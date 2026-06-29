export interface Message {
  id: string;
  from: "user" | "assistant" | "senior" | "qa" | "designer";
  text: string;
  time: string;
}

export interface AgentMeta {
  id: "senior" | "qa" | "designer";
  label: string;
  role: string;
  color: string;
  icon: string;
  description: string;
  status: "online" | "busy" | "offline";
  currentTask: string;
}

export type AgentMode = "room" | "desk" | "meeting";

export interface AgentState {
  mode: AgentMode;
  targetX: number;
  targetY: number;
}
