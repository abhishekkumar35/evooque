import { create } from 'zustand';

interface MediaState {
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isScreenSharing: boolean;
  isRecording: boolean;
  setVideoEnabled: (enabled: boolean) => void;
  setAudioEnabled: (enabled: boolean) => void;
  setScreenSharing: (sharing: boolean) => void;
  setRecording: (recording: boolean) => void;
  toggleVideo: () => void;
  toggleAudio: () => void;
}

export const useMediaStore = create<MediaState>((set) => ({
  isVideoEnabled: true,
  isAudioEnabled: true,
  isScreenSharing: false,
  isRecording: false,

  setVideoEnabled: (enabled) => set({ isVideoEnabled: enabled }),
  setAudioEnabled: (enabled) => set({ isAudioEnabled: enabled }),
  setScreenSharing: (sharing) => set({ isScreenSharing: sharing }),
  setRecording: (recording) => set({ isRecording: recording }),

  toggleVideo: () =>
    set((state) => ({ isVideoEnabled: !state.isVideoEnabled })),
  toggleAudio: () =>
    set((state) => ({ isAudioEnabled: !state.isAudioEnabled })),
})); 