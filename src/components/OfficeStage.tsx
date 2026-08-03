import { Activity, CheckSquare, Coffee, MonitorCog, Network, PanelsTopLeft } from "lucide-react";
import AgentAvatar from "./AgentAvatar";
import type { AgentMeta, FurnitureItem, Position } from "../types";
import { FURNITURE, OFFICE_ZONES } from "../officeLayout";

const zoneIcon = {
  focus: PanelsTopLeft,
  qa: CheckSquare,
  design: Network,
  meeting: Activity,
  ops: MonitorCog,
  lounge: Coffee,
} as const;

function Furniture({ item }: { item: FurnitureItem }) {
  return (
    <div
      className={`office-object ${item.kind} ${item.detail}`}
      style={{
        left: `${item.x}%`,
        top: `${item.y}%`,
        width: `${item.width}%`,
        height: `${item.height}%`,
      }}
    >
      <div className="object-glow" />
      <div className="object-body">
        <span className="object-label">{item.label}</span>
        <span className="object-lines" />
        <span className="object-lights" />
      </div>
    </div>
  );
}

export default function OfficeStage({
  agents,
  positions,
  mode,
  selectedAgentId,
  activeAgentId,
  movingAgentIds,
  onSelectAgent,
}: {
  agents: readonly AgentMeta[];
  positions: Record<string, Position>;
  mode: "work" | "meeting";
  selectedAgentId: string;
  activeAgentId: string | null;
  movingAgentIds: readonly string[];
  onSelectAgent: (agentId: string) => void;
}) {
  const selectedAgent = agents.find((agent) => agent.id === selectedAgentId);

  return (
    <main className="stage">
      <div className="stage-header">
        <div>
          <span className="eyebrow">AI Agent Operations Room</span>
          <h1>{mode === "meeting" ? "War Room meeting active" : "Live team floor"}</h1>
        </div>
        {selectedAgent && (
          <div className="stage-focus">
            <span>{selectedAgent.label}</span>
            <strong>{selectedAgent.currentTask}</strong>
          </div>
        )}
      </div>

      <div className="office-map">
        <div className="map-vignette" />
        <div className="floor-grid" />
        {OFFICE_ZONES.map((zone) => {
          const Icon = zoneIcon[zone.id];
          return (
            <section
              key={zone.id}
              className={`office-zone ${zone.tone}`}
              style={{
                left: `${zone.x}%`,
                top: `${zone.y}%`,
                width: `${zone.width}%`,
                height: `${zone.height}%`,
              }}
            >
              <div className="zone-title">
                <Icon size={13} />
                <span>{zone.label}</span>
              </div>
              <p>{zone.purpose}</p>
            </section>
          );
        })}

        <div className="furniture-layer">
          {FURNITURE.map((item) => (
            <Furniture key={item.id} item={item} />
          ))}
        </div>

        <div className="agents-layer">
          {agents.map((agent) => {
            const position = positions[agent.id];
            if (!position) return null;
            const selected = selectedAgentId === agent.id;
            const active = activeAgentId === agent.id;
            const moving = movingAgentIds.includes(agent.id);
            return (
              <button
                key={agent.id}
                className={`agent-avatar ${agent.status} ${selected ? "selected" : ""} ${active ? "active" : ""} ${moving ? "walking" : ""}`}
                style={{
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                }}
                onClick={() => onSelectAgent(agent.id)}
                aria-label={`${agent.label} 선택`}
              >
                <AgentAvatar agent={agent} selected={selected} active={active} />
              </button>
            );
          })}
        </div>

        {mode === "meeting" && (
          <div className="meeting-overlay">
            <strong>회의 진행 중</strong>
            <span>참여 에이전트가 War Room 주변으로 모였습니다.</span>
          </div>
        )}
      </div>
    </main>
  );
}
