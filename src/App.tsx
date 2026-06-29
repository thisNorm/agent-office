import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import ChatPanel from "./components/ChatPanel";
import AgentSidebar from "./components/AgentSidebar";
import type { AgentMeta, Message, Position } from "./types";

const INITIAL_AGENTS: AgentMeta[] = [
  {
    id: "senior",
    label: "시니어 개발자",
    role: "Senior Developer",
    color: "#0ea5e9",
    icon: "🧑‍💻",
    description: "아키텍처, 코드 리뷰, 배포 설계를 담당합니다.",
    status: "idle",
    currentTask: "대기 중",
    location: "desk",
  },
  {
    id: "qa",
    label: "QA",
    role: "Quality Assurance",
    color: "#f59e0b",
    icon: "🧪",
    description: "테스트 케이스 설계, 품질 검증을 담당합니다.",
    status: "idle",
    currentTask: "대기 중",
    location: "desk",
  },
  {
    id: "designer",
    label: "디자이너",
    role: "UI/UX Designer",
    color: "#ec4899",
    icon: "🎨",
    description: "UI 설계, 사용자 경험 개선을 담당합니다.",
    status: "idle",
    currentTask: "대기 중",
    location: "desk",
  },
  {
    id: "scribe",
    label: "비서",
    role: "Assistant",
    color: "#8b5cf6",
    icon: "📚",
    description: "모든 회의록, 작업 결과물, 에이전트 활동을 수집하여 Obsidian 볼트에 기록하고 관리합니다.",
    status: "idle",
    currentTask: "대기 중",
    location: "desk",
  },
];

const ZONES = {
  seniorDesk: { x: 10, y: 20 },
  qaDesk: { x: 28, y: 20 },
  designerDesk: { x: 46, y: 20 },
  scribeDesk: { x: 64, y: 20 },
  meetingTable: { x: 82, y: 18 },
  sofa: { x: 82, y: 50 },
  coffeeTable: { x: 70, y: 50 },
  bookshelf: { x: 35, y: 60 },
  cabinet: { x: 50, y: 60 },
  plant: { x: 15, y: 60 },
  entrance: { x: 5, y: 85 },
};

const agentWorkSpots: Record<string, Position> = {
  senior: ZONES.seniorDesk,
  qa: ZONES.qaDesk,
  designer: ZONES.designerDesk,
  scribe: ZONES.scribeDesk,
};

const agentMeetingSpots: Record<string, Position> = {
  senior: { x: 50, y: 19 },
  qa: { x: 56, y: 19 },
  designer: { x: 62, y: 19 },
  scribe: { x: 68, y: 19 },
};

const wanderPoints = Object.values(ZONES);

function getRandomWanderPoint(current: Position): Position {
  const others = wanderPoints.filter(
    (p) => Math.hypot(p.x - current.x, p.y - current.y) > 10
  );
  if (others.length === 0) return wanderPoints[Math.floor(Math.random() * wanderPoints.length)];
  return others[Math.floor(Math.random() * wanderPoints.length)];
}

const TASK_TEMPLATES: Record<string, string[]> = {
  senior: [
    "아키텍처 설계 문서 검토 중",
    "코드 리뷰 진행 중 (PR #42)",
    "배포 파이프라인 점검 중",
    "기술 스펙 문서 작성 중",
    "의존성 패키지 업데이트 검토",
  ],
  qa: [
    "테스트 케이스 작성 중",
    "리그레션 테스트 실행 중",
    "버그 리포트 분석 중",
    "테스트 자동화 스크립트 수정",
    "MQTT 브리지 테스트 검토",
  ],
  designer: [
    "와이어프레임 스케치 중",
    "UI 컴포넌트 가이드 업데이트",
    "사용자 플로우 다이어그램 작성",
    "프로토타입 디자인 중",
    "접근성 체크리스트 검토",
  ],
  scribe: [
    "회의록 정리 중",
    "작업 기록 아카이빙 중",
    "Obsidian 볼트 문서 업데이트 중",
    "프로젝트 로그 작성 중",
    "에이전트 활동 보고서 정리 중",
  ],
};

