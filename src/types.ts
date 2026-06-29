export interface Message {
  id: string;
  from: string;
  text: string;
  time: string;
  isAgentMessage?: boolean;
}

export interface AgentMeta {
  id: string;
  label: string;
  role: string;
  color: string;
  icon: string;
  description: string;
  status: string;
  currentTask: string;
  location: string;
}

export type AgentMode = "room" | "desk" | "meeting";

export interface AgentState {
  mode: AgentMode;
  targetX: number;
  targetY: number;
}

export interface Position {
  x: number;
  y: number;
}