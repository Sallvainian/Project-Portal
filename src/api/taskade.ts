import axios from "axios";
import type { TaskadeNode } from "../types";
import { PROJECT_IDS } from "../constants";

/**
 * Axios instance pointed at the Taskade gateway. In the Genesis preview every
 * request to `/api/taskade/*` is proxied to Taskade's API; see vite.config.ts
 * for the local dev proxy.
 */
export const api = axios.create({ baseURL: "/api/taskade" });

/** Projects — project id `taTBPPgRY5gQfoab`. */
export const projectsApi = {
  getAll: async (): Promise<TaskadeNode[]> =>
    (await api.get(`/projects/${PROJECT_IDS.projects}/nodes`)).data.payload.nodes,
  update: async (nodeId: string, patch: Record<string, any>): Promise<void> => {
    await api.patch(`/projects/${PROJECT_IDS.projects}/nodes/${nodeId}`, patch);
  },
};

/** Messages — project id `i4ZFqvqkgAjtNRYB`. */
export const messagesApi = {
  getAll: async (): Promise<TaskadeNode[]> =>
    (await api.get(`/projects/${PROJECT_IDS.messages}/nodes`)).data.payload.nodes,
  markAsRead: async (nodeId: string): Promise<void> => {
    await api.patch(`/projects/${PROJECT_IDS.messages}/nodes/${nodeId}`, {
      "/attributes/@read3": "opt-read",
    });
  },
};

/** Files — project id `CfsTRpBumokQrw9s`. */
export const filesApi = {
  getAll: async (): Promise<TaskadeNode[]> =>
    (await api.get(`/projects/${PROJECT_IDS.files}/nodes`)).data.payload.nodes,
};
