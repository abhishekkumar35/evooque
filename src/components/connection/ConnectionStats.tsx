import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, ArrowDown, ArrowUp, Clock } from 'lucide-react';
import { formatBytes } from '@/lib/utils/format';
import { cn } from '@/lib/utils';

interface ConnectionStatsProps {
  peerConnection: RTCPeerConnection;
  className?: string;
}

interface DetailedStats {
  timestamp: number;
  rtt: number;
  jitter: number;
  packetsLost: number;
  packetsReceived: number;
  bytesReceived: number;
  bytesSent: number;
  framesReceived: number;
  framesDropped: number;
  frameWidth: number;
  frameHeight: number;
  frameRate: number;
}

export function ConnectionStats({
  peerConnection,
  className,
}: ConnectionStatsProps) {
  const [stats, setStats] = useState<DetailedStats | null>(null);
  const [prevStats, setPrevStats] = useState<DetailedStats | null>(null);

  useEffect(() => {
    let mounted = true;

    const updateStats = async () => {
      try {
        const rtcStats = await peerConnection.getStats();
        const newStats: DetailedStats = {
          timestamp: Date.now(),
          rtt: 0,
          jitter: 0,
          packetsLost: 0,
          packetsReceived: 0,
          bytesReceived: 0,
          bytesSent: 0,
          framesReceived: 0,
          framesDropped: 0,
          frameWidth: 0,
          frameHeight: 0,
          frameRate: 0,
        };

        rtcStats.forEach(report => {
          if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            newStats.rtt = report.currentRoundTripTime * 1000;
          }
          if (report.type === 'inbound-rtp') {
            newStats.jitter = report.jitter * 1000;
            newStats.packetsLost = report.packetsLost;
            newStats.packetsReceived = report.packetsReceived;
            newStats.bytesReceived = report.bytesReceived;
            if (report.kind === 'video') {
              newStats.framesReceived = report.framesReceived;
              newStats.framesDropped = report.framesDropped;
              newStats.frameRate = report.framesPerSecond;
            }
          }
          if (report.type === 'outbound-rtp') {
            newStats.bytesSent = report.bytesSent;
          }
          if (report.type === 'track' && report.kind === 'video') {
            newStats.frameWidth = report.frameWidth;
            newStats.frameHeight = report.frameHeight;
          }
        });

        if (mounted) {
          setPrevStats(stats);
          setStats(newStats);
        }
      } catch (error) {
        console.error('Failed to get connection stats:', error);
      }
    };

    const interval = setInterval(updateStats, 1000);
    updateStats();

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [peerConnection]);

  if (!stats) return null;

  const getBitrate = (current: number, previous: number) => {
    if (!prevStats) return 0;
    const timeDiff = (stats.timestamp - prevStats.timestamp) / 1000;
    return ((current - previous) * 8) / timeDiff;
  };

  const downloadBitrate = getBitrate(stats.bytesReceived, prevStats?.bytesReceived || 0);
  const uploadBitrate = getBitrate(stats.bytesSent, prevStats?.bytesSent || 0);

  return (
    <div className={cn('space-y-6 rounded-lg bg-dark-100 p-4', className)}>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          icon={Clock}
          label="Round Trip Time"
          value={`${Math.round(stats.rtt)}ms`}
          trend={getTrend(stats.rtt, prevStats?.rtt)}
          trendUp={false}
        />
        <StatCard
          icon={Activity}
          label="Jitter"
          value={`${Math.round(stats.jitter)}ms`}
          trend={getTrend(stats.jitter, prevStats?.jitter)}
          trendUp={false}
        />
        <StatCard
          icon={ArrowDown}
          label="Download"
          value={formatBytes(downloadBitrate)}
          subValue="/s"
          trend={getTrend(downloadBitrate, getBitrate(prevStats?.bytesReceived || 0, 0))}
        />
        <StatCard
          icon={ArrowUp}
          label="Upload"
          value={formatBytes(uploadBitrate)}
          subValue="/s"
          trend={getTrend(uploadBitrate, getBitrate(prevStats?.bytesSent || 0, 0))}
        />
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-white">Video Stats</h3>
        <div className="grid grid-cols-2 gap-4 rounded-lg bg-dark-200 p-4 md:grid-cols-3">
          <StatItem
            label="Resolution"
            value={`${stats.frameWidth}x${stats.frameHeight}`}
          />
          <StatItem
            label="Frame Rate"
            value={`${Math.round(stats.frameRate)} fps`}
          />
          <StatItem
            label="Frames Dropped"
            value={`${((stats.framesDropped / stats.framesReceived) * 100).toFixed(1)}%`}
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  trend,
  trendUp = true,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  subValue?: string;
  trend: number;
  trendUp?: boolean;
}) {
  const getTrendColor = (trend: number) => {
    if (trendUp) {
      return trend > 0 ? 'text-green-500' : trend < 0 ? 'text-red-500' : 'text-blue-500';
    }
    return trend > 0 ? 'text-red-500' : trend < 0 ? 'text-green-500' : 'text-blue-500';
  };

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="rounded-lg bg-dark-200 p-4"
    >
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4 text-gray-400" />
        <span className="text-xs text-gray-400">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-semibold text-white">{value}</span>
        {subValue && <span className="text-sm text-gray-400">{subValue}</span>}
      </div>
      {trend !== 0 && (
        <div className={cn('mt-1 text-xs', getTrendColor(trend))}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
        </div>
      )}
    </motion.div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="text-xs text-gray-400">{label}</div>
      <div className="text-sm font-medium text-white">{value}</div>
    </div>
  );
}

function getTrend(current: number, previous: number | undefined): number {
  if (!previous) return 0;
  return ((current - previous) / previous) * 100;
} 