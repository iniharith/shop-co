import { create } from 'zustand';
import socketService from '../services/socket';

interface SyncState {
  orders: any[];
  isConnected: boolean;
  initSync: () => void;
  stopSync: () => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  orders: [],
  isConnected: false,
  initSync: () => {
    socketService.connect();
    
    if (socketService.socket) {
      socketService.socket.on('connect', () => set({ isConnected: true }));
      socketService.socket.on('disconnect', () => set({ isConnected: false }));
      
      socketService.socket.on('order-updated', (data) => {
        set((state) => {
          const newOrders = state.orders.map(o => o.id === data.id ? data : o);
          return { orders: newOrders };
        });
      });
    }
  },
  stopSync: () => {
    socketService.disconnect();
    set({ isConnected: false });
  },
}));
