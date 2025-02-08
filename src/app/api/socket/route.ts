import { Server as NetServer } from 'http';
import { NextApiRequest } from 'next';
import { Server as ServerIO } from 'socket.io';
import { NextApiResponseServerIO } from '@/types/socket';

export const config = {
  api: {
    bodyParser: false,
  },
};

const ioHandler = (req: NextApiRequest, res: NextApiResponseServerIO) => {
  if (!res.socket.server.io) {
    const path = '/api/socket';
    const httpServer: NetServer = res.socket.server as any;
    const io = new ServerIO(httpServer, {
      path: path,
      addTrailingSlash: false,
    });

    io.on('connection', (socket) => {
      socket.on('room:join', (roomId: string) => {
        socket.join(roomId);
        socket.to(roomId).emit('user:joined', socket.id);
      });

      socket.on('signal', ({ signal, targetPeerId }) => {
        socket.to(targetPeerId).emit('signal', {
          signal,
          fromPeerId: socket.id,
        });
      });

      socket.on('disconnecting', () => {
        const rooms = Array.from(socket.rooms);
        rooms.forEach(room => {
          if (room !== socket.id) {
            socket.to(room).emit('user:left', socket.id);
          }
        });
      });
    });

    res.socket.server.io = io;
  }
  res.end();
};

export { ioHandler as GET, ioHandler as POST }; 