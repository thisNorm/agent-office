import type { AgentMeta, AgentStatus, FurnitureItem, OfficeZone, Position, ZoneId } from "./types";

export const OFFICE_ZONES: readonly OfficeZone[] = [
  { id: "focus", label: "Focus Pods", purpose: "개발 작업 구역", x: 7, y: 12, width: 36, height: 28, tone: "blue" },
  { id: "qa", label: "QA Bench", purpose: "테스트/검증", x: 7, y: 46, width: 28, height: 28, tone: "amber" },
  { id: "design", label: "Design Board", purpose: "기획/디자인", x: 42, y: 10, width: 24, height: 29, tone: "violet" },
  { id: "meeting", label: "War Room", purpose: "회의/의사결정", x: 39, y: 44, width: 30, height: 29, tone: "indigo" },
  { id: "ops", label: "Ops Console", purpose: "모니터링/런타임", x: 72, y: 12, width: 20, height: 33, tone: "green" },
  { id: "lounge", label: "Lounge", purpose: "대기/휴식", x: 72, y: 57, width: 20, height: 27, tone: "neutral" },
] as const;

export const FURNITURE: readonly FurnitureItem[] = [
  { id: "senior-pod", kind: "workstation", zoneId: "focus", label: "Code pod", x: 12, y: 22, width: 13, height: 10, detail: "editor" },
  { id: "devops-pod", kind: "workstation", zoneId: "focus", label: "Build pod", x: 27, y: 22, width: 12, height: 10, detail: "terminal" },
  { id: "qa-bench", kind: "workstation", zoneId: "qa", label: "Test bench", x: 12, y: 58, width: 15, height: 10, detail: "checklist" },
  { id: "design-board", kind: "board", zoneId: "design", label: "Flow board", x: 47, y: 17, width: 14, height: 16, detail: "wireframe" },
  { id: "meeting-table", kind: "meeting", zoneId: "meeting", label: "Decision table", x: 45, y: 53, width: 18, height: 12, detail: "meeting" },
  { id: "ops-rack", kind: "rack", zoneId: "ops", label: "Runtime rack", x: 78, y: 21, width: 9, height: 17, detail: "graphs" },
  { id: "lounge-sofa", kind: "sofa", zoneId: "lounge", label: "Lounge sofa", x: 76, y: 67, width: 12, height: 10, detail: "idle" },
  { id: "lounge-rug", kind: "rug", zoneId: "lounge", label: "Quiet rug", x: 75, y: 61, width: 15, height: 20, detail: "rug" },
  { id: "plant-a", kind: "plant", zoneId: "qa", label: "Plant", x: 30, y: 67, width: 4, height: 8, detail: "plant" },
] as const;

export const INITIAL_AGENTS: readonly AgentMeta[] = [
  {
    id: "pm",
    label: "PM",
    role: "Project Manager",
    color: "#27a644",
    initials: "PM",
    tool: "clipboard",
    description: "목표, 우선순위, 회의 결론과 액션 아이템을 정리합니다.",
    status: "idle",
    currentTask: "워크룸 우선순위 확인",
    location: "design",
    preferredZones: ["meeting", "design", "focus"],
  },
  {
    id: "senior",
    label: "시니어 개발자",
    role: "Senior Developer",
    color: "#0ea5e9",
    initials: "SD",
    tool: "code",
    description: "구현 구조, 코드 품질, 배포 리스크를 판단합니다.",
    status: "idle",
    currentTask: "대기 중",
    location: "focus",
    preferredZones: ["focus", "ops", "meeting"],
  },
  {
    id: "qa",
    label: "QA",
    role: "Quality Assurance",
    color: "#f59e0b",
    initials: "QA",
    tool: "check",
    description: "완료 기준, 실패 케이스, 스크린샷 검증을 담당합니다.",
    status: "idle",
    currentTask: "대기 중",
    location: "qa",
    preferredZones: ["qa", "focus", "meeting"],
  },
  {
    id: "designer",
    label: "디자이너",
    role: "UI/UX Designer",
    color: "#7170ff",
    initials: "UX",
    tool: "pen",
    description: "시각 밀도, 계층, 색상, 사용성 기준을 점검합니다.",
    status: "idle",
    currentTask: "대기 중",
    location: "design",
    preferredZones: ["design", "meeting", "focus"],
  },
  {
    id: "scribe",
    label: "비서",
    role: "Assistant",
    color: "#8b5cf6",
    initials: "AS",
    tool: "message",
    description: "대화, 회의록, 작업 로그를 정리하고 전달합니다.",
    status: "idle",
    currentTask: "팀 활동 로그 정리",
    location: "ops",
    preferredZones: ["ops", "meeting", "lounge"],
  },
] as const;

