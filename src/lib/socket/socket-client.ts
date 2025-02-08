import { Socket, io as socketIO } from 'socket.io-client';
import { Message } from '@/types';
import { useRoomStore } from '@/store/useRoomStore';

class SocketClient {
  private static instance: SocketClient;
  private socket: Socket | null = null;

  private constructor() {}

  static getInstance(): SocketClient {
    if (!SocketClient.instance) {
      SocketClient.instance = new SocketClient();
    }
    return SocketClient.instance;
  }

  connect(): Socket {
    if (!this.socket) {
      this.socket = socketIO(process.env.NEXT_PUBLIC_SOCKET_URL || '', {
        transports: ['websocket'],
        autoConnect: true,
      });

      this.socket.on('connect', () => {
        console.log('Socket connected:', this.socket?.id);
      });

      this.socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      this.socket.on('file-message', async ({ message }: { message: Message }) => {
        if (message.type === 'file' && message.file) {
          const { addMessage } = useRoomStore.getState();
          addMessage({
            ...message,
            file: {
              ...message.file,
              data: new Uint8Array(message.file.data).buffer,
            },
          });
        }
      });
    }
    return this.socket;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketClient = SocketClient.getInstance(); 