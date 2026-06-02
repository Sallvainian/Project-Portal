import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { Funnel, ChartColumn, DollarSign, Calendar, Folder } from "lucide-react";
import { cn } from "../lib/utils";
import { projectsApi } from "../api/taskade";
import { STATUS_LABELS, STATUS_COLORS, PRIORITY_LABELS } from "../constants";
import type { TaskadeNode } from "../types";

export default function Projects() {
  const [projects, setProjects] = useState<TaskadeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  useEffect(() => {
    (async () => {
      try {
        const data = await projectsApi.getAll();
        setProjects(data);
      } catch (e) {
        console.error("Error fetching projects:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = projects.filter((p) => {
    const statusMatch =
      statusFilter === "all" ||
      p.fieldValues["/attributes/@stat3"] === statusFilter;
    const priorityMatch =
      priorityFilter === "all" ||
      p.fieldValues["/attributes/@prio7"] === priorityFilter;
    return statusMatch && priorityMatch;
  });

  const statusTabs = [
    { value: "all", label: "All Projects", count: projects.length },
    {
      value: "opt-active",
      label: "In Progress",
      count: projects.filter((p) => p.fieldValues["/attributes/@stat3"] === "opt-active")
        .length,
    },
    {
      value: "opt-review",
      label: "Under Review",
      count: projects.filter((p) => p.fieldValues["/attributes/@stat3"] === "opt-review")
        .length,
    },
    {
      value: "opt-complete",
      label: "Completed",
      count: projects.filter(
        (p) => p.fieldValues["/attributes/@stat3"] === "opt-complete",
      ).length,
    },
  ];

  const priorityTabs = [
    { value: "all", label: "All", count: projects.length },
    {
      value: "opt-high",
      label: "High",
      count: projects.filter((p) => p.fieldValues["/attributes/@prio7"] === "opt-high")
        .length,
    },
    {
      value: "opt-med",
      label: "Medium",
      count: projects.filter((p) => p.fieldValues["/attributes/@prio7"] === "opt-med")
        .length,
    },
    {
      value: "opt-low",
      label: "Low",
      count: projects.filter((p) => p.fieldValues["/attributes/@prio7"] === "opt-low")
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          Your Projects
        </h1>
        <p className="text-muted-foreground mt-2">
          Track progress and manage deliverables
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Funnel className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          <span className="text-sm text-muted-foreground font-medium flex-shrink-0">
            Status:
          </span>
          {statusTabs.map((tab) => {
            const active = statusFilter === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={cn(
                  "px-4 py-2.5 rounded-xl whitespace-nowrap font-medium text-sm",
                  "transition-all duration-300",
                  active
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-600/25"
                    : "bg-card/50 text-muted-foreground hover:bg-card hover:text-foreground border border-border/50",
                )}
              >
                {tab.label} <span className="ml-1 opacity-60">({tab.count})</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <ChartColumn className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          <span className="text-sm text-muted-foreground font-medium flex-shrink-0">
            Priority:
          </span>
          {priorityTabs.map((tab) => {
            const active = priorityFilter === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setPriorityFilter(tab.value)}
                className={cn(
                  "px-4 py-2.5 rounded-xl whitespace-nowrap font-medium text-sm",
                  "transition-all duration-300",
                  active && tab.value === "all" &&
                    "bg-purple-600 text-white shadow-lg shadow-purple-600/25",
                  active && tab.value === "opt-high" &&
                    "bg-rose-600 text-white shadow-lg shadow-rose-600/25",
                  active && tab.value === "opt-med" &&
                    "bg-amber-600 text-white shadow-lg shadow-amber-600/25",
                  active && tab.value === "opt-low" &&
                    "bg-slate-600 text-white shadow-lg shadow-slate-600/25",
                  !active &&
                    "bg-card/50 text-muted-foreground hover:bg-card hover:text-foreground border border-border/50",
                )}
              >
                {tab.label} <span className="ml-1 opacity-60">({tab.count})</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((project) => {
          const progress = project.fieldValues["/attributes/@prog4"] || 0;
          const status = project.fieldValues["/attributes/@stat3"];
          const priority = project.fieldValues["/attributes/@prio7"];
          const budget = project.fieldValues["/attributes/@budg6"];
          const dueDate = project.fieldValues["/attributes/@due05"];
          return (
            <div
              key={project.id}
              className={cn(
                "p-5 rounded-xl",
                "backdrop-blur-sm border",
                "transition-all duration-300",
                priority === "opt-high" &&
                  "bg-rose-500/5 border-rose-500/20 hover:shadow-lg hover:shadow-rose-500/10",
                priority === "opt-med" &&
                  "bg-amber-500/5 border-amber-500/20 hover:shadow-lg hover:shadow-amber-500/10",
                priority === "opt-low" &&
                  "bg-slate-500/5 border-slate-500/20 hover:shadow-lg hover:shadow-slate-500/10",
                !priority &&
                  "bg-card/50 border-border/50 hover:bg-card hover:shadow-lg hover:shadow-primary/5",
              )}
            >
              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="text-base font-semibold text-foreground truncate">
                      {project.fieldValues["/attributes/@proj2"] ||
                        project.fieldValues["/text"]}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "px-2.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0",
                          STATUS_COLORS[status],
                          "bg-card border border-border",
                        )}
                      >
                        {STATUS_LABELS[status]}
                      </span>
                      {priority && (
                        <span
                          className={cn(
                            "px-2.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 border",
                            priority === "opt-high" &&
                              "text-rose-400 bg-rose-500/10 border-rose-500/30",
                            priority === "opt-med" &&
                              "text-amber-400 bg-amber-500/10 border-amber-500/30",
                            priority === "opt-low" &&
                              "text-slate-400 bg-slate-500/10 border-slate-500/30",
                          )}
                        >
                          {PRIORITY_LABELS[priority]}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {project.fieldValues["/attributes/@cli01"]}
                  </p>
                </div>

                <div className="hidden lg:block w-48 flex-shrink-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-muted-foreground">Progress</span>
                    <span className="text-xs text-foreground font-medium ml-auto">
                      {progress}%
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      style={{ width: `${progress}%` }}
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                    />
                  </div>
                </div>

                <div className="hidden md:flex items-center gap-2 flex-shrink-0 min-w-[120px]">
                  <ChartColumn className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Priority</p>
                    <p className="text-sm text-foreground">
                      {PRIORITY_LABELS[priority] || "Not set"}
                    </p>
                  </div>
                </div>

                <div className="hidden xl:flex items-center gap-2 flex-shrink-0 min-w-[120px]">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Budget</p>
                    <p className="text-sm text-foreground font-medium">
                      ${budget?.toLocaleString() || "0"}
                    </p>
                  </div>
                </div>

                <div className="hidden xl:flex items-center gap-2 flex-shrink-0 min-w-[140px]">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Due Date</p>
                    <p className="text-sm text-foreground">
                      {dueDate ? format(parseISO(dueDate), "MMM dd, yyyy") : "Not set"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="lg:hidden mt-3 pt-3 border-t border-border">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-muted-foreground">Progress</span>
                  <span className="text-xs text-foreground font-medium ml-auto">
                    {progress}%
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    style={{ width: `${progress}%` }}
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Folder className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-lg">No projects found</p>
        </div>
      )}
    </div>
  );
}
