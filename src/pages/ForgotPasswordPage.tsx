import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowLeft, RefreshCw, CheckCircle, ArrowRight } from 'lucide-react';
import { useToast } from '../lib/toast';
import { api } from '../lib/api';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<'email' | 'otp' | 'password'>('email');
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!email) {
      showToast('Please enter your email address', 'error');
      return;
    }
    try {
      setOtpLoading(true);
      const response = await api.post<{ success: boolean; message?: string }>('/otp/forgot-password/send', { email });
      if (response.success) {
        setStep('otp');
        showToast('OTP sent to your email', 'success');
      } else {
        showToast(response.message || 'Failed to send OTP', 'error');
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to send OTP', 'error');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      showToast('Please enter a valid 6-digit OTP', 'error');
      return;
    }
    try {
      setOtpLoading(true);
      const response = await api.post<{ success: boolean; message?: string }>('/otp/forgot-password/verify', { email, otp });
      if (response.success) {
        setStep('password');
        showToast('OTP verified successfully', 'success');
      } else {
        showToast(response.message || 'Invalid OTP', 'error');
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to verify OTP', 'error');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setResendLoading(true);
      const response = await api.post<{ success: boolean; message?: string }>('/otp/forgot-password/send', { email });
      if (response.success) {
        showToast('OTP resent to your email', 'success');
      } else {
        showToast(response.message || 'Failed to resend OTP', 'error');
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to resend OTP', 'error');
    } finally {
      setResendLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    try {
      setLoading(true);
      const response = await api.post<{ success: boolean; message?: string }>('/auth/reset-password', { email, otp, newPassword });
      if (response.success) {
        showToast('Password reset successfully! Please login with your new password.', 'success');
        navigate('/login');
      } else {
        showToast(response.message || 'Failed to reset password', 'error');
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to reset password', 'error');
    } finally {
      setLoading(false);
    }
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
          <div className="mb-6">
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Login
            </button>
          </div>

          <h1 className="font-serif text-2xl font-bold text-neutral-900 dark:text-white mb-1">
            Reset Password
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
            {step === 'email' && 'Enter your email to receive a verification code'}
            {step === 'otp' && 'Enter the verification code sent to your email'}
            {step === 'password' && 'Create your new password'}
          </p>

          {step === 'email' && (
            <div className="space-y-4">
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
              <button
                onClick={handleSendOtp}
                disabled={otpLoading}
                className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {otpLoading ? 'Sending...' : 'Send Verification Code'}
                <ArrowRight size={18} />
              </button>
            </div>
          )}

          {step === 'otp' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">Verification Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="input flex-1"
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                  />
                  <button
                    onClick={handleVerifyOtp}
                    disabled={otpLoading}
                    className="btn-primary px-4 disabled:opacity-50"
                  >
                    {otpLoading ? 'Verifying...' : 'Verify'}
                  </button>
                </div>
                <button
                  onClick={handleResendOtp}
                  disabled={resendLoading}
                  className="mt-2 text-sm text-neutral-600 hover:text-neutral-700 flex items-center gap-1 disabled:opacity-50"
                >
                  <RefreshCw size={14} className={resendLoading ? 'animate-spin' : ''} />
                  {resendLoading ? 'Resending...' : 'Resend Code'}
                </button>
              </div>
            </div>
          )}

          {step === 'password' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">New Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input pl-10 pr-10"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
                    {showPassword ? <Lock size={18} /> : <Lock size={18} />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Password'}
                <CheckCircle size={18} />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
