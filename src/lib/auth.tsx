import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from './api';

interface User {
  id: string;
  email: string;
  name: string;
  nickname?: string;
  profilePicture?: string;
  location?: string;
  phone?: string;
  role: 'customer' | 'admin' | 'delivery_partner';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name: string, otp?: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = api.getToken();
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const response = await api.get<{ success: boolean; user: User }>('/users/me');
      if (response.success) {
        setUser(response.user);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await api.post<{ success: boolean; token: string; user: User }>('/auth/login', { email, password });
      if (response.success) {
        api.setToken(response.token);
        setUser(response.user);
        return { error: null };
      }
      return { error: 'Login failed' };
    } catch (error: any) {
      return { error: error.message || 'Login failed' };
    }
  };

  const signUp = async (email: string, password: string, name: string, otp?: string) => {
    try {
      const response = await api.post<{ success: boolean; token: string; user: User }>('/auth/register', { email, password, name, otp });
      if (response.success) {
        api.setToken(response.token);
        setUser(response.user);
        return { error: null };
      }
      return { error: 'Registration failed' };
    } catch (error: any) {
      return { error: error.message || 'Registration failed' };
    }
  };

  const signOut = async () => {
    api.clearToken();
    setUser(null);
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  return (
    <AuthContext.Provider value={{ user, loading, setUser, signIn, signUp, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
