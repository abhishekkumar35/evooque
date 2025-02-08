import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatBytes } from '@/lib/utils/format';

interface ConnectionTooltipProps {
  peerConnection: RTCPeerConnection;
  className?: string;
}

interface QuickStats {
  rtt: number;
  quality: 'excellent' | 'good' | 'poor' | 'critical';
  bitrate: number;
}

export function ConnectionTooltip({
  peerConnection,
  className,
}: ConnectionTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [stats, setStats] = useState<QuickStats>({
    rtt: 0,
    quality: 'good',
    bitrate: 0,
  });

  useEffect(() => {
    let mounted = true;

    const updateStats = async () => {
      try {
        const rtcStats = await peerConnection.getStats();
        let rtt = 0;
        let bitrate = 0;

        rtcStats.forEach(report => {
          if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            rtt = report.currentRoundTripTime * 1000;
          }
          if (report.type === 'inbound-rtp') {
            bitrate = report.bytesReceived * 8; // Convert to bits
          }
        });

        if (mounted) {
          setStats({
            rtt,
            quality: getQualityFromRTT(rtt),
            bitrate,
          });
        }
      } catch (error) {
        console.error('Failed to get quick stats:', error);
      }
    };

    const interval = setInterval(updateStats, 1000);
    updateStats();

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [peerConnection]);

  const qualityConfig = {
    excellent: { icon: Wifi, color: 'text-green-500' },
    good: { icon: Wifi, color: 'text-blue-500' },
    poor: { icon: Wifi, color: 'text-yellow-500' },
    critical: { icon: WifiOff, color: 'text-red-500' },
  };

  const Icon = qualityConfig[stats.quality].icon;

  return (
    <div
      className={cn('relative', className)}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <Icon className={cn('h-5 w-5', qualityConfig[stats.quality].color)} />
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-lg bg-dark-100 p-2 shadow-lg"
          >
            <div className="space-y-1 whitespace-nowrap text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">RTT:</span>
                <span className="font-medium text-white">{Math.round(stats.rtt)}ms</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Bitrate:</span>
                <span className="font-medium text-white">{formatBytes(stats.bitrate)}/s</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function getQualityFromRTT(rtt: number): QuickStats['quality'] {
  if (rtt < 100) return 'excellent';
  if (rtt < 200) return 'good';
  if (rtt < 500) return 'poor';
  return 'critical';
} 