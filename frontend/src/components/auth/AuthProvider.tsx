'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';

type User = {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: string;
};

type StudioSettings = {
  studioName: string;
  ownerName: string;
  mobile: string;
  email: string;
  address: string;
  logoUrl?: string;
};

type AuthContextType = {
  user: User | null;
  studioSettings: StudioSettings | null;
  loading: boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  studioSettings: null,
  loading: true,
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [studioSettings, setStudioSettings] = useState<StudioSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await apiRequest<{
          success: boolean;
          user: User;
          studioSettings: StudioSettings;
        }>('/auth/me');

        if (response.success && response.user) {
          setUser(response.user);
          setStudioSettings(response.studioSettings);
        } else {
          throw new Error('Not authenticated');
        }
      } catch (err) {
        // If fetch fails (e.g. 401 Unauthorized), redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    const token = localStorage.getItem('accessToken');
    if (token) {
      void fetchUser();
    } else {
      router.push('/login');
    }
  }, [router]);

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setUser(null);
    setStudioSettings(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, studioSettings, loading, logout }}>
      {loading ? (
        <div className="flex h-screen items-center justify-center bg-slate-50">
          <div className="text-sm text-slate-500">Loading...</div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
