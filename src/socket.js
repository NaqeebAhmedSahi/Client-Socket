import { io } from 'socket.io-client';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const socket = io(BACKEND_URL);

export default socket;