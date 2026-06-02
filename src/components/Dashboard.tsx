import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  FolderOpen,
  TrendingUp,
  Mail,
  CircleCheck,
  Folder,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../lib/utils";
import { projectsApi, messagesApi } from "../api/taskade";
import type { TaskadeNode } from "../types";

// Per-card progress-bar colors (bundle const `OS`).
const PROGRESS_COLORS = [
  "bg-blue-600",
  "bg-purple-600",
  "bg-emerald-600",
  "bg-amber-600",
  "bg-rose-600",
  "bg-cyan-600",
  "bg-indigo-600",
  "bg-pink-600",
];

interface Stat {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

export default function Dashboard() {
  const [projects, setProjects] = useState<TaskadeNode[]>([]);
  const [messages, setMessages] = useState<TaskadeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const now = useMemo(() => new Date(), []);
  const today = format(now, "EEEE, MMMM d, yyyy");

  useEffect(() => {
    (async () => {
      try {
        const [proj, msgs] = await Promise.all([
          projectsApi.getAll(),
          messagesApi.getAll(),
        ]);
        setProjects(proj);
        setMessages(msgs);
      } catch (e) {
        console.error("Error fetching data:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const activeProjects = projects.filter(
    (p) => p.fieldValues["/attributes/@stat3"] === "opt-active",
  );
  const completedProjects = projects.filter(
    (p) => p.fieldValues["/attributes/@stat3"] === "opt-complete",
  );
  const unreadMessages = messages.filter(
    (m) => m.fieldValues["/attributes/@read3"] === "opt-unread",
  );
  const avgProgress =
    projects.length > 0
      ? Math.round(
          projects.reduce(
            (sum, p) => sum + (p.fieldValues["/attributes/@prog4"] || 0),
            0,
          ) / projects.length,
        )
      : 0;

  const stats: Stat[] = [
    {
      label: "Active Projects",
      value: activeProjects.length,
      icon: FolderOpen,
      color: "bg-blue-600",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Avg Progress",
      value: `${avgProgress}%`,
      icon: TrendingUp,
      color: "bg-purple-600",
      bgColor: "bg-purple-500/10",
    },
    {
      label: "Unread Messages",
      value: unreadMessages.length,
      icon: Mail,
      color: "bg-amber-600",
      bgColor: "bg-amber-500/10",
    },
    {
      label: "Completed",
      value: completedProjects.length,
      icon: CircleCheck,
      color: "bg-emerald-600",
      bgColor: "bg-emerald-500/10",
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
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl lg:text-4xl font-bold text-foreground tracking-tight">
          🗓️ {today}
        </h1>
        <p className="text-muted-foreground mt-1.5 text-sm">
          Here's what's happening
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {stats.map((stat) => {
          const hasValue = Number(stat.value) > 0;
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={cn(
                "p-5 rounded-xl group",
                "bg-card/80 backdrop-blur-sm border border-border",
                "hover:bg-card hover:border-border/80 transition-all duration-200",
                hasValue && "hover:shadow-xl hover:shadow-primary/10",
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-muted-foreground text-xs">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1.5 tracking-tight">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={cn(
                    "p-2.5 rounded-lg",
                    stat.color,
                    "group-hover:scale-105 transition-transform duration-200",
                  )}
                >
                  <Icon className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-5 rounded-xl bg-card/80 backdrop-blur-sm border border-border">
        <div className="flex items-center gap-2.5 mb-5">
          <Folder className="w-4 h-4 text-primary" />
          <h2 className="text-lg font-semibold text-foreground tracking-tight">
            Active Projects
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {activeProjects.slice(0, 6).map((project, index) => {
            const progress = project.fieldValues["/attributes/@prog4"] || 0;
            const barColor = PROGRESS_COLORS[index % PROGRESS_COLORS.length];
            return (
              <div
                key={project.id}
                className={cn(
                  "p-3.5 rounded-xl",
                  "bg-card/70 border border-border/70",
                  "hover:bg-card hover:border-border hover:shadow-lg hover:shadow-primary/10",
                  "transition-all duration-200",
                )}
              >
                <div className="space-y-2.5">
                  <div>
                    <h3 className="font-medium text-foreground text-sm line-clamp-1">
                      {project.fieldValues["/attributes/@proj2"] ||
                        project.fieldValues["/text"]}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {project.fieldValues["/attributes/@cli01"]}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Progress</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        style={{ width: `${progress}%` }}
                        className={cn("h-full rounded-full", barColor)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {activeProjects.length === 0 && (
            <div className="col-span-full text-center text-muted-foreground py-8">
              No active projects
            </div>
          )}
        </div>
      </div>

      <div className="p-5 rounded-xl bg-card/80 backdrop-blur-sm border border-border">
        <div className="flex items-center gap-2.5 mb-5">
          <Mail className="w-4 h-4 text-primary" />
          <h2 className="text-lg font-semibold text-foreground tracking-tight">
            Recent Messages
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider pb-3 px-3">
                  Date
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider pb-3 px-3">
                  Sender
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider pb-3 px-3">
                  Message
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {messages.slice(0, 5).map((message) => {
                const unread =
                  message.fieldValues["/attributes/@read3"] === "opt-unread";
                return (
                  <tr
                    key={message.id}
                    className={cn(
                      "hover:bg-accent/30 transition-colors duration-150",
                      unread && "bg-primary/5",
                    )}
                  >
                    <td className="py-3 px-3 text-sm text-muted-foreground whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {unread && (
                          <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />
                        )}
                        <span>Today</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-sm text-foreground font-medium">
                      {message.fieldValues["/attributes/@from8"]}
                    </td>
                    <td className="py-3 px-3 text-sm text-muted-foreground">
                      <div className="max-w-md">
                        <p className="font-medium text-foreground mb-0.5 line-clamp-1">
                          {message.fieldValues["/attributes/@subj0"]}
                        </p>
                        <p className="line-clamp-1">
                          {message.fieldValues["/attributes/@msg11"]}
                        </p>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-12">
              <Mail className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No messages</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
