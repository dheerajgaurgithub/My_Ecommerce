import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from './api';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin';
}

interface AuthContextType {
  admin: AdminUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  user: AdminUser | null;
  setAdmin: (admin: AdminUser | null) => void;
  adminSignIn: (email: string, password: string) => Promise<{ error: string | null }>;
  adminSignOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = api.getToken();
    if (token) {
      fetchAdmin();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchAdmin = async () => {
    try {
      const response = await api.get<{ success: boolean; user: AdminUser }>('/users/me');
      if (response.success && response.user.role === 'admin') {
        setAdmin(response.user);
      }
    } catch (error) {
      console.error('Failed to fetch admin:', error);
      api.clearToken();
    } finally {
      setLoading(false);
    }
  };

  const adminSignIn = async (email: string, password: string) => {
    try {
      const response = await api.post<{ success: boolean; token: string; user: AdminUser }>('/auth/admin/login', { email, password });
      if (response.success) {
        api.setToken(response.token);
        setAdmin(response.user);
        return { error: null };
      }
      return { error: 'Invalid admin credentials' };
    } catch (error: any) {
      return { error: error.message || 'Invalid admin credentials' };
    }
  };

  const adminSignOut = () => {
    api.clearToken();
    setAdmin(null);
  };

  const isAuthenticated = !!admin;

  return (
    <AuthContext.Provider value={{ admin, loading, isAuthenticated, user: admin, setAdmin, adminSignIn, adminSignOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
