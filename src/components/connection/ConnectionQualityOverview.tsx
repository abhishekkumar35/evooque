import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Wifi, WifiOff, Zap } from 'lucide-react';
import { useConnectionQuality } from '@/providers/ConnectionQualityProvider';
import { ConnectionQuality } from '@/lib/webrtc/connection-monitor';
import { cn } from '@/lib/utils';

interface ConnectionQualityOverviewProps {
  className?: string;
}

export function ConnectionQualityOverview({ className }: ConnectionQualityOverviewProps) {
  const { quality, isAutomatic, adaptationHistory } = useConnectionQuality();
  const [showHistory, setShowHistory] = useState(false);

  const qualityConfig = {
    excellent: {
      icon: Zap,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      label: 'Excellent',
      description: 'Connection is optimal',
    },
    good: {
      icon: Wifi,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      label: 'Good',
      description: 'Connection is stable',
    },
    poor: {
      icon: Activity,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      label: 'Poor',
      description: 'Connection may be unstable',
    },
    critical: {
      icon: WifiOff,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      label: 'Critical',
      description: 'Connection is unstable',
    },
  };

  const config = qualityConfig[quality];
  const Icon = config.icon;

  return (
    <div className={cn('rounded-lg bg-dark-100 p-4', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            className={cn('rounded-full p-2', config.bgColor)}
          >
            <Icon className={cn('h-5 w-5', config.color)} />
          </motion.div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={cn('text-sm font-medium', config.color)}>
                {config.label} Connection
              </h3>
              {isAutomatic && (
                <span className="rounded-full bg-primary-500/10 px-2 py-0.5 text-xs text-primary-500">
                  Auto
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400">{config.description}</p>
          </div>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="text-gray-400 hover:text-white"
        >
          {showHistory ? 'Hide History' : 'Show History'}
        </button>
      </div>

      <AnimatePresence>
        {showHistory && adaptationHistory.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-4 space-y-2 overflow-hidden border-t border-dark-200 pt-4"
          >
            {adaptationHistory.map((event, index) => (
              <motion.div
                key={event.timestamp}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  'flex items-center justify-between rounded-lg p-2',
                  qualityConfig[event.quality].bgColor
                )}
              >
                <div className="flex items-center gap-2">
                  <div className={cn('h-2 w-2 rounded-full', qualityConfig[event.quality].color)} />
                  <span className={cn('text-sm', qualityConfig[event.quality].color)}>
                    {qualityConfig[event.quality].label}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {formatTimestamp(event.timestamp)}
                </span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function formatTimestamp(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 60000) {
    return 'Just now';
  }

  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes}m ago`;
  }

  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}h ago`;
  }

  const days = Math.floor(diff / 86400000);
  return `${days}d ago`;
} 