function getRandomTask(agentId: string): string {
  const tasks = TASK_TEMPLATES[agentId] || ["작업 수행 중"];
  return tasks[Math.floor(Math.random() * tasks.length)];
}

function generateAgentResponse(agentId: string, text: string): string {
  const t = text.replace(/@\S+\s*/g, "").trim();
  const keyword = t.length > 0 ? t : "일반";

  const templates: Record<string, string[]> = {
    senior: [
      `${keyword}에 대해 아키텍처 관점에서 검토해보면, 현재 시스템 구조로 충분히 적용 가능합니다. 단, 성능 저하가 우려된다면 캐시 레이어를 먼저 추가하는 걸 권장드려요.`,
      `${keyword} 요청을 받았습니다. 먼저 관련 코드를 확인한 뒤 리뷰 포인트를 정리해서 공유드릴게요.`,
      `${keyword}는 배포 프로세스와도 연관이 있으니, CI/CD 파이프라인 점검도 함께 진행하겠습니다.`,
      `${keyword}에 대해 기술적으로 접근하자면, 의존성 주입과 비동기 처리 흐름을 함께 고려해야 안정적입니다.`,
    ],
    qa: [
      `${keyword}에 대한 테스트 케이스를 추가로 검토했습니다. 정상 케이스 3개, 예외 케이스 2개를 보완했고 회귀 테스트도 함께 돌렸습니다.`,
      `${keyword}는 엣지 케이스가 누락되어 있어 보입니다. 관련 시나리오를 추가해서 테스트 자동화 스크립트에 반영하겠습니다.`,
      `${keyword} 요청 확인했습니다. 먼저 기존 테스트 결과와 충돌 여부를 체크한 뒤, QA 리포팅을 작성하겠습니다.`,
      `${keyword}를 QA 관점에서 보면 사용자 경로별로 재검증이 필요합니다. 체크리스트를 업데이트하고 검수 진행하겠습니다.`,
    ],
    designer: [
      `${keyword}에 대해 UI/UX 측면에서 정리해보면, 정보 계층을 재구성하면 사용성이 더 개선될 것으로 보입니다. 와이어프레임을 업데이트하겠습니다.`,
      `${keyword} 요청을 받았습니다. 디자인 시스템 가이드에 맞춰 컴포넌트를 수정하고, 접근성 요구사항도 함께 검토하겠습니다.`,
      `${keyword}은 사용자 플로우 상에서 핵심 전환 지점입니다. 프로토타입을 수정해서 검증 가능하도록 준비하겠습니다.`,
      `${keyword}에 대한 디자인 제안: 시각적 우선순위를 명확히 하고, 피드백 영역을 확보하면 전환율이 개선될 것입니다.`,
    ],
    scribe: [
      `알겠습니다. ${keyword} 관련 내용을 정리해서 현재 진행 상황을 기록해두었습니다.`,
      `${keyword} 요청을 확인했습니다. 관련 문서를 Obsidian 볼트에 업데이트할게요.`,
      `${keyword}에 대한 회의록과 작업 로그를 아카이빙했습니다. 나중에 추적할 수 있도록 태그도 달아두었어요.`,
    ],
  };

  const list = templates[agentId] || [`${keyword} 확인 후 답변드리겠습니다.`];
  return list[Math.floor(Math.random() * list.length)];
}

async function writeObsidianNote(notePath: string, content: string) {
  try {
    const vaultName = "Obsidian-Work-Brain";
    const fullPath = `Agent-Office/${notePath}`;
    window.open(
      `obsidian://new?vault=${vaultName}&file=${encodeURIComponent(fullPath)}&content=${encodeURIComponent(content)}`,
      "_blank"
    );
    return true;
  } catch {
    return false;
  }
}

