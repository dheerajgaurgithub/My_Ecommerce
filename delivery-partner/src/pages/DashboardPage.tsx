import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package, MapPin, Phone, DollarSign, Clock, LogOut, Power,
  TrendingUp, Truck, User, Sun, Moon, CreditCard, LayoutDashboard
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';
import { useToast } from '../lib/toast';
import { api } from '../lib/api';

export function DashboardPage() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [ordersSubTab, setOrdersSubTab] = useState('available');
  const [partnerData, setPartnerData] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentType, setPaymentType] = useState<'joining' | 'renewal' | null>(null);

  useEffect(() => {
    fetchPartnerData();
    fetchOrders();
  }, []);

  const fetchPartnerData = async () => {
    try {
      const response = await api.get<{ success: boolean; data?: any }>('/delivery-partners/profile');
      if (response.success && response.data) {
        setPartnerData(response.data);
        setIsOnline(response.data.workDetails?.isOnline || false);
      }
    } catch (error) {
      console.error('Error fetching partner data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await api.get<{ success: boolean; orders?: any[] }>('/delivery-partners/active-orders');
      if (response.success && response.orders) {
        setOrders(response.orders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const toggleOnlineStatus = async () => {
    try {
      const newStatus = !isOnline;
      
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          await api.put('/delivery-partners/online-status', {
            isOnline: newStatus,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setIsOnline(newStatus);
          showToast(newStatus ? 'You are now online' : 'You are now offline', 'success');
        });
      } else {
        setIsOnline(newStatus);
      }
    } catch (error) {
      showToast('Error updating online status', 'error');
    }
  };

  const handleLogout = () => {
    signOut();
    navigate('/login');
  };

  const acceptOrder = async (orderId: string) => {
    try {
      await api.patch(`/orders/${orderId}/accept`, {});
      showToast('Order accepted successfully', 'success');
      fetchOrders();
    } catch (error) {
      showToast('Error accepting order', 'error');
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      showToast(`Order status updated to ${status}`, 'success');
      fetchOrders();
    } catch (error) {
      showToast('Error updating order status', 'error');
    }
  };

  const handlePayment = async (type: 'joining' | 'renewal') => {
    setPaymentType(type);
    setShowPaymentModal(true);
  };

  const processPayment = async () => {
    try {
      const amount = paymentType === 'joining' ? 500 : 200;
      
      // Create Razorpay order for delivery partner payment
      const response = await api.post<{ success: boolean; order: any; keyId: string }>('/delivery-partners/create-payment-order', {
        amount,
        type: paymentType,
        currency: 'INR',
        receipt: `${paymentType}_fee_${Date.now()}`
      });

      if (!response.success) {
        showToast('Failed to create payment order', 'error');
        return;
      }

      const { order, keyId } = response;

      // Load Razorpay script dynamically
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        const options = {
          key: keyId,
          amount: order.amount,
          currency: order.currency,
          name: 'Mahir & Friends',
          description: paymentType === 'joining' ? 'Delivery Partner Joining Fee' : 'Delivery Partner Renewal Fee',
          order_id: order.id,
          handler: async (response: any) => {
            // Verify payment on backend
            try {
              const verifyResponse = await api.post<{ success: boolean; data?: any }>('/delivery-partners/verify-payment', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                type: paymentType
              });

              if (verifyResponse.success) {
                showToast('Payment successful!', 'success');
                setShowPaymentModal(false);
                fetchPartnerData();
              } else {
                showToast('Payment verification failed', 'error');
              }
            } catch (error) {
              showToast('Payment verification failed', 'error');
            }
          },
          prefill: {
            name: partnerData?.personalDetails?.fullName,
            email: partnerData?.personalDetails?.email,
            contact: partnerData?.personalDetails?.contactNumber
          },
          theme: {
            color: '#4F46E5'
          },
          modal: {
            ondismiss: () => {
              showToast('Payment cancelled', 'info');
            }
          }
        };

        if (typeof (window as any).Razorpay !== 'undefined') {
          const rzp = new (window as any).Razorpay(options);
          rzp.open();
        }
      };
      script.onerror = () => {
        showToast('Failed to load payment gateway', 'error');
      };
      document.body.appendChild(script);

    } catch (error) {
      console.error('Payment error:', error);
      showToast('Payment failed', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="text-neutral-600 dark:text-neutral-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-neutral-800 border-r border-neutral-200 dark:border-neutral-700 fixed inset-y-0 left-0 z-40 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-serif text-xl font-bold text-neutral-900 dark:text-white">MAHIR & FRIENDS</h1>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">Delivery Partner</p>
            </div>
          </div>
        </div>

        {/* Profile Section */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-brand-100 dark:bg-brand-900 rounded-full flex items-center justify-center overflow-hidden aspect-square">
              {partnerData?.kycDetails?.selfie ? (
                <img 
                  src={partnerData.kycDetails.selfie} 
                  alt="Profile" 
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <User className="w-6 h-6 text-brand-600 dark:text-brand-400" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-neutral-900 dark:text-white truncate">
                {partnerData?.personalDetails?.fullName || 'Partner'}
              </p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 truncate">
                {partnerData?.personalDetails?.email || 'email@example.com'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'orders', label: 'Orders', icon: Package },
            { id: 'earnings', label: 'Earnings', icon: DollarSign },
            { id: 'profile', label: 'Profile', icon: User },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === item.id
                  ? 'bg-brand-50 dark:bg-brand-900 text-brand-700 dark:text-brand-300'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-700 space-y-2">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-all"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        {/* Top Bar */}
        <header className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-white capitalize">
                  {activeTab}
                </h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Welcome back, {partnerData?.personalDetails?.fullName?.split(' ')[0] || 'Partner'}
                </p>
              </div>
              <button
                onClick={toggleOnlineStatus}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isOnline
                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                    : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300'
                }`}
              >
                <Power className="w-5 h-5" />
                {isOnline ? 'Online' : 'Offline'}
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Payment Cards */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="card p-6 border-2 border-brand-200 dark:border-brand-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-brand-100 dark:bg-brand-900 rounded-xl flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                  </div>
                  <span className="px-3 py-1 bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 rounded-full text-sm font-medium">
                    One-time
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">Joining Fee</h3>
                <p className="text-3xl font-bold text-brand-600 mb-4">₹500</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                  Pay one-time joining fee to start accepting deliveries
                </p>
                <button
                  onClick={() => handlePayment('joining')}
                  className="w-full btn-primary"
                >
                  Pay Joining Fee
                </button>
              </div>

              <div className="card p-6 border-2 border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
                    Monthly
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">Renewal Fee</h3>
                <p className="text-3xl font-bold text-green-600 mb-4">₹200/month</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                  Monthly renewal fee to continue as active delivery partner
                </p>
                {partnerData?.renewalFee?.nextDueDate && (
                  <p className="text-sm text-green-600 dark:text-green-400 mb-4">
                    Next due: {new Date(partnerData.renewalFee.nextDueDate).toLocaleDateString('en-IN', { 
                      day: 'numeric', 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </p>
                )}
                <button
                  onClick={() => handlePayment('renewal')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  disabled={!partnerData?.joiningFee?.paid}
                >
                  {partnerData?.joiningFee?.paid ? 'Pay Renewal Fee' : 'Pay Joining Fee First'}
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
                    <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {partnerData?.workDetails?.totalDeliveries || 0}
                </p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Total Deliveries</p>
              </div>

              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                  ₹{partnerData?.workDetails?.totalEarnings || 0}
                </p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Total Earnings</p>
              </div>

              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {partnerData?.workDetails?.rating || 0}
                </p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Rating</p>
              </div>

              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {orders.filter(o => o.status === 'in_progress').length}
                </p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Active Orders</p>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
              {orders.length === 0 ? (
                <p className="text-neutral-600 dark:text-neutral-400 text-center py-8">
                  No orders assigned yet
                </p>
              ) : (
                <div className="space-y-4">
                  {orders.slice(0, 5).map((order) => (
                    <div key={order._id} className="border border-neutral-200 dark:border-neutral-700 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-medium text-neutral-900 dark:text-white">
                            Order #{order.order_number}
                          </p>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            {order.items?.length || 0} items • ₹{order.total}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                          order.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-neutral-100 text-neutral-700'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                        <MapPin className="w-4 h-4" />
                        <span>{order.shippingAddress?.address || 'Address not available'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div>
            <div className="flex gap-2 mb-6">
              {['available', 'in_progress', 'completed'].map((subtab) => (
                <button
                  key={subtab}
                  onClick={() => setOrdersSubTab(subtab)}
                  className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
                    ordersSubTab === subtab
                      ? 'bg-brand-600 text-white'
                      : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  {subtab.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {orders
                .filter(order => {
                  if (ordersSubTab === 'available') return order.status === 'assigned';
                  if (ordersSubTab === 'in_progress') return order.status === 'in_progress';
                  if (ordersSubTab === 'completed') return order.status === 'delivered';
                  return true;
                })
                .map((order) => (
                  <div key={order._id} className="card p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="font-semibold text-lg text-neutral-900 dark:text-white">
                          Order #{order.order_number}
                        </p>
                        <p className="text-neutral-600 dark:text-neutral-400">
                          {order.items?.length || 0} items • ₹{order.total}
                        </p>
                      </div>
                      {ordersSubTab === 'available' && (
                        <button
                          onClick={() => acceptOrder(order._id)}
                          className="btn-primary"
                        >
                          Accept Order
                        </button>
                      )}
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                        <MapPin className="w-4 h-4" />
                        <span>{order.shippingAddress?.address || 'Address not available'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                        <Phone className="w-4 h-4" />
                        <span>{order.shippingAddress?.phone || 'Phone not available'}</span>
                      </div>
                    </div>

                    {ordersSubTab === 'in_progress' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateOrderStatus(order._id, 'picked_up')}
                          className="btn-secondary"
                        >
                          Mark Picked Up
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order._id, 'delivered')}
                          className="btn-primary"
                        >
                          Mark Delivered
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              
              {orders.filter(order => {
                if (ordersSubTab === 'available') return order.status === 'assigned';
                if (ordersSubTab === 'in_progress') return order.status === 'in_progress';
                if (ordersSubTab === 'completed') return order.status === 'delivered';
                return true;
              }).length === 0 && (
                <p className="text-neutral-600 dark:text-neutral-400 text-center py-8">
                  No orders in this category
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'earnings' && (
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4">Earnings Overview</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-700 rounded-xl">
                <div>
                  <p className="font-medium text-neutral-900 dark:text-white">Total Earnings</p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">All time</p>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  ₹{partnerData?.workDetails?.totalEarnings || 0}
                </p>
              </div>
              <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-700 rounded-xl">
                <div>
                  <p className="font-medium text-neutral-900 dark:text-white">This Month</p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Current month earnings</p>
                </div>
                <p className="text-2xl font-bold text-brand-600">
                  ₹{partnerData?.workDetails?.monthlyEarnings || 0}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4">Profile</h2>
            <div className="space-y-6">
              {/* Personal Details */}
              <div>
                <h3 className="text-lg font-medium mb-3 text-neutral-900 dark:text-white">Personal Details</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Full Name</label>
                    <p className="text-neutral-900 dark:text-white">
                      {partnerData?.personalDetails?.fullName || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <p className="text-neutral-900 dark:text-white">
                      {partnerData?.personalDetails?.email || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone</label>
                    <p className="text-neutral-900 dark:text-white">
                      {partnerData?.personalDetails?.contactNumber || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Date of Birth</label>
                    <p className="text-neutral-900 dark:text-white">
                      {partnerData?.personalDetails?.dateOfBirth || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Gender</label>
                    <p className="text-neutral-900 dark:text-white">
                      {partnerData?.personalDetails?.gender || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Vehicle Details */}
              <div>
                <h3 className="text-lg font-medium mb-3 text-neutral-900 dark:text-white">Vehicle Details</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Vehicle Type</label>
                    <p className="text-neutral-900 dark:text-white capitalize">
                      {partnerData?.vehicleDetails?.vehicleType || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Vehicle Number</label>
                    <p className="text-neutral-900 dark:text-white">
                      {partnerData?.vehicleDetails?.vehicleNumber || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Vehicle Model</label>
                    <p className="text-neutral-900 dark:text-white">
                      {partnerData?.vehicleDetails?.vehicleModel || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Vehicle Color</label>
                    <p className="text-neutral-900 dark:text-white">
                      {partnerData?.vehicleDetails?.vehicleColor || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <h3 className="text-lg font-medium mb-3 text-neutral-900 dark:text-white">Address</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Street</label>
                    <p className="text-neutral-900 dark:text-white">
                      {partnerData?.address?.street || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">City</label>
                    <p className="text-neutral-900 dark:text-white">
                      {partnerData?.address?.city || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">State</label>
                    <p className="text-neutral-900 dark:text-white">
                      {partnerData?.address?.state || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Pincode</label>
                    <p className="text-neutral-900 dark:text-white">
                      {partnerData?.address?.pincode || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Landmark</label>
                    <p className="text-neutral-900 dark:text-white">
                      {partnerData?.address?.landmark || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div>
                <h3 className="text-lg font-medium mb-3 text-neutral-900 dark:text-white">Emergency Contact</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Contact Name</label>
                    <p className="text-neutral-900 dark:text-white">
                      {partnerData?.emergencyContact?.name || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Relationship</label>
                    <p className="text-neutral-900 dark:text-white">
                      {partnerData?.emergencyContact?.relationship || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Contact Number</label>
                    <p className="text-neutral-900 dark:text-white">
                      {partnerData?.emergencyContact?.contactNumber || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* KYC Details */}
              <div>
                <h3 className="text-lg font-medium mb-3 text-neutral-900 dark:text-white">KYC Details</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Aadhar Number</label>
                    <p className="text-neutral-900 dark:text-white">
                      {partnerData?.kycDetails?.aadharNumber || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">PAN Number</label>
                    <p className="text-neutral-900 dark:text-white">
                      {partnerData?.kycDetails?.panNumber || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">KYC Status</label>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      partnerData?.kycDetails?.kycStatus === 'approved' ? 'bg-green-100 text-green-700' :
                      partnerData?.kycDetails?.kycStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {partnerData?.kycDetails?.kycStatus || 'Not Submitted'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div>
                <h3 className="text-lg font-medium mb-3 text-neutral-900 dark:text-white">Bank Details</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Account Number</label>
                    <p className="text-neutral-900 dark:text-white">
                      {partnerData?.bankDetails?.accountNumber || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Account Holder Name</label>
                    <p className="text-neutral-900 dark:text-white">
                      {partnerData?.bankDetails?.accountHolderName || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">IFSC Code</label>
                    <p className="text-neutral-900 dark:text-white">
                      {partnerData?.bankDetails?.ifscCode || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Bank Name</label>
                    <p className="text-neutral-900 dark:text-white">
                      {partnerData?.bankDetails?.bankName || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Work Details */}
              <div>
                <h3 className="text-lg font-medium mb-3 text-neutral-900 dark:text-white">Work Details</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Total Deliveries</label>
                    <p className="text-neutral-900 dark:text-white">
                      {partnerData?.workDetails?.totalDeliveries || 0}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Total Earnings</label>
                    <p className="text-neutral-900 dark:text-white">
                      ₹{partnerData?.workDetails?.totalEarnings || 0}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Rating</label>
                    <p className="text-neutral-900 dark:text-white">
                      {partnerData?.workDetails?.rating || 0} ⭐
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Status</label>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      partnerData?.status === 'approved' ? 'bg-green-100 text-green-700' :
                      partnerData?.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      partnerData?.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-neutral-100 text-neutral-700'
                    }`}>
                      {partnerData?.status || 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4 text-neutral-900 dark:text-white">
              {paymentType === 'joining' ? 'Pay Joining Fee' : 'Pay Renewal Fee'}
            </h2>
            <div className="mb-6">
              <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-700 rounded-xl mb-4">
                <span className="text-neutral-600 dark:text-neutral-400">Amount</span>
                <span className="text-2xl font-bold text-brand-600">
                  ₹{paymentType === 'joining' ? 500 : 200}
                </span>
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {paymentType === 'joining' 
                  ? 'This is a one-time joining fee to activate your delivery partner account.' 
                  : 'This is a monthly renewal fee to continue your active delivery partner status.'}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={processPayment}
                className="flex-1 btn-primary"
              >
                Pay Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
