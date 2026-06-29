import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import type { AgentMeta, Message } from "../types";

function agentById(agents: AgentMeta[], id: string) {
  return agents.find((item) => item.id === id);
}

function formatTime(iso: string) {
  const date = new Date(iso);
  return date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

function isAgent(id: string): boolean {
  return ["senior", "qa", "designer"].includes(id);
}

export default function ChatPanel({ agents }: { agents: AgentMeta[] }) {
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", from: "assistant", text: "Agent Office에 오신 것을 환영합니다.", time: new Date().toISOString() },
  ]);
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  const sendMessage = (event: FormEvent) => {
    event.preventDefault();
    const text = input.trim();
    if (!text) return;

    setMessages((prev) => [...prev, { id: crypto.randomUUID(), from: "user", text, time: new Date().toISOString() }]);
    setInput("");

    const match = text.match(/@([가-힣a-zA-Z]+)/);
    const agent = match ? agentById(agents, match[1]) : undefined;

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          from: agent ? agent.id : "assistant",
          text: agent
            ? `${agent.icon} ${agent.label}: "${text}" 요청을 받았습니다. 검토 후 여기에 결과를 반영할게요.`
            : "요청을 분류해서 적절한 에이전트에게 전달할게요.",
          time: new Date().toISOString(),
        },
      ]);
    }, 400);
  };

  return (
    <section className="chat">
      <div className="chat-header">
        <div className="chat-title">사무실 채팅</div>
        <div className="chat-sub">에이전트 소통 + 실시간 피드백</div>
        <div className="chat-actions">
          <button className="chat-new-btn">+ 새로운 채팅</button>
        </div>
        <div className="chat-hint">@시니어 @QA @디자이너를 입력하여 에이전트를 호출하세요</div>
      </div>

      <div className="messages" ref={listRef}>
        {messages.length === 0 && (
          <div className="empty">아직 메시지가 없습니다.</div>
        )}
        {messages.map((message) => {
          const matchedAgent = isAgent(message.from) ? agentById(agents, message.from) : undefined;

          if (message.from === "user") {
            return (
              <div key={message.id} className="message-row" style={{ justifyContent: "flex-end" }}>
                <div className="message-bubble" data-from="user">
                  <div>{message.text}</div>
                  <div className="message-time">{formatTime(message.time)}</div>
                </div>
              </div>
            );
          }

          if (!matchedAgent) {
            return (
              <div key={message.id} className="message system">
                {message.text}
              </div>
            );
          }

          return (
            <div key={message.id} className="message-row" style={{ justifyContent: "flex-start" }}>
              <div className="message-bubble" data-from={matchedAgent.id}>
                <div className="message-sender" style={{ color: matchedAgent.color }}>
                  <span style={{ marginRight: 6 }}>{matchedAgent.icon}</span>
                  <span className="message-sender-name">{matchedAgent.label}</span>
                </div>
                <div>{message.text}</div>
                <div className="message-time">{formatTime(message.time)}</div>
              </div>
            </div>
          );
        })}
      </div>

      <form className="composer" onSubmit={sendMessage}>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
            if (event.key === "Enter" && !event.shiftKey) event.currentTarget.form?.requestSubmit();
          }}
          placeholder="@시니어 @QA @디자이너"
        />
        <button className="send" type="submit">보내기</button>
      </form>
    </section>
  );
}