function ChibiCharacter({ agent }: { agent: AgentMeta }) {
  const c = agent.color;
  const hairColor =
    agent.id === "senior"
      ? "#1e293b"
      : agent.id === "qa"
        ? "#4a3d2a"
        : agent.id === "designer"
          ? "#8b3a5a"
          : "#5b3a8a";
  const isOffline = agent.status === "offline";
  const isIdle = agent.status === "idle";

  return (
    <svg
      className={`avatar-character ${isOffline ? "offline" : ""} ${isIdle ? "idle" : ""}`}
      width="80"
      height="88"
      viewBox="0 0 52 58"
      fill="none"
    >
      <ellipse cx="26" cy="56" rx="16" ry="3" fill="rgba(0,0,0,0.1)" />
      <rect x="16" y="28" width="20" height="14" rx="5" fill={c} opacity={isOffline ? 0.4 : 0.9} />
      <path d="M22 28 L26 33 L30 28" fill="white" opacity="0.3" />
      <rect x="8" y="29" width="9" height="5" rx="2.5" fill={c} opacity={isOffline ? 0.35 : 0.8} />
      <rect x="35" y="29" width="9" height="5" rx="2.5" fill={c} opacity={isOffline ? 0.35 : 0.8} />
      <rect x="18" y="42" width="6" height="9" rx="3" fill={c} opacity={isOffline ? 0.3 : 0.75} />
      <rect x="28" y="42" width="6" height="9" rx="3" fill={c} opacity={isOffline ? 0.3 : 0.75} />
      <ellipse cx="21" cy="52" rx="4.5" ry="2.5" fill="#333" opacity={isOffline ? 0.3 : 0.7} />
      <ellipse cx="31" cy="52" rx="4.5" ry="2.5" fill="#333" opacity={isOffline ? 0.3 : 0.7} />
      <circle cx="26" cy="14" r="12" fill={isOffline ? "#ccc" : "#fce4d6"} />
      <ellipse cx="26" cy="6" rx="13" ry="8" fill={isOffline ? "#999" : hairColor} opacity={isOffline ? 0.4 : 1} />
      <path d="M14 10 Q18 6 22 9 Q26 5 30 9 Q34 6 38 10" fill={isOffline ? "#999" : hairColor} opacity={isOffline ? 0.4 : 0.9} />
      <rect x="14" y="8" width="3" height="8" rx="1.5" fill={isOffline ? "#999" : hairColor} opacity={isOffline ? 0.4 : 0.8} />
      <rect x="35" y="8" width="3" height="8" rx="1.5" fill={isOffline ? "#999" : hairColor} opacity={isOffline ? 0.4 : 0.8} />
      {isOffline ? (
        <>
          <line x1="18" y1="11" x2="24" y2="17" stroke="#999" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="24" y1="11" x2="18" y2="17" stroke="#999" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="28" y1="11" x2="34" y2="17" stroke="#999" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="34" y1="11" x2="28" y2="17" stroke="#999" strokeWidth="1.5" strokeLinecap="round" />
        </>
      ) : (
        <>
          <ellipse cx="21" cy="14" rx="3.5" ry="4" fill="white" />
          <ellipse cx="31" cy="14" rx="3.5" ry="4" fill="white" />
          <ellipse cx="21" cy="14.5" rx="2.2" ry="2.8" fill="#2d1b0e" />
          <ellipse cx="31" cy="14.5" rx="2.2" ry="2.8" fill="#2d1b0e" />
          <circle cx="20" cy="13" r="1" fill="white" opacity="0.8" />
          <circle cx="30" cy="13" r="1" fill="white" opacity="0.8" />
          {isIdle && (
            <>
              <circle cx="16" cy="17" r="2.5" fill="#ff8a8a" opacity="0.15" />
              <circle cx="36" cy="17" r="2.5" fill="#ff8a8a" opacity="0.15" />
              <path d="M23 19 Q26 20.5 29 19" stroke="#d4756b" strokeWidth="1" fill="none" strokeLinecap="round" />
            </>
          )}
          {!isIdle && (
            <>
              <circle cx="16" cy="17" r="3" fill="#ff8a8a" opacity="0.25" />
              <circle cx="36" cy="17" r="3" fill="#ff8a8a" opacity="0.25" />
              <path d="M23 18 Q26 21 29 18" stroke="#d4756b" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            </>
          )}
          {agent.id === "senior" && (
            <>
              <circle cx="21" cy="14" r="4.5" stroke="rgba(0,0,0,0.25)" strokeWidth="0.8" fill="none" />
              <circle cx="31" cy="14" r="4.5" stroke="rgba(0,0,0,0.25)" strokeWidth="0.8" fill="none" />
              <line x1="25.5" y1="14" x2="26.5" y2="14" stroke="rgba(0,0,0,0.25)" strokeWidth="0.8" />
            </>
          )}
          {agent.id === "scribe" && (
            <>
              <rect x="19" y="10" width="14" height="10" rx="1" fill="rgba(255,255,255,0.2)" transform="rotate(-5, 26, 15)" />
              <line x1="21" y1="13" x2="31" y2="13" stroke="white" strokeWidth="0.6" opacity="0.5" />
              <line x1="21" y1="15" x2="28" y2="15" stroke="white" strokeWidth="0.6" opacity="0.5" />
              <line x1="21" y1="17" x2="26" y2="17" stroke="white" strokeWidth="0.6" opacity="0.5" />
            </>
          )}
          {agent.id === "qa" && (
            <g transform="translate(36, 26)">
              <rect x="0" y="0" width="10" height="7" rx="1" fill="#475569" />
              <rect x="1" y="1" width="8" height="4" rx="0.5" fill="#0f172a" />
              <rect x="2" y="2" width="6" height="2" rx="0.3" fill="#3b82f6" opacity="0.3" />
            </g>
          )}
          {agent.id === "designer" && (
            <g transform="translate(38, 24) rotate(-30)">
              <rect x="0" y="0" width="2" height="8" rx="1" fill="#ff6b6b" />
              <rect x="0" y="6" width="2" height="3" rx="0.5" fill="#d4a574" />
            </g>
          )}
        </>
      )}
    </svg>
  );
}

