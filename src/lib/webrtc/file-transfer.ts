import { EventEmitter } from 'events';
import { dataChannelService } from './data-channel';
import { FileValidationService } from '@/lib/file/file-validation';
import { EncryptionService } from '@/lib/crypto/encryption-service';
import { ConnectionRecoveryService } from './connection-recovery';

interface FileTransfer {
  id: string;
  name: string;
  size: number;
  type: string;
  chunks: number;
  currentChunk: number;
  checksum: string;
  isPaused: boolean;
  startTime: number;
  bytesTransferred: number;
  transferSpeed: number;
  peerId: string;
  key?: CryptoKey;
}

interface FileChunk {
  id: string;
  index: number;
  total: number;
  data: ArrayBuffer;
  iv: Uint8Array;
}

interface RetryConfig {
  maxAttempts: number;
  delayMs: number;
  backoffFactor: number;
}

interface TransferCheckpoint {
  lastChunkIndex: number;
  bytesTransferred: number;
  timestamp: number;
}

export class FileTransferService extends EventEmitter {
  private static instance: FileTransferService;
  private transfers: Map<string, FileTransfer> = new Map();
  private chunks: Map<string, ArrayBuffer[]> = new Map();
  private CHUNK_SIZE = 16384; // 16KB chunks
  private transferQueue: Map<string, {
    chunks: { index: number; data: ArrayBuffer; iv: Uint8Array }[];
    isPaused: boolean;
  }> = new Map();
  private readonly RATE_LIMIT = 1024 * 1024; // 1MB/s
  private readonly CHUNK_INTERVAL = 50; // 50ms between chunks
  private retryQueue: Map<string, {
    attempts: number;
    timeoutId?: NodeJS.Timeout;
  }> = new Map();
  private readonly DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxAttempts: 3,
    delayMs: 1000,
    backoffFactor: 2,
  };
  private checkpoints: Map<string, TransferCheckpoint> = new Map();
  private recoveryService: ConnectionRecoveryService;

  private constructor() {
    super();
    this.recoveryService = new ConnectionRecoveryService(); // initialize recoveryService
    this.setupDataChannelHandler();
    this.setupRecoveryHandling();
  }

  static getInstance(): FileTransferService {
    if (!FileTransferService.instance) {
      FileTransferService.instance = new FileTransferService();
    }
    return FileTransferService.instance;
  }

  private setupDataChannelHandler() {
    dataChannelService.addMessageHandler((message, peerId) => {
      if (message.type === 'file') {
        this.handleFileMessage(message.payload, peerId);
      }
    });
  }

  private setupRecoveryHandling() {
    this.recoveryService.on('transfer:resume', async ({ peerId, transferIds }) => {
      for (const id of transferIds) {
        await this.resumeTransfer(peerId, id);
      }
    });
  }

  private handleFileMessage(payload: any, peerId: string) {
    switch (payload.action) {
      case 'start':
        this.handleFileStart(payload, peerId);
        break;
      case 'chunk':
        this.handleFileChunk(payload, peerId);
        break;
      case 'complete':
        this.handleFileComplete(payload, peerId);
        break;
    }
  }

  private async handleFileStart(payload: { 
    id: string; 
    name: string; 
    size: number; 
    type: string; 
    checksum: string;
    key: string;
  }, peerId: string) {
    const key = await EncryptionService.importKey(payload.key);
    this.transfers.set(payload.id, {
      ...payload,
      chunks: Math.ceil(payload.size / this.CHUNK_SIZE),
      currentChunk: 0,
      key,
      peerId,
    });
    this.chunks.set(payload.id, []);
    this.emit('transfer:start', { peerId, ...payload });
  }

  private async handleFileChunk(payload: { 
    id: string; 
    index: number; 
    data: ArrayBuffer;
    iv: Uint8Array;
  }, peerId: string) {
    const transfer = this.transfers.get(payload.id);
    if (!transfer || !transfer.key) return;

    const chunks = this.chunks.get(payload.id);
    if (!chunks) return;

    // Decrypt chunk
    const decrypted = await EncryptionService.decryptChunk(
      payload.data,
      transfer.key,
      payload.iv
    );

    chunks[payload.index] = decrypted;
    transfer.currentChunk++;

    const progress = (transfer.currentChunk / transfer.chunks) * 100;
    this.emit('transfer:progress', { 
      peerId, 
      id: payload.id, 
      progress,
      received: transfer.currentChunk,
      total: transfer.chunks 
    });
  }

  private async handleFileComplete(payload: { id: string }, peerId: string) {
    const transfer = this.transfers.get(payload.id);
    const chunks = this.chunks.get(payload.id);
    if (!transfer || !chunks) return;

    const file = new Blob(chunks, { type: transfer.type });
    const checksum = await FileValidationService.calculateChecksum(
      new File([file], transfer.name, { type: transfer.type })
    );

    // Verify checksum
    if (checksum !== transfer.checksum) {
      this.emit('transfer:error', {
        peerId,
        id: payload.id,
        error: 'File integrity check failed',
      });
      return;
    }

    // Clean up retry state
    for (const [key, { timeoutId }] of this.retryQueue.entries()) {
      if (key.startsWith(`${payload.id}-`) && timeoutId) {
        clearTimeout(timeoutId);
        this.retryQueue.delete(key);
      }
    }

    this.emit('transfer:complete', {
      peerId,
      id: payload.id,
      file,
      name: transfer.name,
      size: transfer.size,
      type: transfer.type,
    });

    this.transfers.delete(payload.id);
    this.chunks.delete(payload.id);
  }

  pauseTransfer(id: string) {
    const transfer = this.transfers.get(id);
    if (transfer) {
      transfer.isPaused = true;
      this.emit('transfer:pause', { id });
    }
  }

  resumeTransfer(id: string) {
    const transfer = this.transfers.get(id);
    if (transfer) {
      transfer.isPaused = false;
      this.emit('transfer:resume', { id });
      this.processQueue(id);
    }
  }

  private async processQueue(id: string) {
    const queueItem = this.transferQueue.get(id);
    const transfer = this.transfers.get(id);
    if (!queueItem || !transfer || transfer.isPaused) return;

    while (queueItem.chunks.length > 0 && !transfer.isPaused) {
      const chunk = queueItem.chunks.shift();
      if (!chunk) continue;

      const now = Date.now();
      const timeDiff = now - transfer.startTime;
      const currentSpeed = transfer.bytesTransferred / (timeDiff / 1000);

      if (currentSpeed > this.RATE_LIMIT) {
        // Wait if we're exceeding rate limit
        await new Promise(resolve => setTimeout(resolve, this.CHUNK_INTERVAL));
      }

      try {
        await this.sendChunk(id, chunk.index, chunk.data, chunk.iv);
        
        // Create checkpoint every N chunks
        if (transfer.currentChunk % 10 === 0) {
          this.createCheckpoint(id);
        }
      } catch (error) {
        // On error, requeue the chunk and pause
        queueItem.chunks.unshift(chunk);
        transfer.isPaused = true;
        throw error;
      }
    }

    if (queueItem.chunks.length === 0) {
      this.transferQueue.delete(id);
      this.sendComplete(id);
    }
  }

  private async sendChunk(id: string, index: number, data: ArrayBuffer, iv: Uint8Array, retryAttempt = 0) {
    const transfer = this.transfers.get(id);
    if (!transfer) return;

    try {
      const success = await dataChannelService.sendMessage(transfer.peerId, {
        type: 'file',
        payload: {
          action: 'chunk',
          id,
          index,
          data,
          iv,
        },
      });

      if (!success) {
        throw new Error('Failed to send chunk');
      }

      // Clear retry state on successful send
      this.retryQueue.delete(`${id}-${index}`);

      transfer.currentChunk++;
      const progress = (transfer.currentChunk / transfer.chunks) * 100;
      
      this.emit('transfer:progress', {
        id,
        progress,
        currentChunk: transfer.currentChunk,
        totalChunks: transfer.chunks,
        speed: transfer.transferSpeed,
      });
    } catch (error) {
      await this.handleChunkError(id, index, data, iv, retryAttempt);
    }
  }

  private async handleChunkError(
    id: string, 
    index: number, 
    data: ArrayBuffer, 
    iv: Uint8Array, 
    retryAttempt: number
  ) {
    const transfer = this.transfers.get(id);
    if (!transfer) return;

    const retryKey = `${id}-${index}`;
    const retryState = this.retryQueue.get(retryKey) || { attempts: 0 };

    if (retryAttempt >= this.DEFAULT_RETRY_CONFIG.maxAttempts) {
      this.emit('transfer:error', {
        id,
        error: `Failed to send chunk ${index} after ${retryAttempt} attempts`,
      });
      this.cancelTransfer(id);
      return;
    }

    const delay = this.DEFAULT_RETRY_CONFIG.delayMs * 
      Math.pow(this.DEFAULT_RETRY_CONFIG.backoffFactor, retryAttempt);

    this.retryQueue.set(retryKey, {
      attempts: retryState.attempts + 1,
      timeoutId: setTimeout(async () => {
        await this.sendChunk(id, index, data, iv, retryAttempt + 1);
      }, delay),
    });

    this.emit('transfer:retry', {
      id,
      chunk: index,
      attempt: retryAttempt + 1,
      nextAttemptIn: delay,
    });
  }

  cancelTransfer(id: string) {
    const transfer = this.transfers.get(id);
    if (!transfer) return;

    // Clear all retry timeouts for this transfer
    for (const [key, { timeoutId }] of this.retryQueue.entries()) {
      if (key.startsWith(`${id}-`) && timeoutId) {
        clearTimeout(timeoutId);
      }
    }

    // Clean up transfer data
    this.transfers.delete(id);
    this.chunks.delete(id);
    this.transferQueue.delete(id);

    // Remove retry entries for this transfer
    for (const key of this.retryQueue.keys()) {
      if (key.startsWith(`${id}-`)) {
        this.retryQueue.delete(key);
      }
    }

    this.checkpoints.delete(id);
    if (transfer) {
      this.recoveryService.unregisterTransfer(transfer.peerId, id);
    }

    this.emit('transfer:cancel', { id });
  }

  private sendComplete(id: string) {
    const transfer = this.transfers.get(id);
    if (!transfer) return;

    dataChannelService.sendMessage(transfer.peerId, {
      type: 'file',
      payload: {
        action: 'complete',
        id,
      },
    });
  }

  private createCheckpoint(id: string) {
    const transfer = this.transfers.get(id);
    if (!transfer) return;

    this.checkpoints.set(id, {
      lastChunkIndex: transfer.currentChunk,
      bytesTransferred: transfer.bytesTransferred,
      timestamp: Date.now(),
    });
  }

  private async resumeTransfer(peerId: string, id: string) {
    const transfer = this.transfers.get(id);
    const checkpoint = this.checkpoints.get(id);
    if (!transfer || !checkpoint) return;

    // Reset transfer state to checkpoint
    transfer.currentChunk = checkpoint.lastChunkIndex;
    transfer.bytesTransferred = checkpoint.bytesTransferred;

    // Re-queue remaining chunks
    const queueItem = this.transferQueue.get(id);
    if (!queueItem) return;

    const remainingChunks = queueItem.chunks.filter(
      chunk => chunk.index > checkpoint.lastChunkIndex
    );

    queueItem.chunks = remainingChunks;
    transfer.isPaused = false;

    this.emit('transfer:resumed', {
      id,
      checkpoint: checkpoint.lastChunkIndex,
      remaining: remainingChunks.length,
    });

    // Resume processing
    await this.processQueue(id);
  }

  async sendFile(peerId: string, file: File, checksum: string) {
    const id = crypto.randomUUID();
    const key = await EncryptionService.generateKey();
    const keyString = await EncryptionService.exportKey(key);
    const chunks = Math.ceil(file.size / this.CHUNK_SIZE);

    // Send file start message with encryption key
    await dataChannelService.sendMessage(peerId, {
      type: 'file',
      payload: {
        action: 'start',
        id,
        name: file.name,
        size: file.size,
        type: file.type,
        checksum,
        key: keyString,
      },
    });

    const transfer: FileTransfer = {
      id,
      name: file.name,
      size: file.size,
      type: file.type,
      chunks,
      currentChunk: 0,
      checksum,
      isPaused: false,
      startTime: Date.now(),
      bytesTransferred: 0,
      transferSpeed: 0,
      peerId,
      key,
    };

    this.transfers.set(id, transfer);
    this.transferQueue.set(id, { chunks: [], isPaused: false });

    // Read and queue file chunks
    const reader = new FileReader();
    for (let i = 0; i < chunks; i++) {
      const start = i * this.CHUNK_SIZE;
      const end = Math.min(start + this.CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      const buffer = await new Promise<ArrayBuffer>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
        reader.readAsArrayBuffer(chunk);
      });

      // Encrypt chunk
      const { encrypted, iv } = await EncryptionService.encryptChunk(buffer, key);

      const queueItem = this.transferQueue.get(id);
      if (queueItem) {
        queueItem.chunks.push({ 
          index: i, 
          data: encrypted,
          iv,
        });
      }
    }

    // Register transfer with recovery service
    this.recoveryService.registerTransfer(peerId, id);

    try {
      await this.processQueue(id);
    } finally {
      this.recoveryService.unregisterTransfer(peerId, id);
    }

    return id;
  }
}

export const fileTransferService = FileTransferService.getInstance(); 