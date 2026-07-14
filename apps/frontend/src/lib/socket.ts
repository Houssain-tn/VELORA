import { io, Socket } from 'socket.io-client';
import Cookies from 'js-cookie';
import { useSocketStore } from '@/stores/useSocketStore';

// Use VITE_API_URL in production, otherwise fallback to current origin
const API_URL = import.meta.env.VITE_API_URL || window.location.origin;
const SOCKET_URL = API_URL.replace(/\/api\/?$/, '');

class SocketManager {
  private socket: Socket | null = null;

  connect(userId: number, companyId?: number | null) {
    if (this.socket?.connected) return this.socket;

    this.socket = io(`${SOCKET_URL}/velora`, {
      auth: {
        token: Cookies.get('token'), 
        companyId: companyId || null,
      },
      transports: ['websocket'],
    });


    this.socket.on('connect', () => {
      console.log(`✅ Websocket Connected (UserID: ${userId})`);
      // Update store state directly since setConnected doesn't exist
      useSocketStore.setState({ isConnected: true });
      
      // Join isolated namespace based on company or user context
      this.socket?.emit('join-room', { room: `user-${userId}` });
      if (companyId) this.socket?.emit('join-room', { room: `company-${companyId}` });
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Websocket Connection Error:', error);
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Websocket Disconnected');
      // Update store state directly since setConnected doesn't exist
      useSocketStore.setState({ isConnected: false });
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    return this.socket;
  }
}

export const socketManager = new SocketManager();
