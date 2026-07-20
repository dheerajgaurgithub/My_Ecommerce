import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { api } from './api';

interface DeliveryPartner {
  _id: string;
  personalDetails: {
    fullName: string;
    contactNumber: string;
    email: string;
    address: string;
  };
  vehicleDetails: {
    vehicleType: string;
    vehicleNumber: string;
  };
  workDetails: {
    isOnline: boolean;
    totalDeliveries: number;
    rating: number;
  };
  status: string;
}

interface AuthContextType {
  user: DeliveryPartner | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (data: any) => Promise<{ error?: string }>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DeliveryPartner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = api.getToken();
    if (token) {
      try {
        const response = await api.get<{ success: boolean; data?: any }>('/delivery-partners/profile');
        if (response.success && response.data) {
          setUser(response.data);
        }
      } catch (error) {
        api.clearToken();
      }
    }
    setLoading(false);
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await api.post<{ success: boolean; token?: string; user?: any }>('/delivery-partners/login', { email, password });
      if (response.success && response.token) {
        api.setToken(response.token);
        setUser(response.user);
        return {};
      }
      return { error: 'Login failed' };
    } catch (error: any) {
      return { error: error.message || 'Login failed' };
    }
  };

  const signUp = async (data: any) => {
    try {
      const response = await api.post<{ success: boolean; message?: string; data?: any }>('/delivery-partners/register', data);
      if (response.success) {
        return {};
      }
      return { error: response.message || 'Registration failed' };
    } catch (error: any) {
      return { error: error.message || 'Registration failed' };
    }
  };

  const signOut = () => {
    api.clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
