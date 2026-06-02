import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { Search, Lightbulb, ExternalLink, Download, File } from "lucide-react";
import { cn } from "../lib/utils";
import { filesApi } from "../api/taskade";
import { FILE_TYPE_ICONS } from "../constants";
import type { TaskadeNode } from "../types";

export default function Files() {
  const [files, setFiles] = useState<TaskadeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await filesApi.getAll();
        setFiles(data);
      } catch (e) {
        console.error("Error fetching files:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = files.filter((file) => {
    const name = file.fieldValues["/attributes/@file4"] || file.fieldValues["/text"];
    const project = file.fieldValues["/attributes/@proj5"];
    const query = search.toLowerCase();
    return (
      name.toLowerCase().includes(query) ||
      project?.toLowerCase().includes(query)
    );
  });

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
          Files & Documents
        </h1>
        <p className="text-muted-foreground mt-2">
          Access your project deliverables and resources
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search files..."
          className={cn(
            "w-full pl-12 pr-4 py-3.5 rounded-xl",
            "bg-card/50 border border-border",
            "text-foreground placeholder-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
            "transition-all duration-200",
            "backdrop-blur-sm",
          )}
        />
      </div>

      <div
        className={cn(
          "p-4 rounded-xl",
          "bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-blue-500/10",
          "border border-primary/20",
          "backdrop-blur-sm",
        )}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground mb-1 flex items-center gap-2">
              💡 Pro Tip: Connect Google Drive
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Set up a{" "}
              <span className="font-medium text-foreground">
                Google Drive automation
              </span>{" "}
              to automatically sync files. Any files uploaded to your connected Drive
              folder will instantly appear here. Perfect for seamless file sharing with
              your team!
            </p>
            <a
              href="https://www.taskade.com/automation"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex items-center gap-1.5 mt-3",
                "text-sm font-medium text-primary",
                "hover:text-primary/80 transition-colors",
                "group",
              )}
            >
              Learn about Taskade Automations
              <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map((file) => {
          const name =
            file.fieldValues["/attributes/@file4"] || file.fieldValues["/text"];
          const type = file.fieldValues["/attributes/@ftyp6"];
          const project = file.fieldValues["/attributes/@proj5"];
          const uploadedAt = file.fieldValues["/attributes/@upld8"];
          const uploadedBy = file.fieldValues["/attributes/@upby9"];
          const version = file.fieldValues["/attributes/@vers0"];
          const url = file.fieldValues["/attributes/@furl1"];
          const isLink = url && typeof url === "string" && url.startsWith("http");
          return (
            <div
              key={file.id}
              onClick={() => {
                if (isLink) window.open(url, "_blank");
              }}
              className={cn(
                "p-4 rounded-xl",
                "bg-card/50 backdrop-blur-sm border border-border/50",
                "hover:bg-card hover:border-border hover:shadow-lg hover:shadow-primary/5",
                "transition-all duration-300",
                isLink ? "cursor-pointer" : "cursor-default",
                "group",
              )}
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex-shrink-0",
                    "bg-gradient-to-br from-primary/10 to-primary/5",
                    "border border-border",
                    "flex items-center justify-center text-xl",
                    "group-hover:scale-105 group-hover:border-primary/30",
                    "transition-all duration-300",
                  )}
                >
                  {FILE_TYPE_ICONS[type]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {name}
                    </h3>
                    {isLink && (
                      <Download className="w-4 h-4 text-primary flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{project}</p>
                </div>
                {version && (
                  <div className="flex-shrink-0 hidden md:block">
                    <p className="text-xs text-muted-foreground">Version</p>
                    <p className="text-sm text-foreground font-medium">{version}</p>
                  </div>
                )}
                <div className="flex-shrink-0 hidden lg:block min-w-[140px]">
                  <p className="text-xs text-muted-foreground">Uploaded by</p>
                  <p className="text-sm text-foreground truncate">{uploadedBy}</p>
                </div>
                {uploadedAt && (
                  <div className="flex-shrink-0 hidden xl:block min-w-[120px]">
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="text-sm text-foreground">
                      {format(parseISO(uploadedAt), "MMM dd, yyyy")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <File className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-lg">
            {search ? "No files match your search" : "No files available"}
          </p>
        </div>
      )}
    </div>
  );
}
