import { EventEmitter } from 'events';
import { PeerService } from './peer-service';

interface ReconnectionConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

export class ReconnectionHandler extends EventEmitter {
  private static instance: ReconnectionHandler;
  private reconnectionAttempts: Map<string, number> = new Map();
  private timeouts: Map<string, NodeJS.Timeout> = new Map();
  private readonly config: ReconnectionConfig = {
    maxAttempts: 5,
    baseDelay: 1000, // 1 second
    maxDelay: 30000, // 30 seconds
    backoffFactor: 1.5,
  };

  private constructor(private peerService: PeerService) {
    super();
    this.setupConnectionMonitoring();
  }

  static getInstance(peerService: PeerService): ReconnectionHandler {
    if (!ReconnectionHandler.instance) {
      ReconnectionHandler.instance = new ReconnectionHandler(peerService);
    }
    return ReconnectionHandler.instance;
  }

  private setupConnectionMonitoring() {
    this.peerService.on('iceStateChange', ({ peerId, state }) => {
      if (state === 'disconnected' || state === 'failed') {
        this.handleDisconnection(peerId);
      } else if (state === 'connected') {
        this.handleReconnection(peerId);
      }
    });
  }

  private async handleDisconnection(peerId: string) {
    const attempts = this.reconnectionAttempts.get(peerId) || 0;
    
    if (attempts >= this.config.maxAttempts) {
      this.emit('reconnection:failed', { peerId });
      this.cleanup(peerId);
      return;
    }

    const delay = Math.min(
      this.config.baseDelay * Math.pow(this.config.backoffFactor, attempts),
      this.config.maxDelay
    );

    this.emit('reconnection:attempt', {
      peerId,
      attempt: attempts + 1,
      nextAttemptIn: delay,
    });

    const timeout = setTimeout(async () => {
      try {
        await this.peerService.reconnect(peerId);
        this.reconnectionAttempts.set(peerId, attempts + 1);
      } catch (error) {
        console.error('Reconnection attempt failed:', error);
        this.handleDisconnection(peerId);
      }
    }, delay);

    this.timeouts.set(peerId, timeout);
  }

  private handleReconnection(peerId: string) {
    this.emit('reconnection:success', { peerId });
    this.cleanup(peerId);
  }

  private cleanup(peerId: string) {
    const timeout = this.timeouts.get(peerId);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(peerId);
    }
    this.reconnectionAttempts.delete(peerId);
  }

  cancelReconnection(peerId: string) {
    this.cleanup(peerId);
    this.emit('reconnection:cancelled', { peerId });
  }
}

export const reconnectionHandler = ReconnectionHandler.getInstance(PeerService.getInstance()); 