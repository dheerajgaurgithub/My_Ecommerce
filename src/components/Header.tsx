import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, startTransition } from 'react';
import {
  Search, ShoppingBag, Heart, User, Menu, X, Sun, Moon,
  ChevronDown, Package, LogOut, LayoutDashboard, MapPin, Bell
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useCart } from '../lib/cart';
import { useTheme } from '../lib/theme';
import { api } from '../lib/api';
import type { Category } from '../lib/types';

export function Header() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { cartCount } = useCart();
  const { theme, toggleTheme } = useTheme();
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMegaMenu, setShowMegaMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [megaMenuTimeout, setMegaMenuTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [userLocation, setUserLocation] = useState('Your Location');
  const [deliveryAvailable, setDeliveryAvailable] = useState<boolean | null>(null);
  const [freeDelivery, setFreeDelivery] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get<{ success: boolean; categories: Category[] }>('/categories');
        setCategories(response.categories ?? []);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    // Get user's location using Geolocation API
    if (navigator.geolocation) {
      startTransition(() => {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            try {
              // Use OpenStreetMap's Nominatim API for reverse geocoding
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
              );
              const data = await response.json();
              const city = data.address.city || data.address.town || data.address.village || data.address.county || 'Your Location';
              const postcode = data.address.postcode || '';
              setUserLocation(city);
              
              // Check delivery availability for this location (use postcode if available, otherwise use city)
              try {
                const checkParam = postcode || city;
                const deliveryResponse = await api.get<{ success: boolean; available: boolean; free: boolean }>(`/delivery/check/${encodeURIComponent(checkParam)}`);
                if (deliveryResponse.success) {
                  setDeliveryAvailable(deliveryResponse.available);
                  setFreeDelivery(deliveryResponse.free);
                }
              } catch (error) {
                console.error('Failed to check delivery availability:', error);
                setDeliveryAvailable(null);
              }
            } catch (error) {
              console.error('Failed to get location name:', error);
              setUserLocation('Your Location');
            }
          },
          (error) => {
            console.error('Geolocation error:', error);
            setUserLocation('Your Location');
          }
        );
      });
    }
  }, []);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (user) {
        try {
          const response = await api.get<{ success: boolean; notifications: any[] }>('/notifications');
          if (response.success) {
            setNotifications(response.notifications);
            setUnreadCount(response.notifications.filter((n: any) => !n.is_read).length);
          }
        } catch (error) {
          console.error('Failed to fetch notifications:', error);
        }
      }
    };
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const response = await api.patch<{ success: boolean; notification: any }>(`/notifications/${notificationId}/read`);
      if (response.success && response.notification) {
        setNotifications(notifications.map((n: any) => n._id === notificationId ? response.notification : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      setNotifications(notifications.filter((n: any) => n._id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const deleteAllNotifications = async () => {
    try {
      await api.delete('/notifications');
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to delete all notifications:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearch(false);
      setSearchQuery('');
    }
  };

  const featuredCategories = categories.filter((c) => c.is_featured);

  return (
    <>
      {/* Announcement bar */}
      <div className="bg-neutral-900 dark:bg-black text-white text-sm sm:text-base py-3 overflow-hidden relative min-h-[44px] flex items-center justify-center px-2 sm:px-0">
        <div className="animate-marquee whitespace-nowrap absolute">
          <p className="font-medium">
            {deliveryAvailable === true && freeDelivery ? `FREE DELIVERY in ${userLocation}` :
             deliveryAvailable === true && !freeDelivery ? `DELIVERY AVAILABLE in ${userLocation}` :
             deliveryAvailable === false ? `DELIVERY NOT AVAILABLE in ${userLocation}` :
             `FREE DELIVERY in ${userLocation}`}
            {' '}&bull; Quality Clothing Since 2026
          </p>
        </div>
      </div>

      <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'glass shadow-md' : 'bg-white dark:bg-neutral-900'}`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-1 sm:gap-4">
            {/* Mobile menu button */}
            <button
              className="lg:hidden text-neutral-700 dark:text-neutral-200 p-2"
              onClick={() => setShowMobileMenu(true)}
            >
              <Menu size={24} />
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
              <img src="/logo.png" alt="Mahir & Friends" className="h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10 object-contain" />
              <div className="flex flex-col">
                <span className="font-serif text-sm sm:text-base lg:text-xl xl:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white leading-tight">
                  MAHIR <span className="text-brand-600">& FRIENDS</span>
                </span>
                <span className="text-[9px] sm:text-[10px] lg:text-xs text-neutral-500 dark:text-neutral-400 leading-tight hidden sm:block">
                  Everything You Need, Delivered Today
                </span>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
              <button
                className="px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:text-brand-600 flex items-center gap-1"
                onMouseEnter={() => {
                  if (megaMenuTimeout) clearTimeout(megaMenuTimeout);
                  setShowMegaMenu(true);
                }}
                onMouseLeave={() => {
                  const timeout = setTimeout(() => setShowMegaMenu(false), 200);
                  setMegaMenuTimeout(timeout);
                }}
              >
                Categories <ChevronDown size={14} />
              </button>
              <Link key="shop-all" to="/shop" className="px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:text-brand-600">Shop All</Link>
              <Link key="trending" to="/shop?filter=trending" className="px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:text-brand-600">Trending</Link>
              <Link key="new-arrivals" to="/shop?filter=new" className="px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:text-brand-600">New Arrivals</Link>
              <Link key="best-sellers" to="/shop?filter=bestseller" className="px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:text-brand-600">Best Sellers</Link>
              <Link key="flash-sale" to="/shop?filter=flash-sale" className="px-3 py-2 text-sm font-medium text-accent-600 dark:text-accent-400 hover:text-accent-700">Flash Sale</Link>
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="p-2 text-neutral-700 dark:text-neutral-200 hover:text-brand-600"
              >
                <Search size={20} />
              </button>
              <Link to="/cart" className="relative p-2 text-neutral-700 dark:text-neutral-200 hover:text-brand-600 flex-shrink-0">
                <ShoppingBag size={20} />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-brand-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
              <button onClick={toggleTheme} className="p-2 text-neutral-700 dark:text-neutral-200 hover:text-brand-600 hidden sm:block">
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </button>
              <Link to="/wishlist" className="p-2 text-neutral-700 dark:text-neutral-200 hover:text-brand-600 hidden sm:block">
                <Heart size={20} />
              </Link>
              {user && (
                <div className="relative hidden sm:block">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 text-neutral-700 dark:text-neutral-200 hover:text-brand-600"
                  >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-brand-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  {showNotifications && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                      <div className="absolute right-0 mt-2 w-80 card shadow-xl z-50 py-2 animate-slide-down max-h-96 overflow-y-auto">
                        <div className="px-4 py-2 border-b border-neutral-100 dark:border-neutral-700 flex items-center justify-between">
                          <p className="text-sm font-medium text-neutral-900 dark:text-white">Notifications</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-neutral-500">{unreadCount} unread</span>
                            {notifications.length > 0 && (
                              <button
                                onClick={deleteAllNotifications}
                                className="text-xs text-red-600 hover:text-red-700 font-medium"
                              >
                                Clear All
                              </button>
                            )}
                          </div>
                        </div>
                        {notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center text-sm text-neutral-500">No notifications</div>
                        ) : (
                          notifications.map((notif: any) => (
                            <div
                              key={notif._id}
                              className={`px-4 py-3 border-b border-neutral-50 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 ${!notif.is_read ? 'bg-brand-50 dark:bg-brand-900/20' : ''}`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div
                                  className="flex-1 cursor-pointer"
                                  onClick={() => !notif.is_read && markNotificationAsRead(notif._id)}
                                >
                                  <p className="text-sm font-medium text-neutral-900 dark:text-white">{notif.title}</p>
                                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">{notif.message}</p>
                                  <p className="text-xs text-neutral-400 mt-2">{new Date(notif.createdAt).toLocaleDateString()}</p>
                                </div>
                                <button
                                  onClick={() => deleteNotification(notif._id)}
                                  className="p-1 text-neutral-400 hover:text-red-500 transition-colors flex-shrink-0"
                                  title="Delete notification"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="p-2 text-neutral-700 dark:text-neutral-200 hover:text-brand-600"
                  >
                    {user.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt="Profile"
                        className="w-8 h-8 rounded-full object-cover aspect-square"
                      />
                    ) : (
                      <User size={20} />
                    )}
                  </button>
                  {showUserMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                      <div className="absolute right-0 mt-2 w-56 card shadow-xl z-50 py-2 animate-slide-down">
                        <div className="px-4 py-2 border-b border-neutral-100 dark:border-neutral-700 flex items-center gap-3">
                          {user.profilePicture ? (
                            <img
                              src={user.profilePicture}
                              alt="Profile"
                              className="w-10 h-10 rounded-full object-cover aspect-square"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center aspect-square">
                              <User size={20} className="text-brand-600 dark:text-brand-300" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{user.nickname || user.name}</p>
                            <p className="text-xs text-neutral-500 truncate">{user.email}</p>
                          </div>
                        </div>
                        <Link to="/account" onClick={() => setShowUserMenu(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700">
                          <LayoutDashboard size={16} /> My Account
                        </Link>
                        <Link to="/account/orders" onClick={() => setShowUserMenu(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700">
                          <Package size={16} /> Orders
                        </Link>
                        <Link to="/account/addresses" onClick={() => setShowUserMenu(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700">
                          <MapPin size={16} /> Addresses
                        </Link>
                        <button
                          onClick={() => { signOut(); setShowUserMenu(false); navigate('/'); }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-neutral-50 dark:hover:bg-neutral-700"
                        >
                          <LogOut size={16} /> Sign Out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <Link to="/login" className="p-2 text-neutral-700 dark:text-neutral-200 hover:text-brand-600">
                  <User size={20} />
                </Link>
              )}
            </div>
          </div>

          {/* Search bar */}
          {showSearch && (
            <div className="pb-3 animate-slide-down">
              <form onSubmit={handleSearch} className="relative">
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for products, brands, categories..."
                  autoFocus
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                <button type="button" onClick={() => setShowSearch(false)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                  <X size={18} />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Mega menu */}
        {showMegaMenu && (
          <div
            className="hidden lg:block absolute top-full left-0 right-0 bg-white dark:bg-neutral-800 shadow-xl border-t border-neutral-100 dark:border-neutral-700 animate-slide-down z-50"
            onMouseEnter={() => {
              if (megaMenuTimeout) clearTimeout(megaMenuTimeout);
              setShowMegaMenu(true);
            }}
            onMouseLeave={() => {
              const timeout = setTimeout(() => setShowMegaMenu(false), 200);
              setMegaMenuTimeout(timeout);
            }}
          >
            <div className="max-w-7xl mx-auto px-6 py-6">
              <div className="grid grid-cols-4 gap-6">
                {(featuredCategories.length > 0 ? featuredCategories : categories).map((cat) => (
                  <Link key={cat.id} to={`/shop?category=${cat.slug}`} className="group">
                    <div className="aspect-square rounded-lg overflow-hidden mb-2 bg-neutral-100 dark:bg-neutral-700">
                      {cat.image_url ? (
                        <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-400">
                          <Package size={32} />
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-white group-hover:text-brand-600">{cat.name}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Mobile menu */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileMenu(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-80 max-w-[85%] bg-white dark:bg-neutral-900 overflow-y-auto animate-slide-down">
            <div className="flex items-center justify-between p-4 border-b border-neutral-100 dark:border-neutral-700">
              <span className="font-serif text-lg font-bold">MAHIR & FRIENDS</span>
              <button onClick={() => setShowMobileMenu(false)}><X size={24} /></button>
            </div>
            <nav className="p-4 space-y-1">
              <Link key="mobile-shop-all" to="/shop" onClick={() => setShowMobileMenu(false)} className="block py-2.5 px-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 font-medium">Shop All</Link>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/shop?category=${cat.slug}`}
                  onClick={() => setShowMobileMenu(false)}
                  className="block py-2.5 px-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800"
                >
                  {cat.name}
                </Link>
              ))}
              <div className="border-t border-neutral-100 dark:border-neutral-700 pt-2 mt-2">
                <Link key="mobile-wishlist" to="/wishlist" onClick={() => setShowMobileMenu(false)} className="flex items-center gap-2 py-2.5 px-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800">
                  <Heart size={18} /> Wishlist
                </Link>
                {user ? (
                  <>
                    <Link key="mobile-account" to="/account" onClick={() => setShowMobileMenu(false)} className="flex items-center gap-2 py-2.5 px-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800">
                      <User size={18} /> My Account
                    </Link>
                    <button key="mobile-signout" onClick={() => { signOut(); setShowMobileMenu(false); }} className="flex items-center gap-2 py-2.5 px-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 text-red-500 w-full">
                      <LogOut size={18} /> Sign Out
                    </button>
                  </>
                ) : (
                  <Link key="mobile-login" to="/login" onClick={() => setShowMobileMenu(false)} className="flex items-center gap-2 py-2.5 px-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800">
                    <User size={18} /> Login / Sign Up
                  </Link>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