export const WORK_SPOTS: Record<string, Position> = {
  pm: { x: 53, y: 39 },
  senior: { x: 18, y: 42 },
  qa: { x: 23, y: 77 },
  designer: { x: 62, y: 38 },
  scribe: { x: 83, y: 49 },
};

export const MEETING_SPOTS: Record<string, Position> = {
  pm: { x: 50, y: 51 },
  senior: { x: 43, y: 60 },
  qa: { x: 50, y: 72 },
  designer: { x: 62, y: 60 },
  scribe: { x: 66, y: 51 },
};

export const ZONE_ANCHORS: Record<ZoneId, readonly Position[]> = {
  focus: [{ x: 16, y: 41 }, { x: 33, y: 41 }, { x: 26, y: 16 }],
  qa: [{ x: 15, y: 75 }, { x: 31, y: 55 }, { x: 28, y: 79 }],
  design: [{ x: 49, y: 38 }, { x: 64, y: 22 }, { x: 61, y: 39 }],
  meeting: [{ x: 43, y: 59 }, { x: 50, y: 72 }, { x: 62, y: 59 }, { x: 66, y: 51 }],
  ops: [{ x: 75, y: 47 }, { x: 89, y: 31 }, { x: 83, y: 48 }],
  lounge: [{ x: 75, y: 78 }, { x: 88, y: 78 }, { x: 84, y: 61 }],
};

export const TASKS_BY_ZONE: Record<ZoneId, readonly string[]> = {
  focus: ["코드 패널 검토", "빌드 로그 확인", "구현 리스크 점검"],
  qa: ["회귀 테스트 체크", "버그 카드 분류", "완료 기준 확인"],
  design: ["와이어프레임 정리", "시각 계층 점검", "제품 흐름 검토"],
  meeting: ["회의 참석", "쟁점 정리", "결정사항 확인"],
  ops: ["런타임 상태 모니터링", "터미널 로그 확인", "모델 응답 상태 점검"],
  lounge: ["대기 중", "요청 대기", "작업 전환 준비"],
};

export function getStatusLabel(status: AgentStatus): string {
  return {
    idle: "대기",
    working: "작업",
    reviewing: "검토",
    meeting: "회의",
    speaking: "발언",
    blocked: "막힘",
    offline: "오프라인",
  }[status];
}

export function pickNextZone(agent: AgentMeta, tick: number): ZoneId {
  if (agent.status === "reviewing") return agent.id === "qa" ? "qa" : "design";
  if (agent.status === "blocked") return "meeting";
  const zones = agent.preferredZones;
  return zones[tick % zones.length];
}

export function taskForZone(zoneId: ZoneId, tick: number): string {
  const tasks = TASKS_BY_ZONE[zoneId];
  return tasks[tick % tasks.length];
}

export function spreadPosition(zoneId: ZoneId, tick: number, offset: number): Position {
  const anchors = ZONE_ANCHORS[zoneId];
  return anchors[(tick + offset) % anchors.length];
}

export function isPointInFurniture(point: Position, padding = 3): boolean {
  return FURNITURE.some((item) =>
    item.kind !== "rug" &&
    point.x > item.x - padding &&
    point.x < item.x + item.width + padding &&
    point.y > item.y - padding &&
    point.y < item.y + item.height + padding
  );
}

export function keepDistance(point: Position, occupied: readonly Position[], minDistance = 7): Position {
  if (!occupied.some((other) => Math.hypot(other.x - point.x, other.y - point.y) < minDistance)) return point;
  return { x: Math.min(92, point.x + minDistance), y: Math.min(86, point.y + minDistance / 2) };
}

export function routeWaypoint(from: Position, to: Position): Position | null {
  const blocker = FURNITURE.find((item) => {
    if (item.kind === "rug") return false;
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;
    return midX > item.x - 3 && midX < item.x + item.width + 3 && midY > item.y - 3 && midY < item.y + item.height + 3;
  });
  if (!blocker) return null;
  return {
    x: Math.min(92, Math.max(8, blocker.x + blocker.width + 5)),
    y: Math.min(86, Math.max(14, blocker.y - 5)),
  };
}
