import type { AgentMeta } from "./types";

export function resolveMention(text: string, agents: readonly AgentMeta[]): AgentMeta | undefined {
  const lowered = text.toLowerCase();
  return agents.find((agent) => {
    const names = [agent.id, agent.label, agent.role, `@${agent.id}`, `@${agent.label}`].map((value) => value.toLowerCase());
    return names.some((name) => lowered.includes(name));
  });
}

export function localAgentReply(agent: AgentMeta, text: string): string {
  const prompt = text.replace(/@\S+\s*/g, "").trim() || "현재 상황";
  const replies: Record<string, string> = {
    pm: `범위부터 정리하겠습니다. "${prompt}"는 목표, 리스크, 다음 액션으로 나눠서 팀에 배분하는 것이 좋습니다.`,
    senior: `구현 관점에서는 "${prompt}"의 데이터 구조와 상태 전이를 먼저 고정해야 합니다. 작은 단위로 빌드 검증까지 묶겠습니다.`,
    qa: `검증 기준을 먼저 잡겠습니다. "${prompt}"는 정상 흐름, 회귀 흐름, 화면 캡처 기준으로 확인해야 합니다.`,
    designer: `시각 품질 기준으로 보면 "${prompt}"는 밀도, 계층, 역할 구분이 핵심입니다. 장식보다 상태가 읽혀야 합니다.`,
    scribe: `요청 내용을 기록했습니다. "${prompt}" 관련 발언, 결정사항, 후속 작업을 대화 로그에 정리하겠습니다.`,
  };
  return replies[agent.id] || `${agent.label}가 요청을 확인했습니다.`;
}

export function cleanModelReply(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.length > 0 ? cleaned : null;
}
