import { create } from 'zustand';
import axios from 'axios';
import { API_BASE_URL } from '../api/client';

export type UserRole = 'user' | 'support';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  token?: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; role?: UserRole }>;
  register: (name: string, email: string, password: string, role?: UserRole, phone?: string) => Promise<{ success: boolean; error?: string }>;
  quickLogin: (role: UserRole) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    try {
      const { useProjectStore } = require('./projectStore');
      useProjectStore.getState().clearProjects();
    } catch {}
    set({ isLoading: true, error: null });
    try {
      const cleanEmail = email.trim().toLowerCase();

      // 1. Backend orqali kirish (MongoDB dan tekshiradi va rolni aniqlaydi)
      try {
        const res = await axios.post(`${API_BASE_URL}/auth/login`, {
          email: cleanEmail,
          password,
        }, { timeout: 15000 });

        if (res.data && res.data.user) {
          const detectedRole: UserRole = res.data.user.role === 'support' || res.data.user.role === 'admin' ? 'support' : 'user';
          const authUser: AuthUser = {
            id: res.data.user.id || res.data.user._id,
            name: res.data.user.name,
            email: res.data.user.email,
            role: detectedRole,
            phone: res.data.user.phone,
            token: res.data.token,
          };
          set({
            user: authUser,
            token: res.data.token,
            isAuthenticated: true,
            isLoading: false,
          });
          return { success: true, role: detectedRole };
        }
      } catch (err: any) {
        if (err.response && err.response.data && err.response.data.message) {
          set({ isLoading: false, error: err.response.data.message });
          return { success: false, error: err.response.data.message };
        }
      }

      // 2. Oflayn rejim fallback (agar server vaqtincha aloqada bo'lmasa)
      const isSupportEmail = cleanEmail.includes('support') || cleanEmail === 'admin@termoplan.uz';
      const fallbackRole: UserRole = isSupportEmail ? 'support' : 'user';

      const fallbackUser: AuthUser = {
        id: isSupportEmail ? 'support_offline_01' : `user_${Date.now()}`,
        name: isSupportEmail ? 'Nazoratchi (Support)' : (cleanEmail.split('@')[0] || 'Loyiha Muhandisi'),
        email: cleanEmail,
        role: fallbackRole,
        token: isSupportEmail ? 'offline_support_token' : 'offline_jwt_token',
      };

      set({
        user: fallbackUser,
        token: fallbackUser.token || null,
        isAuthenticated: true,
        isLoading: false,
      });

      return { success: true, role: fallbackRole };
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Kirishda xatolik yuz berdi' });
      return { success: false, error: err.message };
    }
  },

  register: async (name: string, email: string, password: string, role: UserRole = 'user', phone?: string) => {
    try {
      const { useProjectStore } = require('./projectStore');
      useProjectStore.getState().clearProjects();
    } catch {}
    set({ isLoading: true, error: null });
    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanName = name.trim() || 'Foydalanuvchi';

      // Backend orqali ro'yxatdan o'tish (Rol bilan birga MongoDB ga yoziladi)
      try {
        const res = await axios.post(`${API_BASE_URL}/auth/register`, {
          name: cleanName,
          email: cleanEmail,
          password,
          role,
          phone,
        }, { timeout: 15000 });

        if (res.data && res.data.user) {
          const detectedRole: UserRole = res.data.user.role === 'support' || res.data.user.role === 'admin' ? 'support' : 'user';
          const authUser: AuthUser = {
            id: res.data.user.id || res.data.user._id,
            name: res.data.user.name,
            email: res.data.user.email,
            role: detectedRole,
            phone: res.data.user.phone,
            token: res.data.token,
          };
          set({
            user: authUser,
            token: res.data.token,
            isAuthenticated: true,
            isLoading: false,
          });
          return { success: true };
        }
      } catch (err: any) {
        if (err.response && err.response.data && err.response.data.message) {
          set({ isLoading: false, error: err.response.data.message });
          return { success: false, error: err.response.data.message };
        }
      }

      // Oflayn registratsiya fallback
      const newUser: AuthUser = {
        id: role === 'support' ? `support_${Date.now()}` : `user_${Date.now()}`,
        name: cleanName,
        email: cleanEmail,
        role,
        phone,
        token: 'offline_jwt_token',
      };

      set({
        user: newUser,
        token: newUser.token || null,
        isAuthenticated: true,
        isLoading: false,
      });

      return { success: true };
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Ro‘yxatdan o‘tishda xatolik' });
      return { success: false, error: err.message };
    }
  },

  quickLogin: (role: UserRole) => {
    if (role === 'support') {
      set({
        user: {
          id: 'support_ctrl_001',
          name: 'Nazoratchi (Support)',
          email: 'support@termoplan.uz',
          role: 'support',
          phone: '+998 71 200-00-01',
          token: 'quick_support_token',
        },
        token: 'quick_support_token',
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } else {
      set({
        user: {
          id: 'user_eng_001',
          name: 'Saidov Muzaffar (Muhandis)',
          email: 'user@termoplan.uz',
          role: 'user',
          phone: '+998 90 999-88-77',
          token: 'quick_user_token',
        },
        token: 'quick_user_token',
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    }
  },

  logout: () => {
    try {
      const { useProjectStore } = require('./projectStore');
      useProjectStore.getState().clearProjects();
    } catch {}
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  },
}));
