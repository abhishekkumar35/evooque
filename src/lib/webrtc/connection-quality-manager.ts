import { EventEmitter } from 'events';
import { ConnectionQuality } from './connection-monitor';
import { BandwidthControl } from './bandwidth-control';

interface QualityConfig {
  maxBitrate: number;
  maxFrameRate: number;
  maxResolution: {
    width: number;
    height: number;
  };
}

export class ConnectionQualityManager extends EventEmitter {
  private static instance: ConnectionQualityManager;
  private qualityConfigs: Record<ConnectionQuality, QualityConfig> = {
    excellent: {
      maxBitrate: 2500000, // 2.5 Mbps
      maxFrameRate: 30,
      maxResolution: { width: 1280, height: 720 }, // 720p
    },
    good: {
      maxBitrate: 1000000, // 1 Mbps
      maxFrameRate: 25,
      maxResolution: { width: 854, height: 480 }, // 480p
    },
    poor: {
      maxBitrate: 500000, // 500 Kbps
      maxFrameRate: 20,
      maxResolution: { width: 640, height: 360 }, // 360p
    },
    critical: {
      maxBitrate: 250000, // 250 Kbps
      maxFrameRate: 15,
      maxResolution: { width: 426, height: 240 }, // 240p
    },
  };

  private constructor() {
    super();
  }

  static getInstance(): ConnectionQualityManager {
    if (!ConnectionQualityManager.instance) {
      ConnectionQualityManager.instance = new ConnectionQualityManager();
    }
    return ConnectionQualityManager.instance;
  }

  async adaptQuality(
    pc: RTCPeerConnection,
    stream: MediaStream,
    quality: ConnectionQuality
  ) {
    const config = this.qualityConfigs[quality];
    const videoTrack = stream.getVideoTracks()[0];

    if (videoTrack) {
      try {
        // Adapt video constraints
        await videoTrack.applyConstraints({
          width: { ideal: config.maxResolution.width },
          height: { ideal: config.maxResolution.height },
          frameRate: { ideal: config.maxFrameRate },
        });

        // Adapt bandwidth
        await BandwidthControl.setQualityTier(pc, quality);

        this.emit('quality:adapted', {
          quality,
          config,
          success: true,
        });
      } catch (error) {
        console.error('Failed to adapt quality:', error);
        this.emit('quality:adapted', {
          quality,
          config,
          success: false,
          error,
        });
      }
    }
  }

  getQualityConfig(quality: ConnectionQuality): QualityConfig {
    return this.qualityConfigs[quality];
  }

  getCurrentQuality(stats: RTCStatsReport): ConnectionQuality {
    let rtt = 0;
    let packetsLost = 0;
    let totalPackets = 0;

    stats.forEach(report => {
      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        rtt = report.currentRoundTripTime * 1000;
      }
      if (report.type === 'inbound-rtp') {
        packetsLost = report.packetsLost;
        totalPackets = report.packetsReceived;
      }
    });

    const packetLoss = totalPackets ? (packetsLost / totalPackets) * 100 : 0;

    if (rtt < 100 && packetLoss < 1) return 'excellent';
    if (rtt < 200 && packetLoss < 5) return 'good';
    if (rtt < 500 && packetLoss < 10) return 'poor';
    return 'critical';
  }
}

export const qualityManager = ConnectionQualityManager.getInstance(); 