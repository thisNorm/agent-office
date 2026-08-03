export interface Message {
  id: string;
  from: string;
  text: string;
  time: string;
  isAgentMessage?: boolean;
}

export type AgentStatus = "idle" | "working" | "reviewing" | "meeting" | "speaking" | "blocked" | "offline";
export type ZoneId = "focus" | "qa" | "design" | "meeting" | "ops" | "lounge";
export type AgentTool = "clipboard" | "code" | "check" | "pen" | "message";

export interface AgentMeta {
  id: string;
  label: string;
  role: string;
  color: string;
  initials: string;
  tool: AgentTool;
  description: string;
  status: AgentStatus;
  currentTask: string;
  location: ZoneId;
  preferredZones: readonly ZoneId[];
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

export interface OfficeZone {
  id: ZoneId;
  label: string;
  purpose: string;
  x: number;
  y: number;
  width: number;
  height: number;
  tone: string;
}

export interface FurnitureItem {
  id: string;
  kind: "workstation" | "meeting" | "board" | "rack" | "sofa" | "rug" | "plant";
  zoneId: ZoneId;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  detail: string;
}
