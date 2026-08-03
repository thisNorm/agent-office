import { useEffect, useRef, useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import type { AgentMeta, Message } from "../types";

function agentById(agents: readonly AgentMeta[], id: string) {
  return agents.find((item) => item.id === id);
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

export default function ChatPanel({
  agents,
  messages,
  activeAgentId,
  onSelectAgent,
  onSendMessage,
}: {
  agents: readonly AgentMeta[];
  messages: readonly Message[];
  activeAgentId: string | null;
  onSelectAgent: (agentId: string) => void;
  onSendMessage: (text: string) => void;
}) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<AgentMeta[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = listRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [messages]);

  const detectMention = (value: string) => {
    const match = value.slice(0, value.length).match(/@(\S*)$/);
    if (!match) {
      setSuggestions([]);
      return;
    }
    const query = match[1].toLowerCase();
    setSuggestions(agents.filter((agent) => {
      const searchable = [agent.id, agent.label, agent.role].join(" ").toLowerCase();
      return agent.status !== "offline" && searchable.includes(query);
    }));
  };

  const selectSuggestion = (agent: AgentMeta) => {
    setInput((value) => value.replace(/@\S*$/, `@${agent.id} `));
    setSuggestions([]);
    onSelectAgent(agent.id);
  };

  const sendMessage = (event: FormEvent) => {
    event.preventDefault();
    // If mention dropdown is open, Enter selects first suggestion instead of sending
    if (suggestions.length > 0) {
      selectSuggestion(suggestions[0]);
      return;
    }
    const text = input.trim();
    if (!text) return;
    onSendMessage(text);
    setInput("");
    setSuggestions([]);
  };

  return (
    <section className="chat">
      <div className="chat-header">
        <div>
          <div className="chat-title">Team channel</div>
          <div className="chat-sub">멘션과 회의 흐름이 중앙 오피스 상태에 반영됩니다.</div>
        </div>
        <div className="chat-agent-icons">
          {agents.filter((agent) => agent.status !== "offline").map((agent) => (
            <button
              type="button"
              key={agent.id}
              className={`chat-agent-icon ${activeAgentId === agent.id ? "active" : ""}`}
              style={{ color: agent.color }}
              title={agent.label}
              onClick={() => onSelectAgent(agent.id)}
            >
              {agent.initials}
            </button>
          ))}
        </div>
      </div>

      <div className="chat-body" ref={listRef}>
        {messages.map((message) => {
          const matchedAgent = message.from !== "user" && message.from !== "system"
            ? agentById(agents, message.from)
            : undefined;

          if (message.from === "system") {
            return <div key={message.id} className="message system">{message.text}</div>;
          }

          if (message.from === "user") {
            return (
              <div key={message.id} className="message-row user-row">
                <div className="message-bubble user">
                  <div className="message-text">{message.text}</div>
                  <div className="message-time">{formatTime(message.time)}</div>
                </div>
              </div>
            );
          }

          if (!matchedAgent) return null;

          return (
            <button
              type="button"
              key={message.id}
              className={`message-row agent-row ${activeAgentId === matchedAgent.id ? "active" : ""}`}
              onClick={() => onSelectAgent(matchedAgent.id)}
            >
              <div className="message-sender-avatar" style={{ borderColor: matchedAgent.color, color: matchedAgent.color }}>
                {matchedAgent.initials}
              </div>
              <div className="message-content">
                <div className="message-sender" style={{ color: matchedAgent.color }}>
                  {matchedAgent.label}
                </div>
                <div className="message-bubble agent">
                  <div className="message-text">{message.text}</div>
                  <div className="message-time">{formatTime(message.time)}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <form className="composer" onSubmit={sendMessage}>
        <div className="composer-input-wrap">
          <input
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              detectMention(event.target.value);
            }}
            placeholder="메시지 또는 @agent 입력"
          />
          {suggestions.length > 0 && (
            <div className="mention-menu">
              {suggestions.map((suggestion) => (
                <button
                  type="button"
                  key={suggestion.id}
                  className="mention-item"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    selectSuggestion(suggestion);
                  }}
                >
                  <span style={{ color: suggestion.color }}>{suggestion.initials}</span>
                  <span>{suggestion.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button className="send" type="submit" aria-label="메시지 전송">
          <Send size={15} />
        </button>
      </form>
    </section>
  );
}
