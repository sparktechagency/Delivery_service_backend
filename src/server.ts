import http from 'http';
import app from './app';
import { Server } from 'socket.io';
import { socketHelper } from './helpers/socketHelper';

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*' },
  pingTimeout: 60000,
});

socketHelper.socket(io);

global.io = io;

const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || 'localhost';
server.listen(port, host, () => {
  console.log(`✅ Server running at http://${host}:${port}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  server.close();
});


// import app from './app'
// import { Server } from 'socket.io';
// import { socketHelper } from './helpers/socketHelper';
// import { logger } from './shared/logger';

// let server: any;
// // let io: Server;

// // Extend NodeJS.Global to include 'io'
// declare global {
//   // eslint-disable-next-line no-var
//   var io: Server;
// }

// const port = Number(process.env.PORT) || 3000;
// const host = process.env.HOST || 'localhost';
// app.listen(port, host, () => {
//   console.log(`✅ Server running at http://${host}:${port}`);
//   const io = new Server(server, {
//     cors: {
//       origin: '*',
//     },
//     pingTimeout: 60000,
//   });

//   socketHelper.socket(io);
//   //@ts-ignore
//   global.io = io;

// });
// process.on('SIGTERM', () => {
//   logger.info('SIGTERM IS RECEIVED');
//   if (server) {
//     server.close();
//   }
// });


