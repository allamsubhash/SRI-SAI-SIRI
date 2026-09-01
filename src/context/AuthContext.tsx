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
  login: (email: string, password: string, role?: 'OWNER' | 'TENANT', rememberDevice?: boolean) => Promise<{ success: boolean; user?: User; error?: string }>;
  registerOwner: (name: string, email: string, password: string, ownerKey: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const checkSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error(error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const login = async (email: string, password: string, role?: 'OWNER' | 'TENANT', rememberDevice: boolean = true) => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const savedHash = typeof window !== 'undefined' ? (localStorage.getItem(`pwd_hash_${cleanEmail}`) || '') : '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (savedHash) {
        headers['X-Saved-Pwd-Hash'] = savedHash;
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers,
        body: JSON.stringify({ email, password, role, rememberDevice })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUser(data.user);
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.error || 'Authentication failed' };
      }
    } catch (err: any) {
      return { success: false, error: 'Failed to connect to authentication server' };
    }
  };

  const registerOwner = async (name: string, email: string, password: string, ownerKey: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, ownerKey, role: 'OWNER' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUser(data.user);
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.error || 'Owner registration failed' };
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
      if (typeof window !== 'undefined') {
        sessionStorage.clear();
      }
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, registerOwner, logout, checkSession }}>
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
