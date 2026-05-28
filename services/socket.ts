import { io } from 'socket.io-client';

// Automatically connects to window.location.origin
// Vite dev server proxies /socket.io to backend on port 5000
export const socket = io({
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('Real-time connection established:', socket.id);
});

socket.on('disconnect', () => {
  console.log('Real-time connection lost.');
});
