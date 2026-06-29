import type { AgentMeta } from "../types";

const locationLabels: Record<string, string> = {
  desk: "💼 업무 중",
  office: "🚶 사무실 이동 중",
  meeting: "🤝 회의 중",
  lounge: "☕ 라운지",
};

const statusLabels: Record<string, string> = {
  idle: "대기 중",
  busy: "작업 중",
  online: "운영중",
  offline: "오프라인",
  meeting: "회의 중",
};

export default function AgentSidebar({
  agents,
  mode,
}: {
  agents: AgentMeta[];
  mode: "work" | "meeting";
}) {
  return (
    <aside className="agent-sidebar">
      <div className="agent-sidebar-header">
        <span className="sidebar-title">에이전트 목록</span>
        <span className="sidebar-count">
          {agents.filter((a) => a.status !== "offline").length}/{agents.length} 활동
        </span>
      </div>

      <div className="agent-summary">
        {agents.map((agent) => (
          <div className="agent-card" key={agent.id}>
            <div className="agent-card-head">
              <div
                className="agent-icon"
                style={{
                  background: `${agent.color}18`,
                  border: `1px solid ${agent.color}55`,
                  color: agent.color,
                }}
              >
                {agent.icon}
              </div>
              <div className="agent-meta">
                <div className="agent-name">{agent.label}</div>
                <div className="agent-role">{agent.role}</div>
              </div>
              <div className={`agent-status-badge ${agent.status}`}>
                {statusLabels[agent.status] || agent.status}
              </div>
            </div>

            <div className="agent-task-box">
              <div className="agent-task-row">
                <span className="agent-task-icon">📋</span>
                <span className="agent-task-label">작업</span>
              </div>
              <div className="agent-task-value">{agent.currentTask}</div>
            </div>

            <div className="agent-location-row">
              <span className="agent-location-icon">📍</span>
              <span className="agent-location-label">
                {mode === "meeting"
                  ? "🤝 회의실"
                  : locationLabels[agent.location] || agent.location}
              </span>
              <span className={`agent-online-dot ${agent.status}`} />
            </div>

            {agent.status !== "offline" && (
              <div className="agent-description">{agent.description}</div>
            )}
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-footer-info">
          <span>🕐 {new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}</span>
          <span>{mode === "work" ? "💼 업무 모드" : "🤝 회의 모드"}</span>
        </div>
      </div>
    </aside>
  );
}