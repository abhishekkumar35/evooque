import { useEffect, useState } from "react";
import { NetworkMonitor, NetworkStats } from "@/lib/webrtc/network-monitor";
import { Signal, SignalLow, SignalMedium, SignalHigh } from "lucide-react";
import { cn } from "@/lib/utils";

interface NetworkQualityProps {
  stream: MediaStream;
  className?: string;
}

export function NetworkQuality({ stream, className }: NetworkQualityProps) {
  const [quality, setQuality] = useState<'excellent' | 'good' | 'poor'>('good');
  const [stats, setStats] = useState<NetworkStats | null>(null);

  useEffect(() => {
    if (!stream) return;

    const track = stream.getVideoTracks()[0];
    if (!track) return;

    const sender = (track.sender as RTCRtpSender);
    if (!sender) return;

    const pc = sender.transport?.transport as RTCPeerConnection;
    if (!pc) return;

    const interval = setInterval(async () => {
      try {
        const stats = await NetworkMonitor.getConnectionStats(pc);
        setStats(stats);
        setQuality(NetworkMonitor.getConnectionQuality(stats));
      } catch (error) {
        console.error('Error getting network stats:', error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [stream]);

  const icons = {
    excellent: SignalHigh,
    good: SignalMedium,
    poor: SignalLow,
  };

  const colors = {
    excellent: 'text-green-500',
    good: 'text-yellow-500',
    poor: 'text-red-500',
  };

  const Icon = icons[quality];

  return (
    <div className={cn('group relative', className)}>
      <Icon className={cn('h-4 w-4', colors[quality])} />
      
      <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 rounded-lg bg-dark-100 p-2 text-xs group-hover:block">
        <div className="space-y-1">
          <p className="font-medium text-white">Network Quality: {quality}</p>
          {stats && (
            <>
              <p className="text-gray-400">
                Bitrate: {(stats.bitrate / 1000000).toFixed(1)} Mbps
              </p>
              <p className="text-gray-400">
                Packet Loss: {stats.packetsLost.toFixed(1)}%
              </p>
              {stats.roundTripTime && (
                <p className="text-gray-400">
                  Latency: {stats.roundTripTime.toFixed(0)}ms
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
} 