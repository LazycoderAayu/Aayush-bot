export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface ChatState {
  sessions: ChatSession[];
  currentSessionId: string | null;
  isLoading: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string; // 'guest' for guest users
  avatar?: string;
  provider: 'email' | 'google' | 'apple' | 'guest';
  isAdmin?: boolean;
}