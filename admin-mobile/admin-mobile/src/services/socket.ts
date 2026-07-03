import { io, Socket } from 'socket.io-client';
import { API_URL } from './api';

class SocketService {
  public socket: Socket | null = null;

  connect() {
    if (this.socket) return;
    this.socket = io(`${API_URL}/admin`, {
      transports: ['websocket'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('Connected to admin socket:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from admin socket');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

const socketService = new SocketService();
export default socketService;
