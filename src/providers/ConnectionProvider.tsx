import { createContext, useContext, useEffect, useState } from 'react';
import { ConnectionQuality } from '@/lib/webrtc/connection-monitor';
import { qualityMonitor } from '@/lib/webrtc/quality-monitor';

interface ConnectionState {
  quality: ConnectionQuality;
  isConnected: boolean;
  isReconnecting: boolean;
  lastConnected: number | null;
  reconnectAttempt: number;
}

interface ConnectionContextType {
  state: ConnectionState;
  peers: Map<string, RTCPeerConnection>;
  addPeer: (id: string, connection: RTCPeerConnection) => void;
  removePeer: (id: string) => void;
}

const ConnectionContext = createContext<ConnectionContextType | null>(null);

export function ConnectionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ConnectionState>({
    quality: 'good',
    isConnected: false,
    isReconnecting: false,
    lastConnected: null,
    reconnectAttempt: 0,
  });

  const [peers] = useState(new Map<string, RTCPeerConnection>());

  useEffect(() => {
    const handleQualityUpdate = ({ quality }: { quality: ConnectionQuality }) => {
      setState(prev => ({ ...prev, quality }));
    };

    qualityMonitor.on('quality:update', handleQualityUpdate);

    return () => {
      qualityMonitor.off('quality:update', handleQualityUpdate);
    };
  }, []);

  const addPeer = (id: string, connection: RTCPeerConnection) => {
    peers.set(id, connection);

    connection.addEventListener('connectionstatechange', () => {
      const isConnected = connection.connectionState === 'connected';
      const isReconnecting = connection.connectionState === 'connecting' || 
                            connection.connectionState === 'checking';

      setState(prev => ({
        ...prev,
        isConnected,
        isReconnecting,
        lastConnected: isConnected ? Date.now() : prev.lastConnected,
        reconnectAttempt: isReconnecting ? prev.reconnectAttempt + 1 : prev.reconnectAttempt,
      }));
    });
  };

  const removePeer = (id: string) => {
    peers.delete(id);
  };

  return (
    <ConnectionContext.Provider value={{ state, peers, addPeer, removePeer }}>
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnection() {
  const context = useContext(ConnectionContext);
  if (!context) {
    throw new Error('useConnection must be used within a ConnectionProvider');
  }
  return context;
} 