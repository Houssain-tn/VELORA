import { create } from 'zustand';
import { socketManager } from '@/lib/socket';
import { Socket } from 'socket.io-client';
import { useSettingsStore } from './useSettingsStore';
import api from '@/lib/api';
import { useAuthStore } from './useAuthStore';
import { toast } from '@/components/ui/Toaster';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  createdAt: string;
  read: boolean;
}

interface SocketState {
  isConnected: boolean;
  isInitialized: boolean;
  notifications: AppNotification[];
  unreadCount: number;
  lastProcessedId: string | number | null;
  connect: (userId: number, companyId?: number | null) => void;
  disconnect: () => void;
  addNotification: (notification: AppNotification) => void;
  fetchRecentNotifications: () => Promise<void>;
  syncUnreadCount: () => Promise<void>;
  markAsRead: (id: string | number) => void;
  markAllAsRead: () => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  isConnected: false,
  isInitialized: false,
  notifications: [],
  unreadCount: 0,
  lastProcessedId: null,

  connect: (userId, companyId) => {
    // If already initialized with listeners, skip adding them again
    if (get().isInitialized && get().isConnected) return;

    const socket: Socket = socketManager.connect(userId, companyId);

    // Completely detach previous listeners to be safe
    socket.off('connect');
    socket.off('disconnect');
    socket.off('notification');
    socket.off('force-logout');

    socket.on('connect', () => set({ isConnected: true, isInitialized: true }));
    socket.on('disconnect', () => set({ isConnected: false }));

    socket.on('force-logout', (data: any) => {
      toast.error(data?.message || "Votre session a été révoquée par un administrateur.");
      get().disconnect();
      useAuthStore.getState().logout();
      window.location.href = '/login';
    });

    // Listen to real-time events
    socket.on('notification', (payload: any) => {
      // 0. Deduplication Guard: Check if we already processed this exact event
      if (payload.id && get().lastProcessedId === payload.id) {
        // console.log('🛡️ Duplicate notification filtered:', payload.id);
        return;
      }

      set({ lastProcessedId: payload.id || null });

      const newNotif: AppNotification = {
        id: payload.id || Math.random().toString(36).substring(7),
        title: payload.title || 'Nouvelle Notification',
        message: payload.message,
        type: payload.type || 'INFO',
        createdAt: payload.createdAt || new Date().toISOString(),
        read: false,
      };
      
      // 1. Audio Feedback (Premium Tone)
      const { soundEnabled, pushEnabled } = useSettingsStore.getState();
      
      if (soundEnabled) {
        const audio = new Audio('/sounds/notification.mp3');
        audio.volume = 0.6;
        audio.play().catch(e => console.warn('Audio play blocked or file missing', e));
      }

      // 2. Native OS Notification (Background Support)
      if (pushEnabled && 'Notification' in window && Notification.permission === "granted") {
        new Notification("VELORA PRO", {
          body: `${newNotif.title}: ${newNotif.message}`,
          icon: '/favicon.png',
          tag: 'VELORA-notification', // Overwrite previous notification to avoid clutter
          silent: true // We use our own audio engine for better control
        });
      }

      get().addNotification(newNotif);
    });

    // Initial Sync (Badge Count + Recent History)
    get().syncUnreadCount();
    get().fetchRecentNotifications();
  },

  fetchRecentNotifications: async () => {
    try {
      const { data } = await api.get('/notifications');
      set({ notifications: data });
    } catch (e) {
      console.warn('Failed to fetch recent notifications', e);
    }
  },

  syncUnreadCount: async () => {
    try {
      const { data } = await api.get('/notifications/unread-count');
      set({ unreadCount: data.count });
    } catch (e) {
      console.warn('Failed to sync unread count', e);
    }
  },

  disconnect: () => {
    socketManager.disconnect();
    set({ isConnected: false, isInitialized: false });
  },

  addNotification: (notification) => set((state) => ({
    notifications: [notification, ...state.notifications],
    unreadCount: state.unreadCount + 1,
  })),

  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ),
    unreadCount: Math.max(0, state.unreadCount - 1),
  })),

  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, read: true })),
    unreadCount: 0,
  })),
}));
