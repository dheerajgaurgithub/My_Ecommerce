import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, MapPin, Package, DollarSign, Clock, Settings, LogOut, Bell, XCircle, Moon, Sun, Power } from 'lucide-react';
import { useTheme } from '../lib/theme';

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

  const payJoiningFee = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:5000/api/delivery-partners/pay-joining-fee', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ paymentId: 'simulated_payment_' + Date.now() })
      });
      const data = await response.json();
      if (data.success) {
        alert('Payment successful! You can now start working.');
        fetchPartnerData();
      } else {
        alert(data.message || 'Payment failed');
      }
    } catch (error) {
      alert('Error processing payment');
    }
  };

  const payRenewalFee = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:5000/api/delivery-partners/pay-renewal-fee', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ paymentId: 'simulated_renewal_payment_' + Date.now() })
      });
      const data = await response.json();
      if (data.success) {
        alert('Renewal payment successful! Your account is active for another 30 days.');
        fetchPartnerData();
      } else {
        alert(data.message || 'Payment failed');
      }
    } catch (error) {
      alert('Error processing payment');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900"></div>
      </div>
    );
  }

  // Show login prompt if not logged in
  if (!partnerData) {
    const token = localStorage.getItem('auth_token');
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-8 shadow-sm max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <User className="w-16 h-16 mx-auto mb-4 text-neutral-400" />
            <h1 className="text-2xl font-bold mb-2">Delivery Partner Portal</h1>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              {token ? 'You are logged in but not registered as a delivery partner.' : 'Please login to access your delivery partner dashboard.'}
            </p>
            {token && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  If you have already registered, please contact support. Otherwise, register as a delivery partner first.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {token ? (
              <button
                onClick={() => {
                  localStorage.removeItem('auth_token');
                  window.location.reload();
                }}
                className="btn-primary w-full"
              >
                Logout and Register
              </button>
            ) : (
              <button
                onClick={() => navigate('/delivery-partner/login')}
                className="btn-primary w-full"
              >
                Login
              </button>
            )}
            <button
              onClick={() => navigate('/delivery-partner/register')}
              className="btn-secondary w-full"
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
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-8 shadow-sm max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <Clock className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
            <h1 className="text-2xl font-bold mb-2">Registration Pending</h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              Your registration is under review. Please wait for admin approval.
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="btn-secondary w-full"
          >
            Back to Store
          </button>
        </div>
      </div>
    );
  }

  if (partnerData.status === 'approved') {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-8 shadow-sm max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <DollarSign className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h1 className="text-2xl font-bold mb-2">Congratulations! You're Approved</h1>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              Your registration has been approved. Pay the joining fee to start working.
            </p>
            <div className="bg-neutral-100 dark:bg-neutral-700 rounded-xl p-4 mb-4">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Joining Fee</p>
              <p className="text-2xl font-bold">₹{partnerData.joiningFee?.amount || 500}</p>
            </div>
          </div>
          <button
            onClick={payJoiningFee}
            className="btn-primary w-full"
          >
            Pay Joining Fee
          </button>
        </div>
      </div>
    );
  }

  // Check if renewal fee is due
  if (partnerData.status === 'active' && partnerData.renewalFee?.nextDueDate && new Date(partnerData.renewalFee.nextDueDate) < new Date()) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-8 shadow-sm max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <Clock className="w-16 h-16 mx-auto mb-4 text-orange-500" />
            <h1 className="text-2xl font-bold mb-2">Renewal Fee Due</h1>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              Your renewal fee is due. Pay to continue working as a delivery partner.
            </p>
            <div className="bg-neutral-100 dark:bg-neutral-700 rounded-xl p-4 mb-4">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Renewal Fee</p>
              <p className="text-2xl font-bold">₹{partnerData.renewalFee?.amount || 200}</p>
              <p className="text-xs text-neutral-500 mt-1">Valid for 30 days</p>
            </div>
          </div>
          <button
            onClick={payRenewalFee}
            className="btn-primary w-full"
          >
            Pay Renewal Fee
          </button>
        </div>
      </div>
    );
  }

  if (partnerData.status === 'rejected') {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-8 shadow-sm max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h1 className="text-2xl font-bold mb-2">Registration Rejected</h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              {partnerData.rejectionReason || 'Your registration was rejected. Please contact support for more information.'}
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="btn-secondary w-full"
          >
            Back to Store
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Header */}
      <header className="bg-white dark:bg-neutral-800 shadow-sm sticky top-0 z-50">
        <div className="container-responsive py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Selfie Display */}
              {partnerData?.kycDetails?.selfie && (
                <img 
                  src={partnerData.kycDetails.selfie} 
                  alt="Profile" 
                  className="w-12 h-12 rounded-full object-cover border-2 border-brand-500"
                />
              )}
              <div>
                <h1 className="text-xl font-bold">Delivery Partner</h1>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {partnerData?.personalDetails?.fullName || 'Partner'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Online/Offline Toggle */}
              <button
                onClick={toggleOnlineStatus}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  isOnline
                    ? 'bg-green-500 text-white'
                    : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                <Power className="w-4 h-4" />
                <span className="text-sm font-medium">{isOnline ? 'Online' : 'Offline'}</span>
              </button>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg"
              >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg relative"
                >
                  <Bell className="w-5 h-5" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 max-h-96 overflow-y-auto">
                    <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
                      <h3 className="font-semibold">Notifications</h3>
                    </div>
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-neutral-500 dark:text-neutral-400">
                        No notifications
                      </div>
                    ) : (
                      <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
                        {notifications.map((notification) => (
                          <div key={notification._id} className="p-4 hover:bg-neutral-50 dark:hover:bg-neutral-700">
                            <p className="text-sm font-medium">{notification.title}</p>
                            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">{notification.message}</p>
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
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container-responsive py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-neutral-800 rounded-2xl p-4 shadow-sm sticky top-24">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === 'dashboard'
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-700'
                  }`}
                >
                  <User className="w-5 h-5" />
                  Dashboard
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === 'profile'
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-700'
                  }`}
                >
                  <User className="w-5 h-5" />
                  Profile
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === 'orders'
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-700'
                  }`}
                >
                  <Package className="w-5 h-5" />
                  Orders
                </button>
                <button
                  onClick={() => setActiveTab('earnings')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === 'earnings'
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-700'
                  }`}
                >
                  <DollarSign className="w-5 h-5" />
                  Earnings
                </button>
                <button
                  onClick={() => setActiveTab('payouts')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === 'payouts'
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-700'
                  }`}
                >
                  <Clock className="w-5 h-5" />
                  Payouts
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === 'settings'
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-700'
                  }`}
                >
                  <Settings className="w-5 h-5" />
                  Settings
                </button>
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
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-6">
          {partnerData?.kycDetails?.selfie && (
            <img 
              src={partnerData.kycDetails.selfie} 
              alt="Profile" 
              className="w-24 h-24 rounded-full object-cover border-4 border-brand-500"
            />
          )}
          <div>
            <h2 className="text-2xl font-bold">{partnerData?.personalDetails?.fullName || 'N/A'}</h2>
            <p className="text-neutral-600 dark:text-neutral-400">{partnerData?.personalDetails?.email || 'N/A'}</p>
            <p className="text-neutral-600 dark:text-neutral-400">{partnerData?.personalDetails?.contactNumber || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Personal Details */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Personal Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Full Name</p>
            <p className="font-medium">{partnerData?.personalDetails?.fullName || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Email</p>
            <p className="font-medium">{partnerData?.personalDetails?.email || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Contact Number</p>
            <p className="font-medium">{partnerData?.personalDetails?.contactNumber || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Date of Birth</p>
            <p className="font-medium">{partnerData?.personalDetails?.dateOfBirth ? new Date(partnerData.personalDetails.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Gender</p>
            <p className="font-medium capitalize">{partnerData?.personalDetails?.gender || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* KYC Details */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">KYC Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Aadhar Number</p>
            <p className="font-medium">{partnerData?.kycDetails?.aadharNumber || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">PAN Number</p>
            <p className="font-medium">{partnerData?.kycDetails?.panNumber || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">KYC Status</p>
            <p className="font-medium capitalize">{partnerData?.kycDetails?.kycStatus || 'N/A'}</p>
          </div>
          {partnerData?.kycDetails?.verifiedAt && (
            <div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Verified At</p>
              <p className="font-medium">{new Date(partnerData.kycDetails.verifiedAt).toLocaleString()}</p>
            </div>
          )}
        </div>
      </div>

      {/* Vehicle Details */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Vehicle Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Vehicle Type</p>
            <p className="font-medium capitalize">{partnerData?.vehicleDetails?.vehicleType || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Vehicle Number</p>
            <p className="font-medium">{partnerData?.vehicleDetails?.vehicleNumber || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Vehicle Model</p>
            <p className="font-medium">{partnerData?.vehicleDetails?.vehicleModel || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Vehicle Color</p>
            <p className="font-medium">{partnerData?.vehicleDetails?.vehicleColor || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Address</h3>
        <div className="space-y-2">
          <div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Street</p>
            <p className="font-medium">{partnerData?.address?.street || 'N/A'}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">City</p>
              <p className="font-medium">{partnerData?.address?.city || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">State</p>
              <p className="font-medium">{partnerData?.address?.state || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Pincode</p>
              <p className="font-medium">{partnerData?.address?.pincode || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Landmark</p>
              <p className="font-medium">{partnerData?.address?.landmark || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bank Details */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Bank Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Account Number</p>
            <p className="font-medium">{partnerData?.bankDetails?.accountNumber || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Account Holder Name</p>
            <p className="font-medium">{partnerData?.bankDetails?.accountHolderName || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">IFSC Code</p>
            <p className="font-medium">{partnerData?.bankDetails?.ifscCode || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Bank Name</p>
            <p className="font-medium">{partnerData?.bankDetails?.bankName || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Emergency Contact</h3>
          {!editingEmergency && (
            <button
              onClick={() => setEditingEmergency(true)}
              className="text-sm text-brand-600 hover:text-brand-700 font-medium"
            >
              Edit
            </button>
          )}
        </div>
        
        {editingEmergency ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={emergencyForm.name}
                onChange={(e) => setEmergencyForm({...emergencyForm, name: e.target.value})}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Relationship</label>
              <input
                type="text"
                value={emergencyForm.relationship}
                onChange={(e) => setEmergencyForm({...emergencyForm, relationship: e.target.value})}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Contact Number</label>
              <input
                type="text"
                value={emergencyForm.contactNumber}
                onChange={(e) => setEmergencyForm({...emergencyForm, contactNumber: e.target.value})}
                className="input"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleEmergencyUpdate}
                className="btn-primary"
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
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Name</p>
              <p className="font-medium">{partnerData?.emergencyContact?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Relationship</p>
              <p className="font-medium">{partnerData?.emergencyContact?.relationship || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Contact Number</p>
              <p className="font-medium">{partnerData?.emergencyContact?.contactNumber || 'N/A'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Account Status */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Account Status</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Status</p>
            <p className="font-medium capitalize">{partnerData?.status || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Registration Date</p>
            <p className="font-medium">{partnerData?.createdAt ? new Date(partnerData.createdAt).toLocaleString() : 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Total Deliveries</p>
            <p className="font-medium">{partnerData?.workDetails?.totalDeliveries || 0}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Total Earnings</p>
            <p className="font-medium">₹{partnerData?.workDetails?.totalEarnings || 0}</p>
          </div>
        </div>
      </div>
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
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-neutral-600 dark:text-neutral-400">Today's Orders</span>
          </div>
          <p className="text-3xl font-bold">0</p>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-green-500" />
            <span className="text-sm text-neutral-600 dark:text-neutral-400">Today's Earnings</span>
          </div>
          <p className="text-3xl font-bold">₹0</p>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-neutral-600 dark:text-neutral-400">Total Deliveries</span>
          </div>
          <p className="text-3xl font-bold">{partnerData?.workDetails?.totalDeliveries || 0}</p>
        </div>
      </div>

      {/* Account Status */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Account Status</h2>
        <div className="flex items-center gap-4">
          <div className={`px-4 py-2 rounded-full font-medium ${
            partnerData?.status === 'active'
              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
              : partnerData?.status === 'pending'
              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
              : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
          }`}>
            {partnerData?.status?.toUpperCase() || 'PENDING'}
          </div>
          <span className="text-sm text-neutral-600 dark:text-neutral-400">
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
        <div className={`bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm ${
          daysUntilRenewal !== null && daysUntilRenewal <= 5 ? 'border-2 border-orange-500' : ''
        }`}>
          <h2 className="text-lg font-semibold mb-4">Renewal Fee Status</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Next Due Date</p>
              <p className="text-lg font-semibold">
                {new Date(partnerData.renewalFee.nextDueDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </p>
            </div>
            <div className={`px-4 py-2 rounded-full font-medium ${
              daysUntilRenewal !== null && daysUntilRenewal <= 5
                ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
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
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <button 
            onClick={() => navigate('/delivery-partner?tab=orders&subtab=available')}
            className="flex items-center gap-3 p-4 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-all cursor-pointer"
          >
            <MapPin className="w-5 h-5 text-blue-500" />
            <span>View Available Orders</span>
          </button>
          <button 
            onClick={() => navigate('/delivery-partner?tab=orders&subtab=active')}
            className="flex items-center gap-3 p-4 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-all cursor-pointer"
          >
            <Package className="w-5 h-5 text-green-500" />
            <span>Active Deliveries</span>
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
      <div className="flex gap-4 border-b border-neutral-200 dark:border-neutral-700">
        <button
          onClick={() => setActiveTab('available')}
          className={`px-4 py-2 font-medium transition-all ${
            activeTab === 'available'
              ? 'border-b-2 border-neutral-900 text-neutral-900 dark:border-white dark:text-white'
              : 'text-neutral-600 dark:text-neutral-400'
          }`}
        >
          Available Orders
        </button>
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 font-medium transition-all ${
            activeTab === 'active'
              ? 'border-b-2 border-neutral-900 text-neutral-900 dark:border-white dark:text-white'
              : 'text-neutral-600 dark:text-neutral-400'
          }`}
        >
          Active Deliveries ({activeOrders.length})
        </button>
      </div>

      {activeTab === 'available' && (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 mx-auto"></div>
            </div>
          ) : availableOrders.length === 0 ? (
            <div className="bg-white dark:bg-neutral-800 rounded-2xl p-8 text-center">
              <Package className="w-12 h-12 mx-auto mb-4 text-neutral-400" />
              <p className="text-neutral-600 dark:text-neutral-400">No orders available nearby</p>
              <button
                onClick={fetchAvailableOrders}
                className="mt-4 btn-primary"
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
            <div className="bg-white dark:bg-neutral-800 rounded-2xl p-8 text-center">
              <Package className="w-12 h-12 mx-auto mb-4 text-neutral-400" />
              <p className="text-neutral-600 dark:text-neutral-400">No active deliveries</p>
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
    <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold">Order #{order._id?.slice(-6)}</h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-green-600">₹{order.delivery?.fee || 0}</p>
          <p className="text-xs text-neutral-600 dark:text-neutral-400">Delivery Fee</p>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-blue-500 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Pickup</p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">{order.storeAddress || 'Store Address'}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-green-500 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Delivery</p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">{order.shippingAddress?.address || 'Customer Address'}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-neutral-700">
        <div className="text-sm text-neutral-600 dark:text-neutral-400">
          <span className="font-medium">{order.delivery?.distance || 0} km</span> away
        </div>
        <button
          onClick={onAccept}
          className="btn-primary"
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
    <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold">Order #{order.order_number?.slice(-6)}</h3>
          <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 ${
            order.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
          }`}>
            {order.status.replace('_', ' ').toUpperCase()}
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-green-600">₹{order.total || 0}</p>
          <p className="text-xs text-neutral-600 dark:text-neutral-400">Order Amount</p>
        </div>
      </div>

      {/* Order Items */}
      <div className="mb-4 p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
        <p className="text-xs font-medium mb-2">Items:</p>
        {order.items?.map((item: any, i: number) => (
          <div key={i} className="flex justify-between text-xs mb-1">
            <span>{item.product_name} x{item.quantity}</span>
            <span>₹{item.price * item.quantity}</span>
          </div>
        ))}
      </div>

      {/* Progress Steps */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          {statusSteps.map((step, index) => (
            <div key={step.key} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                  index <= currentStepIndex
                    ? 'bg-green-500 text-white'
                    : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                {index + 1}
              </div>
              {index < statusSteps.length - 1 && (
                <div
                  className={`w-12 h-1 mx-1 ${
                    index < currentStepIndex ? 'bg-green-500' : 'bg-neutral-200 dark:bg-neutral-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-neutral-600 dark:text-neutral-400">
          {statusSteps.map((step) => (
            <span key={step.key} className="w-16 text-center">{step.label}</span>
          ))}
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-blue-500 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Pickup OTP: {order.delivery?.pickupOTP}</p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">{order.delivery?.storeAddress}</p>
            <p className="text-xs text-neutral-500">Contact: {order.delivery?.storeContact}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-green-500 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Delivery OTP: {order.delivery?.deliveryOTP}</p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {order.address_snapshot?.address_line}, {order.address_snapshot?.city}, {order.address_snapshot?.state} - {order.address_snapshot?.pincode}
            </p>
          </div>
        </div>
      </div>

      {order.status !== 'delivered' && (
        <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <button
            onClick={() => handleStatusUpdate(statusSteps[currentStepIndex + 1]?.key)}
            disabled={updating}
            className="btn-primary w-full"
          >
            {updating ? 'Updating...' : statusSteps[currentStepIndex + 1]?.label || 'Complete Delivery'}
          </button>
        </div>
      )}

      {/* OTP Verification Modal */}
      {showOtpInput && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {otpType === 'pickup' ? 'Verify Pickup OTP' : 'Verify Delivery OTP'}
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
              {otpType === 'pickup'
                ? `Enter the pickup OTP provided by the store: ${order.delivery?.pickupOTP}`
                : `Enter the delivery OTP provided by the customer: ${order.delivery?.deliveryOTP}`}
            </p>
            <input
              type="text"
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value)}
              placeholder="Enter OTP"
              className="input w-full mb-4"
              maxLength={6}
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowOtpInput(false);
                  setOtpInput('');
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={verifyOtpAndProceed}
                disabled={updating || otpInput.length === 0}
                className="btn-primary flex-1"
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
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
          <div className="h-16 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">Total Earnings</p>
          <p className="text-3xl font-bold text-green-600">₹{earnings?.totalEarnings || 0}</p>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">Total Orders</p>
          <p className="text-3xl font-bold">{earnings?.totalOrders || 0}</p>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">Average per Order</p>
          <p className="text-3xl font-bold">₹{earnings?.averagePerOrder?.toFixed(2) || 0}</p>
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
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
          <div className="h-16 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Payout History</h2>
        {payouts.length === 0 ? (
          <p className="text-neutral-600 dark:text-neutral-400">No payouts yet</p>
        ) : (
          <div className="space-y-4">
            {payouts.map((payout) => (
              <div key={payout._id} className="border border-neutral-200 dark:border-neutral-700 rounded-xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium">₹{payout.summary?.netAmount || 0}</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {new Date(payout.payoutPeriod?.startDate).toLocaleDateString()} - {new Date(payout.payoutPeriod?.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    payout.status === 'paid' ? 'bg-green-100 text-green-700' :
                    payout.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {payout.status.toUpperCase()}
                  </div>
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
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
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Payout Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Payout Frequency</label>
            <select
              value={payoutFrequency}
              onChange={(e) => setPayoutFrequency(e.target.value)}
              className="input"
            >
              <option value="daily">Daily (24 hours)</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {payoutFrequency === 'weekly' && (
            <div>
              <label className="block text-sm font-medium mb-2">Payout Day</label>
              <select
                value={payoutDay}
                onChange={(e) => setPayoutDay(parseInt(e.target.value))}
                className="input"
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
              <label className="block text-sm font-medium mb-2">Payout Day</label>
              <select
                value={payoutDay}
                onChange={(e) => setPayoutDay(parseInt(e.target.value))}
                className="input"
              >
                {[...Array(28)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}{i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">UPI ID (Optional)</label>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="input"
              placeholder="yourname@upi"
            />
          </div>

          <button
            onClick={savePayoutSettings}
            disabled={saving}
            className="btn-primary"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Profile Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Full Name</label>
            <input
              type="text"
              defaultValue={partnerData?.personalDetails?.fullName}
              className="input"
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Contact Number</label>
            <input
              type="tel"
              defaultValue={partnerData?.personalDetails?.contactNumber}
              className="input"
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              defaultValue={partnerData?.personalDetails?.email}
              className="input"
              disabled
            />
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Contact support to update profile information
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Vehicle Information</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Vehicle Type</label>
              <input
                type="text"
                defaultValue={partnerData?.vehicleDetails?.vehicleType}
                className="input"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Vehicle Number</label>
              <input
                type="text"
                defaultValue={partnerData?.vehicleDetails?.vehicleNumber}
                className="input"
                disabled
              />
            </div>
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Contact support to update vehicle information
          </p>
        </div>
      </div>
    </div>
  );
}
