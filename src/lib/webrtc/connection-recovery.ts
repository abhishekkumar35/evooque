import { EventEmitter } from 'events';
import { PeerService } from './peer-service';
import { ConnectionMonitor, ConnectionQuality } from './connection-monitor';

interface RecoveryState {
  peerId: string;
  attempts: number;
  lastAttempt: number;
  isRecovering: boolean;
  transferIds: string[];
}

export class ConnectionRecoveryService extends EventEmitter {
  private static instance: ConnectionRecoveryService;
  private recoveryStates: Map<string, RecoveryState> = new Map();
  private readonly MAX_ATTEMPTS = 5;
  private readonly RETRY_DELAY = 2000; // 2 seconds
  private readonly BACKOFF_FACTOR = 1.5;

  private constructor(private peerService: PeerService) {
    super();
    this.setupConnectionMonitoring();
  }

  static getInstance(peerService: PeerService): ConnectionRecoveryService {
    if (!ConnectionRecoveryService.instance) {
      ConnectionRecoveryService.instance = new ConnectionRecoveryService(peerService);
    }
    return ConnectionRecoveryService.instance;
  }

  private setupConnectionMonitoring() {
    this.peerService.on('iceStateChange', async ({ peerId, state }) => {
      if (state === 'disconnected' || state === 'failed') {
        await this.handleConnectionLoss(peerId);
      } else if (state === 'connected') {
        await this.handleConnectionRecovery(peerId);
      }
    });
  }

  private async handleConnectionLoss(peerId: string) {
    const state = this.recoveryStates.get(peerId) || {
      peerId,
      attempts: 0,
      lastAttempt: 0,
      isRecovering: false,
      transferIds: [],
    };

    if (state.isRecovering) return;

    state.isRecovering = true;
    this.recoveryStates.set(peerId, state);
    this.emit('recovery:start', { peerId });

    await this.attemptRecovery(state);
  }

  private async attemptRecovery(state: RecoveryState) {
    while (state.attempts < this.MAX_ATTEMPTS && state.isRecovering) {
      state.attempts++;
      state.lastAttempt = Date.now();

      try {
        await this.peerService.reconnect(state.peerId);
        return;
      } catch (error) {
        console.error(`Recovery attempt ${state.attempts} failed:`, error);
        
        if (state.attempts < this.MAX_ATTEMPTS) {
          const delay = this.RETRY_DELAY * Math.pow(this.BACKOFF_FACTOR, state.attempts - 1);
          this.emit('recovery:retry', {
            peerId: state.peerId,
            attempt: state.attempts,
            nextAttemptIn: delay,
          });
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    if (state.isRecovering) {
      this.emit('recovery:failed', { peerId: state.peerId });
      this.recoveryStates.delete(state.peerId);
    }
  }

  private async handleConnectionRecovery(peerId: string) {
    const state = this.recoveryStates.get(peerId);
    if (!state) return;

    state.isRecovering = false;
    this.emit('recovery:success', { peerId });
    this.recoveryStates.delete(peerId);

    // Resume any pending transfers
    if (state.transferIds.length > 0) {
      this.emit('transfer:resume', {
        peerId,
        transferIds: state.transferIds,
      });
    }
  }

  registerTransfer(peerId: string, transferId: string) {
    const state = this.recoveryStates.get(peerId);
    if (state) {
      state.transferIds.push(transferId);
    }
  }

  unregisterTransfer(peerId: string, transferId: string) {
    const state = this.recoveryStates.get(peerId);
    if (state) {
      state.transferIds = state.transferIds.filter(id => id !== transferId);
    }
  }

  isRecovering(peerId: string): boolean {
    return this.recoveryStates.get(peerId)?.isRecovering || false;
  }
} 