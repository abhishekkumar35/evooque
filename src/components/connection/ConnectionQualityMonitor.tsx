import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Settings, Video, Wifi } from 'lucide-react';
import { qualityManager } from '@/lib/webrtc/connection-quality-manager';
import { ConnectionQuality } from '@/lib/webrtc/connection-monitor';
import { ConnectionQualityControls } from './ConnectionQualityControls';
import { ConnectionQualityStats } from './ConnectionQualityStats';
import { cn } from '@/lib/utils';

interface ConnectionQualityMonitorProps {
  peerConnection: RTCPeerConnection;
  stream: MediaStream;
  className?: string;
}

interface AdaptationEvent {
  timestamp: number;
  quality: ConnectionQuality;
  success: boolean;
  error?: Error;
}

export function ConnectionQualityMonitor({
  peerConnection,
  stream,
  className,
}: ConnectionQualityMonitorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [adaptationHistory, setAdaptationHistory] = useState<AdaptationEvent[]>([]);
  const [currentQuality, setCurrentQuality] = useState<ConnectionQuality>('good');

  useEffect(() => {
    const handleQualityAdapted = (event: {
      quality: ConnectionQuality;
      success: boolean;
      error?: Error;
    }) => {
      setAdaptationHistory(prev => [
        {
          timestamp: Date.now(),
          quality: event.quality,
          success: event.success,
          error: event.error,
        },
        ...prev.slice(0, 9), // Keep last 10 events
      ]);

      if (event.success) {
        setCurrentQuality(event.quality);
      }
    };

    qualityManager.on('quality:adapted', handleQualityAdapted);

    return () => {
      qualityManager.off('quality:adapted', handleQualityAdapted);
    };
  }, []);

  const getQualityColor = (quality: ConnectionQuality) => {
    switch (quality) {
      case 'excellent':
        return 'text-green-500';
      case 'good':
        return 'text-blue-500';
      case 'poor':
        return 'text-yellow-500';
      case 'critical':
        return 'text-red-500';
    }
  };

  return (
    <div className={cn('rounded-lg bg-dark-100 shadow-lg', className)}>
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Activity className={cn('h-5 w-5', getQualityColor(currentQuality))} />
            <span className={cn('text-sm font-medium', getQualityColor(currentQuality))}>
              {currentQuality.charAt(0).toUpperCase() + currentQuality.slice(1)} Quality
            </span>
          </div>
          {adaptationHistory.length > 0 && (
            <span className="text-xs text-gray-400">
              Last adapted {formatTimeDiff(adaptationHistory[0].timestamp)}
            </span>
          )}
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="rounded-full p-1 text-gray-400 hover:text-white"
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-dark-200"
          >
            <div className="space-y-4 p-4">
              <ConnectionQualityControls
                peerConnection={peerConnection}
                stream={stream}
              />
              <ConnectionQualityStats
                peerConnection={peerConnection}
              />

              {adaptationHistory.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-white">Adaptation History</h3>
                  <div className="space-y-2">
                    {adaptationHistory.map((event, index) => (
                      <div
                        key={index}
                        className={cn(
                          'flex items-center justify-between rounded-lg bg-dark-200 p-2 text-sm',
                          event.success ? 'text-green-500' : 'text-red-500'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {event.success ? (
                            <Video className="h-4 w-4" />
                          ) : (
                            <Activity className="h-4 w-4" />
                          )}
                          <span>
                            Adapted to {event.quality} quality
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {formatTimeDiff(event.timestamp)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function formatTimeDiff(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
} 