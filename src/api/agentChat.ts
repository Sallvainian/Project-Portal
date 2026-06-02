import { z } from "zod";
import type { ChatMessage } from "../types";

/**
 * Taskade AI agent chat transport. Two REST calls bootstrap a public
 * conversation and post user messages; assistant tokens stream back over an
 * EventSource (SSE). Reconstructed from the bundle's `ex`, `tx`, the `QS` zod
 * schema and the `AgentChatStream` class (`tu`).
 *
 * Endpoints (relative to `baseUrl`, default same-origin):
 *   POST /api/taskade/agents/{agentId}/public-conversations
 *   POST /api/taskade/agents/{agentId}/public-conversations/{conversationId}/messages
 *   GET  /api/taskade/agents/{agentId}/public-conversations/{conversationId}/stream
 */

const isEmpty = (s: string | null | undefined): boolean =>
  s == null || s.trim().length === 0;

export interface AgentChatOptions {
  baseUrl?: string;
  autoReconnect?: boolean;
  reconnectDelay?: number;
  autoConnect?: boolean;
  onError?: (error: Error) => void;
}

export interface CreateConversationResponse {
  conversationId: string;
}

export interface SendMessageResponse {
  messageId: string;
}

export async function createConversation(
  agentId: string,
  options?: { baseUrl?: string },
): Promise<CreateConversationResponse> {
  if (isEmpty(agentId)) throw new Error("Agent ID cannot be empty");

  const url = `${options?.baseUrl ?? ""}/api/taskade/agents/${encodeURIComponent(agentId)}/public-conversations`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  const contentType = res.headers.get("content-type") || "";
  const text = await res.text().catch(() => "");

  if (!res.ok) {
    throw new Error(
      `Failed to create conversation: ${res.status} ${text || "Unknown error"}`,
    );
  }
  if (!contentType.includes("application/json")) {
    throw new Error(
      `Invalid response format: expected JSON, got ${contentType}. Response: ${text.substring(0, 100)}`,
    );
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(
      `Failed to parse JSON response: ${e instanceof Error ? e.message : "Unknown error"}. Response: ${text.substring(0, 200)}`,
    );
  }
}

