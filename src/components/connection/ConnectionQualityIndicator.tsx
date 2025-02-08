import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConnectionQualityIndicatorProps {
  peerConnection: RTCPeerConnection;
  className?: string;
}

interface QualityLevel {
  label: string;
  color: string;
  icon: typeof Wifi;
  description: string;
}

export function ConnectionQualityIndicator({
  peerConnection,
  className,
}: ConnectionQualityIndicatorProps) {
  const [quality, setQuality] = useState<QualityLevel>({
    label: 'Good',
    color: 'text-blue-500',
    icon: Wifi,
    description: 'Connection is stable',
  });

  useEffect(() => {
    let mounted = true;

    const updateQuality = async () => {
      try {
        const stats = await peerConnection.getStats();
        let rtt = 0;
        let packetsLost = 0;
        let totalPackets = 0;

        stats.forEach(report => {
          if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            rtt = report.currentRoundTripTime * 1000;
          }
          if (report.type === 'inbound-rtp') {
            packetsLost = report.packetsLost;
            totalPackets = report.packetsReceived;
          }
        });

        const packetLoss = totalPackets ? (packetsLost / totalPackets) * 100 : 0;

        if (mounted) {
          setQuality(getQualityLevel(rtt, packetLoss));
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
  }, [peerConnection]);

  const Icon = quality.icon;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn('flex items-center gap-2', className)}
    >
      <div className="relative">
        <Icon className={cn('h-5 w-5', quality.color)} />
        <motion.div
          className={cn(
            'absolute -right-1 -top-1 h-2 w-2 rounded-full',
            quality.color.replace('text-', 'bg-')
          )}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </div>
      <div className="flex flex-col">
        <span className={cn('text-sm font-medium', quality.color)}>
          {quality.label}
        </span>
        <span className="text-xs text-gray-400">
          {quality.description}
        </span>
      </div>
    </motion.div>
  );
}

function getQualityLevel(rtt: number, packetLoss: number): QualityLevel {
  if (rtt < 100 && packetLoss < 1) {
    return {
      label: 'Excellent',
      color: 'text-green-500',
      icon: Wifi,
      description: 'Connection is excellent',
    };
  }
  if (rtt < 200 && packetLoss < 5) {
    return {
      label: 'Good',
      color: 'text-blue-500',
      icon: Wifi,
      description: 'Connection is stable',
    };
  }
  if (rtt < 500 && packetLoss < 10) {
    return {
      label: 'Fair',
      color: 'text-yellow-500',
      icon: Wifi,
      description: 'Connection may be unstable',
    };
  }
  return {
    label: 'Poor',
    color: 'text-red-500',
    icon: WifiOff,
    description: 'Connection is poor',
  };
} 