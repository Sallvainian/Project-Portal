import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Bell, TriangleAlert, Plus, Check, X, Send, type LucideIcon } from "lucide-react";
import { cn } from "../lib/utils";
import { messagesApi, api } from "../api/taskade";
import { PROJECT_IDS } from "../constants";
import type { TaskadeNode } from "../types";

interface ComposeForm {
  type: string;
  subject: string;
  message: string;
  from: string;
  client: string;
}

const EMPTY_FORM: ComposeForm = {
  type: "opt-msg",
  subject: "",
  message: "",
  from: "",
  client: "",
};

function typeIcon(type: string): LucideIcon {
  switch (type) {
    case "opt-msg":
      return Mail;
    case "opt-notif":
      return Bell;
    case "opt-alert":
      return TriangleAlert;
    default:
      return Mail;
  }
}

function typeGradient(type: string): string {
  switch (type) {
    case "opt-msg":
      return "from-blue-500 to-cyan-500";
    case "opt-notif":
      return "from-purple-500 to-pink-500";
    case "opt-alert":
      return "from-red-500 to-orange-500";
    default:
      return "from-slate-500 to-gray-500";
  }
}

export default function Messages() {
  const [messages, setMessages] = useState<TaskadeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showCompose, setShowCompose] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState<ComposeForm>(EMPTY_FORM);

  useEffect(() => {
    (async () => {
      try {
        const data = await messagesApi.getAll();
        setMessages(data);
      } catch (e) {
        console.error("Error fetching messages:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await messagesApi.markAsRead(id);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id
            ? {
                ...m,
                fieldValues: { ...m.fieldValues, "/attributes/@read3": "opt-read" },
              }
            : m,
        ),
      );
    } catch (e) {
      console.error("Error marking message as read:", e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.post(`/projects/${PROJECT_IDS.messages}/nodes`, {
        "/attributes/@type2": form.type,
        "/attributes/@read3": "opt-unread",
        "/attributes/@subj0": form.subject,
        "/attributes/@msg11": form.message,
        "/attributes/@from8": form.from,
        "/attributes/@clie9": form.client,
        "/text": form.subject,
      });
      const refreshed = await messagesApi.getAll();
      setMessages(refreshed);
      setForm(EMPTY_FORM);
      setShowCompose(false);
    } catch (e) {
      console.error("Error creating message:", e);
    } finally {
      setSending(false);
    }
  };

  const filtered =
    filter === "all"
      ? messages
      : filter === "unread"
        ? messages.filter((m) => m.fieldValues["/attributes/@read3"] === "opt-unread")
        : messages.filter((m) => m.fieldValues["/attributes/@type2"] === filter);

  const filterTabs = [
    { value: "all", label: "All", count: messages.length },
    {
      value: "unread",
      label: "Unread",
      count: messages.filter((m) => m.fieldValues["/attributes/@read3"] === "opt-unread")
        .length,
    },
    {
      value: "opt-msg",
      label: "Messages",
      count: messages.filter((m) => m.fieldValues["/attributes/@type2"] === "opt-msg")
        .length,
    },
    {
      value: "opt-notif",
      label: "Notifications",
      count: messages.filter((m) => m.fieldValues["/attributes/@type2"] === "opt-notif")
        .length,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Messages</h1>
          <p className="text-muted-foreground mt-2">
            Stay updated with project communications
          </p>
        </div>
        <button
          onClick={() => setShowCompose(true)}
          className={cn(
            "px-4 py-2.5 rounded-xl",
            "bg-amber-600 text-white",
            "shadow-lg shadow-amber-600/25",
            "font-medium text-sm",
            "flex items-center gap-2",
            "transition-all duration-300",
            "hover:scale-105 active:scale-95",
          )}
        >
          <Plus className="w-4 h-4" />
          Compose
        </button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {filterTabs.map((tab) => {
          const active = filter === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={cn(
                "px-4 py-2.5 rounded-xl whitespace-nowrap font-medium text-sm",
                "transition-all duration-300",
                active
                  ? "bg-amber-600 text-white shadow-lg shadow-amber-600/25"
                  : "bg-card/50 text-muted-foreground hover:bg-card hover:text-foreground border border-border/50",
              )}
            >
              {tab.label} <span className="ml-1 opacity-60">({tab.count})</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {filtered.map((message) => {
          const unread = message.fieldValues["/attributes/@read3"] === "opt-unread";
          const type = message.fieldValues["/attributes/@type2"];
          const Icon = typeIcon(type);
          const gradient = typeGradient(type);
          return (
            <div
              key={message.id}
              className={cn(
                "p-5 rounded-xl",
                "bg-card/50 backdrop-blur-sm border border-border/50",
                "hover:bg-card hover:border-border hover:shadow-lg hover:shadow-primary/5",
                "transition-all duration-300",
                unread && "border-primary/30 bg-primary/5",
              )}
            >
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex-shrink-0",
                    "bg-gradient-to-br",
                    gradient,
                    "bg-opacity-10 border border-border",
                    "flex items-center justify-center",
                  )}
                >
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {unread && (
                          <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                        )}
                        <h3 className="font-medium text-foreground">
                          {message.fieldValues["/attributes/@subj0"]}
                        </h3>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        From: {message.fieldValues["/attributes/@from8"]}
                      </p>
                    </div>
                    {unread && (
                      <button
                        onClick={() => handleMarkAsRead(message.id)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg",
                          "bg-card border border-border",
                          "text-xs text-muted-foreground",
                          "hover:bg-accent hover:text-foreground",
                          "transition-all duration-200",
                          "flex items-center gap-1.5",
                        )}
                      >
                        <Check className="w-3 h-3" />
                        Mark Read
                      </button>
                    )}
                  </div>
                  <p className="text-foreground text-sm leading-relaxed">
                    {message.fieldValues["/attributes/@msg11"]}
                  </p>
                  {message.fieldValues["/attributes/@clie9"] && (
                    <p className="text-xs text-muted-foreground mt-3">
                      Client: {message.fieldValues["/attributes/@clie9"]}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-lg">No messages found</p>
        </div>
      )}

      <AnimatePresence>
        {showCompose && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCompose(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div
                className={cn(
                  "w-full max-w-2xl",
                  "bg-card/95 backdrop-blur-xl",
                  "border border-border",
                  "rounded-2xl shadow-2xl",
                  "p-6",
                )}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">
                        Compose Message
                      </h2>
                      <p className="text-sm text-muted-foreground">Send a new message</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCompose(false)}
                    className="p-2 rounded-lg hover:bg-accent transition-colors"
                  >
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Type
                    </label>
                    <select
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                      className={cn(
                        "w-full px-4 py-2.5 rounded-xl",
                        "bg-background border border-border",
                        "text-foreground",
                        "focus:outline-none focus:ring-2 focus:ring-primary/50",
                        "transition-all duration-200",
                      )}
                      required
                    >
                      <option value="opt-msg">Message</option>
                      <option value="opt-notif">Notification</option>
                      <option value="opt-alert">Alert</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      From
                    </label>
                    <input
                      type="text"
                      value={form.from}
                      onChange={(e) => setForm({ ...form, from: e.target.value })}
                      placeholder="Your name or email"
                      className={cn(
                        "w-full px-4 py-2.5 rounded-xl",
                        "bg-background border border-border",
                        "text-foreground placeholder:text-muted-foreground",
                        "focus:outline-none focus:ring-2 focus:ring-primary/50",
                        "transition-all duration-200",
                      )}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Client{" "}
                      <span className="text-muted-foreground">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={form.client}
                      onChange={(e) => setForm({ ...form, client: e.target.value })}
                      placeholder="Client name"
                      className={cn(
                        "w-full px-4 py-2.5 rounded-xl",
                        "bg-background border border-border",
                        "text-foreground placeholder:text-muted-foreground",
                        "focus:outline-none focus:ring-2 focus:ring-primary/50",
                        "transition-all duration-200",
                      )}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      placeholder="Message subject"
                      className={cn(
                        "w-full px-4 py-2.5 rounded-xl",
                        "bg-background border border-border",
                        "text-foreground placeholder:text-muted-foreground",
                        "focus:outline-none focus:ring-2 focus:ring-primary/50",
                        "transition-all duration-200",
                      )}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Message
                    </label>
                    <textarea
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Write your message here..."
                      rows={6}
                      className={cn(
                        "w-full px-4 py-2.5 rounded-xl",
                        "bg-background border border-border",
                        "text-foreground placeholder:text-muted-foreground",
                        "focus:outline-none focus:ring-2 focus:ring-primary/50",
                        "transition-all duration-200",
                        "resize-none",
                      )}
                      required
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCompose(false)}
                      className={cn(
                        "flex-1 px-4 py-2.5 rounded-xl",
                        "bg-card border border-border",
                        "text-muted-foreground",
                        "hover:bg-accent hover:text-foreground",
                        "transition-all duration-200",
                        "font-medium text-sm",
                      )}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={sending}
                      className={cn(
                        "flex-1 px-4 py-2.5 rounded-xl",
                        "bg-gradient-to-br from-blue-500 to-purple-600 text-white",
                        "shadow-lg shadow-primary/25",
                        "font-medium text-sm",
                        "flex items-center justify-center gap-2",
                        "transition-all duration-300",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                      )}
                    >
                      {sending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send Message
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
