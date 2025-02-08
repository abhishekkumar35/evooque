import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Wifi, WifiOff } from 'lucide-react';
import { ConnectionQuality } from '@/lib/webrtc/connection-monitor';
import { qualityManager } from '@/lib/webrtc/connection-quality-manager';
import { cn } from '@/lib/utils';

interface ConnectionQualityBadgeProps {
  peerConnection: RTCPeerConnection;
  className?: string;
}

export function ConnectionQualityBadge({
  peerConnection,
  className,
}: ConnectionQualityBadgeProps) {
  const [quality, setQuality] = useState<ConnectionQuality>('good');

  useEffect(() => {
    let mounted = true;

    const updateQuality = async () => {
      try {
        const stats = await peerConnection.getStats();
        const newQuality = qualityManager.getCurrentQuality(stats);
        if (mounted && newQuality !== quality) {
          setQuality(newQuality);
        }
      } catch (error) {
        console.error('Failed to update quality:', error);
      }
    };

    const interval = setInterval(updateQuality, 2000);
    updateQuality();

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [peerConnection, quality]);

  const qualityConfig = {
    excellent: {
      icon: Wifi,
      color: 'text-green-500',
      pulseColor: 'bg-green-500',
      label: 'Excellent',
    },
    good: {
      icon: Wifi,
      color: 'text-blue-500',
      pulseColor: 'bg-blue-500',
      label: 'Good',
    },
    poor: {
      icon: Activity,
      color: 'text-yellow-500',
      pulseColor: 'bg-yellow-500',
      label: 'Poor',
    },
    critical: {
      icon: WifiOff,
      color: 'text-red-500',
      pulseColor: 'bg-red-500',
      label: 'Critical',
    },
  };

  const config = qualityConfig[quality];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn('flex items-center gap-2', className)}
    >
      <div className="relative">
        <Icon className={cn('h-5 w-5', config.color)} />
        <motion.div
          className={cn('absolute -right-1 -top-1 h-2 w-2 rounded-full', config.pulseColor)}
          animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </div>
      <span className={cn('text-sm font-medium', config.color)}>
        {config.label}
      </span>
    </motion.div>
  );
} 