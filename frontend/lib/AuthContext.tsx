'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from './api/client';

interface User {
  id: number;
  email: string;
  full_name: string;
  credits: number;
  is_admin: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, full_name: string, password: string) => Promise<void>;
  logout: () => void;
  updateCredits: (credits: number) => void;
  updateUser: (user: User) => void;  // ← YEH LINE ADD KARI
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const response = await authAPI.me();
        setUser(response.data);
      } catch (error) {
        localStorage.removeItem('access_token');
      }
    }
    setLoading(false);
  };

  const login = async (email: string, password: string) => {
    const response = await authAPI.login({ email, password });
    const { access_token, user_id, email: userEmail, credits, full_name } = response.data;
    localStorage.setItem('access_token', access_token);
    setUser({ id: user_id, email: userEmail, full_name: full_name || '', credits, is_admin: false });
  };

  const signup = async (email: string, full_name: string, password: string) => {
    const response = await authAPI.signup({ email, full_name, password });
    const { access_token, user_id, email: userEmail, credits } = response.data;
    localStorage.setItem('access_token', access_token);
    setUser({ id: user_id, email: userEmail, full_name, credits, is_admin: false });
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
  };

  const updateCredits = (credits: number) => {
    if (user) {
      setUser({ ...user, credits });
    }
  };

  // ← YEH NAYA FUNCTION HAI
  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateCredits, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
