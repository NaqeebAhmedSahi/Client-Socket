import { io } from 'socket.io-client';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000' || 'https://socket-server-lyart-two.vercel.app';

const socket = io(BACKEND_URL, {
  transports: ['websocket'],
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  secure: true,
  withCredentials: true
});

export default socket;