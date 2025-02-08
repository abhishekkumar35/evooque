import { ConnectionMonitor, ConnectionQuality, ConnectionStats } from './connection-monitor';
import { BandwidthControl } from './bandwidth-control';

export interface QualityConfig {
  resolution: {
    width: number;
    height: number;
  };
  frameRate: number;
  bitrate: number;
}

export class QualityAdapter {
  private static readonly QUALITY_CONFIGS: Record<ConnectionQuality, QualityConfig> = {
    excellent: {
      resolution: { width: 1280, height: 720 },
      frameRate: 30,
      bitrate: 2500000, // 2.5 Mbps
    },
    good: {
      resolution: { width: 854, height: 480 },
      frameRate: 25,
      bitrate: 1000000, // 1 Mbps
    },
    poor: {
      resolution: { width: 640, height: 360 },
      frameRate: 20,
      bitrate: 500000, // 500 Kbps
    },
    critical: {
      resolution: { width: 426, height: 240 },
      frameRate: 15,
      bitrate: 250000, // 250 Kbps
    },
  };

  static async adaptQuality(
    pc: RTCPeerConnection,
    stats: ConnectionStats,
    stream: MediaStream
  ) {
    const quality = ConnectionMonitor.getConnectionQuality(stats);
    const config = this.QUALITY_CONFIGS[quality];

    // Adapt video constraints
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      try {
        await videoTrack.applyConstraints({
          width: { ideal: config.resolution.width },
          height: { ideal: config.resolution.height },
          frameRate: { ideal: config.frameRate },
        });
      } catch (error) {
        console.error('Failed to apply video constraints:', error);
      }
    }

    // Adapt bandwidth
    try {
      await BandwidthControl.setBandwidthLimit(pc, config.bitrate);
    } catch (error) {
      console.error('Failed to set bandwidth limit:', error);
    }

    return quality;
  }

  static async getStreamStats(stream: MediaStream): Promise<{
    resolution: string;
    frameRate: number;
    bitrate: number;
  }> {
    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) {
      return { resolution: 'N/A', frameRate: 0, bitrate: 0 };
    }

    const settings = videoTrack.getSettings();
    return {
      resolution: `${settings.width}x${settings.height}`,
      frameRate: settings.frameRate || 0,
      bitrate: 0, // This will be updated with real-time stats
    };
  }
} 