export interface Message {
  id: string;
  from: 'user' | 'senior' | 'qa' | 'designer';
  text: string;
  time: string;
}

export interface AgentMeta {
  id: 'senior' | 'qa' | 'designer';
  label: string;
  role: string;
  color: string;
  icon: string;
  description: string;
  status: 'online' | 'busy' | 'offline';
  currentTask: string;
}
