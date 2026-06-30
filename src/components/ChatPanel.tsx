import { useState, useEffect, useRef, type FormEvent } from 'react';
import type { AgentMeta, Message } from '../types';

function agentById(agents: AgentMeta[], id: string) {
  return agents.find((item: AgentMeta) => item.id === id);
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

export default function ChatPanel({
  agents,
  messages,
  onSendMessage,
}: {
  agents: AgentMeta[];
  messages: Message[];
  onSendMessage: (text: string) => void;
}) {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<AgentMeta[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  const detectMention = (value: string) => {
    const caret = (document.activeElement as HTMLInputElement)?.selectionStart ?? value.length;
    const before = value.slice(0, caret);
    const match = before.match(/@(\S*)$/);
    if (!match) {
      setShowSuggestions(false);
      return;
    }
    const query = match[1].toLowerCase();
    const matches = agents.filter((a) => {
      if (a.status === 'offline') return false;
      const base = [a.id, a.label, a.role].join(' ').toLowerCase();
      return base.includes(query);
    });
    setSuggestions(matches);
    setShowSuggestions(matches.length > 0);
  };

  const selectSuggestion = (agent: AgentMeta) => {
    const before = input.includes('@')
      ? input.replace(/@\S*$/, `@${agent.id} `)
      : `@${agent.id} `;
    setInput(before);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (showSuggestions && suggestions.length > 0) {
        e.preventDefault();
        selectSuggestion(suggestions[0]);
        return;
      }
    }
  };

  const sendMessage = (event: FormEvent) => {
    event.preventDefault();
    const text = input.trim();
    if (!text) return;
    onSendMessage(text);
    setInput('');
    setShowSuggestions(false);
  };

  return (
    <section className="chat">
      <div className="chat-header">
        <div className="chat-header-top">
          <div>
            <div className="chat-title">팀 채팅</div>
            <div className="chat-sub">에이전트 간 실시간 소통</div>
          </div>
          <div className="chat-agent-icons">
            {agents
              .filter((a) => a.status !== 'offline')
              .map((a) => (
                <span key={a.id} className="chat-agent-icon" style={{ color: a.color }} title={a.label}>
                  {a.icon}
                </span>
              ))}
          </div>
        </div>
        <div className="chat-hint-wrap">
          <span className="chat-hint">💡 @로 시작하면 에이전트를 선택할 수 있어요</span>
          <span className="chat-status">
            <span className="chat-status-dot" /> 실시간
          </span>
        </div>
      </div>

      <div className="chat-body" ref={listRef}>
        {messages.length === 0 && (
          <div className="empty">메시지가 없습니다. 대화를 시작해보세요!</div>
        )}

        {messages.map((message) => {
          const matchedAgent = message.from !== 'user' && message.from !== 'system'
            ? agentById(agents, message.from)
            : undefined;

          if (message.from === 'system') {
            return (
              <div key={message.id} className="message system">
                {message.text}
              </div>
            );
          }

          if (message.from === 'user') {
            return (
              <div key={message.id} className="message-row user-row">
                <div className="message-bubble user">
                  <div className="message-text">{message.text}</div>
                  <div className="message-time">{formatTime(message.time)}</div>
                </div>
              </div>
            );
          }

          if (matchedAgent) {
            return (
              <div key={message.id} className="message-row agent-row">
                <div
                  className="message-sender-avatar"
                  style={{ borderColor: `${matchedAgent.color}44` }}
                >
                  {matchedAgent.icon}
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
              </div>
            );
          }

          return null;
        })}
      </div>

      <form className="composer" onSubmit={sendMessage}>
        <div className="composer-input-wrap">
          <input
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              detectMention(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하거나 @에이전트를 호출하세요..."
          />
          {showSuggestions && (
            <div className="mention-menu">
              {suggestions.map((suggestion) => (
                <button
                  type="button"
                  key={suggestion.id}
                  className="mention-item"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectSuggestion(suggestion);
                  }}
                >
                  <span style={{ color: suggestion.color }}>{suggestion.icon}</span>
                  <span>{suggestion.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button className="send" type="submit">
          전송
        </button>
      </form>
    </section>
  );
}
