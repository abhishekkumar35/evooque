import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Video, Wifi } from 'lucide-react';
import { qualityManager } from '@/lib/webrtc/connection-quality-manager';
import { ConnectionQuality } from '@/lib/webrtc/connection-monitor';
import { cn } from '@/lib/utils';

interface ConnectionQualityControlsProps {
  peerConnection: RTCPeerConnection;
  stream: MediaStream;
  className?: string;
}

export function ConnectionQualityControls({
  peerConnection,
  stream,
  className,
}: ConnectionQualityControlsProps) {
  const [quality, setQuality] = useState<ConnectionQuality>('good');
  const [isAutomatic, setIsAutomatic] = useState(true);

  useEffect(() => {
    let mounted = true;

    const updateQuality = async () => {
      if (!isAutomatic) return;

      try {
        const stats = await peerConnection.getStats();
        const newQuality = qualityManager.getCurrentQuality(stats);

        if (mounted && newQuality !== quality) {
          setQuality(newQuality);
          await qualityManager.adaptQuality(peerConnection, stream, newQuality);
        }
      } catch (error) {
        console.error('Failed to update quality:', error);
      }
    };

    const interval = setInterval(updateQuality, 5000);
    updateQuality();

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [peerConnection, stream, quality, isAutomatic]);

  const handleQualityChange = async (newQuality: ConnectionQuality) => {
    try {
      setQuality(newQuality);
      await qualityManager.adaptQuality(peerConnection, stream, newQuality);
    } catch (error) {
      console.error('Failed to change quality:', error);
    }
  };

  const config = qualityManager.getQualityConfig(quality);

  return (
    <div className={cn('space-y-4 rounded-lg bg-dark-100 p-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">Quality Settings</h3>
        <button
          onClick={() => setIsAutomatic(!isAutomatic)}
          className={cn(
            'rounded-lg px-3 py-1 text-sm transition-colors',
            isAutomatic ? 'bg-primary-500 text-white' : 'bg-dark-200 text-gray-400'
          )}
        >
          {isAutomatic ? 'Auto' : 'Manual'}
        </button>
      </div>

      {!isAutomatic && (
        <div className="grid grid-cols-2 gap-2">
          {(['excellent', 'good', 'poor', 'critical'] as ConnectionQuality[]).map(q => (
            <button
              key={q}
              onClick={() => handleQualityChange(q)}
              className={cn(
                'flex items-center gap-2 rounded-lg p-2 text-sm transition-colors',
                quality === q ? 'bg-primary-500 text-white' : 'bg-dark-200 text-gray-400'
              )}
            >
              <Wifi className="h-4 w-4" />
              {q.charAt(0).toUpperCase() + q.slice(1)}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Video className="h-4 w-4 text-gray-400" />
          <span className="text-gray-400">Resolution:</span>
          <span className="font-medium text-white">
            {config.maxResolution.width}x{config.maxResolution.height}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Settings className="h-4 w-4 text-gray-400" />
          <span className="text-gray-400">Frame Rate:</span>
          <span className="font-medium text-white">{config.maxFrameRate} fps</span>
        </div>
      </div>
    </div>
  );
} 