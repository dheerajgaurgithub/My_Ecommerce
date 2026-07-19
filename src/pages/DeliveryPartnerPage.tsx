import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  User, MapPin, Package, DollarSign, Clock, Settings, LogOut, Bell, XCircle,
  Moon, Sun, Power, CheckCircle2, Navigation, Wallet, TrendingUp, Phone,
  ChevronRight, CreditCard, Truck, ShieldCheck, Sparkles
} from 'lucide-react';
import { useTheme } from '../lib/theme';
import { PaymentQR } from '../components/PaymentQR';

export function DeliveryPartnerPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [ordersSubTab, setOrdersSubTab] = useState('available');
  const [partnerData, setPartnerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPaymentQR, setShowPaymentQR] = useState(false);
  const [paymentFeeType, setPaymentFeeType] = useState<'joining' | 'renewal'>('joining');

  useEffect(() => {
    fetchPartnerData();
    fetchNotifications();
    
    // Handle URL parameters for tab navigation
    const tab = searchParams.get('tab');
    const subtab = searchParams.get('subtab');
    if (tab) {
      setActiveTab(tab);
      if (tab === 'orders' && subtab) {
        setOrdersSubTab(subtab);
      }
    }
  }, [searchParams]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:5000/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setNotifications(data.data || []);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    }
  };

  const toggleOnlineStatus = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const newStatus = !isOnline;
      
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          await fetch('http://localhost:5000/api/delivery-partners/online-status', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              isOnline: newStatus,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            })
          });
          setIsOnline(newStatus);
        });
      } else {
        setIsOnline(newStatus);
      }
    } catch (error) {
      console.error('Error toggling online status:', error);
    }
  };

  const fetchPartnerData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        // Not logged in, show login prompt
        setPartnerData(null);
        setLoading(false);
        return;
      }

      console.log('Fetching profile with token:', token);
      const response = await fetch('http://localhost:5000/api/delivery-partners/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('Profile response:', data);
      console.log('Response status:', response.status);
      if (data.success) {
        setPartnerData(data.data);
      } else {
        // Not registered as delivery partner or auth error
        console.error('Profile fetch failed:', data.message);
        setPartnerData(null);
      }
    } catch (error) {
      console.error('Error fetching partner data:', error);
      setPartnerData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    navigate('/delivery-partner/login');
  };

  const payJoiningFee = () => {
    setPaymentFeeType('joining');
    setShowPaymentQR(true);
  };

  const handleJoiningFeeSuccess = () => {
    setShowPaymentQR(false);
    fetchPartnerData();
  };

  const payRenewalFee = () => {
    setPaymentFeeType('renewal');
    setShowPaymentQR(true);
  };

  const handleRenewalFeeSuccess = () => {
    setShowPaymentQR(false);
    fetchPartnerData();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-14 w-14">
            <div className="absolute inset-0 rounded-full border-4 border-brand-100 dark:border-neutral-800"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-brand-500 animate-spin"></div>
          </div>
          <p className="text-sm font-medium text-neutral-400 tracking-wide">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  // Show login prompt if not logged in
  if (!partnerData) {
    const token = localStorage.getItem('auth_token');
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-neutral-50 to-brand-50/40 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900 flex items-center justify-center px-4">
        <div className="bg-white dark:bg-neutral-800 rounded-3xl p-8 shadow-xl shadow-neutral-200/60 dark:shadow-black/40 ring-1 ring-neutral-100 dark:ring-neutral-700/60 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
              <Truck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight mb-2">Delivery Partner Portal</h1>
            <p className="text-neutral-500 dark:text-neutral-400 mb-4 leading-relaxed">
              {token ? 'You are logged in but not registered as a delivery partner.' : 'Log in to reach your delivery partner dashboard.'}
            </p>
            {token && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 mb-4 text-left flex gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  If you have already registered, please contact support. Otherwise, register as a delivery partner first.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {token ? (
              <button
                onClick={() => {
                  localStorage.removeItem('auth_token');
                  window.location.reload();
                }}
                className="btn-primary w-full rounded-xl py-3 font-semibold shadow-md shadow-brand-500/20 hover:shadow-lg hover:shadow-brand-500/30 transition-all active:scale-[0.98]"
              >
                Logout and Register
              </button>
            ) : (
              <button
                onClick={() => navigate('/delivery-partner/login')}
                className="btn-primary w-full rounded-xl py-3 font-semibold shadow-md shadow-brand-500/20 hover:shadow-lg hover:shadow-brand-500/30 transition-all active:scale-[0.98]"
              >
                Login
              </button>
            )}
            <button
              onClick={() => navigate('/delivery-partner/register')}
              className="btn-secondary w-full rounded-xl py-3 font-semibold transition-all active:scale-[0.98]"
            >
              Register as Delivery Partner
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show status-based messages
  if (partnerData.status === 'pending') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-neutral-50 to-amber-50/40 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900 flex items-center justify-center px-4">
        <div className="bg-white dark:bg-neutral-800 rounded-3xl p-8 shadow-xl shadow-neutral-200/60 dark:shadow-black/40 ring-1 ring-neutral-100 dark:ring-neutral-700/60 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight mb-2">Registration Pending</h1>
            <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Your registration is under review. Please wait for admin approval — we'll notify you as soon as it's decided.
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="btn-secondary w-full rounded-xl py-3 font-semibold"
          >
            Back to Store
          </button>
        </div>
      </div>
    );
  }

  if (partnerData.status === 'approved') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-neutral-50 to-emerald-50/40 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900 flex items-center justify-center px-4">
        <div className="bg-white dark:bg-neutral-800 rounded-3xl p-8 shadow-xl shadow-neutral-200/60 dark:shadow-black/40 ring-1 ring-neutral-100 dark:ring-neutral-700/60 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight mb-2">You're Approved!</h1>
            <p className="text-neutral-500 dark:text-neutral-400 mb-5 leading-relaxed">
              Pay the one-time joining fee to activate your account and start accepting orders.
            </p>
            <div className="bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-700 dark:to-neutral-700/60 rounded-2xl p-5 mb-2 ring-1 ring-neutral-100 dark:ring-neutral-600">
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-400 mb-1">Joining Fee</p>
              <p className="text-3xl font-bold tracking-tight">₹{partnerData.joiningFee?.amount || 500}</p>
            </div>
          </div>
          <button
            onClick={payJoiningFee}
            className="btn-primary w-full rounded-xl py-3 font-semibold shadow-md shadow-brand-500/20 hover:shadow-lg hover:shadow-brand-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            Pay Joining Fee
          </button>
        </div>
      </div>
    );
  }

  // Check if renewal fee is due
  if (partnerData.status === 'active' && partnerData.renewalFee?.nextDueDate && new Date(partnerData.renewalFee.nextDueDate) < new Date()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-neutral-50 to-orange-50/40 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900 flex items-center justify-center px-4">
        <div className="bg-white dark:bg-neutral-800 rounded-3xl p-8 shadow-xl shadow-neutral-200/60 dark:shadow-black/40 ring-1 ring-neutral-100 dark:ring-neutral-700/60 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight mb-2">Renewal Fee Due</h1>
            <p className="text-neutral-500 dark:text-neutral-400 mb-5 leading-relaxed">
              Your renewal fee is due. Pay to continue working as a delivery partner.
            </p>
            <div className="bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-700 dark:to-neutral-700/60 rounded-2xl p-5 mb-2 ring-1 ring-neutral-100 dark:ring-neutral-600">
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-400 mb-1">Renewal Fee</p>
              <p className="text-3xl font-bold tracking-tight">₹{partnerData.renewalFee?.amount || 200}</p>
              <p className="text-xs text-neutral-400 mt-1">Valid for 30 days</p>
            </div>
          </div>
          <button
            onClick={payRenewalFee}
            className="btn-primary w-full rounded-xl py-3 font-semibold shadow-md shadow-brand-500/20 hover:shadow-lg hover:shadow-brand-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            Pay Renewal Fee
          </button>
        </div>
      </div>
    );
  }

  if (partnerData.status === 'rejected') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-neutral-50 to-red-50/40 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900 flex items-center justify-center px-4">
        <div className="bg-white dark:bg-neutral-800 rounded-3xl p-8 shadow-xl shadow-neutral-200/60 dark:shadow-black/40 ring-1 ring-neutral-100 dark:ring-neutral-700/60 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-red-400 to-red-500 flex items-center justify-center shadow-lg shadow-red-500/30">
              <XCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight mb-2">Registration Rejected</h1>
            <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
              {partnerData.rejectionReason || 'Your registration was rejected. Please contact support for more information.'}
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="btn-secondary w-full rounded-xl py-3 font-semibold"
          >
            Back to Store
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <header className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-neutral-100 dark:border-neutral-800">
        <div className="container-responsive py-2.5 sm:py-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Selfie Display */}
              {partnerData?.kycDetails?.selfie ? (
                <img 
                  src={partnerData.kycDetails.selfie} 
                  alt="Profile" 
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-brand-500 ring-offset-2 ring-offset-white dark:ring-offset-neutral-900"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-semibold ring-2 ring-brand-500 ring-offset-2 ring-offset-white dark:ring-offset-neutral-900">
                  {(partnerData?.personalDetails?.fullName || 'P').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="hidden sm:block">
                <h1 className="text-base sm:text-lg font-bold tracking-tight leading-tight">Delivery Partner</h1>
                <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                  {partnerData?.personalDetails?.fullName || 'Partner'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Online/Offline Toggle */}
              <button
                onClick={toggleOnlineStatus}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all active:scale-[0.97] ${
                  isOnline
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'
                }`}
              >
                <span className="relative flex h-2 w-2">
                  {isOnline && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>}
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${isOnline ? 'bg-white' : 'bg-neutral-400'}`}></span>
                </span>
                <Power className="w-4 h-4" />
                <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
              </button>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
              >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full relative transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-neutral-900">
                      {notifications.length}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-neutral-800 rounded-2xl shadow-xl shadow-neutral-300/30 dark:shadow-black/40 border border-neutral-100 dark:border-neutral-700 max-h-96 overflow-y-auto">
                    <div className="p-4 border-b border-neutral-100 dark:border-neutral-700">
                      <h3 className="font-semibold">Notifications</h3>
                    </div>
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-neutral-400 dark:text-neutral-500">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">No notifications</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-neutral-100 dark:divide-neutral-700">
                        {notifications.map((notification) => (
                          <div key={notification._id} className="p-4 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
                            <p className="text-sm font-semibold">{notification.title}</p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{notification.message}</p>
                            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-2">
                              {new Date(notification.createdAt).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="p-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 rounded-full transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container-responsive py-4 sm:py-6">
        <div className="grid lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-neutral-800 rounded-2xl p-2.5 sm:p-3 shadow-sm ring-1 ring-neutral-100 dark:ring-neutral-700/60 sticky top-20 sm:top-24">
              <nav className="space-y-1">
                {[
                  { key: 'dashboard', label: 'Dashboard', icon: TrendingUp },
                  { key: 'profile', label: 'Profile', icon: User },
                  { key: 'orders', label: 'Orders', icon: Package },
                  { key: 'earnings', label: 'Earnings', icon: DollarSign },
                  { key: 'payouts', label: 'Payouts', icon: Wallet },
                  { key: 'settings', label: 'Settings', icon: Settings },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                      activeTab === key
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-md'
                        : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px]" />
                    {label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'dashboard' && <DashboardContent partnerData={partnerData} />}
            {activeTab === 'profile' && <ProfileContent partnerData={partnerData} />}
            {activeTab === 'orders' && <OrdersContent initialSubTab={ordersSubTab} />}
            {activeTab === 'earnings' && <EarningsContent />}
            {activeTab === 'payouts' && <PayoutsContent />}
            {activeTab === 'settings' && <SettingsContent partnerData={partnerData} />}
          </div>
        </div>
      </div>

      {/* Payment QR Modal */}
      {showPaymentQR && (
        <PaymentQR
          feeType={paymentFeeType}
          amount={paymentFeeType === 'joining' ? (partnerData?.joiningFee?.amount || 500) : (partnerData?.renewalFee?.amount || 200)}
          onSuccess={paymentFeeType === 'joining' ? handleJoiningFeeSuccess : handleRenewalFeeSuccess}
          onCancel={() => setShowPaymentQR(false)}
        />
      )}
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-400 mb-1">{label}</p>
      <p className="font-semibold text-neutral-800 dark:text-neutral-100">{value ?? 'N/A'}</p>
    </div>
  );
}

function SectionCard({ title, children, icon: Icon }: { title: string; children: React.ReactNode; icon?: any }) {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm ring-1 ring-neutral-100 dark:ring-neutral-700/60">
      <h3 className="text-base font-bold tracking-tight mb-4 flex items-center gap-2">
        {Icon && <Icon className="w-[18px] h-[18px] text-brand-500" />}
        {title}
      </h3>
      {children}
    </div>
  );
}

function ProfileContent({ partnerData }: { partnerData: any }) {
  const [editingEmergency, setEditingEmergency] = useState(false);
  const [emergencyForm, setEmergencyForm] = useState({
    name: partnerData?.emergencyContact?.name || '',
    relationship: partnerData?.emergencyContact?.relationship || '',
    contactNumber: partnerData?.emergencyContact?.contactNumber || ''
  });

  const handleEmergencyUpdate = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:5000/api/delivery-partners/emergency-contact', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(emergencyForm)
      });
      const data = await response.json();
      if (data.success) {
        alert('Emergency contact updated successfully');
        setEditingEmergency(false);
        // Refresh partner data
        window.location.reload();
      } else {
        alert(data.message || 'Failed to update emergency contact');
      }
    } catch (error) {
      alert('Error updating emergency contact');
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-neutral-900 to-neutral-700 dark:from-neutral-800 dark:to-neutral-900 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-brand-500/20 rounded-full blur-2xl"></div>
        <div className="flex items-center gap-4 sm:gap-6 relative">
          {partnerData?.kycDetails?.selfie ? (
            <img 
              src={partnerData.kycDetails.selfie} 
              alt="Profile" 
              className="w-24 h-24 rounded-2xl object-cover ring-4 ring-white/20"
            />
          ) : (
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/10 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold ring-4 ring-white/20">
              {(partnerData?.personalDetails?.fullName || 'P').charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{partnerData?.personalDetails?.fullName || 'N/A'}</h2>
            <p className="text-neutral-300 text-sm mt-1">{partnerData?.personalDetails?.email || 'N/A'}</p>
            <p className="text-neutral-300 text-sm flex items-center gap-1.5 mt-0.5">
              <Phone className="w-3.5 h-3.5" />
              {partnerData?.personalDetails?.contactNumber || 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Personal Details */}
      <SectionCard title="Personal Details" icon={User}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <InfoField label="Full Name" value={partnerData?.personalDetails?.fullName} />
          <InfoField label="Email" value={partnerData?.personalDetails?.email} />
          <InfoField label="Contact Number" value={partnerData?.personalDetails?.contactNumber} />
          <InfoField label="Date of Birth" value={partnerData?.personalDetails?.dateOfBirth ? new Date(partnerData.personalDetails.dateOfBirth).toLocaleDateString() : 'N/A'} />
          <InfoField label="Gender" value={partnerData?.personalDetails?.gender ? partnerData.personalDetails.gender.charAt(0).toUpperCase() + partnerData.personalDetails.gender.slice(1) : 'N/A'} />
        </div>
      </SectionCard>

      {/* KYC Details */}
      <SectionCard title="KYC Details" icon={ShieldCheck}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <InfoField label="Aadhar Number" value={partnerData?.kycDetails?.aadharNumber} />
          <InfoField label="PAN Number" value={partnerData?.kycDetails?.panNumber} />
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-400 mb-1">KYC Status</p>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
              partnerData?.kycDetails?.kycStatus === 'approved'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
            }`}>
              {partnerData?.kycDetails?.kycStatus === 'approved' && <CheckCircle2 className="w-3.5 h-3.5" />}
              {partnerData?.kycDetails?.kycStatus || 'N/A'}
            </span>
          </div>
          {partnerData?.kycDetails?.verifiedAt && (
            <InfoField label="Verified At" value={new Date(partnerData.kycDetails.verifiedAt).toLocaleString()} />
          )}
        </div>
      </SectionCard>

      {/* Vehicle Details */}
      <SectionCard title="Vehicle Details" icon={Truck}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <InfoField label="Vehicle Type" value={partnerData?.vehicleDetails?.vehicleType ? partnerData.vehicleDetails.vehicleType.charAt(0).toUpperCase() + partnerData.vehicleDetails.vehicleType.slice(1) : 'N/A'} />
          <InfoField label="Vehicle Number" value={partnerData?.vehicleDetails?.vehicleNumber} />
          <InfoField label="Vehicle Model" value={partnerData?.vehicleDetails?.vehicleModel} />
          <InfoField label="Vehicle Color" value={partnerData?.vehicleDetails?.vehicleColor} />
        </div>
      </SectionCard>

      {/* Address */}
      <SectionCard title="Address" icon={MapPin}>
        <div className="space-y-4">
          <InfoField label="Street" value={partnerData?.address?.street} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <InfoField label="City" value={partnerData?.address?.city} />
            <InfoField label="State" value={partnerData?.address?.state} />
            <InfoField label="Pincode" value={partnerData?.address?.pincode} />
            <InfoField label="Landmark" value={partnerData?.address?.landmark} />
          </div>
        </div>
      </SectionCard>

      {/* Bank Details */}
      <SectionCard title="Bank Details" icon={CreditCard}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <InfoField label="Account Number" value={partnerData?.bankDetails?.accountNumber} />
          <InfoField label="Account Holder Name" value={partnerData?.bankDetails?.accountHolderName} />
          <InfoField label="IFSC Code" value={partnerData?.bankDetails?.ifscCode} />
          <InfoField label="Bank Name" value={partnerData?.bankDetails?.bankName} />
        </div>
      </SectionCard>

      {/* Emergency Contact */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm ring-1 ring-neutral-100 dark:ring-neutral-700/60">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold tracking-tight">Emergency Contact</h3>
          {!editingEmergency && (
            <button
              onClick={() => setEditingEmergency(true)}
              className="text-sm text-brand-600 hover:text-brand-700 font-semibold transition-colors"
            >
              Edit
            </button>
          )}
        </div>
        
        {editingEmergency ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Name</label>
              <input
                type="text"
                value={emergencyForm.name}
                onChange={(e) => setEmergencyForm({...emergencyForm, name: e.target.value})}
                className="input rounded-xl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Relationship</label>
              <input
                type="text"
                value={emergencyForm.relationship}
                onChange={(e) => setEmergencyForm({...emergencyForm, relationship: e.target.value})}
                className="input rounded-xl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Contact Number</label>
              <input
                type="text"
                value={emergencyForm.contactNumber}
                onChange={(e) => setEmergencyForm({...emergencyForm, contactNumber: e.target.value})}
                className="input rounded-xl"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleEmergencyUpdate}
                className="btn-primary rounded-xl font-semibold"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setEditingEmergency(false);
                  setEmergencyForm({
                    name: partnerData?.emergencyContact?.name || '',
                    relationship: partnerData?.emergencyContact?.relationship || '',
                    contactNumber: partnerData?.emergencyContact?.contactNumber || ''
                  });
                }}
                className="btn-secondary rounded-xl font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <InfoField label="Name" value={partnerData?.emergencyContact?.name} />
            <InfoField label="Relationship" value={partnerData?.emergencyContact?.relationship} />
            <InfoField label="Contact Number" value={partnerData?.emergencyContact?.contactNumber} />
          </div>
        )}
      </div>

      {/* Account Status */}
      <SectionCard title="Account Status">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <InfoField label="Status" value={partnerData?.status ? partnerData.status.charAt(0).toUpperCase() + partnerData.status.slice(1) : 'N/A'} />
          <InfoField label="Registration Date" value={partnerData?.createdAt ? new Date(partnerData.createdAt).toLocaleString() : 'N/A'} />
          <InfoField label="Total Deliveries" value={partnerData?.workDetails?.totalDeliveries || 0} />
          <InfoField label="Total Earnings" value={`₹${partnerData?.workDetails?.totalEarnings || 0}`} />
        </div>
      </SectionCard>
    </div>
  );
}

function DashboardContent({ partnerData }: { partnerData: any }) {
  const daysUntilRenewal = partnerData?.renewalFee?.nextDueDate
    ? Math.ceil((new Date(partnerData.renewalFee.nextDueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm ring-1 ring-neutral-100 dark:ring-neutral-700/60 relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-3">
            <Package className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">Today's Orders</p>
          <p className="text-3xl font-bold tracking-tight">0</p>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm ring-1 ring-neutral-100 dark:ring-neutral-700/60 relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mb-3">
            <DollarSign className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">Today's Earnings</p>
          <p className="text-3xl font-bold tracking-tight">₹0</p>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm ring-1 ring-neutral-100 dark:ring-neutral-700/60 relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center mb-3">
            <Clock className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">Total Deliveries</p>
          <p className="text-3xl font-bold tracking-tight">{partnerData?.workDetails?.totalDeliveries || 0}</p>
        </div>
      </div>

      {/* Account Status */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm ring-1 ring-neutral-100 dark:ring-neutral-700/60">
        <h2 className="text-base font-bold tracking-tight mb-4">Account Status</h2>
        <div className="flex items-center gap-3 flex-wrap">
          <div className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold ${
            partnerData?.status === 'active'
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
              : partnerData?.status === 'pending'
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
              : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
          }`}>
            {partnerData?.status === 'active' && <CheckCircle2 className="w-4 h-4" />}
            {partnerData?.status?.toUpperCase() || 'PENDING'}
          </div>
          <span className="text-sm text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            {partnerData?.kycDetails?.kycStatus === 'approved'
              ? 'KYC Verified'
              : partnerData?.kycDetails?.kycStatus === 'pending'
              ? 'KYC Pending'
              : 'KYC Required'}
          </span>
        </div>
      </div>

      {/* Renewal Fee Status */}
      {partnerData?.renewalFee?.nextDueDate && (
        <div className={`bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm ring-1 ${
          daysUntilRenewal !== null && daysUntilRenewal <= 5 ? 'ring-orange-300 dark:ring-orange-700' : 'ring-neutral-100 dark:ring-neutral-700/60'
        }`}>
          <h2 className="text-base font-bold tracking-tight mb-4">Renewal Fee Status</h2>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">Next Due Date</p>
              <p className="text-lg font-bold tracking-tight">
                {new Date(partnerData.renewalFee.nextDueDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </p>
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-bold ${
              daysUntilRenewal !== null && daysUntilRenewal <= 5
                ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
            }`}>
              {daysUntilRenewal !== null && daysUntilRenewal > 0
                ? `${daysUntilRenewal} days left`
                : daysUntilRenewal === 0
                ? 'Due today'
                : 'Overdue'}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm ring-1 ring-neutral-100 dark:ring-neutral-700/60">
        <h2 className="text-base font-bold tracking-tight mb-4">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <button 
            onClick={() => navigate('/delivery-partner?tab=orders&subtab=available')}
            className="flex items-center gap-3 p-4 border border-neutral-100 dark:border-neutral-700 rounded-xl hover:border-brand-300 hover:bg-brand-50/50 dark:hover:bg-neutral-700/40 transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-blue-500" />
            </div>
            <span className="font-medium text-sm">View Available Orders</span>
            <ChevronRight className="w-4 h-4 text-neutral-300 ml-auto group-hover:translate-x-0.5 transition-transform" />
          </button>
          <button 
            onClick={() => navigate('/delivery-partner?tab=orders&subtab=active')}
            className="flex items-center gap-3 p-4 border border-neutral-100 dark:border-neutral-700 rounded-xl hover:border-brand-300 hover:bg-brand-50/50 dark:hover:bg-neutral-700/40 transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5 text-emerald-500" />
            </div>
            <span className="font-medium text-sm">Active Deliveries</span>
            <ChevronRight className="w-4 h-4 text-neutral-300 ml-auto group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}

function OrdersContent({ initialSubTab = 'available' }: { initialSubTab?: string }) {
  const [activeTab, setActiveTab] = useState(initialSubTab);
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialSubTab) {
      setActiveTab(initialSubTab);
    }
    fetchAvailableOrders();
    fetchActiveOrders();
  }, [initialSubTab]);

  const fetchAvailableOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const response = await fetch(
            `http://localhost:5000/api/delivery-partners/available-orders?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const data = await response.json();
          if (data.success) {
            setAvailableOrders(data.data);
          }
        });
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveOrders = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:5000/api/delivery-partners/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setActiveOrders(data.orders);
      }
    } catch (error) {
      console.error('Error fetching active orders:', error);
    }
  };

  const acceptOrder = async (orderId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:5000/api/delivery-partners/accept-order/${orderId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        fetchAvailableOrders();
        fetchActiveOrders();
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('Error accepting order');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-1 bg-white dark:bg-neutral-800 rounded-xl p-1 ring-1 ring-neutral-100 dark:ring-neutral-700/60 w-fit">
        <button
          onClick={() => setActiveTab('available')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'available'
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-100'
          }`}
        >
          Available Orders
        </button>
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'active'
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-100'
          }`}
        >
          Active Deliveries ({activeOrders.length})
        </button>
      </div>

      {activeTab === 'available' && (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-16">
              <div className="relative h-10 w-10 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-brand-100 dark:border-neutral-700"></div>
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-brand-500 animate-spin"></div>
              </div>
            </div>
          ) : availableOrders.length === 0 ? (
            <div className="bg-white dark:bg-neutral-800 rounded-2xl p-10 text-center ring-1 ring-neutral-100 dark:ring-neutral-700/60">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-neutral-50 dark:bg-neutral-700 flex items-center justify-center">
                <Package className="w-7 h-7 text-neutral-300 dark:text-neutral-500" />
              </div>
              <p className="text-neutral-500 dark:text-neutral-400 font-medium">No orders available nearby</p>
              <p className="text-neutral-400 dark:text-neutral-500 text-sm mt-1">New orders will show up here as soon as they're placed</p>
              <button
                onClick={fetchAvailableOrders}
                className="mt-5 btn-primary rounded-xl font-semibold"
              >
                Refresh
              </button>
            </div>
          ) : (
            availableOrders.map((order) => (
              <OrderCard key={order._id} order={order} onAccept={() => acceptOrder(order._id)} />
            ))
          )}
        </div>
      )}

      {activeTab === 'active' && (
        <div className="space-y-4">
          {activeOrders.length === 0 ? (
            <div className="bg-white dark:bg-neutral-800 rounded-2xl p-10 text-center ring-1 ring-neutral-100 dark:ring-neutral-700/60">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-neutral-50 dark:bg-neutral-700 flex items-center justify-center">
                <Truck className="w-7 h-7 text-neutral-300 dark:text-neutral-500" />
              </div>
              <p className="text-neutral-500 dark:text-neutral-400 font-medium">No active deliveries</p>
              <p className="text-neutral-400 dark:text-neutral-500 text-sm mt-1">Accept an order to start your next delivery</p>
            </div>
          ) : (
            activeOrders.map((order) => (
              <ActiveOrderCard key={order._id} order={order} onUpdate={fetchActiveOrders} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function OrderCard({ order, onAccept }: { order: any; onAccept: () => void }) {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm ring-1 ring-neutral-100 dark:ring-neutral-700/60 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold tracking-tight">Order #{order._id?.slice(-6)}</h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-emerald-600 tracking-tight">₹{order.delivery?.fee || 0}</p>
          <p className="text-xs text-neutral-400">Delivery Fee</p>
        </div>
      </div>

      {/* Route */}
      <div className="mb-4 pl-1">
        <div className="flex gap-3">
          <div className="flex flex-col items-center pt-1">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
            <div className="w-px flex-1 my-1 border-l-2 border-dashed border-neutral-200 dark:border-neutral-600"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
          </div>
          <div className="flex-1 space-y-4 pb-1">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Pickup</p>
              <p className="text-sm text-neutral-700 dark:text-neutral-300">{order.storeAddress || 'Store Address'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Delivery</p>
              <p className="text-sm text-neutral-700 dark:text-neutral-300">{order.shippingAddress?.address || 'Customer Address'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-neutral-700">
        <div className="text-sm text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
          <Navigation className="w-4 h-4" />
          <span className="font-semibold text-neutral-700 dark:text-neutral-200">{order.delivery?.distance || 0} km</span> away
        </div>
        <button
          onClick={onAccept}
          className="btn-primary rounded-xl font-semibold px-5"
        >
          Accept Order
        </button>
      </div>
    </div>
  );
}

function ActiveOrderCard({ order, onUpdate }: { order: any; onUpdate: () => void }) {
  const [updating, setUpdating] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpType, setOtpType] = useState<'pickup' | 'delivery'>('pickup');

  const updateStatus = async (status: string, otp?: string) => {
    try {
      setUpdating(true);
      const token = localStorage.getItem('auth_token');
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const body: any = {
            status,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          if (otp) {
            body.otp = otp;
            body.otpType = otpType;
          }
          await fetch(`http://localhost:5000/api/delivery-partners/order-status/${order._id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(body)
          });
          onUpdate();
          setShowOtpInput(false);
          setOtpInput('');
        });
      }
    } catch (error) {
      alert('Error updating status');
    } finally {
      setUpdating(false);
    }
  };

  const handleStatusUpdate = (nextStatus: string) => {
    // OTP verification required for pickup and delivery
    if (nextStatus === 'reached_store' || nextStatus === 'delivered') {
      setOtpType(nextStatus === 'reached_store' ? 'pickup' : 'delivery');
      setShowOtpInput(true);
    } else {
      updateStatus(nextStatus);
    }
  };

  const verifyOtpAndProceed = () => {
    const expectedOtp = otpType === 'pickup' ? order.delivery?.pickupOTP : order.delivery?.deliveryOTP;
    if (otpInput === expectedOtp) {
      const nextStatus = otpType === 'pickup' ? 'reached_store' : 'delivered';
      updateStatus(nextStatus, otpInput);
    } else {
      alert('Invalid OTP. Please try again.');
    }
  };

  const statusSteps = [
    { key: 'out_for_delivery', label: 'Reached Store', requiresOtp: true },
    { key: 'reached_store', label: 'Picked Up', requiresOtp: false },
    { key: 'picked_up', label: 'In Transit', requiresOtp: false },
    { key: 'in_transit', label: 'Delivered', requiresOtp: true }
  ];

  const currentStepIndex = statusSteps.findIndex(step => step.key === order.status);

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm ring-1 ring-neutral-100 dark:ring-neutral-700/60">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold tracking-tight">Order #{order.order_number?.slice(-6)}</h3>
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mt-2 ${
            order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
          }`}>
            {order.status === 'delivered' && <CheckCircle2 className="w-3.5 h-3.5" />}
            {order.status.replace('_', ' ').toUpperCase()}
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-emerald-600 tracking-tight">₹{order.total || 0}</p>
          <p className="text-xs text-neutral-400">Order Amount</p>
        </div>
      </div>

      {/* Order Items */}
      <div className="mb-5 p-4 bg-neutral-50 dark:bg-neutral-700/50 rounded-xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">Items</p>
        {order.items?.map((item: any, i: number) => (
          <div key={i} className="flex justify-between text-sm mb-1 last:mb-0">
            <span className="text-neutral-600 dark:text-neutral-300">{item.product_name} <span className="text-neutral-400">×{item.quantity}</span></span>
            <span className="font-medium">₹{item.price * item.quantity}</span>
          </div>
        ))}
      </div>

      {/* Progress Steps */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          {statusSteps.map((step, index) => (
            <div key={step.key} className="flex items-center flex-1 last:flex-initial">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                  index <= currentStepIndex
                    ? 'bg-emerald-500 text-white'
                    : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-400 dark:text-neutral-500'
                }`}
              >
                {index < currentStepIndex ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
              </div>
              {index < statusSteps.length - 1 && (
                <div
                  className={`h-1 flex-1 mx-1 rounded-full transition-colors ${
                    index < currentStepIndex ? 'bg-emerald-500' : 'bg-neutral-100 dark:bg-neutral-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-[11px] font-medium text-neutral-400">
          {statusSteps.map((step) => (
            <span key={step.key} className="w-16 text-center">{step.label}</span>
          ))}
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50/60 dark:bg-blue-900/10">
          <MapPin className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">Pickup OTP: <span className="font-mono text-blue-600 dark:text-blue-400">{order.delivery?.pickupOTP}</span></p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{order.delivery?.storeAddress}</p>
            <p className="text-xs text-neutral-400 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" /> {order.delivery?.storeContact}</p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-900/10">
          <MapPin className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">Delivery OTP: <span className="font-mono text-emerald-600 dark:text-emerald-400">{order.delivery?.deliveryOTP}</span></p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {order.address_snapshot?.address_line}, {order.address_snapshot?.city}, {order.address_snapshot?.state} - {order.address_snapshot?.pincode}
            </p>
          </div>
        </div>
      </div>

      {order.status !== 'delivered' && (
        <div className="pt-4 border-t border-neutral-100 dark:border-neutral-700">
          <button
            onClick={() => handleStatusUpdate(statusSteps[currentStepIndex + 1]?.key)}
            disabled={updating}
            className="btn-primary w-full rounded-xl font-semibold disabled:opacity-60"
          >
            {updating ? 'Updating...' : statusSteps[currentStepIndex + 1]?.label || 'Complete Delivery'}
          </button>
        </div>
      )}

      {/* OTP Verification Modal */}
      {showOtpInput && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-neutral-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold tracking-tight mb-3">
              {otpType === 'pickup' ? 'Verify Pickup OTP' : 'Verify Delivery OTP'}
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4 leading-relaxed">
              {otpType === 'pickup'
                ? `Enter the pickup OTP provided by the store: ${order.delivery?.pickupOTP}`
                : `Enter the delivery OTP provided by the customer: ${order.delivery?.deliveryOTP}`}
            </p>
            <input
              type="text"
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value)}
              placeholder="Enter OTP"
              className="input w-full mb-4 rounded-xl text-center text-lg font-mono tracking-[0.3em]"
              maxLength={6}
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowOtpInput(false);
                  setOtpInput('');
                }}
                className="btn-secondary flex-1 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={verifyOtpAndProceed}
                disabled={updating || otpInput.length === 0}
                className="btn-primary flex-1 rounded-xl font-semibold disabled:opacity-60"
              >
                {updating ? 'Verifying...' : 'Verify & Proceed'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EarningsContent() {
  const [earnings, setEarnings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:5000/api/delivery-partners/earnings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setEarnings(data.data);
      }
    } catch (error) {
      console.error('Error fetching earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm ring-1 ring-neutral-100 dark:ring-neutral-700/60">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-neutral-100 dark:bg-neutral-700 rounded-lg"></div>
          <div className="h-16 bg-neutral-100 dark:bg-neutral-700 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 shadow-sm shadow-emerald-500/20 text-white">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mb-3">
            <Wallet className="w-[18px] h-[18px]" />
          </div>
          <p className="text-sm text-emerald-50 mb-1">Total Earnings</p>
          <p className="text-3xl font-bold tracking-tight">₹{earnings?.totalEarnings || 0}</p>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm ring-1 ring-neutral-100 dark:ring-neutral-700/60">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-3">
            <Package className="w-[18px] h-[18px] text-blue-500" />
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">Total Orders</p>
          <p className="text-3xl font-bold tracking-tight">{earnings?.totalOrders || 0}</p>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm ring-1 ring-neutral-100 dark:ring-neutral-700/60">
          <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center mb-3">
            <TrendingUp className="w-[18px] h-[18px] text-purple-500" />
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">Average per Order</p>
          <p className="text-3xl font-bold tracking-tight">₹{earnings?.averagePerOrder?.toFixed(2) || 0}</p>
        </div>
      </div>
    </div>
  );
}

function PayoutsContent() {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayouts();
  }, []);

  const fetchPayouts = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:5000/api/delivery-partners/payouts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setPayouts(data.data);
      }
    } catch (error) {
      console.error('Error fetching payouts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm ring-1 ring-neutral-100 dark:ring-neutral-700/60">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-neutral-100 dark:bg-neutral-700 rounded-lg"></div>
          <div className="h-16 bg-neutral-100 dark:bg-neutral-700 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm ring-1 ring-neutral-100 dark:ring-neutral-700/60">
        <h2 className="text-base font-bold tracking-tight mb-4">Payout History</h2>
        {payouts.length === 0 ? (
          <div className="text-center py-8">
            <Wallet className="w-10 h-10 mx-auto mb-3 text-neutral-200 dark:text-neutral-600" />
            <p className="text-neutral-400 text-sm">No payouts yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payouts.map((payout) => (
              <div key={payout._id} className="border border-neutral-100 dark:border-neutral-700 rounded-xl p-4 hover:bg-neutral-50/60 dark:hover:bg-neutral-700/30 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-lg tracking-tight">₹{payout.summary?.netAmount || 0}</p>
                    <p className="text-sm text-neutral-400">
                      {new Date(payout.payoutPeriod?.startDate).toLocaleDateString()} - {new Date(payout.payoutPeriod?.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                    payout.status === 'paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' :
                    payout.status === 'processing' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
                    'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                  }`}>
                    {payout.status.toUpperCase()}
                  </div>
                </div>
                <div className="text-sm text-neutral-400">
                  {payout.summary?.totalOrders || 0} orders • {payout.payoutFrequency}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsContent({ partnerData }: { partnerData: any }) {
  const [payoutFrequency, setPayoutFrequency] = useState(partnerData?.payoutSettings?.payoutFrequency || 'weekly');
  const [payoutDay, setPayoutDay] = useState(partnerData?.payoutSettings?.payoutDay || 1);
  const [upiId, setUpiId] = useState(partnerData?.payoutSettings?.upiId || '');
  const [saving, setSaving] = useState(false);

  const savePayoutSettings = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:5000/api/delivery-partners/payout-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          payoutFrequency,
          payoutDay,
          upiId
        })
      });
      const data = await response.json();
      if (data.success) {
        alert('Payout settings saved successfully');
      } else {
        alert(data.message || 'Failed to save settings');
      }
    } catch (error) {
      alert('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionCard title="Payout Settings" icon={Wallet}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Payout Frequency</label>
            <select
              value={payoutFrequency}
              onChange={(e) => setPayoutFrequency(e.target.value)}
              className="input rounded-xl"
            >
              <option value="daily">Daily (24 hours)</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {payoutFrequency === 'weekly' && (
            <div>
              <label className="block text-sm font-medium mb-1.5">Payout Day</label>
              <select
                value={payoutDay}
                onChange={(e) => setPayoutDay(parseInt(e.target.value))}
                className="input rounded-xl"
              >
                <option value={1}>Monday</option>
                <option value={2}>Tuesday</option>
                <option value={3}>Wednesday</option>
                <option value={4}>Thursday</option>
                <option value={5}>Friday</option>
                <option value={6}>Saturday</option>
                <option value={7}>Sunday</option>
              </select>
            </div>
          )}

          {payoutFrequency === 'monthly' && (
            <div>
              <label className="block text-sm font-medium mb-1.5">Payout Day</label>
              <select
                value={payoutDay}
                onChange={(e) => setPayoutDay(parseInt(e.target.value))}
                className="input rounded-xl"
              >
                {[...Array(28)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}{i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5">UPI ID (Optional)</label>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="input rounded-xl"
              placeholder="yourname@upi"
            />
          </div>

          <button
            onClick={savePayoutSettings}
            disabled={saving}
            className="btn-primary rounded-xl font-semibold disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Profile Information" icon={User}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Full Name</label>
            <input
              type="text"
              defaultValue={partnerData?.personalDetails?.fullName}
              className="input rounded-xl opacity-60 cursor-not-allowed"
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Contact Number</label>
            <input
              type="tel"
              defaultValue={partnerData?.personalDetails?.contactNumber}
              className="input rounded-xl opacity-60 cursor-not-allowed"
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input
              type="email"
              defaultValue={partnerData?.personalDetails?.email}
              className="input rounded-xl opacity-60 cursor-not-allowed"
              disabled
            />
          </div>
          <p className="text-sm text-neutral-400">
            Contact support to update profile information
          </p>
        </div>
      </SectionCard>

      <SectionCard title="Vehicle Information" icon={Truck}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Vehicle Type</label>
              <input
                type="text"
                defaultValue={partnerData?.vehicleDetails?.vehicleType}
                className="input rounded-xl opacity-60 cursor-not-allowed"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Vehicle Number</label>
              <input
                type="text"
                defaultValue={partnerData?.vehicleDetails?.vehicleNumber}
                className="input rounded-xl opacity-60 cursor-not-allowed"
                disabled
              />
            </div>
          </div>
          <p className="text-sm text-neutral-400">
            Contact support to update vehicle information
          </p>
        </div>
      </SectionCard>
    </div>
  );
}