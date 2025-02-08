export interface NetworkStats {
  bitrate: number;
  packetsLost: number;
  roundTripTime?: number;
  jitter?: number;
}

export class NetworkMonitor {
  private static readonly BITRATE_THRESHOLD = {
    poor: 500000, // 500 Kbps
    fair: 1500000, // 1.5 Mbps
  };

  private static readonly PACKET_LOSS_THRESHOLD = {
    poor: 5, // 5%
    fair: 2, // 2%
  };

  private static readonly RTT_THRESHOLD = {
    poor: 300, // 300ms
    fair: 150, // 150ms
  };

  static async getConnectionStats(pc: RTCPeerConnection): Promise<NetworkStats> {
    const stats = await pc.getStats();
    let bitrate = 0;
    let packetsLost = 0;
    let roundTripTime: number | undefined;
    let jitter: number | undefined;

    stats.forEach((report) => {
      if (report.type === 'inbound-rtp' && report.kind === 'video') {
        const now = report.timestamp;
        const bytes = report.bytesReceived;
        const packets = report.packetsReceived;
        const lost = report.packetsLost;

        if (report.lastPacketReceivedTimestamp) {
          const timeDiff = now - report.lastPacketReceivedTimestamp;
          bitrate = (bytes * 8) / (timeDiff / 1000);
        }

        if (packets > 0) {
          packetsLost = (lost / packets) * 100;
        }

        jitter = report.jitter * 1000; // Convert to ms
      }

      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        roundTripTime = report.currentRoundTripTime * 1000; // Convert to ms
      }
    });

    return {
      bitrate,
      packetsLost,
      roundTripTime,
      jitter,
    };
  }

  static getConnectionQuality(stats: NetworkStats): 'excellent' | 'good' | 'poor' {
    const scores = {
      bitrate: this.getBitrateScore(stats.bitrate),
      packetLoss: this.getPacketLossScore(stats.packetsLost),
      rtt: stats.roundTripTime ? this.getRTTScore(stats.roundTripTime) : 'good',
    };

    const scoreValues = Object.values(scores);
    if (scoreValues.includes('poor')) return 'poor';
    if (scoreValues.includes('fair')) return 'good';
    return 'excellent';
  }

  private static getBitrateScore(bitrate: number): 'excellent' | 'fair' | 'poor' {
    if (bitrate < this.BITRATE_THRESHOLD.poor) return 'poor';
    if (bitrate < this.BITRATE_THRESHOLD.fair) return 'fair';
    return 'excellent';
  }

  private static getPacketLossScore(
    loss: number
  ): 'excellent' | 'fair' | 'poor' {
    if (loss > this.PACKET_LOSS_THRESHOLD.poor) return 'poor';
    if (loss > this.PACKET_LOSS_THRESHOLD.fair) return 'fair';
    return 'excellent';
  }

  private static getRTTScore(rtt: number): 'excellent' | 'fair' | 'poor' {
    if (rtt > this.RTT_THRESHOLD.poor) return 'poor';
    if (rtt > this.RTT_THRESHOLD.fair) return 'fair';
    return 'excellent';
  }
} 