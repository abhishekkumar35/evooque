import Peer, { Instance } from 'simple-peer';
import { EventEmitter } from 'events';
import { BandwidthControl } from './bandwidth-control';
import { NetworkMonitor } from './network-monitor';
import { dataChannelService } from './data-channel';
import { qualityMonitor } from './quality-monitor';

interface PeerConnection {
  peer: Instance;
  stream: MediaStream;
}

export class PeerService extends EventEmitter {
  private peers: Map<string, PeerConnection>;
  private localStream: MediaStream | null;
  private config: RTCConfiguration;

  constructor() {
    super();
    this.peers = new Map();
    this.localStream = null;
    this.config = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        {
          urls: process.env.NEXT_PUBLIC_TURN_URL || '',
          username: process.env.NEXT_PUBLIC_TURN_USERNAME || '',
          credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL || '',
        },
      ],
    };
  }

  setLocalStream(stream: MediaStream) {
    this.localStream = stream;
  }

  createPeer(peerId: string, initiator: boolean = false): Instance {
    if (!this.localStream) {
      throw new Error('Local stream not set');
    }

    const peer = new Peer({
      initiator,
      stream: this.localStream,
      trickle: false,
      config: this.config,
    });

    this.setupPeerEvents(peer, peerId);
    this.peers.set(peerId, { peer, stream: this.localStream });

    // Create data channel if initiator
    if (initiator) {
      const pc = peer._pc as RTCPeerConnection;
      dataChannelService.createDataChannel(pc, peerId);
    }

    // Start quality monitoring
    if (this.localStream) {
      const pc = peer._pc as RTCPeerConnection;
      qualityMonitor.startMonitoring(peerId, pc, this.localStream);
    }

    return peer;
  }

  private setupPeerEvents(peer: Instance, peerId: string) {
    peer.on('signal', (signal) => {
      this.emit('signal', { peerId, signal });
    });

    peer.on('stream', (stream) => {
      this.emit('stream', { peerId, stream });
    });

    peer.on('error', (error) => {
      console.error('Peer error:', error);
      this.emit('error', { peerId, error });
      this.removePeer(peerId);
    });

    peer.on('close', () => {
      this.emit('close', { peerId });
      this.removePeer(peerId);
    });

    // Handle ICE connection state changes
    const pc = peer._pc as RTCPeerConnection;
    let lastOptimization = Date.now();

    pc.oniceconnectionstatechange = async () => {
      const state = pc.iceConnectionState;
      this.emit('iceStateChange', { peerId, state });

      if (state === 'connected') {
        // Enable simulcast when connection is established
        await BandwidthControl.enableSimulcast(pc);
      }

      if (state === 'failed' || state === 'closed') {
        this.removePeer(peerId);
      }
    };

    // Periodically optimize bandwidth based on network conditions
    const optimizationInterval = setInterval(async () => {
      if (Date.now() - lastOptimization < 5000) return; // Don't optimize more often than every 5 seconds

      try {
        const stats = await NetworkMonitor.getConnectionStats(pc);
        await BandwidthControl.optimizeBandwidth(pc, stats);
        lastOptimization = Date.now();
      } catch (error) {
        console.error('Error optimizing bandwidth:', error);
      }
    }, 5000);

    peer.on('close', () => {
      clearInterval(optimizationInterval);
    });

    // Handle incoming data channels
    pc.ondatachannel = (event) => {
      dataChannelService.handleDataChannel(event, peerId);
    };
  }

  getPeer(peerId: string): Instance | undefined {
    return this.peers.get(peerId)?.peer;
  }

  removePeer(peerId: string) {
    const connection = this.peers.get(peerId);
    if (connection) {
      connection.peer.destroy();
      this.peers.delete(peerId);
    }
    qualityMonitor.stopMonitoring(peerId);
  }

  removeAllPeers() {
    this.peers.forEach((connection) => {
      connection.peer.destroy();
    });
    this.peers.clear();
    qualityMonitor.stopAllMonitoring();
  }

  // Handle reconnection attempts
  async reconnect(peerId: string) {
    this.removePeer(peerId);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return this.createPeer(peerId, true);
  }

  // Handle media track changes
  replaceTrack(track: MediaStreamTrack, oldTrack?: MediaStreamTrack) {
    this.peers.forEach(({ peer }) => {
      const sender = (peer._pc as RTCPeerConnection)
        .getSenders()
        .find((s) => s.track === oldTrack);

      if (sender) {
        sender.replaceTrack(track);
      }
    });
  }

  // Add method to send data through data channel
  sendData(peerId: string, data: any, type: 'chat' | 'file' | 'status' = 'chat') {
    return dataChannelService.sendMessage(peerId, {
      type,
      payload: data,
    });
  }

  // Add method to broadcast data to all peers
  broadcastData(data: any, type: 'chat' | 'file' | 'status' = 'chat') {
    dataChannelService.broadcastMessage({
      type,
      payload: data,
    });
  }
} 