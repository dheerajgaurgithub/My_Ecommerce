import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package, Heart, MapPin, User, LogOut, LayoutDashboard,
  ShoppingBag, Trash2, Plus, Check, Camera, Star, X
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useToast } from '../lib/toast';
import { api } from '../lib/api';
import { formatPrice, formatDate } from '../lib/utils';
import type { Order, Address, Product } from '../lib/types';
import { ProductCard } from '../components/ProductCard';

type Tab = 'overview' | 'orders' | 'wishlist' | 'addresses' | 'profile';

export function AccountPage() {
  const navigate = useNavigate();
  const { user, signOut, isAdmin, setUser } = useAuth();
  const { showToast } = useToast();
  const [tab, setTab] = useState<Tab>('overview');
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({ full_name: '', phone: '', pincode: '', address_line: '', city: '', state: '' });
  const [profileForm, setProfileForm] = useState({ name: '', nickname: '', phone: '', location: '' });
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewProduct, setReviewProduct] = useState<any>(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', body: '' });

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/account');
      return;
    }
    const fetchAll = async () => {
      try {
        const [ordersRes, wishlistRes, addrRes] = await Promise.all([
          api.get<{ success: boolean; orders: Order[] }>('/orders'),
          api.get<{ success: boolean; products: Product[] }>('/wishlist'),
          api.get<{ success: boolean; addresses: Address[] }>('/addresses'),
        ]);
        setOrders(ordersRes.orders ?? []);
        setWishlist(wishlistRes.products ?? []);
        setAddresses(addrRes.addresses ?? []);
      } catch (error) {
        console.error('Failed to fetch account data:', error);
      }
    };
    fetchAll();
    // Initialize profile form
    setProfileForm({
      name: user.name,
      nickname: user.nickname || '',
      phone: user.phone || '',
      location: user.location || ''
    });
  }, [user, navigate]);

  const addAddress = async () => {
    if (!user) return;
    try {
      const response = await api.post<{ success: boolean; address: Address }>('/addresses', {
        ...newAddress,
        country: 'India',
        is_default: addresses.length === 0,
      });
      const addr = response.address;
      setAddresses((prev) => [...prev, addr]);
      setShowAddressForm(false);
      setNewAddress({ full_name: '', phone: '', pincode: '', address_line: '', city: '', state: '' });
      showToast('Address added', 'success');
    } catch (error) {
      showToast('Failed to add address', 'error');
    }
  };

  const deleteAddress = async (id: string) => {
    try {
      await api.delete(`/addresses/${id}`);
      setAddresses((prev) => prev.filter((a) => a._id !== id));
      showToast('Address deleted', 'info');
    } catch (error) {
      console.error('Failed to delete address:', error);
    }
  };

  const removeWishlist = async (productId: string) => {
    if (!user) return;
    try {
      await api.delete(`/wishlist/${productId}`);
      setWishlist((prev) => prev.filter((p) => p._id !== productId));
      showToast('Removed from wishlist', 'info');
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
    }
  };

  const openReviewModal = (item: any) => {
    setReviewProduct(item);
    setReviewForm({ rating: 5, title: '', body: '' });
    setShowReviewModal(true);
  };

  const submitReview = async () => {
    if (!reviewProduct || !user) return;
    try {
      await api.post('/reviews', {
        product_id: reviewProduct.product_id,
        rating: reviewForm.rating,
        title: reviewForm.title,
        body: reviewForm.body,
      });
      showToast('Review submitted successfully', 'success');
      setShowReviewModal(false);
      setReviewProduct(null);
    } catch (error) {
      showToast('Failed to submit review', 'error');
    }
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300',
    confirmed: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300',
    packed: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300',
    shipped: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300',
    'out_for_delivery': 'bg-accent-100 text-accent-600 dark:bg-accent-900 dark:text-accent-300',
    delivered: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300',
    cancelled: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300',
  };

  const tabs = [
    { id: 'overview' as Tab, label: 'Overview', icon: LayoutDashboard },
    { id: 'orders' as Tab, label: 'Orders', icon: Package },
    { id: 'wishlist' as Tab, label: 'Wishlist', icon: Heart },
    { id: 'addresses' as Tab, label: 'Addresses', icon: MapPin },
    { id: 'profile' as Tab, label: 'Profile', icon: User },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
      <h1 className="font-serif text-xl sm:text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white mb-4 sm:mb-6">My Account</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <div className="card p-3 sm:p-4 sticky top-20 sm:top-24">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-neutral-100 dark:border-neutral-700">
              <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center font-medium text-brand-700 dark:text-brand-300">
                {user?.email?.[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{user?.email}</p>
                <p className="text-xs text-neutral-500">Customer</p>
              </div>
            </div>
            <nav className="space-y-1">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-brand-50 dark:bg-brand-900 text-brand-700 dark:text-brand-300' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'}`}
                >
                  <t.icon size={18} /> {t.label}
                </button>
              ))}
              {isAdmin && (
                <Link to="/admin" className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-brand-600 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                  <LayoutDashboard size={18} /> Admin Panel
                </Link>
              )}
              <button onClick={() => { signOut(); navigate('/'); }} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                <LogOut size={18} /> Sign Out
              </button>
            </nav>
          </div>
        </aside>

        {/* Content */}
        <div className="lg:col-span-3">
          {tab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {[
                  { label: 'Total Orders', value: orders.length, icon: Package, color: 'text-blue-600' },
                  { label: 'Wishlist Items', value: wishlist.length, icon: Heart, color: 'text-brand-600' },
                  { label: 'Saved Addresses', value: addresses.length, icon: MapPin, color: 'text-green-600' },
                  { label: 'Delivered', value: orders.filter((o) => o.status === 'delivered').length, icon: Check, color: 'text-accent-600' },
                ].map((stat, i) => (
                  <div key={i} className="card p-4">
                    <stat.icon size={20} className={stat.color} />
                    <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-2">{stat.value}</p>
                    <p className="text-xs text-neutral-500">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Recent orders */}
              <div className="card p-5">
                <h2 className="font-semibold text-lg text-neutral-900 dark:text-white mb-4">Recent Orders</h2>
                {orders.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingBag size={40} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-2" />
                    <p className="text-neutral-500 text-sm">No orders yet</p>
                    <Link to="/shop" className="text-brand-600 text-sm hover:underline mt-2 inline-block">Start Shopping</Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.slice(0, 3).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border border-neutral-100 dark:border-neutral-700">
                        <div>
                          <p className="text-sm font-medium text-neutral-900 dark:text-white">{order.order_number}</p>
                          <p className="text-xs text-neutral-500">{formatDate(order.created_at)} &bull; {formatPrice(order.total)}</p>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${statusColors[order.status] ?? statusColors.pending}`}>
                          {order.status.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                    <button onClick={() => setTab('orders')} className="text-sm text-brand-600 hover:text-brand-700">View all orders</button>
                  </div>
                )}
              </div>

            </div>
          )}

          {tab === 'orders' && (
            <div className="space-y-4">
              <h2 className="font-semibold text-lg text-neutral-900 dark:text-white">Order History</h2>
              {orders.length === 0 ? (
                <div className="card p-8 text-center">
                  <Package size={40} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-2" />
                  <p className="text-neutral-500">No orders yet</p>
                  <Link to="/shop" className="text-brand-600 text-sm hover:underline mt-2 inline-block">Start Shopping</Link>
                </div>
              ) : (
                orders.map((order) => (
                  <div key={order.id} className="card p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                      <div>
                        <p className="font-mono text-sm font-medium text-neutral-900 dark:text-white">{order.order_number}</p>
                        <p className="text-xs text-neutral-500">Placed on {formatDate(order.created_at)}</p>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full font-medium capitalize ${statusColors[order.status] ?? statusColors.pending}`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {order.items?.map((item: any) => (
                        <div key={item.id} className="flex gap-3 items-center">
                          <img src={item.product_image ?? ''} alt="" className="w-12 h-16 object-cover rounded" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-neutral-900 dark:text-white line-clamp-1">{item.product_name}</p>
                            <p className="text-xs text-neutral-500">{item.size} &bull; {item.color} &bull; Qty {item.quantity}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{formatPrice(item.price * item.quantity)}</p>
                            {order.status === 'delivered' && (
                              <button
                                onClick={() => openReviewModal(item)}
                                className="text-xs px-2 py-1 bg-brand-100 text-brand-700 rounded hover:bg-brand-200 dark:bg-brand-900 dark:text-brand-300"
                              >
                                Rate
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-700">
                      <p className="text-sm text-neutral-500">Total: <span className="font-semibold text-neutral-900 dark:text-white">{formatPrice(order.total)}</span></p>
                      <p className="text-xs text-neutral-500">Payment: {order.payment_method.toUpperCase()}</p>
                    </div>
                    {/* Timeline */}
                    {order.timeline && order.timeline.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-700">
                        <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-2">Order Timeline</p>
                        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                          {order.timeline.map((event, i) => (
                            <div key={i} className="flex items-center gap-2 flex-shrink-0">
                              <div className="w-2 h-2 rounded-full bg-green-500" />
                              <span className="text-xs text-neutral-500">{event.status}</span>
                              {i < order.timeline.length - 1 && <div className="w-4 h-px bg-neutral-200 dark:bg-neutral-700" />}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'wishlist' && (
            <div>
              <h2 className="font-semibold text-lg text-neutral-900 dark:text-white mb-4">My Wishlist</h2>
              {wishlist.length === 0 ? (
                <div className="card p-8 text-center">
                  <Heart size={40} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-2" />
                  <p className="text-neutral-500">Your wishlist is empty</p>
                  <Link to="/shop" className="text-brand-600 text-sm hover:underline mt-2 inline-block">Browse Products</Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {wishlist.map((p) => (
                    <div key={p.id} className="relative">
                      <ProductCard product={p} />
                      <button
                        onClick={() => removeWishlist(p.id)}
                        className="absolute top-2 right-2 z-10 bg-white/90 dark:bg-neutral-800/90 p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900"
                      >
                        <Trash2 size={14} className="text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'addresses' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg text-neutral-900 dark:text-white">Saved Addresses</h2>
                <button onClick={() => setShowAddressForm(!showAddressForm)} className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1">
                  <Plus size={16} /> Add New
                </button>
              </div>
              {showAddressForm && (
                <div className="card p-5 mb-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <input className="input" placeholder="Full Name" value={newAddress.full_name} onChange={(e) => setNewAddress({ ...newAddress, full_name: e.target.value })} />
                    <input className="input" placeholder="Phone" value={newAddress.phone} onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })} />
                  </div>
                  <input className="input" placeholder="Address Line" value={newAddress.address_line} onChange={(e) => setNewAddress({ ...newAddress, address_line: e.target.value })} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <input className="input" placeholder="City" value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} />
                    <input className="input" placeholder="State" value={newAddress.state} onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })} />
                    <input className="input" placeholder="Pincode" value={newAddress.pincode} onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })} />
                  </div>
                  <button onClick={addAddress} className="btn-primary text-sm">Save Address</button>
                </div>
              )}
              {addresses.length === 0 && !showAddressForm ? (
                <div className="card p-8 text-center">
                  <MapPin size={40} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-2" />
                  <p className="text-neutral-500">No saved addresses</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div key={addr.id} className="card p-4">
                      <div className="flex items-start justify-between">
                        <div className="text-sm">
                          <p className="font-medium text-neutral-900 dark:text-white">{addr.full_name}</p>
                          <p className="text-neutral-500">{addr.phone}</p>
                          <p className="text-neutral-600 dark:text-neutral-400 mt-2">{addr.address_line}</p>
                          <p className="text-neutral-600 dark:text-neutral-400">{addr.city}, {addr.state} - {addr.pincode}</p>
                          {addr.is_default && <span className="inline-block mt-2 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded">Default</span>}
                        </div>
                        <button onClick={() => deleteAddress(addr.id)} className="text-red-500 hover:text-red-600">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'profile' && (
            <div className="card p-6 max-w-2xl">
              <h2 className="font-semibold text-lg text-neutral-900 dark:text-white mb-6">Profile Information</h2>
              
              <div className="flex flex-col md:flex-row gap-6 sm:gap-8">
                {/* Profile Picture */}
                <div className="flex-shrink-0">
                  <div className="relative w-32 h-32 mx-auto">
                    {user?.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt="Profile"
                        className="w-full h-full rounded-full object-cover border-4 border-neutral-200 dark:border-neutral-700"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center border-4 border-neutral-200 dark:border-neutral-700">
                        <User size={48} className="text-brand-600 dark:text-brand-300" />
                      </div>
                    )}
                    <label className="absolute bottom-0 right-0 w-8 h-8 bg-brand-600 hover:bg-brand-700 rounded-full flex items-center justify-center cursor-pointer text-white shadow-lg">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            // Limit file size to 2MB
                            if (file.size > 2 * 1024 * 1024) {
                              showToast('Image must be less than 2MB', 'error');
                              return;
                            }
                            const reader = new FileReader();
                            reader.onloadend = async () => {
                              const base64 = reader.result as string;
                              try {
                                const response = await api.put<{ success: boolean; user: any }>('/users/me', { profilePicture: base64 });
                                if (response.success && response.user) {
                                  showToast('Profile picture updated', 'success');
                                  setUser(response.user);
                                }
                              } catch (error) {
                                console.error('Profile update error:', error);
                                showToast('Failed to update profile picture', 'error');
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <Camera size={16} />
                    </label>
                  </div>
                  <p className="text-xs text-neutral-500 text-center mt-2">Click to change</p>
                </div>

                {/* Profile Form */}
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 block">Full Name</label>
                      <input
                        type="text"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        className="input w-full"
                        placeholder="Your full name"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 block">Nickname</label>
                      <input
                        type="text"
                        value={profileForm.nickname}
                        onChange={(e) => setProfileForm({ ...profileForm, nickname: e.target.value })}
                        className="input w-full"
                        placeholder="Your nickname"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 block">Email</label>
                    <input
                      type="email"
                      value={user?.email}
                      disabled
                      className="input w-full bg-neutral-50 dark:bg-neutral-800 cursor-not-allowed"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 block">Phone</label>
                      <input
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        className="input w-full"
                        placeholder="+91 6397684456"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 block">Location</label>
                      <input
                        type="text"
                        value={profileForm.location}
                        onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                        className="input w-full"
                        placeholder="Your city"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
                    <button
                      onClick={async () => {
                        try {
                          const response = await api.put<{ success: boolean; user: any }>('/users/me', profileForm);
                          if (response.success && response.user) {
                            showToast('Profile updated successfully', 'success');
                            setUser(response.user);
                          }
                        } catch (error) {
                          console.error('Profile update error:', error);
                          showToast('Failed to update profile', 'error');
                        }
                      }}
                      className="btn-primary"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-700">
                <h3 className="font-medium text-neutral-900 dark:text-white mb-4">Account Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-neutral-500">User ID</p>
                    <p className="font-mono text-neutral-900 dark:text-white">{user?.id}</p>
                  </div>
                  <div>
                    <p className="text-neutral-500">Member Since</p>
                    <p className="text-neutral-900 dark:text-white">{formatDate(new Date())}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && reviewProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="card max-w-md w-full p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg font-bold text-neutral-900 dark:text-white">Rate Product</h3>
              <button onClick={() => setShowReviewModal(false)} className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300">
                <X size={20} />
              </button>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <img src={reviewProduct.product_image ?? ''} alt="" className="w-16 h-20 object-cover rounded" />
              <div>
                <p className="text-sm font-medium text-neutral-900 dark:text-white">{reviewProduct.product_name}</p>
                <p className="text-xs text-neutral-500">{formatPrice(reviewProduct.price)}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 block">Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                      className={`p-1 ${star <= reviewForm.rating ? 'text-yellow-500' : 'text-neutral-300'}`}
                    >
                      <Star size={24} fill={star <= reviewForm.rating ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 block">Title (optional)</label>
                <input
                  type="text"
                  value={reviewForm.title}
                  onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                  className="input w-full"
                  placeholder="Sum up your experience"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 block">Review (optional)</label>
                <textarea
                  value={reviewForm.body}
                  onChange={(e) => setReviewForm({ ...reviewForm, body: e.target.value })}
                  className="input w-full min-h-[100px]"
                  placeholder="Tell us about your experience with this product"
                />
              </div>
              <button onClick={submitReview} className="btn-primary w-full">Submit Review</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
