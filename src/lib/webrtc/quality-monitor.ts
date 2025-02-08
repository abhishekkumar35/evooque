import { EventEmitter } from 'events';
import { ConnectionMonitor, ConnectionQuality, ConnectionStats } from './connection-monitor';
import { QualityAdapter } from './quality-adapter';

export class QualityMonitor extends EventEmitter {
  private static instance: QualityMonitor;
  private monitoringIntervals: Map<string, NodeJS.Timer> = new Map();
  private readonly MONITOR_INTERVAL = 2000; // 2 seconds

  private constructor() {
    super();
  }

  static getInstance(): QualityMonitor {
    if (!QualityMonitor.instance) {
      QualityMonitor.instance = new QualityMonitor();
    }
    return QualityMonitor.instance;
  }

  startMonitoring(peerId: string, pc: RTCPeerConnection, stream: MediaStream) {
    if (this.monitoringIntervals.has(peerId)) return;

    const interval = setInterval(async () => {
      try {
        const stats = await ConnectionMonitor.getConnectionStats(pc);
        const quality = await QualityAdapter.adaptQuality(pc, stats, stream);

        this.emit('quality:update', {
          peerId,
          quality,
          stats,
        });

        // Emit warning for poor connection
        if (quality === 'poor' || quality === 'critical') {
          this.emit('quality:warning', {
            peerId,
            quality,
            message: ConnectionMonitor.formatQualityMessage(quality),
          });
        }
      } catch (error) {
        console.error('Error monitoring connection quality:', error);
      }
    }, this.MONITOR_INTERVAL);

    this.monitoringIntervals.set(peerId, interval);
  }

  stopMonitoring(peerId: string) {
    const interval = this.monitoringIntervals.get(peerId);
    if (interval) {
      clearInterval(interval);
      this.monitoringIntervals.delete(peerId);
    }
  }

  stopAllMonitoring() {
    this.monitoringIntervals.forEach(interval => clearInterval(interval));
    this.monitoringIntervals.clear();
  }
}

export const qualityMonitor = QualityMonitor.getInstance(); 