export default function App() {
  const [agents, setAgents] = useState<AgentMeta[]>(INITIAL_AGENTS);
  const [positions, setPositions] = useState<Record<string, Position>>({ ...agentWorkSpots });
  const [mode, setMode] = useState<"work" | "meeting">("work");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      from: "system",
      text: "👋 Agent Office에 오신 것을 환영합니다! @시니어, @QA, @디자이너, @비서 에게 업무를 지시해보세요.",
      time: new Date().toISOString(),
    },
  ]);
  const [isWandering, setIsWandering] = useState(true);

  const positionsRef = useRef<Record<string, Position>>({ ...agentWorkSpots });
  const agentChatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const targets = useMemo(() => {
    if (mode === "meeting") return { ...agentMeetingSpots };
    return { ...agentWorkSpots };
  }, [mode]);

  useEffect(() => {
    // 자동 채팅 비활성화: 사용자 지시가 있을 때만 busy로 변경
    return () => {};
  }, [agents, mode]);

  const updateAgentStatus = useCallback((agentId: string, status: string, task?: string) => {
    setAgents((prev) => prev.map((a) =>
      a.id === agentId ? { ...a, status, currentTask: task || a.currentTask } : a
    ));
  }, []);

  const toggleMode = useCallback(() => {
    setMode((prev) => {
      const next = prev === "work" ? "meeting" : "work";
      if (next === "work") {
        setIsWandering(true);
        positionsRef.current = { ...agentWorkSpots };
        setPositions({ ...agentWorkSpots });
        setAgents((prev) => prev.map((a) =>
          a.status === "meeting" ? { ...a, status: "idle", currentTask: "대기 중" } : a
        ));
        setMessages((prev) => [...prev, {
          id: crypto.randomUUID(), from: "system",
          text: "🔄 회의가 종료되었습니다. 각자 자리로 복귀합니다.",
          time: new Date().toISOString(),
        }]);
      } else {
        setIsWandering(false);
        positionsRef.current = { ...agentMeetingSpots };
        setPositions({ ...agentMeetingSpots });
        setAgents((prev) => prev.map((a) =>
          a.status !== "offline" ? { ...a, status: "meeting", currentTask: "회의 참석 중" } : a
        ));
        setMessages((prev) => [...prev, {
          id: crypto.randomUUID(), from: "system",
          text: "🏢 회의가 시작되었습니다. 모든 에이전트가 회의실로 이동합니다.",
          time: new Date().toISOString(),
        }]);
      }
      return next;
    });
  }, []);

  const returnToWork = useCallback(() => {
    setMode("work"); setIsWandering(true);
    positionsRef.current = { ...agentWorkSpots };
    setPositions({ ...agentWorkSpots });
    setAgents((prev) => prev.map((a) =>
      a.status === "meeting" ? { ...a, status: "idle", currentTask: "대기 중" } : a
    ));
    setMessages((prev) => [...prev, {
      id: crypto.randomUUID(), from: "system",
      text: "🔄 회의가 종료되었습니다. 각자 자리로 복귀합니다.",
      time: new Date().toISOString(),
    }]);
  }, []);

  const handleUserMessage = useCallback((text: string) => {
    const mentionMatch = text.match(/@(\S+)/);
    const targetAgentId = mentionMatch
      ? agents.find((a) => a.id === mentionMatch[1] || a.label.includes(mentionMatch[1]))
      : undefined;

    if (!targetAgentId) {
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(),
        from: "system",
        text: "⚠️ @시니어, @QA, @디자이너 중 한 명을 멘션해주세요. @비서는 기록 전용입니다.",
        time: new Date().toISOString(),
      }]);
      return;
    }

    const task = getRandomTask(targetAgentId.id);
    updateAgentStatus(targetAgentId.id, "busy", task);
    const response = generateAgentResponse(targetAgentId.id, text);

    setTimeout(() => {
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(),
        from: targetAgentId.id,
        text: response,
        time: new Date().toISOString(),
        isAgentMessage: true,
      }]);
    }, 500);
  }, [agents, updateAgentStatus]);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-icon">AO</span>
          <span className="brand-name">Agent Office</span>
          <span className="brand-sub">— 멀티 에이전트 협업 플랫폼</span>
        </div>
        <div className="topbar-center">
          <div className="mode-indicator">
            <span className={`mode-badge ${mode}`}>
              {mode === "work" ? "💼 업무 모드" : "🤝 회의 모드"}
            </span>
            <span className="agent-count">
              {agents.filter((a) => a.status === "busy").length}명 작업중 · {agents.filter((a) => a.status === "idle").length}명 대기중
            </span>
          </div>
        </div>
        <div className="topbar-actions">
          <div className="topbar-status">
            <span className="topbar-dot" />
            <span className="topbar-label">Online</span>
          </div>
          {mode === "meeting" && (
            <button className="ghost" onClick={returnToWork}>사무실 복귀</button>
          )}
          <button className="primary" onClick={toggleMode}>
            {mode === "work" ? "🤝 회의 시작" : "💼 업무 복귀"}
          </button>
        </div>
      </header>

      <section className="layout">
        <AgentSidebar agents={agents} mode={mode} />

        <main className="stage">
          <div className="office-bg">
            <div className="office-floor">
              <div className="floor-grid" />
              <div className="office-walls">
                <div className="wall-top" />
                <div className="wall-left" />
              </div>

              <div className="office-furniture">
                <div className="furniture desk senior-desk">
                  <div className="desk-top">
                    <div className="desk-monitor" />
                    <div className="desk-keyboard" />
                    <span className="desk-label">시니어 개발자</span>
                    <span className="desk-accessory coffee">☕</span>
                  </div>
                </div>
                <div className="furniture desk qa-desk">
                  <div className="desk-top">
                    <div className="desk-monitor" />
                    <div className="desk-keyboard" />
                    <span className="desk-label">QA</span>
                    <span className="desk-accessory plant">🌱</span>
                  </div>
                </div>
                <div className="furniture desk designer-desk">
                  <div className="desk-top">
                    <div className="desk-monitor" />
                    <div className="desk-keyboard" />
                    <span className="desk-label">디자이너</span>
                  </div>
                </div>
                <div className="furniture desk scribe-desk">
                  <div className="desk-top">
                    <div className="desk-monitor" />
                    <div className="desk-keyboard" />
                    <span className="desk-label">비서</span>
                    <span className="desk-accessory" style={{ right: "2px", bottom: "4px", fontSize: "10px" }}>📚</span>
                  </div>
                </div>
                <div className="furniture meeting-table">
                  <div className="table-top">
                    <div className="table-surface">
                      <span className="table-label">회의 테이블</span>
                    </div>
                    <div className="table-chairs">
                      <div className="table-chair" />
                      <div className="table-chair" />
                      <div className="table-chair" />
                      <div className="table-chair" />
                    </div>
                  </div>
                </div>
                <div className="furniture sofa">
                  <div className="sofa-body">
                    <div className="sofa-armrest left" />
                    <div className="sofa-armrest right" />
                    <span className="sofa-label">SOFA</span>
                  </div>
                </div>
                <div className="furniture coffee-table">
                  <div className="coffee-table-top">
                    <span className="coffee-table-label">☕</span>
                  </div>
                </div>
                <div className="furniture bookshelf">
                  <div className="bookshelf-body">
                    <div className="bookshelf-shelf"><span>📘</span><span>📗</span><span>📙</span></div>
                    <div className="bookshelf-shelf"><span>📕</span><span>📘</span><span>📓</span></div>
                    <div className="bookshelf-shelf"><span>📗</span><span>📙</span><span>📕</span></div>
                  </div>
                </div>
                <div className="furniture cabinet">
                  <div className="cabinet-body">
                    <span className="cabinet-label">🗄️</span>
                  </div>
                </div>
                <div className="furniture plant">
                  <div className="plant-pot">
                    <span className="plant-leaves">🌿</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="agents-layer">
            {agents.map((agent) => {
              const pos = positions[agent.id];
              if (!pos) return null;
              const isMoving = mode === "work" && isWandering && agent.status !== "idle";
              return (
                <div
                  key={agent.id}
                  className={`agent-avatar ${mode === "meeting" ? "at-meeting" : ""} ${isMoving ? "is-walking" : ""} ${agent.status === "idle" ? "is-idle" : ""}`}
                  style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    "--agent-color": agent.color,
                  } as React.CSSProperties}
                >
                  <div className="avatar-body">
                    <ChibiCharacter agent={agent} />
                    <div className="avatar-shadow" />
                  </div>
                  <div className="avatar-info">
                    <span className="avatar-name" style={{ color: agent.color }}>
                      {agent.label}
                    </span>
                    <span className={`avatar-status ${agent.status}`} />
                  </div>
                  {agent.status === "busy" && isMoving && (
                    <div className="avatar-thought">
                      <span>{agent.currentTask}</span>
                    </div>
                  )}
                  {agent.status === "idle" && (
                    <div className="avatar-idle-badge">💤 대기중</div>
                  )}
                </div>
              );
            })}
          </div>

          {mode === "meeting" && (
            <div className="meeting-overlay">
              <div className="meeting-badge">🤝 회의 진행중</div>
              <div className="meeting-participants">
                {agents.filter((a) => a.status !== "offline").map((a) => (
                  <span key={a.id} className="meeting-participant" style={{ color: a.color }}>
                    {a.icon} {a.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </main>

        <aside className="right-panel">
          <ChatPanel
            agents={agents}
            messages={messages}
            onSendMessage={(text: string) => {
              setMessages((prev) => [...prev, {
                id: crypto.randomUUID(), from: "user", text, time: new Date().toISOString(),
              }]);
              handleUserMessage(text);
            }}
          />
        </aside>
      </section>
    </div>
  );
}