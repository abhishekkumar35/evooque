import { createContext, useContext, useEffect, useState } from 'react';
import { ConnectionQuality } from '@/lib/webrtc/connection-monitor';
import { qualityManager } from '@/lib/webrtc/connection-quality-manager';

interface ConnectionQualityState {
  quality: ConnectionQuality;
  isAutomatic: boolean;
  adaptationHistory: Array<{
    timestamp: number;
    quality: ConnectionQuality;
    success: boolean;
  }>;
}

interface ConnectionQualityContextType extends ConnectionQualityState {
  setAutomatic: (isAutomatic: boolean) => void;
  setQualityManually: (quality: ConnectionQuality) => Promise<void>;
}

const ConnectionQualityContext = createContext<ConnectionQualityContextType | null>(null);

export function ConnectionQualityProvider({
  children,
  peerConnection,
  stream,
}: {
  children: React.ReactNode;
  peerConnection: RTCPeerConnection;
  stream: MediaStream;
}) {
  const [state, setState] = useState<ConnectionQualityState>({
    quality: 'good',
    isAutomatic: true,
    adaptationHistory: [],
  });

  useEffect(() => {
    if (!state.isAutomatic) return;

    const updateQuality = async () => {
      try {
        const stats = await peerConnection.getStats();
        const newQuality = qualityManager.getCurrentQuality(stats);

        if (newQuality !== state.quality) {
          await qualityManager.adaptQuality(peerConnection, stream, newQuality);
          setState(prev => ({
            ...prev,
            quality: newQuality,
            adaptationHistory: [
              {
                timestamp: Date.now(),
                quality: newQuality,
                success: true,
              },
              ...prev.adaptationHistory.slice(0, 9),
            ],
          }));
        }
      } catch (error) {
        console.error('Failed to update quality:', error);
      }
    };

    const interval = setInterval(updateQuality, 5000);
    updateQuality();

    return () => clearInterval(interval);
  }, [peerConnection, stream, state.isAutomatic, state.quality]);

  const setAutomatic = (isAutomatic: boolean) => {
    setState(prev => ({ ...prev, isAutomatic }));
  };

  const setQualityManually = async (quality: ConnectionQuality) => {
    try {
      await qualityManager.adaptQuality(peerConnection, stream, quality);
      setState(prev => ({
        ...prev,
        quality,
        adaptationHistory: [
          {
            timestamp: Date.now(),
            quality,
            success: true,
          },
          ...prev.adaptationHistory.slice(0, 9),
        ],
      }));
    } catch (error) {
      console.error('Failed to set quality manually:', error);
      throw error;
    }
  };

  return (
    <ConnectionQualityContext.Provider
      value={{
        ...state,
        setAutomatic,
        setQualityManually,
      }}
    >
      {children}
    </ConnectionQualityContext.Provider>
  );
}

export function useConnectionQuality() {
  const context = useContext(ConnectionQualityContext);
  if (!context) {
    throw new Error('useConnectionQuality must be used within a ConnectionQualityProvider');
  }
  return context;
} 