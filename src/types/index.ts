export interface User {
  id: string;
  name: string;
  avatar?: string;
}

export interface FileMessage {
  name: string;
  size: number;
  type: string;
  data: ArrayBuffer;
}

export interface Reaction {
  emoji: string;
  count: number;
  users: string[];
}

export interface Message {
  id: string;
  content: string;
  sender: User;
  timestamp: Date;
  type: 'text' | 'file' | 'system';
  file?: FileMessage;
  reactions?: Reaction[];
}

export interface Room {
  id: string;
  participants: User[];
  messages: Message[];
  createdAt: Date;
  type: 'chat' | 'video' | 'audio';
}

export type ConnectionState = 'connecting' | 'connected' | 'disconnected';

export interface PeerConnection {
  peerId: string;
  stream: MediaStream;
  user: User;
} 