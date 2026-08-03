import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AgentSidebar from "./components/AgentSidebar";
import ChatPanel from "./components/ChatPanel";
import OfficeStage from "./components/OfficeStage";
import { cleanModelReply, localAgentReply, resolveMention } from "./conversation";
import {
  INITIAL_AGENTS,
  MEETING_SPOTS,
  WORK_SPOTS,
  getStatusLabel,
  keepDistance,
  pickNextZone,
  routeWaypoint,
  spreadPosition,
  taskForZone,
} from "./officeLayout";
import type { AgentMeta, AgentStatus, Message, Position, ZoneId } from "./types";

// ── localStorage helpers ───────────────────────────────────────────────────
const LS_MESSAGES = "ao:messages";
const LS_POSITIONS = "ao:positions";
const LS_HISTORY = "ao:chatHistory";
const MAX_STORED_MESSAGES = 120;

function lsGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function lsSet(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// ── walk helpers ──────────────────────────────────────────────────────────
const WALK_STEP = 5.5;
const WALK_INTERVAL_MS = 560;

function stepToward(from: Position, to: Position): Position {
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  if (distance <= WALK_STEP) return to;
  const ratio = WALK_STEP / distance;
  return { x: from.x + (to.x - from.x) * ratio, y: from.y + (to.y - from.y) * ratio };
}

// ── chat history type ──────────────────────────────────────────────────────
type HistoryEntry = { role: "user" | "assistant"; content: string };

// ── initial state ──────────────────────────────────────────────────────────
const INITIAL_MESSAGES: Message[] = [
  {
    id: "init",
    from: "system",
    text: "Agent Office가 준비되었습니다. @PM, @시니어, @QA, @디자이너, @비서 처럼 멘션하거나, 멘션 없이 보내면 팀 전체가 답합니다.",
    time: new Date().toISOString(),
  },
];

export default function App() {
  const [agents, setAgents] = useState<AgentMeta[]>(() =>
    INITIAL_AGENTS.map((a) => ({ ...a }))
  );
  const [positions, setPositions] = useState<Record<string, Position>>(() =>
    lsGet(LS_POSITIONS, { ...WORK_SPOTS })
  );
  const [mode, setMode] = useState<"work" | "meeting">("work");
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = lsGet<Message[]>(LS_MESSAGES, []);
    return saved.length > 0 ? saved : INITIAL_MESSAGES;
  });
  const [selectedAgentId, setSelectedAgentId] = useState("pm");
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const [movingAgentIds, setMovingAgentIds] = useState<readonly string[]>([]);

  const positionsRef = useRef<Record<string, Position>>(positions);
  const agentsRef = useRef<AgentMeta[]>(agents);
  const tickRef = useRef(0);
  const routeTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  // Per-agent conversation history for context memory
  const chatHistoryRef = useRef<Record<string, HistoryEntry[]>>(
    lsGet(LS_HISTORY, {})
  );

  // Keep refs in sync
  useEffect(() => { agentsRef.current = agents; }, [agents]);
  useEffect(() => { positionsRef.current = positions; }, [positions]);

  // Persist messages (trim to avoid bloat)
  useEffect(() => {
    const toSave = messages.slice(-MAX_STORED_MESSAGES);
    lsSet(LS_MESSAGES, toSave);
  }, [messages]);

  // Persist positions
  useEffect(() => { lsSet(LS_POSITIONS, positions); }, [positions]);

  // ── team stats ───────────────────────────────────────────────────────────
  const teamStats = useMemo(() => {
    const count = (s: AgentStatus) => agents.filter((a) => a.status === s).length;
    return {
      active: agents.filter((a) => a.status !== "offline").length,
      working: count("working") + count("speaking"),
      reviewing: count("reviewing"),
      meeting: count("meeting"),
      blocked: count("blocked"),
    };
  }, [agents]);

  // ── movement ─────────────────────────────────────────────────────────────
  const moveAgent = useCallback((agentId: string, target: Position) => {
    const current = positionsRef.current[agentId] || WORK_SPOTS[agentId] || target;
    const waypoint = routeWaypoint(current, target);
    const route = waypoint ? [waypoint, target] : [target];

    const commit = (next: Position) => {
      positionsRef.current = { ...positionsRef.current, [agentId]: next };
      setPositions({ ...positionsRef.current });
    };

    const walk = (routeIndex: number) => {
      const destination = route[routeIndex];
      if (!destination) {
        setMovingAgentIds((ids) => ids.filter((id) => id !== agentId));
        return;
      }
      const next = stepToward(positionsRef.current[agentId] || current, destination);
      commit(next);
      if (next.x === destination.x && next.y === destination.y) {
        walk(routeIndex + 1);
        return;
      }
      routeTimersRef.current[agentId] = setTimeout(() => walk(routeIndex), WALK_INTERVAL_MS);
    };

    const timer = routeTimersRef.current[agentId];
    if (timer) clearTimeout(timer);
    setMovingAgentIds((ids) => (ids.includes(agentId) ? ids : [...ids, agentId]));
    walk(0);
  }, []);

  useEffect(() => {
    return () => Object.values(routeTimersRef.current).forEach(clearTimeout);
  }, []);

  // ── wander loop — moves agents, does NOT fake status ──────────────────────
  useEffect(() => {
    if (mode !== "work") return;
    const interval = setInterval(() => {
      tickRef.current += 1;
      const occupied: Position[] = [];

      // Compute new positions outside setAgents to avoid side-effects in updater
      const currentAgents = agentsRef.current;
      const updates: { id: string; target: Position; zoneId: ZoneId }[] = [];

      currentAgents.forEach((agent, index) => {
        if (agent.status === "offline" || agent.status === "speaking") return;
        const zoneId = pickNextZone(agent, tickRef.current + index);
        const rawTarget = spreadPosition(zoneId, tickRef.current, index);
        const target = keepDistance(rawTarget, occupied);
        occupied.push(target);
        updates.push({ id: agent.id, target, zoneId });
      });

      // Move agents (side effect — outside updater)
      updates.forEach(({ id, target }) => moveAgent(id, target));

      // Only update location, not status — status only changes from user interaction
      setAgents((prev) =>
        prev.map((agent) => {
          const update = updates.find((u) => u.id === agent.id);
          if (!update) return agent;
          return { ...agent, location: update.zoneId };
        })
      );
    }, 4400);

    return () => clearInterval(interval);
  }, [mode, moveAgent]);

  // ── agent status helpers ─────────────────────────────────────────────────
  const setAgentStatus = useCallback((agentId: string, status: AgentStatus, task?: string) => {
    setAgents((prev) =>
      prev.map((a) =>
        a.id === agentId ? { ...a, status, currentTask: task ?? a.currentTask } : a
      )
    );
  }, []);

  // ── LLM call ────────────────────────────────────────────────────────────
  const callAgent = useCallback(
    async (agent: AgentMeta, text: string, delay = 0) => {
      if (delay > 0) await new Promise((r) => setTimeout(r, delay));

      setSelectedAgentId(agent.id);
      setActiveAgentId(agent.id);
      setAgentStatus(agent.id, "speaking", "요청 응답 작성 중");
      moveAgent(
        agent.id,
        mode === "meeting"
          ? MEETING_SPOTS[agent.id]
          : WORK_SPOTS[agent.id] || positionsRef.current[agent.id]
      );

      const history = chatHistoryRef.current[agent.id] ?? [];
      const cleanText = text.replace(/@\S+\s*/g, "").trim();

      let reply = "";
      try {
        const response = await fetch("http://127.0.0.1:7002/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agentId: agent.id, label: agent.label, text: cleanText, history }),
        });
        const data = await response.json();
        reply = cleanModelReply(data?.response) || localAgentReply(agent, text);
      } catch {
        reply = localAgentReply(agent, text);
      }

      // Append to per-agent history
      chatHistoryRef.current[agent.id] = [
        ...history,
        { role: "user" as const, content: cleanText },
        { role: "assistant" as const, content: reply },
      ].slice(-20); // keep last 20 turns
      lsSet(LS_HISTORY, chatHistoryRef.current);

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), from: agent.id, text: reply, time: new Date().toISOString(), isAgentMessage: true },
      ]);
      setActiveAgentId(null);
      setAgentStatus(agent.id, "idle", "대기 중");
    },
    [mode, moveAgent, setAgentStatus]
  );

  // ── mode toggle ──────────────────────────────────────────────────────────
  const toggleMode = useCallback(() => {
    setMode((prev) => {
      const next = prev === "work" ? "meeting" : "work";
      const spots = next === "meeting" ? MEETING_SPOTS : WORK_SPOTS;
      agentsRef.current.forEach((agent) => moveAgent(agent.id, spots[agent.id]));
      setAgents((current) =>
        current.map((agent): AgentMeta => {
          const status: AgentStatus = next === "meeting" ? "meeting" : "idle";
          const location: ZoneId = next === "meeting" ? "meeting" : agent.location;
          return { ...agent, status, location, currentTask: next === "meeting" ? "회의 참석 중" : "대기 중" };
        })
      );
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          from: "system",
          text:
            next === "meeting"
              ? "회의 모드가 시작되었습니다. 에이전트들이 War Room으로 이동합니다."
              : "업무 모드로 복귀했습니다.",
          time: new Date().toISOString(),
        },
      ]);
      return next;
    });
  }, [moveAgent]);

  // ── message handling ─────────────────────────────────────────────────────
  const handleUserMessage = useCallback(
    (text: string) => {
      if (/회의\s*시작|미팅\s*시작|meeting\s*start/i.test(text) && mode === "work") {
        toggleMode();
        return;
      }

      const mentioned = resolveMention(text, agentsRef.current);
      if (mentioned) {
        void callAgent(mentioned, text);
      } else {
        // No mention → everyone responds, staggered
        const active = agentsRef.current.filter((a) => a.status !== "offline");
        active.forEach((agent, i) => void callAgent(agent, text, i * 1200));
      }
    },
    [callAgent, mode, toggleMode]
  );

  const selectedAgent = agents.find((a) => a.id === selectedAgentId) ?? agents[0];

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-icon">AO</span>
          <div>
            <span className="brand-name">Agent Office</span>
            <span className="brand-sub">멀티 에이전트 협업 플랫폼</span>
          </div>
        </div>

        <div className="team-metrics" aria-label="팀 상태 요약">
          <span>Active {teamStats.active}</span>
          <span>Working {teamStats.working}</span>
          <span>Reviewing {teamStats.reviewing}</span>
          <span>Meeting {teamStats.meeting}</span>
          <span>Blocked {teamStats.blocked}</span>
        </div>

        <div className="topbar-actions">
          <div className="topbar-status">
            <span className="topbar-dot" />
            <span>{mode === "meeting" ? "Meeting" : "Live Ops"}</span>
          </div>
          <button className="primary" type="button" onClick={toggleMode}>
            {mode === "work" ? "회의 시작" : "업무 복귀"}
          </button>
        </div>
      </header>

      <section className="layout">
        <AgentSidebar
          agents={agents}
          mode={mode}
          selectedAgentId={selectedAgentId}
          onSelectAgent={setSelectedAgentId}
        />

        <OfficeStage
          agents={agents}
          positions={positions}
          mode={mode}
          selectedAgentId={selectedAgentId}
          activeAgentId={activeAgentId}
          movingAgentIds={movingAgentIds}
          onSelectAgent={setSelectedAgentId}
        />

        <aside className="right-panel">
          {selectedAgent && (
            <div className="agent-detail-strip">
              <span>{selectedAgent.label}</span>
              <strong>
                {getStatusLabel(selectedAgent.status)} · {selectedAgent.currentTask}
              </strong>
            </div>
          )}
          <ChatPanel
            agents={agents}
            messages={messages}
            activeAgentId={activeAgentId}
            onSelectAgent={setSelectedAgentId}
            onSendMessage={(text: string) => {
              setMessages((prev) => [
                ...prev,
                { id: crypto.randomUUID(), from: "user", text, time: new Date().toISOString() },
              ]);
              handleUserMessage(text);
            }}
          />
        </aside>
      </section>
    </div>
  );
}
