import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

interface ConnectionQualityGraphProps {
  peerConnection: RTCPeerConnection;
  className?: string;
}

interface MetricPoint {
  timestamp: number;
  rtt: number;
  packetLoss: number;
  bitrate: number;
}

export function ConnectionQualityGraph({
  peerConnection,
  className,
}: ConnectionQualityGraphProps) {
  const [metrics, setMetrics] = useState<MetricPoint[]>([]);
  const maxPoints = 30; // Show last 30 seconds

  useEffect(() => {
    let mounted = true;

    const updateMetrics = async () => {
      try {
        const stats = await peerConnection.getStats();
        const newPoint: MetricPoint = {
          timestamp: Date.now(),
          rtt: 0,
          packetLoss: 0,
          bitrate: 0,
        };

        stats.forEach(report => {
          if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            newPoint.rtt = report.currentRoundTripTime * 1000;
          }
          if (report.type === 'inbound-rtp') {
            newPoint.packetLoss = (report.packetsLost / report.packetsReceived) * 100;
            if (metrics.length > 0) {
              const prevReport = metrics[metrics.length - 1];
              const bytesReceived = report.bytesReceived;
              const timeDiff = (newPoint.timestamp - prevReport.timestamp) / 1000;
              newPoint.bitrate = ((bytesReceived * 8) / timeDiff) / 1000000; // Convert to Mbps
            }
          }
        });

        if (mounted) {
          setMetrics(prev => [...prev.slice(-maxPoints + 1), newPoint]);
        }
      } catch (error) {
        console.error('Failed to update metrics:', error);
      }
    };

    const interval = setInterval(updateMetrics, 1000);
    updateMetrics();

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [peerConnection]);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const chartData = metrics.map(point => ({
    time: formatTime(point.timestamp),
    rtt: point.rtt,
    packetLoss: point.packetLoss,
    bitrate: point.bitrate,
  }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn('space-y-4 rounded-lg bg-dark-100 p-4', className)}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">Connection Metrics</h3>
        <div className="flex gap-4">
          <MetricLegend color="#3b82f6" label="RTT (ms)" />
          <MetricLegend color="#ef4444" label="Packet Loss (%)" />
          <MetricLegend color="#10b981" label="Bitrate (Mbps)" />
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis
              dataKey="time"
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: 'none',
                borderRadius: '0.5rem',
                color: '#fff',
              }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="rtt"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              name="RTT"
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="packetLoss"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
              name="Packet Loss"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="bitrate"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              name="Bitrate"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

function MetricLegend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-3 w-3 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  );
} 