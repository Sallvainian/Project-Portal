import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// During development the app calls the Taskade API through a same-origin
// `/api/taskade` prefix (see src/api/taskade.ts). In the Genesis preview this
// is proxied by Taskade's gateway. Point the proxy target at your own gateway
// (or a local mock) if you run this outside the preview environment.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api/taskade": {
        target: process.env.TASKADE_GATEWAY_URL || "https://www.taskade.com",
        changeOrigin: true,
      },
    },
  },
});
