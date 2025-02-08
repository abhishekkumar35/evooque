import { useEffect, useState } from 'react';
import { connectionMonitor } from '@/lib/webrtc/connection-monitor';
import type { ConnectionStats, ConnectionQuality } from '@/types/webrtc';

interface UseConnectionMonitorProps {
  peerId: string;
  peerConnection: RTCPeerConnection;
}

interface ConnectionMonitorState {
  stats: ConnectionStats | null;
  quality: ConnectionQuality;
  history: ConnectionStats[];
  isMonitoring: boolean;
}

export function useConnectionMonitor({
  peerId,
  peerConnection,
}: UseConnectionMonitorProps) {
  const [state, setState] = useState<ConnectionMonitorState>({
    stats: null,
    quality: 'good',
    history: [],
    isMonitoring: false,
  });

  useEffect(() => {
    const handleStatsUpdate = ({
      peerId: id,
      stats,
      quality,
      history,
    }: {
      peerId: string;
      stats: ConnectionStats;
      quality: ConnectionQuality;
      history: ConnectionStats[];
    }) => {
      if (id === peerId) {
        setState(prev => ({
          ...prev,
          stats,
          quality,
          history,
        }));
      }
    };

    connectionMonitor.on('stats:update', handleStatsUpdate);
    connectionMonitor.startMonitoring(peerId, peerConnection);

    setState(prev => ({ ...prev, isMonitoring: true }));

    return () => {
      connectionMonitor.off('stats:update', handleStatsUpdate);
      connectionMonitor.stopMonitoring(peerId);
      setState(prev => ({ ...prev, isMonitoring: false }));
    };
  }, [peerId, peerConnection]);

  return state;
} 