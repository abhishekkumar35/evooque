import { EventEmitter } from 'events';
import { ConnectionQuality } from '@/types/webrtc';

export interface ConnectionStats {
  timestamp: number;
  rtt: number;
  jitter: number;
  packetsLost: number;
  packetsReceived: number;
  framesDropped: number;
  framesSent: number;
  framesReceived: number;
  bytesReceived: number;
  bytesSent: number;
  bandwidth: number;
  availableOutgoingBitrate?: number;
  availableIncomingBitrate?: number;
}

export class ConnectionMonitor extends EventEmitter {
  private static instance: ConnectionMonitor;
  private monitoringIntervals: Map<string, NodeJS.Timer> = new Map();
  private statsHistory: Map<string, ConnectionStats[]> = new Map();
  private readonly MONITOR_INTERVAL = 2000; // 2 seconds
  private readonly HISTORY_LENGTH = 30; // Keep 1 minute of history

  private constructor() {
    super();
  }

  static getInstance(): ConnectionMonitor {
    if (!ConnectionMonitor.instance) {
      ConnectionMonitor.instance = new ConnectionMonitor();
    }
    return ConnectionMonitor.instance;
  }

  startMonitoring(peerId: string, peerConnection: RTCPeerConnection): void {
    if (this.monitoringIntervals.has(peerId)) return;

    const interval = setInterval(async () => {
      try {
        const stats = await this.getConnectionStats(peerConnection);
        this.updateStatsHistory(peerId, stats);
        const quality = this.assessConnectionQuality(stats);

        this.emit('stats:update', {
          peerId,
          stats,
          quality,
          history: this.statsHistory.get(peerId),
        });

      } catch (error) {
        console.error('Failed to get connection stats:', error);
      }
    }, this.MONITOR_INTERVAL);

    this.monitoringIntervals.set(peerId, interval);
  }

  stopMonitoring(peerId: string): void {
    const interval = this.monitoringIntervals.get(peerId);
    if (interval) {
      clearInterval(interval);
      this.monitoringIntervals.delete(peerId);
      this.statsHistory.delete(peerId);
    }
  }

  private async getConnectionStats(pc: RTCPeerConnection): Promise<ConnectionStats> {
    const stats = await pc.getStats();
    const result: ConnectionStats = {
      timestamp: Date.now(),
      rtt: 0,
      jitter: 0,
      packetsLost: 0,
      packetsReceived: 0,
      framesDropped: 0,
      framesSent: 0,
      framesReceived: 0,
      bytesReceived: 0,
      bytesSent: 0,
      bandwidth: 0,
    };

    stats.forEach(report => {
      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        result.rtt = report.currentRoundTripTime * 1000;
      }
      if (report.type === 'inbound-rtp') {
        result.jitter = report.jitter * 1000;
        result.packetsLost = report.packetsLost;
        result.packetsReceived = report.packetsReceived;
        result.bytesReceived = report.bytesReceived;
        if (report.kind === 'video') {
          result.framesReceived = report.framesReceived;
          result.framesDropped = report.framesDropped;
        }
      }
      if (report.type === 'outbound-rtp') {
        result.bytesSent = report.bytesSent;
        if (report.kind === 'video') {
          result.framesSent = report.framesSent;
        }
      }
      if (report.type === 'transport') {
        result.availableOutgoingBitrate = report.availableOutgoingBitrate;
        result.availableIncomingBitrate = report.availableIncomingBitrate;
      }
    });

    // Calculate bandwidth
    if (this.statsHistory.has(peerId)) {
      const history = this.statsHistory.get(peerId)!;
      const lastStats = history[history.length - 1];
      if (lastStats) {
        const timeDiff = (result.timestamp - lastStats.timestamp) / 1000;
        const bytesDiff = result.bytesReceived - lastStats.bytesReceived;
        result.bandwidth = (bytesDiff * 8) / timeDiff; // bits per second
      }
    }

    return result;
  }

  private updateStatsHistory(peerId: string, stats: ConnectionStats): void {
    if (!this.statsHistory.has(peerId)) {
      this.statsHistory.set(peerId, []);
    }

    const history = this.statsHistory.get(peerId)!;
    history.push(stats);

    // Keep only the last HISTORY_LENGTH entries
    if (history.length > this.HISTORY_LENGTH) {
      history.shift();
    }
  }

  private assessConnectionQuality(stats: ConnectionStats): ConnectionQuality {
    const packetLoss = stats.packetsReceived > 0
      ? (stats.packetsLost / stats.packetsReceived) * 100
      : 0;

    if (stats.rtt < 100 && packetLoss < 1 && stats.jitter < 30) {
      return 'excellent';
    }
    if (stats.rtt < 200 && packetLoss < 5 && stats.jitter < 50) {
      return 'good';
    }
    if (stats.rtt < 500 && packetLoss < 10 && stats.jitter < 100) {
      return 'poor';
    }
    return 'critical';
  }

  getStatsHistory(peerId: string): ConnectionStats[] {
    return this.statsHistory.get(peerId) || [];
  }

  clearHistory(peerId: string): void {
    this.statsHistory.delete(peerId);
  }
}

export const connectionMonitor = ConnectionMonitor.getInstance(); 