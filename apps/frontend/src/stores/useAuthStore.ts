import { create } from 'zustand';
import Cookies from 'js-cookie';
import axios from 'axios';

export interface TenantAccess {
  tenantId: number;
  role: string;
  tenant: {
    name: string;
  };
}

export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  companyId: number | null;
  tenantAccess?: TenantAccess[];
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  simulatedRole: string | null;
  login: (token: string, refreshToken: string, user: User) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
  refreshToken: (token: string) => void;
  simulateRole: (role: string | null) => void;
  activeTenantId: number | null;
  setActiveTenant: (id: number | null) => void;
}

const getStoredUser = (): User | null => {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: !!Cookies.get('token'),
  user: getStoredUser(),
  simulatedRole: null,
  activeTenantId: localStorage.getItem('velora_tenant_id') ? parseInt(localStorage.getItem('velora_tenant_id')!) : null,

  checkAuth: async () => {
    const token = Cookies.get('token');
    if (!token) {
      // No token at all — clear state immediately
      set({ isAuthenticated: false, user: null, simulatedRole: null });
      return;
    }

    try {
      // Validate token server-side by calling /api/auth/me
      const API_URL = import.meta.env.VITE_API_URL || '/api';
      const { data: freshUser } = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Update stored user with fresh data from server
      localStorage.setItem('user', JSON.stringify(freshUser));
      set({ isAuthenticated: true, user: freshUser });
    } catch {
      // Token is invalid, expired, or revoked — clear everything
      Cookies.remove('token', { path: '/' });
      Cookies.remove('refresh_token', { path: '/' });
      localStorage.removeItem('user');
      set({ isAuthenticated: false, user: null, simulatedRole: null });
    }
  },

  login: (token, refreshToken, user) => {
    // Set accessToken cookie (short lived — matches backend 15m expiration)
    Cookies.set('token', token, {
      expires: 1/96,
      path: '/',
      sameSite: 'lax'
    });
    // Set refreshToken cookie (long lived)
    Cookies.set('refresh_token', refreshToken, {
      expires: 7,
      path: '/',
      sameSite: 'lax'
    });
    localStorage.setItem('user', JSON.stringify(user));
    set({ isAuthenticated: true, user, simulatedRole: null });
  },

  logout: () => {
    Cookies.remove('token', { path: '/' });
    Cookies.remove('refresh_token', { path: '/' });
    localStorage.removeItem('user');
    set({ isAuthenticated: false, user: null, simulatedRole: null });
  },

  refreshToken: (token) => {
    Cookies.set('token', token, {
      expires: 1/96,
      path: '/',
      sameSite: 'lax'
    });
  },

  simulateRole: (role) => set({ simulatedRole: role }),

  setActiveTenant: (id) => {
    if (id) {
      localStorage.setItem('velora_tenant_id', id.toString());
    } else {
      localStorage.removeItem('velora_tenant_id');
    }
    set({ activeTenantId: id });
    // Force a reload to clear React Query cache across the app
    window.location.reload();
  },
}));

