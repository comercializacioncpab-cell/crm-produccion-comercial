'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'SOLICITANTE' | 'COORDINADOR' | 'POST_PRODUCTOR' | 'PRODUCTOR_SENIOR' | 'ADMIN' | string;
  initials: string;
  phone?: string | null;
  avatar?: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  switchUserDemo: (role: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password = 'password') => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = async () => {
    await fetch('/api/auth/me', { method: 'DELETE' });
    setUser(null);
    router.push('/login');
  };

  const switchUserDemo = async (role: string) => {
    const roleEmails: Record<string, string> = {
      SOLICITANTE: 'adriana.rojas@comercial.tv',
      COORDINADOR: 'coordinacion@produccion.tv',
      POST_PRODUCTOR: 'javier.post@produccion.tv',
      ADMIN: 'admin@produccion.tv',
    };

    const targetEmail = roleEmails[role] || 'adriana.rojas@comercial.tv';
    await login(targetEmail, '123456');
    await refreshUser();
    router.refresh();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, switchUserDemo, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
