import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Wifi, Zap, Server } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatBytes } from '@/lib/utils/format';

interface ConnectionQualityStatsProps {
  peerConnection: RTCPeerConnection;
  className?: string;
}

interface QualityStats {
  rtt: number;
  jitter: number;
  packetLoss: number;
  availableBandwidth: number;
  networkType: string;
  localCandidateType: string;
  remoteCandidateType: string;
  timestamp: number;
}

export function ConnectionQualityStats({
  peerConnection,
  className,
}: ConnectionQualityStatsProps) {
  const [stats, setStats] = useState<QualityStats | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    let mounted = true;

    const updateStats = async () => {
      try {
        const rtcStats = await peerConnection.getStats();
        const newStats: QualityStats = {
          rtt: 0,
          jitter: 0,
          packetLoss: 0,
          availableBandwidth: 0,
          networkType: 'unknown',
          localCandidateType: 'unknown',
          remoteCandidateType: 'unknown',
          timestamp: Date.now(),
        };

        rtcStats.forEach(report => {
          if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            newStats.rtt = report.currentRoundTripTime * 1000;
          }
          if (report.type === 'inbound-rtp') {
            newStats.jitter = report.jitter * 1000;
            newStats.packetLoss = (report.packetsLost / report.packetsReceived) * 100;
          }
          if (report.type === 'local-candidate') {
            newStats.localCandidateType = report.candidateType;
            newStats.networkType = report.networkType;
          }
          if (report.type === 'remote-candidate') {
            newStats.remoteCandidateType = report.candidateType;
          }
          if (report.type === 'transport') {
            newStats.availableBandwidth = report.availableOutgoingBitrate || 0;
          }
        });

        if (mounted) {
          setStats(newStats);
        }
      } catch (error) {
        console.error('Failed to get quality stats:', error);
      }
    };

    const interval = setInterval(updateStats, 2000);
    updateStats();

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [peerConnection]);

  if (!stats) return null;

  const getQualityLevel = (rtt: number, packetLoss: number): {
    label: string;
    color: string;
    icon: typeof Activity;
  } => {
    if (rtt < 100 && packetLoss < 1) {
      return { label: 'Excellent', color: 'text-green-500', icon: Zap };
    }
    if (rtt < 200 && packetLoss < 5) {
      return { label: 'Good', color: 'text-blue-500', icon: Wifi };
    }
    if (rtt < 500 && packetLoss < 10) {
      return { label: 'Fair', color: 'text-yellow-500', icon: Activity };
    }
    return { label: 'Poor', color: 'text-red-500', icon: Server };
  };

  const quality = getQualityLevel(stats.rtt, stats.packetLoss);
  const QualityIcon = quality.icon;

  return (
    <div className={cn('rounded-lg bg-dark-100 p-4', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            className={cn('rounded-full p-2', quality.color.replace('text-', 'bg-') + '/10')}
          >
            <QualityIcon className={cn('h-5 w-5', quality.color)} />
          </motion.div>
          <div>
            <h3 className={cn('text-sm font-medium', quality.color)}>
              {quality.label} Connection
            </h3>
            <p className="text-xs text-gray-400">
              RTT: {Math.round(stats.rtt)}ms | Packet Loss: {stats.packetLoss.toFixed(1)}%
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-400 hover:text-white"
        >
          {isExpanded ? 'Show Less' : 'Show More'}
        </button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-4 space-y-4 overflow-hidden border-t border-dark-200 pt-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <DetailItem
                label="Network Type"
                value={stats.networkType}
              />
              <DetailItem
                label="Available Bandwidth"
                value={formatBytes(stats.availableBandwidth) + '/s'}
              />
              <DetailItem
                label="Local Candidate"
                value={stats.localCandidateType}
              />
              <DetailItem
                label="Remote Candidate"
                value={stats.remoteCandidateType}
              />
              <DetailItem
                label="Jitter"
                value={`${Math.round(stats.jitter)}ms`}
              />
              <DetailItem
                label="Packet Loss"
                value={`${stats.packetLoss.toFixed(1)}%`}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="text-xs text-gray-400">{label}</div>
      <div className="text-sm font-medium text-white">{value}</div>
    </div>
  );
} 