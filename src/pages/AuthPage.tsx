import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useToast } from '../lib/toast';
import { api } from '../lib/api';

interface GoogleAuthResponse {
  success: boolean;
  url: string;
}

export function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, signUp } = useAuth();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const redirect = searchParams.get('redirect') ?? '/';

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      const response = await api.get<GoogleAuthResponse>('/google/url');
      if (response.success) {
        // Store redirect URL for callback
        sessionStorage.setItem('googleRedirect', redirect);
        // Redirect to Google OAuth
        window.location.href = response.url;
      }
    } catch (error) {
      showToast('Failed to connect to Google', 'error');
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) {
        showToast(error, 'error');
      } else {
        showToast('Welcome back!', 'success');
        navigate(redirect);
      }
    } else {
      if (password.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, name);
      if (error) {
        showToast(error, 'error');
      } else {
        showToast('Account created! You are now logged in.', 'success');
        navigate(redirect);
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-neutral-50 dark:bg-neutral-900">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="font-serif text-3xl font-bold text-neutral-900 dark:text-white">
            MAHIR <span className="text-brand-600">& FRIENDS</span>
          </Link>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">Everything You Need, Delivered Today</p>
        </div>

        <div className="card p-8">
          <h1 className="font-serif text-2xl font-bold text-neutral-900 dark:text-white mb-1">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
            {mode === 'login' ? 'Sign in to your account' : 'Join us for premium shopping'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">Full Name</label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input pl-10"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10 pr-10"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
              <ArrowRight size={18} />
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200 dark:border-neutral-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-neutral-700 dark:text-neutral-300 font-medium">
              {googleLoading ? 'Connecting...' : 'Continue with Google'}
            </span>
          </button>

          <p className="text-center text-sm text-neutral-500 dark:text-neutral-400 mt-6">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <Link to={mode === 'login' ? '/signup' : '/login'} className="text-brand-600 hover:text-brand-700 font-medium">
              {mode === 'login' ? 'Sign Up' : 'Sign In'}
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-neutral-400 mt-4">
          <Link to="/admin/login" className="hover:text-brand-600">Admin Login</Link>
        </p>
      </div>
    </div>
  );
}
