export class BandwidthControl {
  private static readonly QUALITY_TIERS = {
    high: {
      maxBitrate: 2500000, // 2.5 Mbps
      scaleResolutionDownBy: 1,
    },
    medium: {
      maxBitrate: 1000000, // 1 Mbps
      scaleResolutionDownBy: 1.5,
    },
    low: {
      maxBitrate: 500000, // 500 Kbps
      scaleResolutionDownBy: 2,
    },
    minimal: {
      maxBitrate: 250000, // 250 Kbps
      scaleResolutionDownBy: 4,
    },
  };

  static async setQualityTier(pc: RTCPeerConnection, tier: keyof typeof BandwidthControl.QUALITY_TIERS) {
    const config = this.QUALITY_TIERS[tier];
    const senders = pc.getSenders();

    for (const sender of senders) {
      if (sender.track?.kind === 'video') {
        const params = sender.getParameters();
        
        // Set encoding parameters
        if (!params.encodings) {
          params.encodings = [{}];
        }

        params.encodings[0].maxBitrate = config.maxBitrate;
        params.encodings[0].scaleResolutionDownBy = config.scaleResolutionDownBy;

        await sender.setParameters(params);
      }
    }
  }

  static async optimizeBandwidth(pc: RTCPeerConnection, stats: RTCStatsReport) {
    const rtt = this.getRTT(stats);
    const packetLoss = this.getPacketLoss(stats);

    // Determine quality tier based on network conditions
    let tier: keyof typeof BandwidthControl.QUALITY_TIERS;

    if (rtt < 100 && packetLoss < 0.01) {
      tier = 'high';
    } else if (rtt < 200 && packetLoss < 0.05) {
      tier = 'medium';
    } else if (rtt < 500 && packetLoss < 0.1) {
      tier = 'low';
    } else {
      tier = 'minimal';
    }

    await this.setQualityTier(pc, tier);
  }

  private static getRTT(stats: RTCStatsReport): number {
    let rtt = 0;
    stats.forEach(report => {
      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        rtt = report.currentRoundTripTime * 1000;
      }
    });
    return rtt;
  }

  private static getPacketLoss(stats: RTCStatsReport): number {
    let totalPackets = 0;
    let packetsLost = 0;

    stats.forEach(report => {
      if (report.type === 'inbound-rtp') {
        totalPackets += report.packetsReceived;
        packetsLost += report.packetsLost;
      }
    });

    return totalPackets > 0 ? packetsLost / totalPackets : 0;
  }
} 