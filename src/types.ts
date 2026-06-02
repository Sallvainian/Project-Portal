/**
 * A Taskade project node as returned by `GET /projects/{id}/nodes`
 * (`response.data.payload.nodes`). Every field the UI reads lives under
 * `fieldValues`, keyed by the node's column ("/attributes/@xxxx") or "/text".
 */
export interface TaskadeNode {
  id: string;
  fieldValues: Record<string, any>;
}

/** Chat message shape produced by the agent-chat hook. */
export interface ToolCall {
  toolCallId: string;
  toolName: string;
  input?: unknown;
  output?: unknown;
  isComplete: boolean;
}

export interface ChatMessage {
  id: string;
  content: string;
  role: "user" | "assistant";
  isComplete: boolean;
  toolCalls?: ToolCall[];
}
