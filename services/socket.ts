import { io } from 'socket.io-client';

// Automatically connects to window.location.origin in dev
// In production, Vercel cannot proxy WebSockets, so we connect directly to Render
const backendUrl = import.meta.env.PROD ? 'https://gyanastu-erp.onrender.com' : undefined;

export const socket = io(backendUrl, {
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('Real-time connection established:', socket.id);
});

socket.on('disconnect', () => {
  console.log('Real-time connection lost.');
});
