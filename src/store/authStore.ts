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

  login: (email: string, password: string, loginRole?: UserRole) => Promise<{ success: boolean; error?: string; role?: UserRole }>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<{ success: boolean; error?: string }>;
  quickLogin: (role: UserRole) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string, loginRole?: UserRole) => {
    set({ isLoading: true, error: null });
    try {
      const cleanEmail = email.trim().toLowerCase();
      const isSupportEmail = cleanEmail.includes('support') || cleanEmail === 'admin@termoplan.uz';

      // Agar foydalanuvchi "Support" sifatida kirmoqchi bo'lsa, lekin support huquqi bo'lmasa
      if (loginRole === 'support' && !isSupportEmail) {
        set({ isLoading: false, error: 'Ushbu hisob Support vakolatiga ega emas. Foydalanuvchi sifatida kiring.' });
        return {
          success: false,
          error: 'Ushbu hisob Support vakolatiga ega emas. Foydalanuvchi sifatida kiring.',
        };
      }

      // 1. Support hisobi
      if (loginRole === 'support' || (loginRole === undefined && isSupportEmail)) {
        const supportUser: AuthUser = {
          id: 'support_admin_01',
          name: 'Nazoratchi (Support)',
          email: cleanEmail || 'support@termoplan.uz',
          role: 'support',
          phone: '+998 71 200-00-01',
          token: 'mock_jwt_support_token_2026',
        };
        set({
          user: supportUser,
          token: supportUser.token || null,
          isAuthenticated: true,
          isLoading: false,
        });
        return { success: true, role: 'support' };
      }

      // 2. Oddiy foydalanuvchi - Backend orqali urinish
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
      } catch {
        // Backend oflayn bo'lsa - oflayn foydalanuvchi kirishi
      }

      // Oflayn muvaffaqiyatli foydalanuvchi kirishi
      const regularUser: AuthUser = {
        id: `user_${Date.now()}`,
        name: cleanEmail.split('@')[0] || 'Loyiha Muhandisi',
        email: cleanEmail,
        role: 'user',
        token: 'offline_jwt_token',
      };

      set({
        user: regularUser,
        token: regularUser.token || null,
        isAuthenticated: true,
        isLoading: false,
      });

      return { success: true, role: 'user' };
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Kirishda xatolik yuz berdi' });
      return { success: false, error: err.message };
    }
  },

  register: async (name: string, email: string, password: string, phone?: string) => {
    set({ isLoading: true, error: null });
    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanName = name.trim() || 'Foydalanuvchi';

      // Ro'yxatdan o'tishda har doim oddiy foydalanuvchi ('user') bo'lib ro'yxatdan o'tadi
      const role: UserRole = 'user';

      // Backend orqali urinish
      try {
        const res = await axios.post(`${API_BASE_URL}/auth/register`, {
          name: cleanName,
          email: cleanEmail,
          password,
          role,
          phone,
        }, { timeout: 15000 });

        if (res.data && res.data.user) {
          const authUser: AuthUser = {
            id: res.data.user.id || res.data.user._id,
            name: res.data.user.name,
            email: res.data.user.email,
            role: 'user',
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
      } catch {
        // Backend oflayn bo'lsa - oflayn registratsiya
      }

      const newUser: AuthUser = {
        id: `user_${Date.now()}`,
        name: cleanName,
        email: cleanEmail,
        role: 'user',
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
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  },
}));
