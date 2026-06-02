import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle, Send, LoaderCircle } from "lucide-react";
import { cn } from "../lib/utils";
import { useAgentChat } from "../hooks/useAgentChat";
import { AGENT_ID } from "../constants";

const STARTERS = [
  { id: "starter-1", title: "Show my active projects", prompt: "What are my active projects?" },
  { id: "starter-2", title: "Check unread messages", prompt: "Do I have any unread messages?" },
  { id: "starter-3", title: "View recent files", prompt: "Show me my recent files" },
  {
    id: "starter-4",
    title: "Project status summary",
    prompt: "Give me a summary of all project statuses",
  },
];

export default function PortalAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const hasAnimated = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { sendMessage, messages, isConnected, createConversation, error } =
    useAgentChat(AGENT_ID, conversationId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initConversation = async () => {
    setIsCreatingConversation(true);
    const id = await createConversation();
    setConversationId(id);
    setIsCreatingConversation(false);
  };

  const handleSend = async (text?: string) => {
    const value = text || input.trim();
    if (!value || !conversationId) return;
    await sendMessage(value);
    setInput("");
  };

  const handleStarterClick = async (prompt: string) => {
    if (conversationId) await handleSend(prompt);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (isOpen && !conversationId && !isCreatingConversation) initConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  return (
    <>
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-50",
          "w-14 h-14 rounded-full",
          "bg-purple-600",
          "backdrop-blur-lg border border-white/20",
          "shadow-lg shadow-blue-500/20",
          "flex items-center justify-center",
          "transition-all duration-300",
        )}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X className="w-6 h-6 text-white" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
            >
              <MessageCircle className="w-6 h-6 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {isOpen && !isCreatingConversation && conversationId && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "fixed bottom-24 right-6 z-40",
              "w-96 h-[600px]",
              "rounded-2xl",
              "bg-card/95 dark:bg-card/90",
              "backdrop-blur-xl border border-border",
              "shadow-2xl",
              "flex flex-col overflow-hidden",
            )}
          >
            <div className="p-4 border-b border-border bg-gradient-to-r from-primary/10 to-primary/5">
              <h3 className="font-semibold text-foreground">Portal Assistant</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {isConnected ? "✓ Connected" : "Connecting..."}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="space-y-6 mt-4">
                  <div className="text-center text-muted-foreground text-sm">
                    <p className="text-base font-medium text-foreground">
                      Hello! I'm your Portal Assistant.
                    </p>
                    <p className="mt-1.5">
                      I can help you with projects, files, and messages.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-medium px-1">
                      Quick actions:
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {STARTERS.map((starter, index) => {
                        const animate = !hasAnimated.current;
                        hasAnimated.current = true;
                        return (
                          <button
                            key={starter.id}
                            onClick={() => handleStarterClick(starter.prompt)}
                            disabled={!conversationId}
                            style={{
                              animationDelay: animate ? `${index * 50}ms` : "0ms",
                            }}
                            className={cn(
                              "p-3 rounded-lg text-left",
                              "bg-accent/50 hover:bg-accent",
                              "border border-border/50 hover:border-border",
                              "text-sm text-foreground",
                              "transition-all duration-200",
                              "hover:shadow-md hover:scale-[1.01]",
                              "disabled:opacity-50 disabled:cursor-not-allowed",
                              animate && "animate-in fade-in slide-in-from-bottom-2",
                            )}
                          >
                            {starter.title}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex",
                    message.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] px-4 py-2 rounded-2xl",
                      message.role === "user"
                        ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white"
                        : "bg-muted text-foreground border border-border",
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    {message.toolCalls && message.toolCalls.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-white/10">
                        <p className="text-xs opacity-60">
                          🔧 Using {message.toolCalls.length} tool
                          {message.toolCalls.length > 1 ? "s" : ""}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  Error: {error.message}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-border bg-card/50">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything..."
                  disabled={!conversationId}
                  className={cn(
                    "flex-1 px-4 py-2 rounded-xl",
                    "bg-background border border-border",
                    "text-foreground placeholder-muted-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-ring",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                  )}
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!conversationId || !input.trim()}
                  className={cn(
                    "px-4 py-2 rounded-xl",
                    "bg-gradient-to-br from-blue-500 to-purple-600",
                    "text-white font-medium",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "hover:shadow-lg hover:shadow-primary/20",
                    "transition-all duration-200",
                    "flex items-center justify-center",
                  )}
                >
                  {conversationId ? (
                    <Send className="w-5 h-5" />
                  ) : (
                    <LoaderCircle className="w-5 h-5 animate-spin" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
