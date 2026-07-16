import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Truck, ArrowRight } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useToast } from '../lib/toast';

export function DeliveryPartnerLoginPage() {
  const navigate = useNavigate();
  const { signIn, user, signOut } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginAttempted, setLoginAttempted] = useState(false);

  useEffect(() => {
    console.log('useEffect triggered', { loginAttempted, user });
    if (loginAttempted && user) {
      console.log('User found:', user);
      if (user.role === 'delivery_partner') {
        showToast('Welcome back!', 'success');
        navigate('/delivery-partner');
      } else {
        showToast('This is the delivery partner login. Please use the regular login for your account.', 'error');
        signOut();
      }
      setLoginAttempted(false);
    }
  }, [user, loginAttempted, navigate, showToast, signOut]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Clear any existing token first to ensure fresh login
    localStorage.removeItem('auth_token');
    
    const { error } = await signIn(email, password);
    if (error) {
      showToast(error, 'error');
      setLoading(false);
    } else {
      // Verify user is a delivery partner before redirecting
      const token = localStorage.getItem('auth_token');
      console.log('Token after login:', token);
      
      if (!token) {
        showToast('Login failed - no token received', 'error');
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch('http://localhost:5000/api/delivery-partners/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        console.log('Profile check:', data);
        console.log('Response status:', response.status);
        
        if (data.success) {
          showToast('Welcome back!', 'success');
          navigate('/delivery-partner');
        } else {
          console.error('Profile check failed:', data.message);
          if (response.status === 401) {
            showToast('Authentication failed. Please try logging in again.', 'error');
            await signOut();
          } else if (response.status === 403) {
            showToast('You are not registered as a delivery partner. Please register first.', 'error');
            await signOut();
            navigate('/delivery-partner/register');
          } else {
            showToast('Error verifying delivery partner status: ' + data.message, 'error');
            await signOut();
          }
        }
      } catch (err) {
        console.error('Profile check failed:', err);
        showToast('Error verifying delivery partner status. Please try again.', 'error');
        await signOut();
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-neutral-900 dark:to-neutral-800 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <Truck className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-neutral-900 dark:text-white mb-2">
            Delivery Partner Portal
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Log in to manage your deliveries
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="your@email.com"
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
              {loading ? 'Please wait...' : 'Sign In'}
              <ArrowRight size={18} />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700 space-y-3">
            <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
              New delivery partner?
            </p>
            <button
              onClick={() => navigate('/delivery-partner/register')}
              className="w-full btn-secondary"
            >
              Register as Delivery Partner
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-neutral-400 mt-4">
          <button onClick={() => navigate('/login')} className="hover:text-blue-600">
            Customer Login
          </button>
        </p>
      </div>
    </div>
  );
}
