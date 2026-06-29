import { useState, useEffect } from "react";
import ChatPanel from "./components/ChatPanel";
import type { AgentMeta, AgentState, AgentMode } from "./types";

const agents: AgentMeta[] = [
  {
    id: "senior",
    label: "시니어 개발자",
    role: "Senior Developer",
    color: "#0ea5e9",
    icon: "🧑‍💻",
    description: "아키텍처, 코드, 리뷰, 배포/운영까지 주도",
    status: "busy",
    currentTask: "Edge Server 아키텍처 설계",
  },
  {
    id: "qa",
    label: "QA",
    role: "Quality Assurance",
    color: "#f59e0b",
    icon: "🧪",
    description: "테스트 설계, 품질 검증, 버그/리스크 관리",
    status: "online",
    currentTask: "MQTT 브리지 테스트 케이스 검토",
  },
  {
    id: "designer",
    label: "디자이너",
    role: "UI/UX Designer",
    color: "#ec4899",
    icon: "🎨",
    description: "대시보드/화면 UI 설계, 컴포넌트 가이드, 사용자 흐름",
    status: "online",
    currentTask: "대시보드 메인 화면 초안",
  },
];

const FURNITURE = [
  { kind: "desk", x: 60, y: 120, width: 220, height: 24, label: "시니어 책상", owner: "senior" as const },
  { kind: "desk", x: 60, y: 220, width: 220, height: 24, label: "QA 책상", owner: "qa" as const },
  { kind: "desk", x: 60, y: 320, width: 220, height: 24, label: "디자이너 책상", owner: "designer" as const },
  { kind: "meeting", x: 320, y: 120, width: 210, height: 110, label: "회의실" },
];

function agentDesk(agentId: string) {
  return FURNITURE.find((item) => item.owner === agentId);
}

export default function App() {
  const [agentStates, setAgentStates] = useState<Record<string, AgentState>>({
    senior: { mode: "desk", targetX: 170, targetY: 132 },
    qa: { mode: "desk", targetX: 170, targetY: 232 },
    designer: { mode: "desk", targetX: 170, targetY: 332 },
  });
  const [meetingActive, setMeetingActive] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => {
      setAgentStates((prev) => {
        const next: Record<string, AgentState> = { ...prev };
        const keys = Object.keys(next) as string[];

        keys.forEach((key) => {
          const current = next[key];

          if (meetingActive && current.mode !== "meeting") {
            next[key] = {
              mode: "meeting",
              targetX: 360,
              targetY: 175,
            };
            return;
          }

          const desk = agentDesk(key);
          if (!desk) return;

          const dx = desk.x - current.targetX;
          const dy = desk.y - current.targetY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const wander = Math.random() > 0.65;

          if (current.mode === "meeting" && !meetingActive) {
            next[key] = {
              mode: "desk",
              targetX: desk.x,
              targetY: desk.y,
            };
            return;
          }

          if (current.mode === "room") {
            if (dist < 6) {
              next[key] = {
                mode: "desk",
                targetX: desk.x,
                targetY: desk.y,
              };
            } else {
              next[key] = {
                mode: "room",
                targetX: current.targetX + Math.sign(dx) * 6,
                targetY: current.targetY + Math.sign(dy) * 6,
              };
            }
            return;
          }

          if (wander) {
            next[key] = {
              mode: "room",
              targetX: Math.max(40, Math.min(560, current.targetX + (Math.random() * 160 - 80))),
              targetY: Math.max(40, Math.min(520, current.targetY + (Math.random() * 160 - 80))),
            };
          } else if (dist > 8) {
            next[key] = {
              mode: "desk",
              targetX: current.targetX + Math.sign(dx) * 6,
              targetY: current.targetY + Math.sign(dy) * 6,
            };
          }
        });

        return next;
      });
    }, 1000);

    return () => window.clearInterval(id);
  }, [meetingActive]);

  const spreadToDesks = () => {
    setMeetingActive(false);
    setAgentStates({
      senior: { mode: "desk", targetX: 170, targetY: 132 },
      qa: { mode: "desk", targetX: 170, targetY: 232 },
      designer: { mode: "desk", targetX: 170, targetY: 332 },
    });
  };

  const gatherToMeeting = () => {
    setMeetingActive(true);
    setAgentStates({
      senior: { mode: "meeting", targetX: 360, targetY: 175 },
      qa: { mode: "meeting", targetX: 425, targetY: 175 },
      designer: { mode: "meeting", targetX: 390, targetY: 210 },
    });
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-icon">🏢</span>
          <span className="brand-title">Agent Office</span>
        </div>
        <div className="topbar-actions">
          <button className="ghost" onClick={spreadToDesks}>사무실 복귀</button>
          <button className="primary" onClick={gatherToMeeting}>회의하자</button>
        </div>
      </header>

      <section className="layout">
        <aside className="sidebar">
          <div className="section-title">에이전트 명단</div>
          <div className="agents">
            {agents.map((agent) => (
              <article key={agent.id} className="agent-card">
                <div className="agent-header">
                  <div className="agent-avatar" style={{ background: `${agent.color}14`, border: `1px solid ${agent.color}55` }}>
                    {agent.icon}
                  </div>
                  <div className="agent-meta">
                    <div className="agent-name">{agent.label}</div>
                    <div className="agent-role">{agent.role}</div>
                  </div>
                </div>
                <p className="agent-desc">{agent.description}</p>
                <div className="agent-task">
                  <span className="agent-task-label">현재 작업</span>
                  <span>{agent.currentTask}</span>
                </div>
                <div className="agent-status">위치: {agentStates[agent.id]?.mode ?? "desk"}</div>
              </article>
            ))}
          </div>
        </aside>

        <main className="stage">
          <div className="office">
            <div className="room-label top-left">📂 에이전트 오피스</div>

            {FURNITURE.map((item) => (
              <div
                key={item.label}
                className={`furniture ${item.kind}`}
                style={{ left: item.x, top: item.y, width: item.width, height: item.height }}
              >
                <span className="furniture-label">{item.label}</span>
              </div>
            ))}

            {agents.map((agent) => {
              const state = agentStates[agent.id];
              if (!state) return null;

              const isMeeting = state.mode === "meeting";

              return (
                <div
                  key={agent.id}
                  className={`avatar avatar-${state.mode}`}
                  style={{
                    left: state.targetX,
                    top: state.targetY,
                    background: `${agent.color}22`,
                    border: `1px solid ${agent.color}55`,
                  }}
                >
                  <span className="avatar-icon">{agent.icon}</span>
                  <span className="avatar-name" style={{ color: agent.color }}>
                    {agent.label}
                  </span>
                </div>
              );
            })}
          </div>

          <ChatPanel agents={agents} />
        </main>
      </section>
    </div>
  );
}
