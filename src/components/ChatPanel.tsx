import { useEffect, useRef, useState } from 'react';
import type { AgentMeta, Message } from './types';

function agentById(agents: AgentMeta[], id: string) {
  return agents.find((item) => item.id === id);
}

function formatTime(value: string) {
  const date = new Date(value);
  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

export default function ChatPanel({ agents }: { agents: AgentMeta[] }) {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', from: 'assistant', text: 'Agent Office에 오신 것을 환영합니다.', time: new Date().toISOString() },
  ]);
  const [input, setInput] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<string>;
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), from: 'assistant', text: `PM: ${custom.detail}`, time: new Date().toISOString() },
      ]);
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            from: 'assistant',
            text: '요청을 반영했습니다.',
            time: new Date().toISOString(),
          },
        ]);
      }, 400);
    };

    window.addEventListener('pm-feedback', handler);
    return () => window.removeEventListener('pm-feedback', handler);
  }, []);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), from: 'user', text, time: new Date().toISOString() }]);
    setInput('');

    const match = text.match(/@([가-힣a-zA-Z]+)/);
    const agent = match ? agentById(agents, match[1]) : undefined;

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          from: agent ? agent.id : 'assistant',
          text: agent ? `${agent.icon} ${agent.label}: "${text}" 요청을 받았습니다. 검토 후 여기에 결과를 반영할게요.` : '요청을 분류해서 적절한 에이전트에게 전달할게요.',
          time: new Date().toISOString(),
        },
      ]);
    }, 400);
  };

  return (
    <section className="chat">
      <div className="chat-header">
        <div>
          <div className="chat-title">사무실 채팅</div>
          <div className="chat-sub">에이전트 소통 + 당신의 피드백</div>
        </div>
        <div className="chat-hint">@로 호출 가능: 시니어 QA 디자이너</div>
      </div>

      <div className="messages" ref={listRef}>
        {messages.map((message) => {
          if (message.from === 'assistant') {
            return (
              <div key={message.id} className="message system">
                {message.text}
              </div>
            );
          }

          const agent = agentById(agents, message.from);

          return (
            <div key={message.id} className="message-row" style={{ justifyContent: message.from === 'user' ? 'flex-end' : 'flex-start' }}>
              <div className="message-bubble" data-from={message.from}>
                <div>
                  {agent ? (
                    <div className="message-sender" style={{ color: agent.color }}>
                      <span style={{ marginRight: 6 }}>{agent.icon}</span>
                      <span className="message-sender-name">{agent.label}</span>
                    </div>
                  ) : null}
                  <div>{message.text}</div>
                </div>
                <div className="message-time" style={{ color: message.from === 'user' ? '#38bdf8' : '#6b7280' }}>
                  {formatTime(message.time)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="composer">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="메시지를 입력하세요. @시니어 @QA @디자이너"
        />
        <button className="send" onClick={send}>보내기</button>
      </div>
    </section>
  );
}
