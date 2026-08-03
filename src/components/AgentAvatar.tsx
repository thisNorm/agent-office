import { CheckCircle2, ClipboardList, Code2, MessageSquareText, PenTool } from "lucide-react";
import type { AgentMeta } from "../types";

const toolIcon = {
  clipboard: ClipboardList,
  code: Code2,
  check: CheckCircle2,
  pen: PenTool,
  message: MessageSquareText,
} as const;

export default function AgentAvatar({
  agent,
  selected,
  active,
}: {
  agent: AgentMeta;
  selected: boolean;
  active: boolean;
}) {
  const Tool = toolIcon[agent.tool];

  return (
    <div className={`agent-figure ${selected ? "selected" : ""} ${active ? "active" : ""} ${agent.status}`}>
      <div className="agent-ring" style={{ borderColor: agent.color }} />
      <div className="agent-head">
        <span>{agent.initials}</span>
      </div>
      <div
        className="agent-torso"
        style={{ background: `linear-gradient(160deg, ${agent.color}, rgba(255,255,255,0.10))` }}
      >
        <Tool size={14} strokeWidth={2.2} />
      </div>
      <div className="agent-arms" />
      <div className="agent-legs" />
      <div className="agent-label">
        <span>{agent.label}</span>
        <i style={{ background: agent.color, boxShadow: `0 0 10px ${agent.color}` }} />
      </div>
      <div className="agent-tooltip">
        <strong>{agent.label}</strong>
        <span>{agent.role}</span>
        <p>{agent.currentTask}</p>
      </div>
    </div>
  );
}
