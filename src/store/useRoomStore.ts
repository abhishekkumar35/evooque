import { create } from 'zustand';
import { Room, Message, User, Reaction } from '@/types';

interface RoomState {
  currentRoom: Room | null;
  messages: Message[];
  participants: User[];
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  setCurrentRoom: (room: Room) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  setMessages: (messages: Message[]) => void;
  setParticipants: (participants: User[]) => void;
  addParticipant: (participant: User) => void;
  removeParticipant: (participantId: string) => void;
  toggleVideo: () => void;
  toggleAudio: () => void;
  addReaction: (messageId: string, reaction: Reaction) => void;
  removeReaction: (messageId: string, emoji: string, userId: string) => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  currentRoom: null,
  messages: [],
  participants: [],
  isVideoEnabled: true,
  isAudioEnabled: true,
  
  setCurrentRoom: (room) => set({ currentRoom: room }),
  
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  
  updateMessage: (messageId, updates) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      ),
    })),
  
  setMessages: (messages) => set({ messages }),
  
  setParticipants: (participants) => set({ participants }),
  
  addParticipant: (participant) =>
    set((state) => ({
      participants: [...state.participants, participant],
    })),
  
  removeParticipant: (participantId) =>
    set((state) => ({
      participants: state.participants.filter((p) => p.id !== participantId),
    })),
  
  toggleVideo: () =>
    set((state) => ({ isVideoEnabled: !state.isVideoEnabled })),
  
  toggleAudio: () =>
    set((state) => ({ isAudioEnabled: !state.isAudioEnabled })),
  
  addReaction: (messageId, reaction) =>
    set((state) => ({
      messages: state.messages.map((msg) => {
        if (msg.id !== messageId) return msg;
        
        const reactions = msg.reactions || [];
        const existingReaction = reactions.find((r) => r.emoji === reaction.emoji);
        
        if (existingReaction) {
          existingReaction.count = reaction.count;
          existingReaction.users = reaction.users;
          return { ...msg, reactions };
        }
        
        return {
          ...msg,
          reactions: [...reactions, reaction],
        };
      }),
    })),
  
  removeReaction: (messageId, emoji, userId) =>
    set((state) => ({
      messages: state.messages.map((msg) => {
        if (msg.id !== messageId) return msg;
        
        const reactions = msg.reactions || [];
        const reaction = reactions.find((r) => r.emoji === emoji);
        
        if (!reaction) return msg;
        
        reaction.users = reaction.users.filter((id) => id !== userId);
        reaction.count--;
        
        return {
          ...msg,
          reactions: reaction.count > 0
            ? reactions.map((r) => (r.emoji === emoji ? reaction : r))
            : reactions.filter((r) => r.emoji !== emoji),
        };
      }),
    })),
})); 