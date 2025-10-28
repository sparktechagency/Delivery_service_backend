import colors from 'colors';
import { Server, Socket } from 'socket.io';
import { logger } from '../shared/logger';

const socket = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    logger.info(colors.blue(`A user connected, socket id: ${socket.id}`));

    // Listen for 'join' event from client to join their userId room
    socket.on('join', (userId: string) => {
      if (userId) {
        socket.join(userId);
        logger.info(colors.green(`Socket ${socket.id} joined room ${userId}`));
      }
    });

    // disconnect
    socket.on('disconnect', () => {
      logger.info(colors.red(`A user disconnected, socket id: ${socket.id}`));
    });
  });
};

export const socketHelper = { socket };
