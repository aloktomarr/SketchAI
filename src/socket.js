import { io } from 'socket.io-client';

// Use environment variables to switch between development and production
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

export const socket = io(SOCKET_URL);