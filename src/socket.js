import { io } from 'socket.io-client';

// Use environment variables to switch between development and production
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

// Create socket with proper configuration
const socket = io(SOCKET_URL, {
  reconnectionDelayMax: 10000,
  reconnection: true,
  reconnectionAttempts: 10,
  transports: ['websocket', 'polling'],
  autoConnect: true,
  withCredentials: true
});

// Add connection event listeners for debugging
socket.on('connect', () => {
  console.log('Socket connected:', socket.id);
});

socket.on('connect_error', (err) => {
  console.error('Socket connection error:', err.message);
  // Log additional details that might help diagnose CORS issues
  console.error('Connection URL:', SOCKET_URL);
});

socket.on('disconnect', (reason) => {
  console.log('Socket disconnected:', reason);
});

export { socket };