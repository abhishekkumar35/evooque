import { create } from 'zustand';
import { ConnectionState, PeerConnection } from '@/types';
import { Socket } from 'socket.io-client';

interface ConnectionStore {
  socket: Socket | null;
  connectionState: ConnectionState;
  peerConnections: PeerConnection[];
  localStream: MediaStream | null;
  setSocket: (socket: Socket | null) => void;
  setConnectionState: (state: ConnectionState) => void;
  setPeerConnections: (connections: PeerConnection[]) => void;
  addPeerConnection: (connection: PeerConnection) => void;
  removePeerConnection: (peerId: string) => void;
  setLocalStream: (stream: MediaStream | null) => void;
}

export const useConnectionStore = create<ConnectionStore>((set) => ({
  socket: null,
  connectionState: 'disconnected',
  peerConnections: [],
  localStream: null,
  
  setSocket: (socket) => set({ socket }),
  
  setConnectionState: (connectionState) => set({ connectionState }),
  
  setPeerConnections: (peerConnections) => set({ peerConnections }),
  
  addPeerConnection: (connection) =>
    set((state) => ({
      peerConnections: [...state.peerConnections, connection],
    })),
  
  removePeerConnection: (peerId) =>
    set((state) => ({
      peerConnections: state.peerConnections.filter((conn) => conn.peerId !== peerId),
    })),
  
  setLocalStream: (localStream) => set({ localStream }),
})); 