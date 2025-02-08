import { useEffect, useState } from 'react';
import { Activity, RefreshCw } from 'lucide-react';
import { ConnectionQualityBadge } from './ConnectionQualityBadge';
import { QualityWarning } from './QualityWarning';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ConnectionStatusProps {
  peerId: string;
  peerConnection: RTCPeerConnection;
  stream: MediaStream;
  className?: string;
}

interface ConnectionState {
  isConnected: boolean;
  isReconnecting: boolean;
  lastConnected: number | null;
  reconnectAttempt: number;
}

export function ConnectionStatus({
  peerId,
  peerConnection,
  stream,
  className,
}: ConnectionStatusProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    isReconnecting: false,
    lastConnected: null,
    reconnectAttempt: 0,
  });

  useEffect(() => {
    const handleStateChange = () => {
      const state = peerConnection.connectionState;
      
      setConnectionState(prev => ({
        ...prev,
        isConnected: state === 'connected',
        isReconnecting: state === 'connecting' || state === 'checking',
        lastConnected: state === 'connected' ? Date.now() : prev.lastConnected,
      }));
    };

    peerConnection.addEventListener('connectionstatechange', handleStateChange);
    handleStateChange(); // Initial state

    return () => {
      peerConnection.removeEventListener('connectionstatechange', handleStateChange);
    };
  }, [peerConnection]);

  const getConnectionTime = () => {
    if (!connectionState.lastConnected) return null;
    const duration = Date.now() - connectionState.lastConnected;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn('space-y-2', className)}>
      <QualityWarning peerId={peerId} />
      
      <motion.div
        layout
        className="rounded-lg bg-dark-100 p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <ConnectionQualityBadge peerId={peerId} />
            {connectionState.isConnected && connectionState.lastConnected && (
              <span className="text-xs text-gray-400">
                Connected for {getConnectionTime()}
              </span>
            )}
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-white"
          >
            <Activity className="h-5 w-5" />
          </button>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-4 space-y-2 border-t border-dark-200 pt-4"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Connection State:</span>
                <span className={cn(
                  'font-medium',
                  connectionState.isConnected ? 'text-green-500' : 'text-yellow-500'
                )}>
                  {peerConnection.connectionState}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">ICE Connection:</span>
                <span className="font-medium text-white">
                  {peerConnection.iceConnectionState}
                </span>
              </div>

              {connectionState.isReconnecting && (
                <div className="flex items-center gap-2 rounded-lg bg-yellow-500/10 p-2 text-sm text-yellow-500">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>
                    Reconnecting... Attempt {connectionState.reconnectAttempt}
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
} 