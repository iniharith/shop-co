import { io, Socket } from 'socket.io-client';
import { API_URL } from './api';
import { useAuthStore } from '../store/useAuthStore';

class SocketService {
  public socket: Socket | null = null;
  private refCount = 0;
  private authToken: string | null = null;

  constructor() {
    useAuthStore.subscribe((state, previousState) => {
      if (state.token !== previousState.token) this.resetConnection();
    });
  }

  private resetConnection() {
    this.socket?.disconnect();
    this.socket = null;
    this.authToken = null;
    this.refCount = 0;
  }

  // connect() is ref-counted so multiple screens can call it without
  // stepping on each other's disconnect().
  connect() {
    const token = useAuthStore.getState().token;
    if (!token) return;

    if (this.socket && this.authToken !== token) this.resetConnection();
    this.refCount += 1;
    if (this.socket) return;
    this.authToken = token;
    this.socket = io(`${API_URL}/admin`, {
      transports: ['websocket'],
      autoConnect: true,
      auth: { token },
    });

    this.socket.on('connect', () => {
      console.log('Connected to admin socket:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from admin socket');
    });
  }

  disconnect() {
    this.refCount = Math.max(0, this.refCount - 1);
    if (this.refCount === 0 && this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.authToken = null;
    }
  }

  // Subscribe to a live event. Returns an unsubscribe function — call it
  // in your useEffect cleanup so screens don't leak listeners.
  on(event: 'order_placed' | 'new_message' | 'notification' | string, handler: (payload: any) => void) {
    this.socket?.on(event, handler);
    return () => this.socket?.off(event, handler);
  }
}

const socketService = new SocketService();
export default socketService;
