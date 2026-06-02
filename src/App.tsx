import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  Folder,
  FileText,
  Mail,
  Sparkles,
  Sun,
  Moon,
  type LucideIcon,
} from "lucide-react";
import { cn } from "./lib/utils";
import Dashboard from "./components/Dashboard";
import Projects from "./components/Projects";
import Files from "./components/Files";
import Messages from "./components/Messages";
import PortalAssistant from "./components/PortalAssistant";
import FloatingParticles from "./components/FloatingParticles";

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  bgColor: string;
  shadowColor: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { theme, setTheme } = useTheme();

  const navItems: NavItem[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, bgColor: "bg-blue-600", shadowColor: "shadow-blue-600/20" },
    { id: "projects", label: "Projects", icon: Folder, bgColor: "bg-purple-600", shadowColor: "shadow-purple-600/20" },
    { id: "files", label: "Files", icon: FileText, bgColor: "bg-emerald-600", shadowColor: "shadow-emerald-600/20" },
    { id: "messages", label: "Messages", icon: Mail, bgColor: "bg-amber-600", shadowColor: "shadow-amber-600/20" },
  ];

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-0 right-1/3 w-[600px] h-[600px] bg-gradient-to-br from-blue-500/30 via-cyan-500/20 to-transparent rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "10s" }}
        />
        <div
          className="absolute bottom-0 left-1/4 w-[700px] h-[700px] bg-gradient-to-tr from-purple-500/30 via-pink-500/20 to-transparent rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "15s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-br from-violet-500/25 via-fuchsia-500/15 to-transparent rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "20s" }}
        />
        <div
          className="absolute inset-0 opacity-[0.015] dark:opacity-[0.025]"
          style={{
            backgroundImage: `linear-gradient(rgba(99, 102, 241, 0.08) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(99, 102, 241, 0.08) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
        <FloatingParticles />
      </div>

      <nav className="sticky top-0 z-50 relative border-b border-border/30 bg-background/80 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3">
          <div className="flex items-center justify-between gap-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 flex-shrink-0"
            >
              <motion.div
                className="relative group"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <div className="absolute inset-0 bg-blue-600 rounded-xl blur-lg opacity-40 group-hover:opacity-70 transition-all duration-300" />
                <motion.div
                  className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-600/30"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </motion.div>
              </motion.div>
            </motion.div>

            <div className="flex items-center gap-0.5 sm:gap-1">
              {navItems.map((item, index) => {
                const active = activeTab === item.id;
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03, duration: 0.2 }}
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                      "relative px-2 sm:px-3.5 py-1.5 sm:py-2 rounded-lg",
                      "flex items-center gap-1.5 sm:gap-2",
                      "transition-all duration-200",
                      "font-medium text-xs sm:text-sm",
                      "flex-shrink-0",
                      active
                        ? `text-white shadow-lg ${item.shadowColor}`
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/40",
                    )}
                  >
                    {active && (
                      <motion.div
                        layoutId="activeTab"
                        className={cn("absolute inset-0 rounded-lg", item.bgColor)}
                        transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                      />
                    )}
                    <Icon className="w-4 h-4 sm:w-[18px] sm:h-[18px] relative z-10" />
                    <span className="relative z-10 hidden md:inline">{item.label}</span>
                  </motion.button>
                );
              })}

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className={cn(
                  "ml-0.5 sm:ml-1.5 p-1.5 sm:p-2 rounded-lg",
                  "bg-accent/30 hover:bg-accent/50",
                  "border border-border/30",
                  "text-muted-foreground hover:text-foreground",
                  "transition-all duration-200",
                  "flex-shrink-0",
                )}
              >
                {theme === "dark" ? (
                  <Sun className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                ) : (
                  <Moon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 lg:py-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            {activeTab === "dashboard" && <Dashboard />}
            {activeTab === "projects" && <Projects />}
            {activeTab === "files" && <Files />}
            {activeTab === "messages" && <Messages />}
          </motion.div>
        </AnimatePresence>
      </main>

      <PortalAssistant />

      <footer className="relative mt-16 border-t border-border/30 bg-background/50 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} All rights reserved</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
