import { create } from 'zustand';
import { User } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface UserState {
  currentUser: User | null;
  setCurrentUser: (user: User) => void;
  createGuestUser: (name?: string) => void;
}

export const useUserStore = create<UserState>((set) => ({
  currentUser: null,
  
  setCurrentUser: (user) => set({ currentUser: user }),
  
  createGuestUser: (name) =>
    set({
      currentUser: {
        id: uuidv4(),
        name: name || `Guest-${Math.floor(Math.random() * 1000)}`,
      },
    }),
})); 