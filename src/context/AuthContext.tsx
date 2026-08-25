'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
  id: string;
  email: string;
  role: 'OWNER' | 'TENANT';
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, role?: 'OWNER' | 'TENANT') => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const defaultOwnerUser: User = {
  id: 'owner-demo-id',
  email: 'alok@srisaisiri.com',
  role: 'OWNER',
  name: 'Alok Sharma'
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(defaultOwnerUser);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const checkSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const login = async (email: string, password: string, role?: 'OWNER' | 'TENANT') => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUser(data.user);
        if (data.user.role === 'OWNER') {
          router.push('/owner/dashboard');
        } else {
          router.push('/tenant/dashboard');
        }
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Authentication failed' };
      }
    } catch (err: any) {
      return { success: false, error: 'Failed to connect to authentication server' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error(e);
    } finally {
      setUser(null);
      router.push('/');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkSession }}>
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
