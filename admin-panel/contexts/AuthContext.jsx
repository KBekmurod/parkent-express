'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/api';
import { getToken, setToken, removeToken, getUser, setUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    const savedUser = getUser();
    
    if (token && savedUser) {
      setUserState(savedUser);
    }
    
    setLoading(false);
  }, []);

  const login = async (telegramId, password) => {
    try {
      const response = await api.post('/api/auth/admin/login', {
        telegram_id: telegramId,
        password: password,
      });

      const { token, user } = response.data;
      
      setToken(token);
      setUser(user);
      setUserState(user);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed',
      };
    }
  };

  const logout = () => {
    removeToken();
    setUserState(null);
    router.push('/login');
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}
