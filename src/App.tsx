import ChatPanel from "./components/ChatPanel";

const agents = [
  {
    id: "senior",
    label: "시니어 개발자",
    role: "Senior Developer",
    color: "#0ea5e9",
    icon: "🧑‍💻",
    description: "아키텍처, 코드, 리뷰, 배포, 리스크 관리",
    status: "online",
    currentTask: "현재 작업: QA 검수",
    location: "desk",
  },
  {
    id: "qa",
    label: "QA",
    role: "Quality",
    color: "#16a34a",
    icon: "🧪",
    description: "테스트 실행, 품질 검증, 버그/리스크 관리",
    status: "busy",
    currentTask: "현재 작업 MQTT 브리지 테스트 케이스 검토",
    location: "desk",
  },
  {
    id: "designer",
    label: "디자이너",
    role: "UI/UX Designer",
    color: "#ec4899",
    icon: "🎨",
    description: "디바이스/화면 UI 설계, 컴포넌트 가이드, 사용자 흐름",
    status: "offline",
    currentTask: "현재 작업 대시보드 메인 화면 초안",
    location: "room",
  },
];

export default function App() {
  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-icon">AO</span>
          <span className="brand-name">Agent Office</span>
        </div>
        <div className="topbar-actions">
          <div className="topbar-status">
            <span className="topbar-dot" />
            <span className="topbar-label">Online</span>
          </div>
        </div>
      </header>

      <section className="layout">
        <main className="workspace">
          <div className="page">
            <div className="section">
              <div className="section-head">
                <div className="section-title">에이전트 담당</div>
              </div>
            </div>

            {agents.map((agent) => (
              <div className="section" key={agent.id}>
                <div className="card">
                  <div className="card-head">
                    <div className="card-left">
                      <div className="avatar" style={{ background: `${agent.color}18`, border: `1px solid ${agent.color}55` }}>
                        {agent.icon}
                      </div>
                      <div className="card-meta">
                        <div className="card-name">{agent.label}</div>
                        <div className="card-role">{agent.role}</div>
                      </div>
                    </div>
                    <div className="badge" data-status={agent.status}>
                      <span className="dot" />
                      {agent.status === "online" ? "온라인" : agent.status === "busy" ? "작업 중" : "오프라인"}
                    </div>
                  </div>
                  <p className="card-desc">{agent.description}</p>
                  <div className="task-box">
                    <span className="task-label">현재 작업</span>
                    <div className="task-value">{agent.currentTask}</div>
                    <span className="task-label" style={{ marginTop: 6, display: "inline-block" }}>
                      위치: {agent.location}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>

        <aside className="chat">
          <ChatPanel agents={agents} />
        </aside>
      </section>
    </div>
  );
}