export async function sendMessageToAgent(
  agentId: string,
  conversationId: string,
  message: string,
  options?: { baseUrl?: string },
): Promise<SendMessageResponse> {
  if (isEmpty(agentId)) throw new Error("Agent ID cannot be empty");
  if (isEmpty(conversationId)) throw new Error("Conversation ID cannot be empty");
  const text = message.trim();
  if (isEmpty(text)) throw new Error("Message text cannot be empty");

  const url = `${options?.baseUrl ?? ""}/api/taskade/agents/${encodeURIComponent(agentId)}/public-conversations/${encodeURIComponent(conversationId)}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  const contentType = res.headers.get("content-type") || "";
  const body = await res.text().catch(() => "");

  if (!res.ok) {
    let msg = `Failed to send message: ${res.status}`;
    try {
      const parsed = JSON.parse(body);
      if (parsed.message) msg = parsed.message;
    } catch {
      if (body) msg = `${msg}: ${body.substring(0, 100)}`;
    }
    throw new Error(msg);
  }
  if (!contentType.includes("application/json")) {
    throw new Error(
      `Invalid response format: expected JSON, got ${contentType}. Response: ${body.substring(0, 100)}`,
    );
  }
  try {
    return JSON.parse(body);
  } catch (e) {
    throw new Error(
      `Failed to parse JSON response: ${e instanceof Error ? e.message : "Unknown error"}. Response: ${body.substring(0, 200)}`,
    );
  }
}

/** Discriminated union of every SSE event the agent stream emits. */
export const agentEventSchema = z.union([
  z.object({ type: z.literal("start"), messageId: z.string() }),
  z.object({ type: z.literal("text-start"), id: z.string() }),
  z.object({ type: z.literal("text-delta"), id: z.string(), delta: z.string() }),
  z.object({ type: z.literal("text-end"), id: z.string() }),
  z.object({
    type: z.literal("tool-input-start"),
    toolCallId: z.string(),
    toolName: z.string(),
    messageId: z.string().optional(),
  }),
  z.object({
    type: z.literal("tool-input-delta"),
    toolCallId: z.string(),
    inputTextDelta: z.string(),
    messageId: z.string().optional(),
  }),
  z.object({
    type: z.literal("tool-input-available"),
    toolCallId: z.string(),
    input: z.unknown(),
    messageId: z.string().optional(),
  }),
  z.object({
    type: z.literal("tool-output-available"),
    toolCallId: z.string(),
    output: z.unknown(),
    messageId: z.string().optional(),
  }),
  z.object({
    type: z.literal("tool-call-end"),
    toolCallId: z.string(),
    messageId: z.string().optional(),
  }),
  z.object({ type: z.literal("finish") }),
  z.object({ type: z.literal("error"), errorText: z.string() }),
]);

export type AgentEvent = z.infer<typeof agentEventSchema>;

type Listener = (...args: any[]) => void;

/**
 * EventSource wrapper that accumulates streamed assistant messages (and their
 * tool calls) keyed by messageId, emitting "open" / "close" / "text-delta" /
 * "finish" / "error" / "event" to subscribers.
 */
export class AgentChatStream {
  agentId: string;
  conversationId: string;
  options: Required<Omit<AgentChatOptions, "autoConnect">>;
  private eventSource: EventSource | null = null;
  private listeners = new Map<string, Set<Listener>>();
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private messageStates = new Map<string, ChatMessage>();
  private currentMessageId: string | null = null;
  private isConnecting = false;

  constructor(agentId: string, conversationId: string, options?: AgentChatOptions) {
    this.agentId = agentId;
    this.conversationId = conversationId;
    this.options = {
      baseUrl: options?.baseUrl ?? "",
      autoReconnect: options?.autoReconnect ?? true,
      reconnectDelay: options?.reconnectDelay ?? 1000,
      onError:
        options?.onError ??
        ((e: Error) => {
          console.error("[AgentChatStream] Unhandled error:", e);
        }),
    };
  }

  clearMessages() {
    this.messageStates.clear();
    this.currentMessageId = null;
  }

  setConversationId(conversationId: string) {
    if (this.conversationId === conversationId) return;
    const wasConnected = this.isConnected;
    const wasConnecting = this.isConnecting;
    this.disconnect();
    this.conversationId = conversationId;
    this.clearMessages();
    if (wasConnected || wasConnecting) this.connect();
  }

  connect() {
    if (this.isConnecting || this.eventSource?.readyState === EventSource.OPEN) return;
    this.isConnecting = true;
    this.disconnect();

    const url = `${this.options.baseUrl}/api/taskade/agents/${encodeURIComponent(this.agentId)}/public-conversations/${encodeURIComponent(this.conversationId)}/stream`;

    if (!this.agentId || !this.conversationId) {
      const err = new Error(
        `Missing required parameters: agentId=${this.agentId || "null"}, conversationId=${this.conversationId || "null"}`,
      );
      this.options.onError(err);
      this.emit("error", { type: "error", errorText: err.message });
      this.isConnecting = false;
      return;
    }

    try {
      this.eventSource = new EventSource(url);
      this.eventSource.onopen = () => {
        this.isConnecting = false;
        this.emit("open");
      };
      this.eventSource.onmessage = (event) => {
        try {
          const parsed = agentEventSchema.parse(JSON.parse(event.data));
          this.handleEvent(parsed);
        } catch (e) {
          const err = e instanceof Error ? e : new Error("Failed to parse event");
          this.options.onError(err);
          this.emit("error", {
            type: "error",
            errorText: `Parse error: ${err.message}`,
          });
        }
      };
      this.eventSource.onerror = () => {
        this.isConnecting = false;
        if (this.eventSource?.readyState === EventSource.CLOSED) {
          this.emit("close");
          if (this.options.autoReconnect) this.scheduleReconnect();
        } else if (this.eventSource?.readyState !== EventSource.CONNECTING) {
          const err = new Error("EventSource connection error");
          this.options.onError(err);
          this.emit("error", { type: "error", errorText: "Stream connection error" });
        }
      };
    } catch (e) {
      this.isConnecting = false;
      const err = e instanceof Error ? e : new Error("Failed to create EventSource");
      this.options.onError(err);
      this.emit("error", {
        type: "error",
        errorText: `Failed to create connection: ${err.message}`,
      });
    }
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.isConnecting = false;
  }

  on(event: string, fn: Listener): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(fn);
    return () => {
      this.listeners.get(event)?.delete(fn);
    };
  }

  off(event: string, fn: Listener) {
    this.listeners.get(event)?.delete(fn);
  }

  get isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }

  get messages(): Map<string, ChatMessage> {
    return new Map(this.messageStates);
  }

  getMessage(id: string): ChatMessage | undefined {
    return this.messageStates.get(id);
  }

  private handleEvent(event: AgentEvent) {
    this.emit("event", event);
    switch (event.type) {
      case "start": {
        this.currentMessageId = event.messageId;
        if (!this.messageStates.has(event.messageId)) {
          this.messageStates.set(event.messageId, {
            id: event.messageId,
            content: "",
            isComplete: false,
            role: "assistant",
          });
        }
        break;
      }
      case "text-start": {
        if (this.currentMessageId && !this.messageStates.has(this.currentMessageId)) {
          this.messageStates.set(this.currentMessageId, {
            id: this.currentMessageId,
            content: "",
            isComplete: false,
            role: "assistant",
          });
        }
        break;
      }
      case "text-delta": {
        if (this.currentMessageId) {
          const prev = this.messageStates.get(this.currentMessageId);
          if (prev) {
            this.messageStates.set(this.currentMessageId, {
              ...prev,
              content: prev.content + event.delta,
            });
          } else {
            this.messageStates.set(this.currentMessageId, {
              id: this.currentMessageId,
              content: event.delta,
              isComplete: false,
              role: "assistant",
            });
          }
        }
        this.emit("text-delta", event);
        break;
      }
      case "text-end":
        break;
      case "tool-input-start": {
        const id = ("messageId" in event && event.messageId) || this.currentMessageId;
        const msg = id ? this.messageStates.get(id) : undefined;
        if (msg) {
          this.messageStates.set(msg.id, {
            ...msg,
            toolCalls: [
              ...(msg.toolCalls ?? []),
              { toolCallId: event.toolCallId, toolName: event.toolName, isComplete: false },
            ],
          });
        }
        break;
      }
      case "tool-input-delta": {
        const id = ("messageId" in event && event.messageId) || this.currentMessageId;
        const msg = id ? this.messageStates.get(id) : undefined;
        if (msg?.toolCalls) {
          const idx = msg.toolCalls.findIndex((t) => t.toolCallId === event.toolCallId);
          if (idx !== -1) {
            const prevInput =
              typeof msg.toolCalls[idx].input === "string"
                ? (msg.toolCalls[idx].input as string)
                : "";
            this.messageStates.set(msg.id, {
              ...msg,
              toolCalls: msg.toolCalls.map((t, i) =>
                i === idx ? { ...t, input: prevInput + event.inputTextDelta } : t,
              ),
            });
          }
        }
        break;
      }
      case "tool-input-available": {
        const id = ("messageId" in event && event.messageId) || this.currentMessageId;
        const msg = id ? this.messageStates.get(id) : undefined;
        if (msg?.toolCalls) {
          const idx = msg.toolCalls.findIndex((t) => t.toolCallId === event.toolCallId);
          if (idx !== -1) {
            this.messageStates.set(msg.id, {
              ...msg,
              toolCalls: msg.toolCalls.map((t, i) =>
                i === idx ? { ...t, input: event.input } : t,
              ),
            });
          }
        }
        break;
      }
      case "tool-output-available": {
        const id = ("messageId" in event && event.messageId) || this.currentMessageId;
        const msg = id ? this.messageStates.get(id) : undefined;
        if (msg?.toolCalls) {
          const idx = msg.toolCalls.findIndex((t) => t.toolCallId === event.toolCallId);
          if (idx !== -1) {
            this.messageStates.set(msg.id, {
              ...msg,
              toolCalls: msg.toolCalls.map((t, i) =>
                i === idx ? { ...t, output: event.output } : t,
              ),
            });
          }
        }
        break;
      }
      case "tool-call-end": {
        const id = ("messageId" in event && event.messageId) || this.currentMessageId;
        const msg = id ? this.messageStates.get(id) : undefined;
        if (msg?.toolCalls) {
          const idx = msg.toolCalls.findIndex((t) => t.toolCallId === event.toolCallId);
          if (idx !== -1) {
            this.messageStates.set(msg.id, {
              ...msg,
              toolCalls: msg.toolCalls.map((t, i) =>
                i === idx ? { ...t, isComplete: true } : t,
              ),
            });
          }
        }
        break;
      }
      case "finish": {
        if (this.currentMessageId) {
          const prev = this.messageStates.get(this.currentMessageId);
          if (prev) {
            this.messageStates.set(this.currentMessageId, { ...prev, isComplete: true });
          }
        }
        this.emit("finish", event);
        break;
      }
      case "error":
        this.emit("error", event);
        this.options.onError(new Error(event.errorText));
        break;
    }
  }

  private emit(event: string, ...args: any[]) {
    this.listeners.get(event)?.forEach((fn) => {
      try {
        fn(...args);
      } catch (e) {
        this.options.onError(e instanceof Error ? e : new Error("Handler error"));
      }
    });
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) return;
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      if (this.options.autoReconnect) this.connect();
    }, this.options.reconnectDelay);
  }
}
