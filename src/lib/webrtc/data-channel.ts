type DataChannelMessage = {
  type: 'chat' | 'file' | 'status';
  payload: any;
};

export class DataChannelService {
  private static instance: DataChannelService;
  private channels: Map<string, RTCDataChannel> = new Map();
  private messageHandlers: Set<(message: DataChannelMessage, peerId: string) => void> = new Set();

  private constructor() {}

  static getInstance(): DataChannelService {
    if (!DataChannelService.instance) {
      DataChannelService.instance = new DataChannelService();
    }
    return DataChannelService.instance;
  }

  createDataChannel(peer: RTCPeerConnection, peerId: string) {
    try {
      const channel = peer.createDataChannel('messageChannel', {
        ordered: true,
      });

      this.setupDataChannel(channel, peerId);
      return channel;
    } catch (error) {
      console.error('Error creating data channel:', error);
      return null;
    }
  }

  handleDataChannel(event: RTCDataChannelEvent, peerId: string) {
    this.setupDataChannel(event.channel, peerId);
  }

  private setupDataChannel(channel: RTCDataChannel, peerId: string) {
    channel.onopen = () => {
      console.log(`Data channel with peer ${peerId} opened`);
      this.channels.set(peerId, channel);
    };

    channel.onclose = () => {
      console.log(`Data channel with peer ${peerId} closed`);
      this.channels.delete(peerId);
    };

    channel.onmessage = (event) => {
      try {
        const message: DataChannelMessage = JSON.parse(event.data);
        this.messageHandlers.forEach(handler => handler(message, peerId));
      } catch (error) {
        console.error('Error parsing data channel message:', error);
      }
    };
  }

  sendMessage(peerId: string, message: DataChannelMessage) {
    const channel = this.channels.get(peerId);
    if (channel?.readyState === 'open') {
      try {
        channel.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error('Error sending message:', error);
        return false;
      }
    }
    return false;
  }

  broadcastMessage(message: DataChannelMessage) {
    this.channels.forEach((channel, peerId) => {
      this.sendMessage(peerId, message);
    });
  }

  addMessageHandler(handler: (message: DataChannelMessage, peerId: string) => void) {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  getPeerConnection(peerId: string): RTCDataChannel | undefined {
    return this.channels.get(peerId);
  }

  isConnected(peerId: string): boolean {
    const channel = this.channels.get(peerId);
    return channel?.readyState === 'open';
  }

  closeChannel(peerId: string) {
    const channel = this.channels.get(peerId);
    if (channel) {
      channel.close();
      this.channels.delete(peerId);
    }
  }

  closeAllChannels() {
    this.channels.forEach(channel => channel.close());
    this.channels.clear();
  }
}

export const dataChannelService = DataChannelService.getInstance(); 