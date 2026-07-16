import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useToast } from '../lib/toast';
import { api } from '../lib/api';

interface GoogleCallbackResponse {
  success: boolean;
  token?: string;
  user?: any;
  isNewUser?: boolean;
  message?: string;
}

export function GoogleCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    const handleGoogleCallback = async () => {
      const code = searchParams.get('code');
      const redirect = sessionStorage.getItem('googleRedirect') || '/';

      if (!code) {
        showToast('Google authentication failed', 'error');
        navigate('/login');
        return;
      }

      try {
        const response: GoogleCallbackResponse = await api.post<GoogleCallbackResponse>('/google/callback', { code });

        if (response.success) {
          if (response.token) {
            api.setToken(response.token);
          }
          setUser(response.user);
          showToast(response.isNewUser ? 'Account created successfully!' : 'Welcome back!', 'success');
          navigate(redirect);
        } else {
          showToast(response.message || 'Google authentication failed', 'error');
          navigate('/login');
        }
      } catch (error) {
        showToast('Failed to authenticate with Google', 'error');
        navigate('/login');
      } finally {
        sessionStorage.removeItem('googleRedirect');
      }
    };

    handleGoogleCallback();
  }, [searchParams, navigate, setUser, showToast]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 bg-neutral-50 dark:bg-neutral-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto mb-4"></div>
        <p className="text-neutral-600 dark:text-neutral-400">Authenticating with Google...</p>
      </div>
    </div>
  );
}
