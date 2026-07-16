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
  isAdmin: boolean;
  setUser: (user: User | null) => void;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  adminSignIn: (email: string, password: string) => Promise<{ error: string | null }>;
  adminSignOut: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const token = api.getToken();
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const adminFlag = localStorage.getItem('mahir_admin');
    setIsAdmin(adminFlag === 'true');
  }, []);

  const fetchUser = async () => {
    try {
      const response = await api.get<{ success: boolean; user: User }>('/users/me');
      if (response.success) {
        setUser(response.user);
        setIsAdmin(response.user.role === 'admin');
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      // Don't clear token on error - this was causing logout on profile update
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
        setIsAdmin(response.user.role === 'admin');
        return { error: null };
      }
      return { error: 'Login failed' };
    } catch (error: any) {
      return { error: error.message || 'Login failed' };
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const response = await api.post<{ success: boolean; token: string; user: User }>('/auth/register', { email, password, name });
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
    setIsAdmin(false);
  };

  const adminSignIn = async (email: string, password: string) => {
    try {
      const response = await api.post<{ success: boolean; token: string; user: User }>('/auth/admin/login', { email, password });
      if (response.success) {
        api.setToken(response.token);
        setUser(response.user);
        localStorage.setItem('mahir_admin', 'true');
        localStorage.setItem('mahir_admin_name', response.user.name);
        setIsAdmin(true);
        return { error: null };
      }
      return { error: 'Invalid admin credentials' };
    } catch (error: any) {
      return { error: error.message || 'Invalid admin credentials' };
    }
  };

  const adminSignOut = () => {
    localStorage.removeItem('mahir_admin');
    localStorage.removeItem('mahir_admin_name');
    setIsAdmin(false);
    signOut();
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, setUser, signIn, signUp, signOut, adminSignIn, adminSignOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
