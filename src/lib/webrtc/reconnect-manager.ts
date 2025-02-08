import { EventEmitter } from 'events';
import { PeerService } from './peer-service';

interface ReconnectConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

export class ReconnectManager extends EventEmitter {
  private static instance: ReconnectManager;
  private reconnectAttempts: Map<string, number> = new Map();
  private timeouts: Map<string, NodeJS.Timeout> = new Map();
  private readonly config: ReconnectConfig = {
    maxAttempts: 5,
    initialDelay: 1000, // 1 second
    maxDelay: 30000,    // 30 seconds
    backoffFactor: 2,
  };

  private constructor(private peerService: PeerService) {
    super();
    this.setupConnectionMonitoring();
  }

  static getInstance(peerService: PeerService): ReconnectManager {
    if (!ReconnectManager.instance) {
      ReconnectManager.instance = new ReconnectManager(peerService);
    }
    return ReconnectManager.instance;
  }

  private setupConnectionMonitoring() {
    this.peerService.on('connectionStateChange', ({ peerId, state }) => {
      if (state === 'disconnected' || state === 'failed') {
        this.handleDisconnection(peerId);
      } else if (state === 'connected') {
        this.handleReconnection(peerId);
      }
    });
  }

  private async handleDisconnection(peerId: string) {
    const attempts = this.reconnectAttempts.get(peerId) || 0;

    if (attempts >= this.config.maxAttempts) {
      this.emit('reconnect:failed', { peerId });
      this.cleanup(peerId);
      return;
    }

    const delay = Math.min(
      this.config.initialDelay * Math.pow(this.config.backoffFactor, attempts),
      this.config.maxDelay
    );

    this.emit('reconnect:attempt', {
      peerId,
      attempt: attempts + 1,
      nextAttemptIn: delay,
      maxAttempts: this.config.maxAttempts,
    });

    const timeout = setTimeout(async () => {
      try {
        await this.peerService.reconnect(peerId);
        this.reconnectAttempts.set(peerId, attempts + 1);
      } catch (error) {
        console.error('Reconnection attempt failed:', error);
        this.handleDisconnection(peerId);
      }
    }, delay);

    this.timeouts.set(peerId, timeout);
  }

  private handleReconnection(peerId: string) {
    this.emit('reconnect:success', { peerId });
    this.cleanup(peerId);
  }

  private cleanup(peerId: string) {
    const timeout = this.timeouts.get(peerId);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(peerId);
    }
    this.reconnectAttempts.delete(peerId);
  }

  cancelReconnection(peerId: string) {
    this.cleanup(peerId);
    this.emit('reconnect:cancelled', { peerId });
  }

  isReconnecting(peerId: string): boolean {
    return this.reconnectAttempts.has(peerId);
  }

  getReconnectAttempts(peerId: string): number {
    return this.reconnectAttempts.get(peerId) || 0;
  }
}

export const reconnectManager = ReconnectManager.getInstance(PeerService.getInstance()); 