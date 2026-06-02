/**
 * IDs and option->label/color maps recovered from the bundle.
 *
 * The app is backed by three Taskade projects (one per data type) plus one
 * Taskade AI agent for the Portal Assistant chat. The "@xxxx" keys are the
 * project columns; each select column stores "opt-*" option ids.
 */

// Taskade project IDs (one project per data domain)
export const PROJECT_IDS = {
  projects: "taTBPPgRY5gQfoab",
  messages: "i4ZFqvqkgAjtNRYB",
  files: "CfsTRpBumokQrw9s",
} as const;

// Taskade AI agent backing the Portal Assistant chat
export const AGENT_ID = "01KT2XM2MHQJD0Z1D8S1VJGXXT";

// Project status (column @stat3)
export const STATUS_LABELS: Record<string, string> = {
  "opt-planning": "Planning",
  "opt-active": "In Progress",
  "opt-review": "Under Review",
  "opt-complete": "Completed",
  "opt-hold": "On Hold",
};

export const STATUS_COLORS: Record<string, string> = {
  "opt-planning": "text-slate-400",
  "opt-active": "text-blue-400",
  "opt-review": "text-amber-400",
  "opt-complete": "text-emerald-400",
  "opt-hold": "text-red-400",
};

// Project priority (column @prio7)
export const PRIORITY_LABELS: Record<string, string> = {
  "opt-low": "Low",
  "opt-med": "Medium",
  "opt-high": "High",
};

// File type (column @ftyp6)
export const FILE_TYPE_ICONS: Record<string, string> = {
  "opt-doc": "📄",
  "opt-img": "🖼️",
  "opt-video": "🎥",
  "opt-pdf": "📕",
  "opt-other": "📎",
};
