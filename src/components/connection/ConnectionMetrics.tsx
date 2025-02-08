import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';
import { formatBytes } from '@/lib/utils/format';

interface ConnectionMetricsProps {
  peerConnection: RTCPeerConnection;
  className?: string;
}

interface MetricPoint {
  timestamp: number;
  rtt: number;
  packetsLost: number;
  bitrate: number;
}

export function ConnectionMetrics({
  peerConnection,
  className,
}: ConnectionMetricsProps) {
  const [metrics, setMetrics] = useState<MetricPoint[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    let mounted = true;
    const maxDataPoints = 30; // 30 seconds of data

    const updateMetrics = async () => {
      try {
        const stats = await peerConnection.getStats();
        const newPoint: MetricPoint = {
          timestamp: Date.now(),
          rtt: 0,
          packetsLost: 0,
          bitrate: 0,
        };

        stats.forEach(report => {
          if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            newPoint.rtt = report.currentRoundTripTime * 1000;
          }
          if (report.type === 'inbound-rtp') {
            newPoint.packetsLost = report.packetsLost || 0;
            if (metrics.length > 0) {
              const prevReport = metrics[metrics.length - 1];
              const bytesReceived = report.bytesReceived - prevReport.bitrate;
              newPoint.bitrate = (bytesReceived * 8) / 1000; // kbps
            }
          }
        });

        if (mounted) {
          setMetrics(prev => {
            const updated = [...prev, newPoint];
            return updated.slice(-maxDataPoints);
          });
        }
      } catch (error) {
        console.error('Failed to get metrics:', error);
      }
    };

    const interval = setInterval(updateMetrics, 1000);
    updateMetrics();

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [peerConnection]);

  const chartData = metrics.map(point => ({
    time: new Date(point.timestamp).toLocaleTimeString(),
    rtt: point.rtt,
    packetsLost: point.packetsLost,
    bitrate: point.bitrate,
  }));

  return (
    <motion.div
      layout
      className={cn('rounded-lg bg-dark-100 p-4', className)}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">Connection Metrics</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-400 hover:text-white"
        >
          {isExpanded ? 'Show Less' : 'Show More'}
        </button>
      </div>

      <motion.div
        animate={{ height: isExpanded ? 'auto' : 0 }}
        className="overflow-hidden"
      >
        <div className="mt-4 space-y-4">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="time" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="rtt"
                  stroke="#3b82f6"
                  name="RTT (ms)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="bitrate"
                  stroke="#10b981"
                  name="Bitrate (kbps)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <MetricCard
              label="Current RTT"
              value={`${Math.round(metrics[metrics.length - 1]?.rtt || 0)}ms`}
              trend={getTrend(metrics, 'rtt')}
            />
            <MetricCard
              label="Packets Lost"
              value={metrics[metrics.length - 1]?.packetsLost.toString() || '0'}
              trend={getTrend(metrics, 'packetsLost')}
            />
            <MetricCard
              label="Bitrate"
              value={`${formatBytes(metrics[metrics.length - 1]?.bitrate || 0)}/s`}
              trend={getTrend(metrics, 'bitrate')}
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function MetricCard({
  label,
  value,
  trend,
}: {
  label: string;
  value: string;
  trend: 'up' | 'down' | 'stable';
}) {
  const trendColors = {
    up: 'text-green-500',
    down: 'text-red-500',
    stable: 'text-blue-500',
  };

  return (
    <div className="rounded-lg bg-dark-200 p-3">
      <div className="text-xs text-gray-400">{label}</div>
      <div className="mt-1 flex items-center gap-2">
        <span className="text-lg font-medium text-white">{value}</span>
        <span className={cn('text-xs', trendColors[trend])}>
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
        </span>
      </div>
    </div>
  );
}

function getTrend(metrics: MetricPoint[], key: keyof MetricPoint): 'up' | 'down' | 'stable' {
  if (metrics.length < 2) return 'stable';
  
  const current = metrics[metrics.length - 1][key] as number;
  const previous = metrics[metrics.length - 2][key] as number;
  
  if (current > previous * 1.1) return 'up';
  if (current < previous * 0.9) return 'down';
  return 'stable';
} 