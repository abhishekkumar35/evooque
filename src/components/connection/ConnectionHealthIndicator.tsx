import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConnectionHealthIndicatorProps {
  peerConnection: RTCPeerConnection;
  className?: string;
}

interface HealthStatus {
  score: number;
  label: string;
  color: string;
}

export function ConnectionHealthIndicator({
  peerConnection,
  className,
}: ConnectionHealthIndicatorProps) {
  const [health, setHealth] = useState<HealthStatus>({
    score: 100,
    label: 'Excellent',
    color: 'text-green-500',
  });

  useEffect(() => {
    let mounted = true;

    const calculateHealth = async () => {
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
            packetsLost += report.packetsLost || 0;
            totalPackets += report.packetsReceived || 0;
          }
        });

        const packetLossRate = totalPackets ? (packetsLost / totalPackets) * 100 : 0;
        
        // Calculate health score (0-100)
        let score = 100;
        score -= Math.min(rtt / 10, 50); // Reduce up to 50 points for high RTT
        score -= Math.min(packetLossRate * 10, 50); // Reduce up to 50 points for packet loss

        if (mounted) {
          setHealth(getHealthStatus(score));
        }
      } catch (error) {
        console.error('Failed to calculate health:', error);
      }
    };

    const interval = setInterval(calculateHealth, 2000);
    calculateHealth();

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [peerConnection]);

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn('flex items-center gap-2', className)}
    >
      <div className="relative">
        <Activity className={cn('h-5 w-5', health.color)} />
        <motion.div
          className={cn(
            'absolute -right-1 -top-1 h-2 w-2 rounded-full',
            health.color.replace('text-', 'bg-')
          )}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </div>
      <div className="flex flex-col">
        <span className={cn('text-sm font-medium', health.color)}>
          {health.label}
        </span>
        <span className="text-xs text-gray-400">
          Health Score: {Math.round(health.score)}%
        </span>
      </div>
    </motion.div>
  );
}

function getHealthStatus(score: number): HealthStatus {
  if (score >= 90) {
    return { score, label: 'Excellent', color: 'text-green-500' };
  } else if (score >= 70) {
    return { score, label: 'Good', color: 'text-blue-500' };
  } else if (score >= 50) {
    return { score, label: 'Fair', color: 'text-yellow-500' };
  } else {
    return { score, label: 'Poor', color: 'text-red-500' };
  }
} 