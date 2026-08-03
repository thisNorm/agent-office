import { MapPin } from "lucide-react";
import { getStatusLabel } from "../officeLayout";
import type { AgentMeta } from "../types";

export default function AgentSidebar({
  agents,
  mode,
  selectedAgentId,
  onSelectAgent,
}: {
  agents: readonly AgentMeta[];
  mode: "work" | "meeting";
  selectedAgentId: string;
  onSelectAgent: (agentId: string) => void;
}) {
  return (
    <aside className="agent-sidebar">
      <div className="agent-sidebar-header">
        <span className="sidebar-title">Agent roster</span>
        <span className="sidebar-count">{agents.filter((agent) => agent.status !== "offline").length}/{agents.length} active</span>
      </div>

      <div className="agent-summary">
        {agents.map((agent) => (
          <button
            type="button"
            className={`agent-card ${selectedAgentId === agent.id ? "selected" : ""}`}
            key={agent.id}
            onClick={() => onSelectAgent(agent.id)}
          >
            <div className="agent-card-head">
              <div className="agent-icon" style={{ borderColor: agent.color, color: agent.color }}>
                {agent.initials}
              </div>
              <div className="agent-meta">
                <div className="agent-name">{agent.label}</div>
                <div className="agent-role">{agent.role}</div>
              </div>
              <div className={`agent-status-badge ${agent.status}`}>
                {getStatusLabel(agent.status)}
              </div>
            </div>

            <div className="agent-task-box">
              <div className="agent-task-label">Current task</div>
              <div className="agent-task-value">{agent.currentTask}</div>
            </div>

            <div className="agent-location-row">
              <MapPin size={12} />
              <span>{mode === "meeting" ? "War Room" : agent.location}</span>
              <span className={`agent-online-dot ${agent.status}`} />
            </div>

            <p className="agent-description">{agent.description}</p>
          </button>
        ))}
      </div>
    </aside>
  );
}
