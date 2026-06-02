import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AgentChatStream,
  createConversation as apiCreateConversation,
  sendMessageToAgent,
  type AgentChatOptions,
} from "../api/agentChat";
import type { ChatMessage } from "../types";

export interface UseAgentChatResult {
  sendMessage: (text: string) => Promise<void>;
  messages: ChatMessage[];
  isConnected: boolean;
  error: Error | null;
  conversationId: string | null;
  createConversation: () => Promise<string>;
  switchConversation: (id: string) => void;
  connect: () => void;
}

/**
 * React binding for {@link AgentChatStream}. Owns the conversation id, the
 * live message map, and the SSE lifecycle. Reconstructed from the bundle's
 * `nx` hook (`useAgentChat`).
 */
export function useAgentChat(
  agentId: string,
  conversationId: string | null,
  options?: AgentChatOptions,
): UseAgentChatResult {
  const [messageMap, setMessageMap] = useState<Map<string, ChatMessage>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    conversationId,
  );

  const streamRef = useRef<AgentChatStream | null>(null);
  const unsubscribesRef = useRef<Array<() => void>>([]);
  const streamAgentIdRef = useRef<string | null>(null);
  const activeConvRef = useRef<string | null>(conversationId);
  const prevConvRef = useRef<string | null>(conversationId);

  // Reset when the externally-provided conversation id changes.
  useEffect(() => {
    const prev = prevConvRef.current;
    const next = conversationId;
    if (prev !== next && next != null && prev != null) {
      setMessageMap(new Map());
      streamRef.current?.clearMessages();
    }
    setActiveConversationId(next);
    activeConvRef.current = next;
    prevConvRef.current = next;
  }, [conversationId]);

  // Tear down the stream on unmount.
  useEffect(
    () => () => {
      if (streamRef.current) {
        streamRef.current.disconnect();
        streamRef.current = null;
        streamAgentIdRef.current = null;
      }
    },
    [],
  );

  const messages = useMemo(() => {
    const list = Array.from(messageMap.values());
    list.sort((a, b) => a.id.localeCompare(b.id));
    return list;
  }, [messageMap]);

  // Main connection management.
  useEffect(() => {
    if (!activeConversationId) {
      if (streamRef.current) {
        streamRef.current.clearMessages();
        streamRef.current.disconnect();
        streamRef.current = null;
        streamAgentIdRef.current = null;
        setIsConnected(false);
      }
      setMessageMap(new Map());
      activeConvRef.current = null;
      return;
    }

    activeConvRef.current = activeConversationId;
    unsubscribesRef.current.forEach((fn) => fn());
    unsubscribesRef.current = [];

    const unsubscribes: Array<() => void> = [];
    let alive = true;
    const cleanup = () => {
      alive = false;
      unsubscribes.forEach((fn) => fn());
    };

    try {
      if (!agentId) throw new Error("Invalid parameters: agentId is required");

      // Pull the stream's accumulated messages into React state.
      const syncMessages = () => {
        const stream = streamRef.current;
        if (!stream) return;
        setMessageMap((prev) => {
          const next = new Map(prev);
          for (const [id, streamed] of stream.messages) {
            const existing = prev.get(id);
            if (!existing || existing.role === "assistant") {
              next.set(id, {
                ...existing,
                ...streamed,
                id,
                role: "assistant",
                content:
                  typeof streamed.content === "string" && streamed.content.length > 0
                    ? streamed.content
                    : existing?.content || "",
              });
            }
          }
          return next;
        });
      };

      let stream: AgentChatStream;
      const existingStream = streamRef.current;
      const agentChanged = existingStream && streamAgentIdRef.current !== agentId;

      if (agentChanged && existingStream) {
        // Carry over already-streamed messages before discarding the stream.
        setMessageMap((prev) => {
          const next = new Map(prev);
          for (const [id, streamed] of existingStream.messages) {
            if (!next.has(id)) {
              next.set(id, streamed);
            } else {
              const existing = prev.get(id);
              if (existing?.role === "user") continue;
              if (existing?.role === "assistant" || !existing) {
                next.set(id, { ...existing, ...streamed, id, role: "assistant" });
              }
            }
          }
          return next;
        });
        existingStream.disconnect();
        streamRef.current = null;
        streamAgentIdRef.current = null;
      }

      if (streamRef.current && !agentChanged) {
        stream = streamRef.current;
        stream.setConversationId(activeConversationId);
      } else {
        stream = new AgentChatStream(agentId, activeConversationId, {
          baseUrl: options?.baseUrl,
          autoReconnect: options?.autoReconnect ?? true,
          reconnectDelay: options?.reconnectDelay,
          onError: (e) => {
            if (alive) setError(e);
            options?.onError?.(e);
          },
        });
        streamRef.current = stream;
        streamAgentIdRef.current = agentId;
      }

      unsubscribes.push(
        stream.on("open", () => {
          if (alive) {
            setIsConnected(true);
            setError(null);
          }
        }),
      );
      unsubscribes.push(
        stream.on("close", () => {
          if (alive) setIsConnected(false);
        }),
      );
      unsubscribes.push(
        stream.on("text-delta", () => {
          if (alive) syncMessages();
        }),
      );
      unsubscribes.push(
        stream.on("finish", () => {
          if (alive) syncMessages();
        }),
      );
      unsubscribes.push(
        stream.on("error", (e: { errorText: string }) => {
          if (alive) setError(new Error(e.errorText));
        }),
      );

      unsubscribesRef.current = unsubscribes;
      if (options?.autoConnect !== false) stream.connect();
    } catch (e) {
      if (alive) {
        const err = e instanceof Error ? e : new Error("Failed to initialize chat");
        setError(err);
        console.error("[useAgentChat] Initialization error:", err);
      }
    }

    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    agentId,
    activeConversationId,
    options?.baseUrl,
    options?.autoReconnect,
    options?.reconnectDelay,
    options?.autoConnect,
    options?.onError,
  ]);

  const sendMessage = useCallback(
    async (text: string) => {
      const conv = activeConversationId;
      if (!conv) {
        throw new Error("No conversation available. Create a conversation first.");
      }
      try {
        setError(null);
        const res = await sendMessageToAgent(agentId, conv, text, {
          baseUrl: options?.baseUrl,
        });
        if (activeConvRef.current !== conv) return;
        const userMessage: ChatMessage = {
          id: res.messageId,
          content: text,
          isComplete: true,
          role: "user",
        };
        setMessageMap((prev) => {
          const next = new Map(prev);
          next.set(res.messageId, userMessage);
          return next;
        });
      } catch (e) {
        const err = e instanceof Error ? e : new Error("Failed to send message");
        setError(err);
        throw err;
      }
    },
    [agentId, activeConversationId, options?.baseUrl],
  );

  const createConversation = useCallback(async () => {
    const { conversationId: id } = await apiCreateConversation(agentId, {
      baseUrl: options?.baseUrl,
    });
    setActiveConversationId(id);
    activeConvRef.current = id;
    setMessageMap(new Map());
    streamRef.current?.setConversationId(id);
    return id;
  }, [agentId, options?.baseUrl]);

  const switchConversation = useCallback((id: string) => {
    setActiveConversationId(id);
    activeConvRef.current = id;
    setMessageMap(new Map());
    streamRef.current?.setConversationId(id);
  }, []);

  const connect = useCallback(() => {
    if (!activeConversationId) {
      throw new Error(
        "Cannot connect: no conversation available. Create a conversation first.",
      );
    }
    if (!streamRef.current) {
      throw new Error(
        "Cannot connect: stream not initialized. Ensure conversationId is provided.",
      );
    }
    streamRef.current.connect();
  }, [activeConversationId]);

  return {
    sendMessage,
    messages,
    isConnected,
    error,
    conversationId: activeConversationId,
    createConversation,
    switchConversation,
    connect,
  };
}
