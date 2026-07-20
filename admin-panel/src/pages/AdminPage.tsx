import { useState, useEffect, startTransition } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingBag, Tag, MapPin, Users, LogOut,
  TrendingUp, DollarSign, Clock, XCircle, CheckCircle, Plus, Edit, Trash2,
  Eye, Search, X, Save, Gift, Download, Bell, AlertTriangle, Moon, Sun, User, MessageSquare, Star, Menu
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';
import { useToast } from '../lib/toast';
import { api } from '../lib/api';
import { formatPrice, formatDate } from '../lib/utils';
import type { Product, Category, Order, Coupon, ComboPack, GiftCard } from '../lib/types';
import { AdminAnalytics } from '../components/AdminAnalytics';

type AdminTab = 'dashboard' | 'products' | 'categories' | 'orders' | 'coupons' | 'combos' | 'giftcards' | 'delivery' | 'delivery-partners' | 'stores' | 'users' | 'notifications' | 'analytics' | 'feedback' | 'profile';

export function AdminPage() {
  const navigate = useNavigate();
  const { isAuthenticated, adminSignOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const [tab, setTab] = useState<AdminTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState({ totalSales: 0, todaySales: 0, totalOrders: 0, totalProducts: 0, totalCustomers: 0, pendingOrders: 0, deliveredOrders: 0, cancelledOrders: 0 });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [comboPacks, setComboPacks] = useState<ComboPack[]>([]);
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [showComboForm, setShowComboForm] = useState(false);
  const [editingCombo, setEditingCombo] = useState<ComboPack | null>(null);
  const [showGiftCardForm, setShowGiftCardForm] = useState(false);
  const [editingGiftCard, setEditingGiftCard] = useState<GiftCard | null>(null);
  const [orderFilter, setOrderFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [deliveryPartners, setDeliveryPartners] = useState<any[]>([]);
  const [selectedPartnerForOrder, setSelectedPartnerForOrder] = useState<{ [key: string]: string }>({});
  const [notifications, setNotifications] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    fetchAll();

    // Poll for order updates every 30 seconds
    const interval = setInterval(() => {
      fetchAll();
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, navigate]);

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      setNotifications(notifications.map(n => n._id === notificationId ? { ...n, is_read: true } : n));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      setNotifications(notifications.filter(n => n._id !== notificationId));
      showToast('Notification deleted', 'success');
    } catch (error) {
      console.error('Failed to delete notification:', error);
      showToast('Failed to delete notification', 'error');
    }
  };

  const deleteAllNotifications = async () => {
    try {
      await api.delete('/notifications');
      setNotifications([]);
      showToast('All notifications deleted', 'success');
    } catch (error) {
      console.error('Failed to delete all notifications:', error);
      showToast('Failed to delete all notifications', 'error');
    }
  };

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [productsRes, ordersRes, catsRes, couponsRes, combosRes, gcRes, partnersRes, notifRes, storesRes] = await Promise.all([
        api.get<{ success: boolean; products: Product[] }>('/products'),
        api.get<{ success: boolean; orders: Order[] }>('/orders'),
        api.get<{ success: boolean; categories: Category[] }>('/categories'),
        api.get<{ success: boolean; coupons: Coupon[] }>('/coupons'),
        api.get<{ success: boolean; combos: ComboPack[] }>('/combos'),
        api.get<{ success: boolean; giftCards: GiftCard[] }>('/gift-cards'),
        api.get<{ success: boolean; partners: any[] }>('/orders/active-delivery-partners'),
        api.get<{ success: boolean; notifications: any[] }>('/notifications'),
        api.get<{ success: boolean; stores: any[] }>('/stores'),
      ]);
      const prods = productsRes.products ?? [];
      const ords = ordersRes.orders ?? [];
      setProducts(prods);
      setOrders(ords);
      setCategories(catsRes.categories ?? []);
      setCoupons(couponsRes.coupons ?? []);
      setComboPacks(combosRes.combos ?? []);
      setGiftCards(gcRes.giftCards ?? []);
      setDeliveryPartners(partnersRes.partners ?? []);
      setNotifications(notifRes.notifications ?? []);
      setStores(storesRes.stores ?? []);

      // Check for low stock products
      const lowStock = prods.filter(p => p.stock <= 5);
      setLowStockProducts(lowStock);

      const today = new Date().toDateString();
      setStats({
        totalSales: ords.reduce((s, o) => s + o.total, 0),
        todaySales: ords.filter((o) => new Date(o.created_at).toDateString() === today).reduce((s, o) => s + o.total, 0),
        totalOrders: ords.length,
        totalProducts: prods.length,
        totalCustomers: new Set(ords.map((o) => o.user_id)).size,
        pendingOrders: ords.filter((o) => o.status === 'pending' || o.status === 'confirmed').length,
        deliveredOrders: ords.filter((o) => o.status === 'delivered').length,
        cancelledOrders: ords.filter((o) => o.status === 'cancelled').length,
      });
      setRecentOrders(ords.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
      showToast('Failed to load admin data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts((prev) => prev.filter((p) => p._id !== id));
      showToast('Product deleted', 'info');
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  const togglePublish = async (product: Product) => {
    try {
      await api.patch(`/products/${product._id}`, { is_published: !product.is_published });
      setProducts((prev) => prev.map((p) => p._id === product._id ? { ...p, is_published: !p.is_published } : p));
      showToast(`Product ${!product.is_published ? 'published' : 'hidden'}`, 'success');
    } catch (error) {
      console.error('Failed to toggle publish:', error);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    const order = orders.find((o) => o._id === orderId);
    const timeline = [...(order?.timeline ?? []), { status: status.charAt(0).toUpperCase() + status.slice(1), timestamp: new Date().toISOString() }];
    const update: any = { status, timeline, updated_at: new Date().toISOString() };
    // COD payment is marked paid when order is delivered
    if (status === 'delivered' && order?.payment_method === 'cod' && order?.payment_status !== 'paid') {
      update.payment_status = 'paid';
      update.paid_at = new Date().toISOString();
      timeline.push({ status: 'Payment Completed (COD)', timestamp: new Date().toISOString() });
    }
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      setOrders((prev) => prev.map((o) => o._id === orderId ? { ...o, status: status as Order['status'], timeline: update.timeline } : o));
      showToast(`Order status updated to ${status}${status === 'delivered' && order?.payment_method === 'cod' ? ' & COD payment marked as paid' : ''}`, 'success');
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  const assignDeliveryPartner = async (orderId: string, partnerId: string) => {
    try {
      await api.put(`/orders/${orderId}/assign-partner`, { partnerId });
      setOrders((prev) => prev.map((o) => o._id === orderId ? {
        ...o,
        delivery: {
          required: o.delivery?.required ?? false,
          assigned: true,
          partnerId,
          fee: o.delivery?.fee ?? 0,
          distance: o.delivery?.distance ?? 0,
          distanceFee: o.delivery?.distanceFee ?? 0,
          estimatedTime: o.delivery?.estimatedTime ?? 0,
          pickupOTP: o.delivery?.pickupOTP ?? undefined,
          deliveryOTP: o.delivery?.deliveryOTP ?? undefined,
          storeAddress: o.delivery?.storeAddress ?? undefined,
          storeCoordinates: o.delivery?.storeCoordinates,
          storeContact: o.delivery?.storeContact ?? undefined,
        }
      } : o));
      setSelectedPartnerForOrder((prev) => ({ ...prev, [orderId]: partnerId }));
      showToast('Delivery partner assigned successfully', 'success');
    } catch (error) {
      console.error('Failed to assign delivery partner:', error);
      showToast('Failed to assign delivery partner', 'error');
    }
  };

  const deleteCoupon = async (id: string) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      await api.delete(`/coupons/${id}`);
      setCoupons((prev) => prev.filter((c) => c._id !== id));
      showToast('Coupon deleted', 'info');
    } catch (error) {
      console.error('Failed to delete coupon:', error);
    }
  };

  const deleteCombo = async (id: string) => {
    if (!window.confirm('Delete this combo pack?')) return;
    try {
      await api.delete(`/combos/${id}`);
      setComboPacks((prev) => prev.filter((c) => c._id !== id));
      showToast('Combo pack deleted', 'info');
    } catch (error) {
      console.error('Failed to delete combo:', error);
    }
  };

  const toggleComboPublish = async (combo: ComboPack) => {
    try {
      await api.patch(`/combos/${combo._id}`, { is_published: !combo.is_published });
      setComboPacks((prev) => prev.map((c) => c._id === combo._id ? { ...c, is_published: !c.is_published } : c));
      showToast(`Combo ${!combo.is_published ? 'published' : 'hidden'}`, 'success');
    } catch (error) {
      console.error('Failed to toggle combo publish:', error);
    }
  };

  const deleteGiftCard = async (id: string) => {
    if (!window.confirm('Delete this gift card?')) return;
    try {
      await api.delete(`/gift-cards/${id}`);
      setGiftCards((prev) => prev.filter((g) => g._id !== id));
      showToast('Gift card deleted', 'info');
    } catch (error) {
      console.error('Failed to delete gift card:', error);
    }
  };

  const toggleGiftCardPublish = async (card: GiftCard) => {
    try {
      await api.patch(`/gift-cards/${card._id}`, { is_published: !card.is_published });
      setGiftCards((prev) => prev.map((g) => g._id === card._id ? { ...g, is_published: !g.is_published } : g));
      showToast(`Gift card ${!card.is_published ? 'published' : 'hidden'}`, 'success');
    } catch (error) {
      console.error('Failed to toggle gift card publish:', error);
    }
  };

  const filteredOrders = orders.filter((o) => orderFilter === 'all' || o.status === orderFilter);
  const filteredProducts = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase()));

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const navItems = [
    { id: 'dashboard' as AdminTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products' as AdminTab, label: 'Products', icon: Package },
    { id: 'categories' as AdminTab, label: 'Categories', icon: Tag },
    { id: 'orders' as AdminTab, label: 'Orders', icon: ShoppingBag },
    { id: 'coupons' as AdminTab, label: 'Coupons', icon: Tag },
    { id: 'combos' as AdminTab, label: 'Combo Packs', icon: Package },
    { id: 'giftcards' as AdminTab, label: 'Gift Cards', icon: Gift },
    { id: 'delivery' as AdminTab, label: 'Delivery', icon: MapPin },
    { id: 'delivery-partners' as AdminTab, label: 'Delivery Partners', icon: Users },
    { id: 'stores' as AdminTab, label: 'Stores', icon: MapPin },
    { id: 'users' as AdminTab, label: 'Users', icon: Users },
    { id: 'feedback' as AdminTab, label: 'Feedback', icon: MessageSquare },
    { id: 'analytics' as AdminTab, label: 'Analytics', icon: TrendingUp },
    { id: 'notifications' as AdminTab, label: 'Notifications', icon: Bell, badge: unreadCount },
    { id: 'profile' as AdminTab, label: 'Profile', icon: User },
  ];

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-950 flex flex-col lg:flex-row">
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 bg-gradient-to-b from-neutral-900 to-neutral-800 dark:from-black dark:to-neutral-900 text-white flex flex-col transition-transform duration-300 ease-in-out w-64 shadow-2xl lg:hidden ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } ${mobileMenuOpen ? 'flex' : 'hidden'}`}>
        <div className="p-4 border-b border-neutral-700/50 flex-shrink-0">
          <Link to="/" className="font-serif text-xl font-bold bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent">MAHIR <span className="text-white">& FRIENDS</span></Link>
          <p className="text-xs text-neutral-400 mt-1 tracking-wide uppercase">Admin Dashboard</p>
        </div>
        <nav className="p-4 space-y-0.5">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => { startTransition(() => setTab(item.id)); setMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              tab === item.id 
                ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-500/25' 
                : 'text-neutral-300 hover:bg-neutral-700/50 hover:text-white'
            }`}>
              <div className="relative">
                <item.icon size={18} />
                {item.badge !== undefined && (
                  <span className={`absolute -top-1 -right-1 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold ${item.badge > 0 ? 'bg-red-500 animate-pulse' : 'bg-neutral-600'}`}>
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-neutral-700/50 space-y-1">
          <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-neutral-300 hover:bg-neutral-700/50 hover:text-white transition-all">
            {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-blue-400" />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button onClick={() => { adminSignOut(); navigate('/'); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all">
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-gradient-to-b from-neutral-900 to-neutral-800 dark:from-black dark:to-neutral-900 text-white flex-col shadow-2xl">
        <div className="p-4 border-b border-neutral-700/50">
          <Link to="/" className="font-serif text-xl font-bold bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent">MAHIR <span className="text-white">& FRIENDS</span></Link>
          <p className="text-xs text-neutral-400 mt-1 tracking-wide uppercase">Admin Dashboard</p>
        </div>
        <nav className="p-4 space-y-0.5">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => startTransition(() => setTab(item.id))} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              tab === item.id 
                ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-500/25' 
                : 'text-neutral-300 hover:bg-neutral-700/50 hover:text-white'
            }`}>
              <div className="relative">
                <item.icon size={18} />
                {item.badge !== undefined && (
                  <span className={`absolute -top-1 -right-1 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold ${item.badge > 0 ? 'bg-red-500 animate-pulse' : 'bg-neutral-600'}`}>
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-neutral-700/50 space-y-1">
          <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-neutral-300 hover:bg-neutral-700/50 hover:text-white transition-all">
            {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-blue-400" />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button onClick={() => { adminSignOut(); navigate('/'); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all">
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="lg:hidden mb-6 p-4 bg-white dark:bg-neutral-800 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div>
              <Link to="/" className="font-serif text-xl font-bold bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">MAHIR <span className="text-neutral-900 dark:text-white">& FRIENDS</span></Link>
              <p className="text-xs text-neutral-500 mt-1 tracking-wide uppercase">Admin Dashboard</p>
            </div>
          </div>
        </div>

        {tab === 'dashboard' && (
          <div className="space-y-6">
            <h1 className="font-serif text-3xl font-bold bg-gradient-to-r from-neutral-900 to-neutral-700 dark:from-white dark:to-neutral-300 bg-clip-text text-transparent">Dashboard</h1>

            {/* Low Stock Alert */}
            {lowStockProducts.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <div className="flex-1">
                    <h3 className="font-medium text-red-900 dark:text-red-100">Low Stock Alert</h3>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {lowStockProducts.length} product(s) have 5 or fewer items in stock
                    </p>
                  </div>
                  <button
                    onClick={() => setTab('products')}
                    className="text-sm text-red-700 dark:text-red-300 hover:underline"
                  >
                    View Products
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-white dark:bg-neutral-800 rounded-2xl p-5 shadow-sm border border-neutral-100 dark:border-neutral-700 animate-pulse">
                    <div className="w-12 h-12 bg-neutral-200 dark:bg-neutral-700 rounded-xl mb-4" />
                    <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded mb-2" />
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-2/3" />
                  </div>
                ))
              ) : [
                { label: 'Total Sales', value: formatPrice(stats.totalSales), icon: DollarSign, color: 'from-emerald-500 to-green-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400' },
                { label: "Today's Sales", value: formatPrice(stats.todaySales), icon: TrendingUp, color: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400' },
                { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingBag, color: 'from-purple-500 to-violet-600', bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400' },
                { label: 'Products', value: stats.totalProducts, icon: Package, color: 'from-amber-500 to-orange-600', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400' },
                { label: 'Customers', value: stats.totalCustomers, icon: Users, color: 'from-indigo-500 to-blue-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-600 dark:text-indigo-400' },
                { label: 'Pending Orders', value: stats.pendingOrders, icon: Clock, color: 'from-yellow-500 to-amber-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-600 dark:text-yellow-400' },
                { label: 'Delivered', value: stats.deliveredOrders, icon: CheckCircle, color: 'from-green-500 to-emerald-600', bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400' },
                { label: 'Cancelled', value: stats.cancelledOrders, icon: XCircle, color: 'from-red-500 to-rose-600', bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400' },
              ].map((stat, i) => (
                <div key={i} className="bg-white dark:bg-neutral-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow border border-neutral-100 dark:border-neutral-700">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 shadow-lg shadow-${stat.color.split('-')[1]}-500/20`}><stat.icon size={22} className="text-white" /></div>
                  <p className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">{stat.value}</p>
                  <p className="text-xs sm:text-sm text-neutral-500 mt-1 font-medium">{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-700">
              <h2 className="font-semibold text-lg text-neutral-900 dark:text-white mb-4">Recent Orders</h2>
              {recentOrders.length === 0 ? <p className="text-neutral-500 text-sm">No orders yet</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-left text-neutral-500 border-b border-neutral-200 dark:border-neutral-700">
                      <th className="pb-3 font-medium">Order #</th><th className="pb-3 font-medium">Date</th><th className="pb-3 font-medium">Total</th><th className="pb-3 font-medium">Status</th>
                    </tr></thead>
                    <tbody>{recentOrders.map((order) => (
                      <tr key={order._id} className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
                        <td className="py-3 font-mono text-xs font-medium text-neutral-900 dark:text-white">{order.order_number}</td>
                        <td className="py-3 text-neutral-500">{formatDate(order.created_at)}</td>
                        <td className="py-3 font-semibold text-neutral-900 dark:text-white">{formatPrice(order.total)}</td>
                        <td className="py-3"><span className="text-xs px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-700 capitalize font-medium">{order.status}</span></td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-700">
                <h2 className="font-semibold text-lg text-neutral-900 dark:text-white mb-4">Top Products</h2>
                <div className="space-y-3">
                  {products.slice(0, 5).map((p) => (
                    <div key={p._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
                      <img src={p.images[0]} alt="" className="w-12 h-14 object-cover rounded-lg" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 dark:text-white line-clamp-1">{p.name}</p>
                        <p className="text-xs text-neutral-500">{formatPrice(p.price)} &bull; Stock: {p.stock}</p>
                      </div>
                      <span className="text-xs text-neutral-500 font-medium">{p.review_count} reviews</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-700">
                <h2 className="font-semibold text-lg text-neutral-900 dark:text-white mb-4">Sales by Category</h2>
                <div className="space-y-4">
                  {categories.slice(0, 5).map((cat) => {
                    const categoryOrders = orders.filter(o => o.items?.some((i: any) => i.category_id === cat._id));
                    const categorySales = categoryOrders.reduce((sum, o) => sum + o.total, 0);
                    const percentage = stats.totalSales > 0 ? (categorySales / stats.totalSales) * 100 : 0;
                    return (
                      <div key={cat._id}>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-medium text-neutral-700 dark:text-neutral-300">{cat.name}</span>
                          <span className="text-neutral-500">{formatPrice(categorySales)}</span>
                        </div>
                        <div className="h-2.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-brand-500 to-brand-600 rounded-full transition-all" style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-700">
              <h2 className="font-semibold text-lg text-neutral-900 dark:text-white mb-4">Order Status Distribution</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
                {[
                  { label: 'Pending', count: stats.pendingOrders, color: 'from-yellow-500 to-amber-500' },
                  { label: 'Confirmed', count: orders.filter(o => o.status === 'confirmed').length, color: 'from-blue-500 to-indigo-500' },
                  { label: 'Picked', count: orders.filter(o => o.status === 'picked').length, color: 'from-purple-500 to-violet-500' },
                  { label: 'Out for Delivery', count: orders.filter(o => o.status === 'out_for_delivery').length, color: 'from-orange-500 to-red-500' },
                  { label: 'Delivered', count: stats.deliveredOrders, color: 'from-green-500 to-emerald-500' },
                  { label: 'Cancelled', count: stats.cancelledOrders, color: 'from-red-500 to-rose-500' },
                  { label: 'Returned', count: orders.filter(o => o.status === 'returned').length, color: 'from-gray-500 to-slate-500' },
                  { label: 'Refunded', count: orders.filter(o => o.status === 'refunded').length, color: 'from-pink-500 to-rose-500' },
                ].map((status) => (
                  <div key={status.label} className="text-center">
                    <div className={`w-14 h-14 bg-gradient-to-br ${status.color} rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-${status.color.split('-')[1]}-500/30`}>
                      <span className="text-white font-bold text-lg">{status.count}</span>
                    </div>
                    <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">{status.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'products' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h1 className="font-serif text-3xl font-bold bg-gradient-to-r from-neutral-900 to-neutral-700 dark:from-white dark:to-neutral-300 bg-clip-text text-transparent">Products</h1>
              <button onClick={() => { setEditingProduct(null); setShowProductForm(true); }} className="btn-primary text-sm flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg shadow-brand-500/25"><Plus size={16} /> Add Product</button>
            </div>
            <div className="relative max-w-sm">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input type="text" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-11 rounded-xl" />
            </div>
            <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 dark:bg-neutral-900/50"><tr className="text-left text-neutral-500">
                    <th className="p-4 font-medium">Product</th><th className="p-4 font-medium">Price</th><th className="p-4 font-medium">Stock</th><th className="p-4 font-medium">Status</th><th className="p-4 font-medium">Actions</th>
                  </tr></thead>
                  <tbody>{filteredProducts.map((p) => (
                    <tr key={p._id} className="border-t border-neutral-100 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
                      <td className="p-4"><div className="flex items-center gap-3">
                        <img src={p.images[0]} alt="" className="w-12 h-14 object-cover rounded-lg" />
                        <div className="min-w-0"><p className="font-medium text-neutral-900 dark:text-white line-clamp-1">{p.name}</p><p className="text-xs text-neutral-500">{p.sku}</p></div>
                      </div></td>
                      <td className="p-4 font-semibold text-neutral-900 dark:text-white">{formatPrice(p.price)}</td>
                      <td className="p-4"><span className={p.stock < 10 ? 'text-red-500 font-semibold bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-lg' : 'text-neutral-600 dark:text-neutral-400'}>{p.stock}</span></td>
                      <td className="p-4"><span className={`text-xs px-3 py-1.5 rounded-full font-medium ${p.is_published ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300' : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-700'}`}>{p.is_published ? 'Published' : 'Hidden'}</span></td>
                      <td className="p-4"><div className="flex gap-1.5">
                        <Link to={`/product/${p.slug}`} target="_blank" className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors" title="View"><Eye size={16} /></Link>
                        <button onClick={() => { setEditingProduct(p); setShowProductForm(true); }} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors" title="Edit"><Edit size={16} /></button>
                        <button onClick={() => togglePublish(p)} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors" title="Toggle publish">{p.is_published ? <XCircle size={16} /> : <CheckCircle size={16} />}</button>
                        <button onClick={() => deleteProduct(p._id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500 transition-colors" title="Delete"><Trash2 size={16} /></button>
                      </div></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === 'orders' && (
          <div className="space-y-5">
            <h1 className="font-serif text-3xl font-bold bg-gradient-to-r from-neutral-900 to-neutral-700 dark:from-white dark:to-neutral-300 bg-clip-text text-transparent">Orders</h1>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
              {['all', 'pending', 'confirmed', 'picked', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'].map((status) => (
                <button key={status} onClick={() => setOrderFilter(status)} className={`px-4 py-2 text-sm rounded-xl whitespace-nowrap transition-all font-medium ${
                  orderFilter === status 
                    ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-500/25' 
                    : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:border-brand-300 dark:hover:border-brand-600'
                }`}>
                  {status === 'all' ? 'All' : status.replace('_', ' ')}
                </button>
              ))}
            </div>
            {filteredOrders.length === 0 ? (
              <div className="bg-white dark:bg-neutral-800 rounded-2xl p-12 text-center border border-neutral-100 dark:border-neutral-700"><ShoppingBag size={48} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-4" /><p className="text-neutral-500 font-medium">No orders found</p></div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <div key={order._id} className="bg-white dark:bg-neutral-800 rounded-2xl p-5 shadow-sm border border-neutral-100 dark:border-neutral-700 hover:shadow-md transition-shadow">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                      <div><p className="font-mono text-sm font-bold text-neutral-900 dark:text-white">{order.order_number}</p><p className="text-xs text-neutral-500 mt-1">{formatDate(order.created_at)} &bull; {formatPrice(order.total)}</p></div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-700 capitalize font-medium">{order.status.replace('_', ' ')}</span>
                        <select value={order.status} onChange={(e) => updateOrderStatus(order._id, e.target.value)} className="text-xs px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 font-medium">
                          {['pending', 'confirmed', 'picked', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'].map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      {order.items?.map((item: any, i: number) => (
                        <div key={i} className="flex gap-3 items-center text-sm p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
                          <img src={item.product_image ?? ''} alt="" className="w-10 h-12 object-cover rounded-lg" />
                          <span className="flex-1 line-clamp-1 font-medium text-neutral-900 dark:text-white">{item.product_name}</span>
                          <span className="text-neutral-500">x{item.quantity}</span>
                          <span className="font-semibold text-neutral-900 dark:text-white">{formatPrice(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-700 flex justify-between text-xs text-neutral-500">
                      <span>Payment: {order.payment_method.toUpperCase()} <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-semibold ${order.payment_status === 'paid' ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300' : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300'}`}>{order.payment_status === 'paid' ? 'PAID' : 'PENDING'}</span></span>
                      <span className="font-medium">{order.address_snapshot?.city}, {order.address_snapshot?.state}</span>
                    </div>
                    {/* Delivery Partner Assignment */}
                    {(order.status === 'packed' || order.status === 'shipped') && (
                      <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-700">
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Assign Delivery Partner:</label>
                          <select 
                            value={selectedPartnerForOrder[order._id] || ''} 
                            onChange={(e) => {
                              setSelectedPartnerForOrder((prev) => ({ ...prev, [order._id]: e.target.value }));
                              if (e.target.value) assignDeliveryPartner(order._id, e.target.value);
                            }}
                            className="text-xs px-2 py-1 rounded border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800"
                          >
                            <option value="">Select Partner</option>
                            {deliveryPartners.map((partner) => (
                              <option key={partner._id} value={partner._id}>
                                {partner.personalDetails?.fullName} - {partner.vehicleDetails?.vehicleType} ({partner.vehicleDetails?.vehicleNumber})
                              </option>
                            ))}
                          </select>
                        </div>
                        {order.delivery?.assigned && (
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                            ✓ Assigned to delivery partner
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'coupons' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="font-serif text-2xl font-bold text-neutral-900 dark:text-white">Coupons</h1>
              <button onClick={() => setShowCouponForm(!showCouponForm)} className="btn-primary text-sm flex items-center gap-2"><Plus size={16} /> Add Coupon</button>
            </div>
            {showCouponForm && <CouponForm onSaved={() => { setShowCouponForm(false); fetchAll(); }} />}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {coupons.map((c) => (
                <div key={c._id} className="card p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-mono font-bold text-lg text-neutral-900 dark:text-white">{c.code}</p>
                      <p className="text-sm text-neutral-500">{c.description}</p>
                      <p className="text-xs text-neutral-400 mt-2">{c.discount_type === 'percentage' ? `${c.discount_value}% off` : `${formatPrice(c.discount_value)} off`}{c.max_discount && ` (max ${formatPrice(c.max_discount)})`}</p>
                      <p className="text-xs text-neutral-400">Min order: {formatPrice(c.min_order)}</p>
                      <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded ${c.is_active ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300' : 'bg-neutral-100 text-neutral-500'}`}>{c.is_active ? 'Active' : 'Inactive'}</span>
                    </div>
                    <button onClick={() => deleteCoupon(c._id)} className="text-red-500 hover:text-red-600"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'combos' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="font-serif text-2xl font-bold text-neutral-900 dark:text-white">Combo Packs</h1>
              <button onClick={() => { setEditingCombo(null); setShowComboForm(true); }} className="btn-primary text-sm flex items-center gap-2"><Plus size={16} /> Add Combo</button>
            </div>
            {showComboForm && <ComboForm combo={editingCombo} products={products} onClose={() => setShowComboForm(false)} onSaved={() => { setShowComboForm(false); fetchAll(); }} />}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {comboPacks.map((c) => (
                <div key={c._id} className="card overflow-hidden">
                  {c.image_url && <img src={c.image_url} alt={c.name} className="w-full h-32 object-cover" />}
                  <div className="p-4">
                    <h3 className="font-medium text-neutral-900 dark:text-white">{c.name}</h3>
                    <p className="text-sm text-neutral-500 line-clamp-2 mt-1">{c.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="font-bold text-neutral-900 dark:text-white">{formatPrice(c.price)}</span>
                      {c.compare_at_price && <span className="text-sm text-neutral-400 line-through">{formatPrice(c.compare_at_price)}</span>}
                    </div>
                    <p className="text-xs text-neutral-400 mt-1">{c.product_ids?.length ?? 0} products in combo</p>
                    <div className="flex items-center gap-2 mt-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${c.is_published ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300' : 'bg-neutral-100 text-neutral-500'}`}>{c.is_published ? 'Published' : 'Hidden'}</span>
                      <button onClick={() => { setEditingCombo(c); setShowComboForm(true); }} className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded" title="Edit"><Edit size={16} /></button>
                      <button onClick={() => toggleComboPublish(c)} className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded" title="Toggle">{c.is_published ? <XCircle size={16} /> : <CheckCircle size={16} />}</button>
                      <button onClick={() => deleteCombo(c._id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900 rounded text-red-500" title="Delete"><Trash2 size={16} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'giftcards' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="font-serif text-2xl font-bold text-neutral-900 dark:text-white">Gift Cards</h1>
              <button onClick={() => { setEditingGiftCard(null); setShowGiftCardForm(true); }} className="btn-primary text-sm flex items-center gap-2"><Plus size={16} /> Add Gift Card</button>
            </div>
            {showGiftCardForm && <GiftCardForm card={editingGiftCard} onClose={() => setShowGiftCardForm(false)} onSaved={() => { setShowGiftCardForm(false); fetchAll(); }} />}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {giftCards.map((g) => (
                <div key={g._id} className="card p-4">
                  <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-lg p-4 text-center mb-3">
                    <p className="text-white/80 text-xs uppercase tracking-wide">MAHIR & FRIENDS</p>
                    <p className="text-2xl font-bold text-white mt-1">{formatPrice(g.denomination)}</p>
                  </div>
                  <h3 className="font-medium text-sm text-neutral-900 dark:text-white">{g.name}</h3>
                  <p className="text-xs text-neutral-500 mt-1">{g.description}</p>
                  <p className="text-sm font-medium mt-2">Buy: {formatPrice(g.price)}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${g.is_published ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300' : 'bg-neutral-100 text-neutral-500'}`}>{g.is_published ? 'Published' : 'Hidden'}</span>
                    <button onClick={() => { setEditingGiftCard(g); setShowGiftCardForm(true); }} className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded" title="Edit"><Edit size={16} /></button>
                    <button onClick={() => toggleGiftCardPublish(g)} className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded" title="Toggle">{g.is_published ? <XCircle size={16} /> : <CheckCircle size={16} />}</button>
                    <button onClick={() => deleteGiftCard(g._id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900 rounded text-red-500" title="Delete"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'categories' && <CategoriesManagement />}
        {tab === 'delivery' && <DeliveryManagement />}
        {tab === 'delivery-partners' && <DeliveryPartnersManagement />}
        {tab === 'stores' && <StoresManagement />}
        {tab === 'users' && <UsersManagement />}
        {tab === 'feedback' && <FeedbackManagement />}
        {tab === 'analytics' && <AdminAnalytics />}
        {tab === 'profile' && <AdminProfile />}
        {tab === 'notifications' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="font-serif text-2xl font-bold text-neutral-900 dark:text-white">Notifications</h1>
              {notifications.length > 0 && (
                <button onClick={deleteAllNotifications} className="text-sm text-red-600 hover:text-red-700 font-medium">
                  Clear All
                </button>
              )}
            </div>
            <div className="card p-5">
              {notifications.length === 0 ? (
                <p className="text-neutral-500 text-sm">No notifications</p>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notif) => (
                    <div
                      key={notif._id}
                      className={`p-4 rounded-lg border transition-colors ${notif.is_read ? 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700' : 'bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-800'}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() => !notif.is_read && markNotificationAsRead(notif._id)}
                        >
                          <h3 className="font-medium text-neutral-900 dark:text-white">{notif.title}</h3>
                          <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1">{notif.message}</p>
                          <p className="text-xs text-neutral-400 mt-2">{formatDate(notif.createdAt)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {!notif.is_read && (
                            <span className="w-2 h-2 bg-brand-500 rounded-full flex-shrink-0"></span>
                          )}
                          <button
                            onClick={() => deleteNotification(notif._id)}
                            className="p-1 text-neutral-400 hover:text-red-500 transition-colors"
                            title="Delete notification"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {showProductForm && <ProductForm product={editingProduct} categories={categories} onClose={() => setShowProductForm(false)} onSaved={() => { setShowProductForm(false); fetchAll(); }} />}
    </div>
  );
}

function ProductForm({ product, categories, onClose, onSaved }: { product: Product | null; categories: Category[]; onClose: () => void; onSaved: () => void }) {
  const { showToast } = useToast();
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>(product?.images ?? ['https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=600']);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [form, setForm] = useState({
    name: product?.name ?? '', slug: product?.slug ?? '', description: product?.description ?? '', brand: product?.brand ?? 'MAHIR & FRIENDS',
    category_id: product?.category_id ?? categories[0]?._id ?? '', price: product?.price ?? 0, compare_at_price: product?.compare_at_price ?? 0,
    stock: product?.stock ?? 0, sku: product?.sku ?? '', sizes: product?.sizes?.join(', ') ?? '', colors: product?.colors?.join(', ') ?? '',
    material: product?.material ?? '', gender: product?.gender ?? 'unisex',
    is_published: product?.is_published ?? true, is_featured: product?.is_featured ?? false, is_trending: product?.is_trending ?? false,
    is_bestseller: product?.is_bestseller ?? false, is_new_arrival: product?.is_new_arrival ?? false, is_flash_sale: product?.is_flash_sale ?? false, is_premium: product?.is_premium ?? false,
  });

  const addImage = () => {
    if (newImageUrl.trim()) {
      setImageUrls([...imageUrls, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const removeImage = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  const createCategory = async () => {
    if (!newCategoryName.trim()) {
      showToast('Category name is required', 'error');
      return;
    }
    try {
      const response = await api.post<{ success: boolean; category: Category }>('/categories', {
        name: newCategoryName.trim(),
        slug: newCategoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        sort_order: categories.length,
      });
      showToast('Category created successfully', 'success');
      setNewCategoryName('');
      setShowCategoryForm(false);
      setForm({ ...form, category_id: response.category._id });
      onSaved(); // This will refresh the categories list
    } catch (error) {
      console.error('Failed to create category:', error);
      showToast('Failed to create category', 'error');
    }
  };

  const save = async () => {
    const slug = form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const data = {
      name: form.name, slug, description: form.description, brand: form.brand, category_id: form.category_id || null,
      price: Number(form.price), compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : null,
      discount_percent: form.compare_at_price ? Math.round(((Number(form.compare_at_price) - Number(form.price)) / Number(form.compare_at_price)) * 100) : 0,
      stock: Number(form.stock), sku: form.sku, sizes: form.sizes.split(',').map((s) => s.trim()).filter(Boolean),
      colors: form.colors.split(',').map((s) => s.trim()).filter(Boolean), material: form.material, gender: form.gender,
      images: imageUrls.filter(Boolean), is_published: form.is_published, is_featured: form.is_featured,
      is_trending: form.is_trending, is_bestseller: form.is_bestseller, is_new_arrival: form.is_new_arrival, is_flash_sale: form.is_flash_sale, is_premium: form.is_premium,
    };
    try {
      if (product) {
        await api.put(`/products/${product._id}`, data);
        showToast('Product updated', 'success');
      } else {
        await api.post('/products', data);
        showToast('Product created', 'success');
      }
      onSaved();
    } catch (error) {
      console.error('Failed to save product:', error);
      showToast('Failed to save product', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-neutral-100 dark:border-neutral-700 sticky top-0 bg-white dark:bg-neutral-800">
          <h2 className="font-semibold text-lg text-neutral-900 dark:text-white">{product ? 'Edit Product' : 'Add Product'}</h2>
          <button onClick={onClose}><X size={24} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium mb-1 block">Name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="text-sm font-medium mb-1 block">Brand</label><input className="input" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} /></div>
          </div>
          <div><label className="text-sm font-medium mb-1 block">SKU (Stock Keeping Unit)</label><input className="input" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="e.g., MFS-001" /></div>
          <div><label className="text-sm font-medium mb-1 block">Description</label><textarea className="input min-h-[80px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-sm font-medium mb-1 block">Price (Rs)</label><input type="number" className="input" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></div>
            <div><label className="text-sm font-medium mb-1 block">Compare At (Rs)</label><input type="number" className="input" value={form.compare_at_price} onChange={(e) => setForm({ ...form, compare_at_price: Number(e.target.value) })} /></div>
            <div><label className="text-sm font-medium mb-1 block">Stock</label><input type="number" className="input" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Category</label>
              <div className="flex gap-2">
                <select className="input flex-1" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                  {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
                <button onClick={() => setShowCategoryForm(true)} className="btn-secondary px-3" title="Add New Category"><Plus size={16} /></button>
              </div>
            </div>
            <div><label className="text-sm font-medium mb-1 block">Gender</label><select className="input" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}><option value="unisex">Unisex</option><option value="male">Male</option><option value="female">Female</option></select></div>
          </div>
          {showCategoryForm && (
            <div className="card p-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
              <label className="text-sm font-medium mb-2 block">New Category Name</label>
              <div className="flex gap-2">
                <input className="input flex-1" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="e.g., Men's Shoes" />
                <button onClick={createCategory} className="btn-primary text-sm">Create</button>
                <button onClick={() => { setShowCategoryForm(false); setNewCategoryName(''); }} className="btn-secondary text-sm">Cancel</button>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium mb-1 block">Sizes (comma separated)</label><input className="input" value={form.sizes} onChange={(e) => setForm({ ...form, sizes: e.target.value })} placeholder="S, M, L, XL" /></div>
            <div><label className="text-sm font-medium mb-1 block">Colors (comma separated)</label><input className="input" value={form.colors} onChange={(e) => setForm({ ...form, colors: e.target.value })} placeholder="Black, White, Blue" /></div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Product Images</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
              {imageUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <img src={url} alt={`Product image ${index + 1}`} className="w-full h-24 object-cover rounded border border-neutral-200 dark:border-neutral-700" />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove image"
                  >
                    <X size={14} />
                  </button>
                  {index === 0 && (
                    <span className="absolute bottom-1 left-1 bg-brand-500 text-white text-xs px-1.5 py-0.5 rounded">Primary</span>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                className="input flex-1"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="Enter image URL"
                onKeyPress={(e) => e.key === 'Enter' && addImage()}
              />
              <button onClick={addImage} className="btn-primary px-4">Add</button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[{ key: 'is_published', label: 'Published' }, { key: 'is_featured', label: 'Featured' }, { key: 'is_trending', label: 'Trending' }, { key: 'is_bestseller', label: 'Best Seller' }, { key: 'is_new_arrival', label: 'New Arrival' }, { key: 'is_flash_sale', label: 'Flash Sale' }, { key: 'is_premium', label: 'Premium' }].map((f) => (
              <label key={f.key} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={(form as any)[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.checked })} className="accent-brand-600" />{f.label}</label>
            ))}
          </div>
        </div>
        <div className="p-5 border-t border-neutral-100 dark:border-neutral-700 flex gap-2 sticky bottom-0 bg-white dark:bg-neutral-800">
          <button onClick={save} className="btn-primary flex items-center gap-2"><Save size={18} /> Save</button>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function CouponForm({ onSaved }: { onSaved: () => void }) {
  const { showToast } = useToast();
  const [form, setForm] = useState({ code: '', description: '', discount_type: 'percentage', discount_value: 10, min_order: 0, max_discount: 500, is_active: true });
  const save = async () => {
    try {
      await api.post('/coupons', {
        code: form.code.toUpperCase(), description: form.description, discount_type: form.discount_type, discount_value: Number(form.discount_value),
        min_order: Number(form.min_order), max_discount: form.max_discount ? Number(form.max_discount) : null, is_active: form.is_active,
        valid_from: new Date().toISOString(), valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      });
      showToast('Coupon created', 'success'); onSaved();
    } catch (error) {
      console.error('Failed to create coupon:', error);
      showToast('Failed to create coupon', 'error');
    }
  };
  return (
    <div className="card p-5 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-sm font-medium mb-1 block">Code</label><input className="input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="SUMMER20" /></div>
        <div><label className="text-sm font-medium mb-1 block">Description</label><input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div><label className="text-sm font-medium mb-1 block">Type</label><select className="input" value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })}><option value="percentage">Percentage</option><option value="flat">Flat</option></select></div>
        <div><label className="text-sm font-medium mb-1 block">Value</label><input type="number" className="input" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })} /></div>
        <div><label className="text-sm font-medium mb-1 block">Min Order</label><input type="number" className="input" value={form.min_order} onChange={(e) => setForm({ ...form, min_order: Number(e.target.value) })} /></div>
      </div>
      <div><label className="text-sm font-medium mb-1 block">Max Discount (optional)</label><input type="number" className="input" value={form.max_discount} onChange={(e) => setForm({ ...form, max_discount: Number(e.target.value) })} /></div>
      <button onClick={save} className="btn-primary text-sm">Create Coupon</button>
    </div>
  );
}

function ComboForm({ combo, products, onClose, onSaved }: { combo: ComboPack | null; products: Product[]; onClose: () => void; onSaved: () => void }) {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    name: combo?.name ?? '', description: combo?.description ?? '', price: combo?.price ?? 0, compare_at_price: combo?.compare_at_price ?? 0,
    image_url: combo?.image_url ?? 'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&w=600',
    is_published: combo?.is_published ?? true, is_featured: combo?.is_featured ?? false,
  });
  const [selectedProducts, setSelectedProducts] = useState<string[]>(combo?.product_ids ?? []);

  const toggleProduct = (id: string) => {
    setSelectedProducts((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]);
  };

  const save = async () => {
    const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const data = {
      name: form.name, slug, description: form.description, price: Number(form.price),
      compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : null,
      product_ids: selectedProducts, image_url: form.image_url, is_published: form.is_published, is_featured: form.is_featured,
    };
    try {
      if (combo) {
        await api.patch(`/combos/${combo._id}`, data);
        showToast('Combo updated', 'success');
      } else {
        await api.post('/combos', data);
        showToast('Combo created', 'success');
      }
      onSaved();
    } catch (error) {
      console.error('Failed to save combo:', error);
      showToast('Failed to save combo', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-neutral-100 dark:border-neutral-700 sticky top-0 bg-white dark:bg-neutral-800">
          <h2 className="font-semibold text-lg text-neutral-900 dark:text-white">{combo ? 'Edit Combo' : 'Add Combo Pack'}</h2>
          <button onClick={onClose}><X size={24} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div><label className="text-sm font-medium mb-1 block">Combo Name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="text-sm font-medium mb-1 block">Description</label><textarea className="input min-h-[60px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium mb-1 block">Combo Price (Rs)</label><input type="number" className="input" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></div>
            <div><label className="text-sm font-medium mb-1 block">Original Price (Rs)</label><input type="number" className="input" value={form.compare_at_price} onChange={(e) => setForm({ ...form, compare_at_price: Number(e.target.value) })} /></div>
          </div>
          <div><label className="text-sm font-medium mb-1 block">Image URL</label><input className="input" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} /></div>
          <div>
            <label className="text-sm font-medium mb-2 block">Select Products ({selectedProducts.length} selected)</label>
            <div className="max-h-48 overflow-y-auto border border-neutral-200 dark:border-neutral-700 rounded-lg p-2 space-y-1">
              {products.map((p) => (
                <label key={p._id} className="flex items-center gap-2 p-2 rounded hover:bg-neutral-50 dark:hover:bg-neutral-700 cursor-pointer">
                  <input type="checkbox" checked={selectedProducts.includes(p._id)} onChange={() => toggleProduct(p._id)} className="accent-brand-600" />
                  <img src={p.images[0]} alt="" className="w-8 h-10 object-cover rounded" />
                  <span className="text-sm flex-1 line-clamp-1">{p.name}</span>
                  <span className="text-xs text-neutral-500">{formatPrice(p.price)}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} className="accent-brand-600" />Published</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} className="accent-brand-600" />Featured</label>
          </div>
        </div>
        <div className="p-5 border-t border-neutral-100 dark:border-neutral-700 flex gap-2 sticky bottom-0 bg-white dark:bg-neutral-800">
          <button onClick={save} className="btn-primary flex items-center gap-2"><Save size={18} /> Save</button>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function GiftCardForm({ card, onClose, onSaved }: { card: GiftCard | null; onClose: () => void; onSaved: () => void }) {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    name: card?.name ?? '', denomination: card?.denomination ?? 500, price: card?.price ?? 500,
    description: card?.description ?? '', image_url: card?.image_url ?? 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=600',
    is_published: card?.is_published ?? true, is_featured: card?.is_featured ?? false,
  });

  const save = async () => {
    const data = {
      name: form.name, denomination: Number(form.denomination), price: Number(form.price),
      description: form.description, image_url: form.image_url, is_published: form.is_published, is_featured: form.is_featured,
    };
    try {
      if (card) {
        await api.patch(`/gift-cards/${card._id}`, data);
        showToast('Gift card updated', 'success');
      } else {
        await api.post('/gift-cards', data);
        showToast('Gift card created', 'success');
      }
      onSaved();
    } catch (error) {
      console.error('Failed to save gift card:', error);
      showToast('Failed to save gift card', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-neutral-100 dark:border-neutral-700 sticky top-0 bg-white dark:bg-neutral-800">
          <h2 className="font-semibold text-lg text-neutral-900 dark:text-white">{card ? 'Edit Gift Card' : 'Add Gift Card'}</h2>
          <button onClick={onClose}><X size={24} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div><label className="text-sm font-medium mb-1 block">Name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Rs 1000 Gift Card" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium mb-1 block">Denomination (Rs)</label><input type="number" className="input" value={form.denomination} onChange={(e) => setForm({ ...form, denomination: Number(e.target.value) })} /></div>
            <div><label className="text-sm font-medium mb-1 block">Price (Rs)</label><input type="number" className="input" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></div>
          </div>
          <div><label className="text-sm font-medium mb-1 block">Description</label><input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div><label className="text-sm font-medium mb-1 block">Image URL</label><input className="input" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} /></div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} className="accent-brand-600" />Published</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} className="accent-brand-600" />Featured</label>
          </div>
        </div>
        <div className="p-5 border-t border-neutral-100 dark:border-neutral-700 flex gap-2 sticky bottom-0 bg-white dark:bg-neutral-800">
          <button onClick={save} className="btn-primary flex items-center gap-2"><Save size={18} /> Save</button>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function DeliveryManagement() {
  const [locations, setLocations] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<any>(null);
  const [newLoc, setNewLoc] = useState({ district: '', city: '', state: '', pincode: '', is_available: true, is_free_delivery: false, delivery_charge: 49, estimated_days: 3 });
  const { showToast } = useToast();

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await api.get<{ success: boolean; locations: any[] }>('/delivery/locations');
      setLocations(response.locations ?? []);
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    }
  };

  const addLocation = async () => {
    if (!newLoc.district || !newLoc.state) { showToast('District and state are required', 'error'); return; }
    try {
      await api.post('/delivery/locations', {
        district: newLoc.district, city: newLoc.city || newLoc.district, state: newLoc.state,
        pincode: newLoc.pincode || '0', is_available: newLoc.is_available, is_free_delivery: newLoc.is_free_delivery,
        delivery_charge: newLoc.is_free_delivery ? 0 : Number(newLoc.delivery_charge), estimated_days: Number(newLoc.estimated_days),
        country: 'India',
      });
      showToast('Delivery location added', 'success');
      setNewLoc({ district: '', city: '', state: '', pincode: '', is_available: true, is_free_delivery: false, delivery_charge: 49, estimated_days: 3 });
      setShowForm(false);
      fetchLocations();
    } catch (error) {
      console.error('Failed to add location:', error);
      showToast('Failed to add location', 'error');
    }
  };

  const updateLocation = async () => {
    if (!editingLocation || !newLoc.district || !newLoc.state) { showToast('District and state are required', 'error'); return; }
    try {
      await api.patch(`/delivery/locations/${editingLocation._id}`, {
        district: newLoc.district, city: newLoc.city || newLoc.district, state: newLoc.state,
        pincode: newLoc.pincode || '0', is_available: newLoc.is_available, is_free_delivery: newLoc.is_free_delivery,
        delivery_charge: newLoc.is_free_delivery ? 0 : Number(newLoc.delivery_charge), estimated_days: Number(newLoc.estimated_days),
      });
      showToast('Delivery location updated', 'success');
      setEditingLocation(null);
      setNewLoc({ district: '', city: '', state: '', pincode: '', is_available: true, is_free_delivery: false, delivery_charge: 49, estimated_days: 3 });
      setShowForm(false);
      fetchLocations();
    } catch (error) {
      console.error('Failed to update location:', error);
      showToast('Failed to update location', 'error');
    }
  };

  const startEdit = (loc: any) => {
    setEditingLocation(loc);
    setNewLoc({
      district: loc.district || '',
      city: loc.city || '',
      state: loc.state || '',
      pincode: loc.pincode || '',
      is_available: loc.is_available ?? true,
      is_free_delivery: loc.is_free_delivery ?? false,
      delivery_charge: loc.delivery_charge ?? 49,
      estimated_days: loc.estimated_days ?? 3,
    });
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditingLocation(null);
    setNewLoc({ district: '', city: '', state: '', pincode: '', is_available: true, is_free_delivery: false, delivery_charge: 49, estimated_days: 3 });
    setShowForm(false);
  };

  const toggleAvailable = async (loc: any) => {
    try {
      await api.patch(`/delivery/locations/${loc._id}`, { is_available: !loc.is_available });
      setLocations((prev) => prev.map((l) => l._id === loc._id ? { ...l, is_available: !l.is_available } : l));
      showToast('Delivery availability updated', 'success');
    } catch (error) {
      console.error('Failed to toggle availability:', error);
    }
  };

  const toggleFreeDelivery = async (loc: any) => {
    const newFree = !loc.is_free_delivery;
    try {
      await api.patch(`/delivery/locations/${loc._id}`, { is_free_delivery: newFree, delivery_charge: newFree ? 0 : loc.delivery_charge });
      setLocations((prev) => prev.map((l) => l._id === loc._id ? { ...l, is_free_delivery: newFree, delivery_charge: newFree ? 0 : l.delivery_charge } : l));
      showToast('Free delivery updated', 'success');
    } catch (error) {
      console.error('Failed to toggle free delivery:', error);
    }
  };

  const deleteLocation = async (id: string) => {
    if (!window.confirm('Delete this delivery location?')) return;
    try {
      await api.delete(`/delivery/locations/${id}`);
      setLocations((prev) => prev.filter((l) => l._id !== id));
      showToast('Location deleted', 'info');
    } catch (error) {
      console.error('Failed to delete location:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold text-neutral-900 dark:text-white">Delivery Locations</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm flex items-center gap-2"><Plus size={16} /> Add Location</button>
      </div>

      {showForm && (
        <div className="card p-5 space-y-3">
          <p className="text-sm text-neutral-500">{editingLocation ? 'Update delivery location details below.' : 'Add a district where delivery is available. Mark free delivery to offer no-cost shipping in that district.'}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div><label className="text-sm font-medium mb-1 block">District *</label><input className="input" value={newLoc.district} onChange={(e) => setNewLoc({ ...newLoc, district: e.target.value })} placeholder="Aligarh" /></div>
            <div><label className="text-sm font-medium mb-1 block">City</label><input className="input" value={newLoc.city} onChange={(e) => setNewLoc({ ...newLoc, city: e.target.value })} placeholder="Aligarh" /></div>
            <div><label className="text-sm font-medium mb-1 block">State *</label><input className="input" value={newLoc.state} onChange={(e) => setNewLoc({ ...newLoc, state: e.target.value })} placeholder="Uttar Pradesh" /></div>
            <div><label className="text-sm font-medium mb-1 block">Pincode</label><input className="input" value={newLoc.pincode} onChange={(e) => setNewLoc({ ...newLoc, pincode: e.target.value })} placeholder="202001" /></div>
            <div><label className="text-sm font-medium mb-1 block">Delivery Charge (Rs)</label><input type="number" className="input" value={newLoc.delivery_charge} onChange={(e) => setNewLoc({ ...newLoc, delivery_charge: Number(e.target.value) })} disabled={newLoc.is_free_delivery} /></div>
            <div><label className="text-sm font-medium mb-1 block">Est. Days</label><input type="number" className="input" value={newLoc.estimated_days} onChange={(e) => setNewLoc({ ...newLoc, estimated_days: Number(e.target.value) })} /></div>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={newLoc.is_available} onChange={(e) => setNewLoc({ ...newLoc, is_available: e.target.checked })} className="accent-brand-600" />Delivery Available</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={newLoc.is_free_delivery} onChange={(e) => setNewLoc({ ...newLoc, is_free_delivery: e.target.checked, delivery_charge: e.target.checked ? 0 : 49 })} className="accent-brand-600" />Free Delivery</label>
          </div>
          <div className="flex gap-2">
            <button onClick={editingLocation ? updateLocation : addLocation} className="btn-primary text-sm">{editingLocation ? 'Update Location' : 'Add Location'}</button>
            {editingLocation && <button onClick={cancelEdit} className="btn-secondary text-sm">Cancel</button>}
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-800"><tr className="text-left text-neutral-500">
              <th className="p-3 font-medium">District</th><th className="p-3 font-medium">City</th><th className="p-3 font-medium">State</th>
              <th className="p-3 font-medium">Charge</th><th className="p-3 font-medium">Days</th><th className="p-3 font-medium">Available</th><th className="p-3 font-medium">Free Del.</th><th className="p-3 font-medium">Actions</th>
            </tr></thead>
            <tbody>
              {locations.map((loc) => (
                <tr key={loc._id} className="border-t border-neutral-100 dark:border-neutral-700">
                  <td className="p-3 font-medium">{loc.district ?? '-'}</td>
                  <td className="p-3">{loc.city}</td>
                  <td className="p-3">{loc.state}</td>
                  <td className="p-3">{loc.is_free_delivery ? <span className="text-green-600 font-medium">FREE</span> : formatPrice(loc.delivery_charge)}</td>
                  <td className="p-3">{loc.estimated_days}</td>
                  <td className="p-3"><button onClick={() => toggleAvailable(loc)} className={`text-xs px-2 py-1 rounded-full ${loc.is_available ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300'}`}>{loc.is_available ? 'Yes' : 'No'}</button></td>
                  <td className="p-3"><button onClick={() => toggleFreeDelivery(loc)} className={`text-xs px-2 py-1 rounded-full ${loc.is_free_delivery ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300' : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-700'}`}>{loc.is_free_delivery ? 'Yes' : 'No'}</button></td>
                  <td className="p-3 flex gap-2">
                    <button onClick={() => startEdit(loc)} className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"><Edit size={16} /></button>
                    <button onClick={() => deleteLocation(loc._id)} className="text-red-500 hover:text-red-600"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CategoriesManagement() {
  const [categories, setCategories] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [newCat, setNewCat] = useState({ name: '', slug: '', image_url: '', is_featured: false, sort_order: 0 });
  const { showToast } = useToast();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get<{ success: boolean; categories: any[] }>('/categories');
      setCategories(response.categories ?? []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const addCategory = async () => {
    if (!newCat.name) { showToast('Category name is required', 'error'); return; }
    try {
      await api.post('/categories', {
        name: newCat.name,
        slug: newCat.slug || newCat.name.toLowerCase().replace(/\s+/g, '-'),
        image_url: newCat.image_url,
        is_featured: newCat.is_featured,
        sort_order: Number(newCat.sort_order),
      });
      showToast('Category added', 'success');
      setNewCat({ name: '', slug: '', image_url: '', is_featured: false, sort_order: 0 });
      setShowForm(false);
      fetchCategories();
    } catch (error) {
      console.error('Failed to add category:', error);
      showToast('Failed to add category', 'error');
    }
  };

  const updateCategory = async () => {
    if (!editingCategory || !newCat.name) { showToast('Category name is required', 'error'); return; }
    try {
      await api.put(`/categories/${editingCategory._id}`, {
        name: newCat.name,
        slug: newCat.slug || newCat.name.toLowerCase().replace(/\s+/g, '-'),
        image_url: newCat.image_url,
        is_featured: newCat.is_featured,
        sort_order: Number(newCat.sort_order),
      });
      showToast('Category updated', 'success');
      setEditingCategory(null);
      setNewCat({ name: '', slug: '', image_url: '', is_featured: false, sort_order: 0 });
      setShowForm(false);
      fetchCategories();
    } catch (error) {
      console.error('Failed to update category:', error);
      showToast('Failed to update category', 'error');
    }
  };

  const startEdit = (cat: any) => {
    setEditingCategory(cat);
    setNewCat({
      name: cat.name,
      slug: cat.slug,
      image_url: cat.image_url || '',
      is_featured: cat.is_featured,
      sort_order: cat.sort_order,
    });
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setNewCat({ name: '', slug: '', image_url: '', is_featured: false, sort_order: 0 });
    setShowForm(false);
  };

  const deleteCategory = async (id: string) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await api.delete(`/categories/${id}`);
      setCategories((prev) => prev.filter((c) => c._id !== id));
      showToast('Category deleted', 'info');
    } catch (error) {
      console.error('Failed to delete category:', error);
      showToast('Failed to delete category', 'error');
    }
  };

  const toggleFeatured = async (cat: any) => {
    try {
      await api.patch(`/categories/${cat._id}`, { is_featured: !cat.is_featured });
      setCategories((prev) => prev.map((c) => c._id === cat._id ? { ...c, is_featured: !cat.is_featured } : c));
      showToast('Featured status updated', 'success');
    } catch (error) {
      console.error('Failed to toggle featured:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold text-neutral-900 dark:text-white">Categories</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm flex items-center gap-2"><Plus size={16} /> Add Category</button>
      </div>

      {showForm && (
        <div className="card p-5 space-y-3">
          <p className="text-sm text-neutral-500">{editingCategory ? 'Update category details below.' : 'Add a new product category. Featured categories appear in the header mega menu.'}</p>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium mb-1 block">Name *</label><input className="input" value={newCat.name} onChange={(e) => setNewCat({ ...newCat, name: e.target.value })} placeholder="Men" /></div>
            <div><label className="text-sm font-medium mb-1 block">Slug (auto-generated)</label><input className="input" value={newCat.slug} onChange={(e) => setNewCat({ ...newCat, slug: e.target.value })} placeholder="men" /></div>
            <div><label className="text-sm font-medium mb-1 block">Image URL</label><input className="input" value={newCat.image_url} onChange={(e) => setNewCat({ ...newCat, image_url: e.target.value })} placeholder="https://..." /></div>
            <div><label className="text-sm font-medium mb-1 block">Sort Order</label><input type="number" className="input" value={newCat.sort_order} onChange={(e) => setNewCat({ ...newCat, sort_order: Number(e.target.value) })} /></div>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={newCat.is_featured} onChange={(e) => setNewCat({ ...newCat, is_featured: e.target.checked })} className="accent-brand-600" />Featured in Header</label>
          </div>
          <div className="flex gap-2">
            <button onClick={editingCategory ? updateCategory : addCategory} className="btn-primary text-sm">{editingCategory ? 'Update Category' : 'Add Category'}</button>
            {editingCategory && <button onClick={cancelEdit} className="btn-secondary text-sm">Cancel</button>}
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-800"><tr className="text-left text-neutral-500">
              <th className="p-3 font-medium">Image</th><th className="p-3 font-medium">Name</th><th className="p-3 font-medium">Slug</th><th className="p-3 font-medium">Sort</th><th className="p-3 font-medium">Featured</th><th className="p-3 font-medium">Actions</th>
            </tr></thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat._id} className="border-t border-neutral-100 dark:border-neutral-700">
                  <td className="p-3">
                    {cat.image_url ? (
                      <img src={cat.image_url} alt={cat.name} className="w-12 h-12 object-cover rounded" />
                    ) : (
                      <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-700 rounded flex items-center justify-center text-neutral-400">
                        <Package size={20} />
                      </div>
                    )}
                  </td>
                  <td className="p-3 font-medium">{cat.name}</td>
                  <td className="p-3 text-neutral-500">{cat.slug}</td>
                  <td className="p-3">{cat.sort_order}</td>
                  <td className="p-3"><button onClick={() => toggleFeatured(cat)} className={`text-xs px-2 py-1 rounded-full ${cat.is_featured ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300' : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-700'}`}>{cat.is_featured ? 'Yes' : 'No'}</button></td>
                  <td className="p-3 flex gap-2">
                    <button onClick={() => startEdit(cat)} className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"><Edit size={16} /></button>
                    <button onClick={() => deleteCategory(cat._id)} className="text-red-500 hover:text-red-600"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DeliveryPartnersManagement() {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:5000/api/delivery-partners/admin/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setPartners(data.data);
      }
    } catch (error) {
      console.error('Error fetching partners:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePartnerStatus = async (partnerId: string, status: string, reason?: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5000/api/delivery-partners/admin/${partnerId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status, reason })
      });
      const data = await response.json();
      if (data.success) {
        showToast('Partner status updated', 'success');
        fetchPartners();
      } else {
        showToast(data.message || 'Failed to update status', 'error');
      }
    } catch (error) {
      showToast('Error updating status', 'error');
    }
  };

  const approvePartner = async (partnerId: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5000/api/delivery-partners/admin/${partnerId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        showToast('Partner approved successfully. Email sent with PDF.', 'success');
        fetchPartners();
      } else {
        showToast(data.message || 'Failed to approve partner', 'error');
      }
    } catch (error) {
      showToast('Error approving partner', 'error');
    }
  };

  const rejectPartner = async (partnerId: string, reason: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5000/api/delivery-partners/admin/${partnerId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });
      const data = await response.json();
      if (data.success) {
        showToast('Partner rejected successfully. Rejection email sent.', 'success');
        fetchPartners();
      } else {
        showToast(data.message || 'Failed to reject partner', 'error');
      }
    } catch (error) {
      showToast('Error rejecting partner', 'error');
    }
  };

  const downloadPartnerPDF = async (partnerId: string, partnerName: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5000/api/delivery-partners/admin/${partnerId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `delivery-partner-${partnerName.replace(/\s+/g, '-')}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showToast('PDF downloaded successfully', 'success');
      } else {
        showToast('Failed to download PDF', 'error');
      }
    } catch (error) {
      showToast('Error downloading PDF', 'error');
    }
  };

  const previewPartnerPDF = async (partnerId: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5000/api/delivery-partners/admin/${partnerId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setPreviewPDF(url);
        setShowPDFPreview(true);
      } else {
        showToast('Failed to generate PDF preview', 'error');
      }
    } catch (error) {
      showToast('Error generating PDF preview', 'error');
    }
  };

  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  const [showPartnerDetails, setShowPartnerDetails] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editFormData, setEditFormData] = useState<any>(null);
  const [previewPDF, setPreviewPDF] = useState<string | null>(null);
  const [showPDFPreview, setShowPDFPreview] = useState(false);

  const viewPartnerDetails = (partner: any) => {
    setSelectedPartner(partner);
    setShowPartnerDetails(true);
  };

  const editPartnerDetails = (partner: any) => {
    setSelectedPartner(partner);
    setEditFormData({
      personalDetails: { ...partner.personalDetails },
      address: { ...partner.address },
      vehicleDetails: { ...partner.vehicleDetails },
      workDetails: { ...partner.workDetails }
    });
    setShowEditForm(true);
  };

  const updatePartnerDetails = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5000/api/delivery-partners/admin/${selectedPartner._id}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editFormData)
      });
      const data = await response.json();
      if (data.success) {
        showToast('Partner details updated successfully', 'success');
        setShowEditForm(false);
        fetchPartners();
      } else {
        showToast(data.message || 'Failed to update details', 'error');
      }
    } catch (error) {
      showToast('Error updating details', 'error');
    }
  };

  const filteredPartners = partners.filter(p => {
    const matchesFilter = filter === 'all' || 
      p.status === filter || 
      (filter === 'pending_payments' && !p.joiningFee?.paid);
    const searchLower = search.toLowerCase();
    const matchesSearch = !search || 
      p.personalDetails?.fullName?.toLowerCase().includes(searchLower) ||
      p.personalDetails?.email?.toLowerCase().includes(searchLower) ||
      p.personalDetails?.contactNumber?.includes(searchLower) ||
      p.vehicleDetails?.vehicleNumber?.toLowerCase().includes(searchLower);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold text-neutral-900 dark:text-white">Delivery Partners</h1>
        <input
          type="text"
          placeholder="Search by name, email, phone, or vehicle number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input w-64"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {['pending', 'approved', 'payment_pending', 'pending_payments', 'active', 'inactive', 'suspended', 'rejected', 'all'].map((status) => (
          <button key={status} onClick={() => setFilter(status)} className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-all ${filter === status ? 'bg-brand-600 text-white' : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700'}`}>
            {status.replace('_', ' ').toUpperCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 mx-auto"></div>
        </div>
      ) : filteredPartners.length === 0 ? (
        <div className="card p-8 text-center">
          <Users size={40} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-2" />
          <p className="text-neutral-500">No delivery partners found</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 dark:bg-neutral-800">
                <tr className="text-left text-neutral-500">
                  <th className="p-3 font-medium">Partner</th>
                  <th className="p-3 font-medium">Contact</th>
                  <th className="p-3 font-medium">Vehicle</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Joining Fee</th>
                  <th className="p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPartners.map((partner) => (
                  <tr key={partner._id} className="border-t border-neutral-100 dark:border-neutral-700">
                    <td className="p-3">
                      <div>
                        <p className="font-medium">{partner.personalDetails?.fullName}</p>
                        <p className="text-xs text-neutral-500">{partner.personalDetails?.email}</p>
                      </div>
                    </td>
                    <td className="p-3">
                      <p className="text-neutral-600 dark:text-neutral-400">{partner.personalDetails?.contactNumber}</p>
                    </td>
                    <td className="p-3">
                      <div>
                        <p className="capitalize">{partner.vehicleDetails?.vehicleType}</p>
                        <p className="text-xs text-neutral-500">{partner.vehicleDetails?.vehicleNumber}</p>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        partner.status === 'active' ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300' :
                        partner.status === 'pending' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300' :
                        partner.status === 'approved' ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300' :
                        partner.status === 'payment_pending' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300' :
                        partner.status === 'suspended' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300' :
                        'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300'
                      }`}>
                        {partner.status?.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`text-xs font-medium ${
                        partner.joiningFee?.paid ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {partner.joiningFee?.paid ? `₹${partner.joiningFee.amount} Paid` : `₹${partner.joiningFee?.amount || 500} Pending`}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button onClick={() => viewPartnerDetails(partner)} className="text-blue-600 hover:text-blue-700" title="View Details">
                          <Eye size={16} />
                        </button>
                        <button onClick={() => previewPartnerPDF(partner._id)} className="text-purple-600 hover:text-purple-700" title="Preview PDF">
                          <Download size={16} />
                        </button>
                        <button onClick={() => downloadPartnerPDF(partner._id, partner.personalDetails?.fullName)} className="text-green-600 hover:text-green-700" title="Download PDF">
                          <Download size={16} />
                        </button>
                        <button onClick={() => editPartnerDetails(partner)} className="text-green-600 hover:text-green-700" title="Edit Details">
                          <Edit size={16} />
                        </button>
                        {partner.status === 'pending' && (
                          <>
                            <button onClick={() => approvePartner(partner._id)} className="text-green-600 hover:text-green-700" title="Approve">
                              <CheckCircle size={16} />
                            </button>
                            <button onClick={() => {
                              const reason = prompt('Enter rejection reason:');
                              if (reason) rejectPartner(partner._id, reason);
                            }} className="text-red-600 hover:text-red-700" title="Reject">
                              <XCircle size={16} />
                            </button>
                          </>
                        )}
                        {partner.status === 'active' && (
                          <button onClick={() => {
                            const reason = prompt('Enter suspension reason:');
                            if (reason) updatePartnerStatus(partner._id, 'suspended', reason);
                          }} className="text-orange-600 hover:text-orange-700" title="Suspend">
                            <XCircle size={16} />
                          </button>
                        )}
                        {partner.status === 'suspended' && (
                          <button onClick={() => updatePartnerStatus(partner._id, 'active')} className="text-green-600 hover:text-green-700" title="Activate">
                            <CheckCircle size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Partner Details Modal */}
      {showPartnerDetails && selectedPartner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-neutral-800 p-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
              <h2 className="text-xl font-bold">Delivery Partner Details</h2>
              <button onClick={() => setShowPartnerDetails(false)} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Personal Details */}
              <div>
                <h3 className="font-semibold mb-3 text-neutral-900 dark:text-white">Personal Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-neutral-500 dark:text-neutral-400">Full Name</p>
                    <p className="font-medium">{selectedPartner.personalDetails?.fullName}</p>
                  </div>
                  <div>
                    <p className="text-neutral-500 dark:text-neutral-400">Email</p>
                    <p className="font-medium">{selectedPartner.personalDetails?.email}</p>
                  </div>
                  <div>
                    <p className="text-neutral-500 dark:text-neutral-400">Contact Number</p>
                    <p className="font-medium">{selectedPartner.personalDetails?.contactNumber}</p>
                  </div>
                  <div>
                    <p className="text-neutral-500 dark:text-neutral-400">Date of Birth</p>
                    <p className="font-medium">{selectedPartner.personalDetails?.dateOfBirth ? new Date(selectedPartner.personalDetails.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-neutral-500 dark:text-neutral-400">Gender</p>
                    <p className="font-medium">{selectedPartner.personalDetails?.gender || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Address Details */}
              <div>
                <h3 className="font-semibold mb-3 text-neutral-900 dark:text-white">Address Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-neutral-500 dark:text-neutral-400">Street</p>
                    <p className="font-medium">{selectedPartner.address?.street || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-neutral-500 dark:text-neutral-400">City</p>
                    <p className="font-medium">{selectedPartner.address?.city || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-neutral-500 dark:text-neutral-400">State</p>
                    <p className="font-medium">{selectedPartner.address?.state || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-neutral-500 dark:text-neutral-400">Pincode</p>
                    <p className="font-medium">{selectedPartner.address?.pincode || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Vehicle Details */}
              <div>
                <h3 className="font-semibold mb-3 text-neutral-900 dark:text-white">Vehicle Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-neutral-500 dark:text-neutral-400">Vehicle Type</p>
                    <p className="font-medium capitalize">{selectedPartner.vehicleDetails?.vehicleType || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-neutral-500 dark:text-neutral-400">Vehicle Number</p>
                    <p className="font-medium">{selectedPartner.vehicleDetails?.vehicleNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-neutral-500 dark:text-neutral-400">Vehicle Name</p>
                    <p className="font-medium">{selectedPartner.vehicleDetails?.vehicleName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-neutral-500 dark:text-neutral-400">Vehicle Color</p>
                    <p className="font-medium">{selectedPartner.vehicleDetails?.vehicleColor || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Work Details */}
              <div>
                <h3 className="font-semibold mb-3 text-neutral-900 dark:text-white">Work Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-neutral-500 dark:text-neutral-400">Preferred Areas</p>
                    <p className="font-medium">{selectedPartner.workDetails?.preferredAreas?.join(', ') || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-neutral-500 dark:text-neutral-400">Available Hours</p>
                    <p className="font-medium">{selectedPartner.workDetails?.availableHours || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-neutral-500 dark:text-neutral-400">Total Deliveries</p>
                    <p className="font-medium">{selectedPartner.workDetails?.totalDeliveries || 0}</p>
                  </div>
                  <div>
                    <p className="text-neutral-500 dark:text-neutral-400">Online Status</p>
                    <p className="font-medium">{selectedPartner.workDetails?.isOnline ? 'Online' : 'Offline'}</p>
                  </div>
                </div>
              </div>

              {/* KYC Details */}
              <div>
                <h3 className="font-semibold mb-3 text-neutral-900 dark:text-white">KYC Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-neutral-500 dark:text-neutral-400">Aadhar Number</p>
                    <p className="font-medium">{selectedPartner.kycDetails?.aadharNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-neutral-500 dark:text-neutral-400">KYC Status</p>
                    <p className="font-medium capitalize">{selectedPartner.kycDetails?.kycStatus || 'Pending'}</p>
                  </div>
                  {selectedPartner.kycDetails?.kycStatus === 'approved' && (
                    <div>
                      <p className="text-neutral-500 dark:text-neutral-400">KYC Verified At</p>
                      <p className="font-medium">{selectedPartner.kycDetails?.verifiedAt ? new Date(selectedPartner.kycDetails.verifiedAt).toLocaleString() : 'N/A'}</p>
                    </div>
                  )}
                </div>
                {selectedPartner.kycDetails?.selfie && (
                  <div className="mt-4">
                    <p className="text-neutral-500 dark:text-neutral-400 mb-2">Profile Picture (Face Identity)</p>
                    <img 
                      src={selectedPartner.kycDetails.selfie} 
                      alt="Profile" 
                      className="w-32 h-32 object-cover rounded-lg border border-neutral-200 dark:border-neutral-700"
                    />
                  </div>
                )}
              </div>

              {/* Account Status */}
              <div>
                <h3 className="font-semibold mb-3 text-neutral-900 dark:text-white">Account Status</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-neutral-500 dark:text-neutral-400">Status</p>
                    <p className="font-medium uppercase">{selectedPartner.status || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-neutral-500 dark:text-neutral-400">Registration Date</p>
                    <p className="font-medium">{selectedPartner.createdAt ? new Date(selectedPartner.createdAt).toLocaleString() : 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Fee Details */}
              <div>
                <h3 className="font-semibold mb-3 text-neutral-900 dark:text-white">Fee Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-neutral-500 dark:text-neutral-400">Joining Fee</p>
                    <p className="font-medium">₹{selectedPartner.joiningFee?.amount || 500}</p>
                  </div>
                  <div>
                    <p className="text-neutral-500 dark:text-neutral-400">Joining Fee Status</p>
                    <p className="font-medium">{selectedPartner.joiningFee?.isPaid ? 'Paid' : 'Pending'}</p>
                  </div>
                  {selectedPartner.joiningFee?.paidAt && (
                    <div>
                      <p className="text-neutral-500 dark:text-neutral-400">Joining Fee Paid At</p>
                      <p className="font-medium">{new Date(selectedPartner.joiningFee.paidAt).toLocaleString()}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-neutral-500 dark:text-neutral-400">Renewal Fee</p>
                    <p className="font-medium">₹{selectedPartner.renewalFee?.amount || 200}</p>
                  </div>
                  <div>
                    <p className="text-neutral-500 dark:text-neutral-400">Renewal Fee Status</p>
                    <p className="font-medium">{selectedPartner.renewalFee?.isPaid ? 'Paid' : 'Pending'}</p>
                  </div>
                  {selectedPartner.renewalFee?.nextDueDate && (
                    <div>
                      <p className="text-neutral-500 dark:text-neutral-400">Next Renewal Due Date</p>
                      <p className="font-medium">{new Date(selectedPartner.renewalFee.nextDueDate).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Partner Form Modal */}
      {showEditForm && selectedPartner && editFormData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-neutral-800 p-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
              <h2 className="text-xl font-bold">Edit Delivery Partner Details</h2>
              <button onClick={() => setShowEditForm(false)} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Personal Details */}
              <div>
                <h3 className="font-semibold mb-3 text-neutral-900 dark:text-white">Personal Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Full Name</label>
                    <input
                      type="text"
                      value={editFormData.personalDetails.fullName}
                      onChange={(e) => setEditFormData({...editFormData, personalDetails: {...editFormData.personalDetails, fullName: e.target.value}})}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                      type="email"
                      value={editFormData.personalDetails.email}
                      onChange={(e) => setEditFormData({...editFormData, personalDetails: {...editFormData.personalDetails, email: e.target.value}})}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Contact Number</label>
                    <input
                      type="tel"
                      value={editFormData.personalDetails.contactNumber}
                      onChange={(e) => setEditFormData({...editFormData, personalDetails: {...editFormData.personalDetails, contactNumber: e.target.value}})}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={editFormData.personalDetails.dateOfBirth}
                      onChange={(e) => setEditFormData({...editFormData, personalDetails: {...editFormData.personalDetails, dateOfBirth: e.target.value}})}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Gender</label>
                    <select
                      value={editFormData.personalDetails.gender}
                      onChange={(e) => setEditFormData({...editFormData, personalDetails: {...editFormData.personalDetails, gender: e.target.value}})}
                      className="input"
                    >
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Address Details */}
              <div>
                <h3 className="font-semibold mb-3 text-neutral-900 dark:text-white">Address Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Street</label>
                    <input
                      type="text"
                      value={editFormData.address.street}
                      onChange={(e) => setEditFormData({...editFormData, address: {...editFormData.address, street: e.target.value}})}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">City</label>
                    <input
                      type="text"
                      value={editFormData.address.city}
                      onChange={(e) => setEditFormData({...editFormData, address: {...editFormData.address, city: e.target.value}})}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">State</label>
                    <input
                      type="text"
                      value={editFormData.address.state}
                      onChange={(e) => setEditFormData({...editFormData, address: {...editFormData.address, state: e.target.value}})}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Pincode</label>
                    <input
                      type="text"
                      value={editFormData.address.pincode}
                      onChange={(e) => setEditFormData({...editFormData, address: {...editFormData.address, pincode: e.target.value}})}
                      className="input"
                    />
                  </div>
                </div>
              </div>

              {/* Vehicle Details */}
              <div>
                <h3 className="font-semibold mb-3 text-neutral-900 dark:text-white">Vehicle Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Vehicle Type</label>
                    <select
                      value={editFormData.vehicleDetails.vehicleType}
                      onChange={(e) => setEditFormData({...editFormData, vehicleDetails: {...editFormData.vehicleDetails, vehicleType: e.target.value}})}
                      className="input"
                    >
                      <option value="">Select</option>
                      <option value="motorcycle">Motorcycle</option>
                      <option value="car">Car</option>
                      <option value="van">Van</option>
                      <option value="bicycle">Bicycle</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Vehicle Number</label>
                    <input
                      type="text"
                      value={editFormData.vehicleDetails.vehicleNumber}
                      onChange={(e) => setEditFormData({...editFormData, vehicleDetails: {...editFormData.vehicleDetails, vehicleNumber: e.target.value}})}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Vehicle Name</label>
                    <input
                      type="text"
                      value={editFormData.vehicleDetails.vehicleName}
                      onChange={(e) => setEditFormData({...editFormData, vehicleDetails: {...editFormData.vehicleDetails, vehicleName: e.target.value}})}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Vehicle Color</label>
                    <input
                      type="text"
                      value={editFormData.vehicleDetails.vehicleColor}
                      onChange={(e) => setEditFormData({...editFormData, vehicleDetails: {...editFormData.vehicleDetails, vehicleColor: e.target.value}})}
                      className="input"
                    />
                  </div>
                </div>
              </div>

              {/* Work Details */}
              <div>
                <h3 className="font-semibold mb-3 text-neutral-900 dark:text-white">Work Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Preferred Areas (comma separated)</label>
                    <input
                      type="text"
                      value={editFormData.workDetails.preferredAreas?.join(', ')}
                      onChange={(e) => setEditFormData({...editFormData, workDetails: {...editFormData.workDetails, preferredAreas: e.target.value.split(',').map(s => s.trim())}})}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Available Hours</label>
                    <input
                      type="text"
                      value={editFormData.workDetails.availableHours}
                      onChange={(e) => setEditFormData({...editFormData, workDetails: {...editFormData.workDetails, availableHours: e.target.value}})}
                      className="input"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <button onClick={() => setShowEditForm(false)} className="btn-secondary">
                  Cancel
                </button>
                <button onClick={updatePartnerDetails} className="btn-primary">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Preview Modal */}
      {showPDFPreview && previewPDF && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="sticky top-0 bg-white dark:bg-neutral-800 p-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
              <h2 className="text-xl font-bold">Delivery Partner PDF Preview</h2>
              <button onClick={() => { setShowPDFPreview(false); if (previewPDF) URL.revokeObjectURL(previewPDF); setPreviewPDF(null); }} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <iframe src={previewPDF} className="w-full h-full min-h-[600px] border-0" title="PDF Preview" />
            </div>
            <div className="p-4 border-t border-neutral-200 dark:border-neutral-700 flex gap-2 justify-end">
              <button onClick={() => { setShowPDFPreview(false); if (previewPDF) URL.revokeObjectURL(previewPDF); setPreviewPDF(null); }} className="btn-secondary">
                Close
              </button>
              <button onClick={() => {
                if (selectedPartner) {
                  downloadPartnerPDF(selectedPartner._id, selectedPartner.personalDetails?.fullName);
                }
              }} className="btn-primary">
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FeedbackManagement() {
  const [feedback, setFeedback] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [responseText, setResponseText] = useState('');
  const [responding, setResponding] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/feedback/all', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });
        const data = await response.json();
        if (data.success) {
          setFeedback(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch feedback:', error);
        showToast('Failed to load feedback', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchFeedback();
  }, [showToast]);

  const handleStatusUpdate = async (feedbackId: string, status: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/feedback/${feedbackId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ status })
      });
      const data = await response.json();
      if (data.success) {
        setFeedback(feedback.map(f => f._id === feedbackId ? data.data : f));
        showToast('Status updated', 'success');
      }
    } catch (error) {
      showToast('Failed to update status', 'error');
    }
  };

  const handleRespond = async () => {
    if (!selectedFeedback || !responseText.trim()) return;
    
    setResponding(true);
    try {
      const response = await fetch(`http://localhost:5000/api/feedback/${selectedFeedback._id}/respond`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ response: responseText })
      });
      const data = await response.json();
      if (data.success) {
        setFeedback(feedback.map(f => f._id === selectedFeedback._id ? data.data : f));
        setSelectedFeedback(data.data);
        setResponseText('');
        showToast('Response sent successfully', 'success');
      }
    } catch (error) {
      showToast('Failed to send response', 'error');
    } finally {
      setResponding(false);
    }
  };

  const filteredFeedback = statusFilter === 'all' 
    ? feedback 
    : feedback.filter(f => f.status === statusFilter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'reviewed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200';
    }
  };

  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={16}
          className={star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-neutral-300'}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold text-neutral-900 dark:text-white">Customer Feedback</h1>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input px-3 py-2"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {selectedFeedback ? (
        <div className="card p-6">
          <button
            onClick={() => setSelectedFeedback(null)}
            className="text-sm text-brand-600 hover:text-brand-700 mb-4"
          >
            ← Back to list
          </button>
          
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                  {selectedFeedback.userName}
                </h2>
                <p className="text-sm text-neutral-500">{selectedFeedback.userEmail}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedFeedback.status)}`}>
                {selectedFeedback.status.charAt(0).toUpperCase() + selectedFeedback.status.slice(1)}
              </span>
            </div>

            <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4">
              <p className="text-sm text-neutral-500 mb-2">Order: {selectedFeedback.orderId?.orderNumber || 'N/A'}</p>
              <p className="text-sm text-neutral-500">
                Submitted: {new Date(selectedFeedback.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                <p className="text-sm font-medium text-purple-900 dark:text-purple-200 mb-2">Product Quality</p>
                <StarRating rating={selectedFeedback.productQuality?.rating || 0} />
                {selectedFeedback.productQuality?.comments && (
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
                    {selectedFeedback.productQuality.comments}
                  </p>
                )}
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">Delivery Experience</p>
                <StarRating rating={selectedFeedback.deliveryExperience?.rating || 0} />
                {selectedFeedback.deliveryExperience?.comments && (
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
                    {selectedFeedback.deliveryExperience.comments}
                  </p>
                )}
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                <p className="text-sm font-medium text-red-900 dark:text-red-200 mb-2">Overall Service</p>
                <StarRating rating={selectedFeedback.overallService?.rating || 0} />
                {selectedFeedback.overallService?.comments && (
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
                    {selectedFeedback.overallService.comments}
                  </p>
                )}
              </div>
            </div>

            {selectedFeedback.queries && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-200 mb-2">Queries/Concerns</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">{selectedFeedback.queries}</p>
              </div>
            )}

            {selectedFeedback.suggestions && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <p className="text-sm font-medium text-green-900 dark:text-green-200 mb-2">Suggestions</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">{selectedFeedback.suggestions}</p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Would recommend:
              </span>
              {selectedFeedback.wouldRecommend ? (
                <span className="text-green-600 font-medium">Yes ✓</span>
              ) : (
                <span className="text-red-600 font-medium">No ✗</span>
              )}
            </div>

            {selectedFeedback.adminResponse?.responded && (
              <div className="bg-brand-50 dark:bg-brand-900/20 rounded-lg p-4">
                <p className="text-sm font-medium text-brand-900 dark:text-brand-200 mb-2">
                  Your Response ({new Date(selectedFeedback.adminResponse.respondedAt).toLocaleDateString()})
                </p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {selectedFeedback.adminResponse.response}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <select
                value={selectedFeedback.status}
                onChange={(e) => handleStatusUpdate(selectedFeedback._id, e.target.value)}
                className="input px-3 py-2"
              >
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
              <h3 className="font-semibold text-neutral-900 dark:text-white mb-3">Respond to Customer</h3>
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Type your response to the customer..."
                className="input w-full min-h-[100px] mb-3"
              />
              <button
                onClick={handleRespond}
                disabled={responding || !responseText.trim()}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {responding ? 'Sending...' : 'Send Response'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <p className="text-neutral-500">Loading feedback...</p>
            </div>
          ) : filteredFeedback.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare size={40} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-2" />
              <p className="text-neutral-500">No feedback yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 dark:bg-neutral-800">
                  <tr className="text-left text-neutral-500">
                    <th className="p-3 font-medium">Customer</th>
                    <th className="p-3 font-medium">Order</th>
                    <th className="p-3 font-medium">Ratings</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium">Date</th>
                    <th className="p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFeedback.map((f) => (
                    <tr key={f._id} className="border-t border-neutral-100 dark:border-neutral-700">
                      <td className="p-3">
                        <div>
                          <p className="font-medium text-neutral-900 dark:text-white">{f.userName}</p>
                          <p className="text-xs text-neutral-500">{f.userEmail}</p>
                        </div>
                      </td>
                      <td className="p-3 text-neutral-600 dark:text-neutral-400">
                        {f.orderId?.orderNumber || 'N/A'}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <StarRating rating={f.productQuality?.rating || 0} />
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(f.status)}`}>
                          {f.status.charAt(0).toUpperCase() + f.status.slice(1)}
                        </span>
                      </td>
                      <td className="p-3 text-neutral-600 dark:text-neutral-400">
                        {new Date(f.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => setSelectedFeedback(f)}
                          className="text-brand-600 hover:text-brand-700 font-medium"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function UsersManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await api.get<{ success: boolean; users: any[] }>('/users/all');
        if (response.success) {
          // Filter out admin users and delivery partners from the list
          setUsers((response.users ?? []).filter(u => u.role !== 'admin' && u.role !== 'delivery_partner'));
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);
  return (
    <div className="space-y-4">
      <h1 className="font-serif text-2xl font-bold text-neutral-900 dark:text-white">Customers</h1>
      {loading ? (
        <div className="card p-8 text-center"><p className="text-neutral-500">Loading customers...</p></div>
      ) : users.length === 0 ? (
        <div className="card p-8 text-center"><Users size={40} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-2" /><p className="text-neutral-500">No customers yet</p></div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 dark:bg-neutral-800"><tr className="text-left text-neutral-500">
                <th className="p-3 font-medium">Customer</th><th className="p-3 font-medium">Email</th><th className="p-3 font-medium">Phone</th><th className="p-3 font-medium">Location</th><th className="p-3 font-medium">Address</th><th className="p-3 font-medium">Pincode</th>
              </tr></thead>
              <tbody>{users.map((u) => (
                <tr key={u._id} className="border-t border-neutral-100 dark:border-neutral-700">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {u.profilePicture ? (
                        <img src={u.profilePicture} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-600 dark:text-brand-300 font-medium text-xs">
                          {u.name?.[0] || u.email?.[0]}
                        </div>
                      )}
                      <span className="font-medium text-neutral-900 dark:text-white">{u.name || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="p-3 text-neutral-600 dark:text-neutral-400">{u.email}</td>
                  <td className="p-3 text-neutral-600 dark:text-neutral-400">{u.phone || 'N/A'}</td>
                  <td className="p-3 text-neutral-600 dark:text-neutral-400">{u.location || 'N/A'}</td>
                  <td className="p-3 text-neutral-600 dark:text-neutral-400 text-xs max-w-xs truncate">
                    {u.addresses && u.addresses.length > 0 ? u.addresses[0].address_line : 'N/A'}
                  </td>
                  <td className="p-3 text-neutral-600 dark:text-neutral-400">
                    {u.addresses && u.addresses.length > 0 ? u.addresses[0].pincode : 'N/A'}
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminProfile() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    profilePicture: '',
    phone: '',
    location: ''
  });

  useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        setLoading(true);
        const response = await api.get<{ success: boolean; user: any }>('/users/me');
        if (response.success && response.user) {
          setForm({
            name: response.user.name || '',
            email: response.user.email || '',
            profilePicture: response.user.profilePicture || '',
            phone: response.user.phone || '',
            location: response.user.location || ''
          });
        }
      } catch (error) {
        console.error('Failed to fetch admin profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminProfile();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/users/me', {
        name: form.name,
        profilePicture: form.profilePicture,
        phone: form.phone,
        location: form.location
      });
      showToast('Profile updated successfully', 'success');
    } catch (error) {
      console.error('Failed to update profile:', error);
      showToast('Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="font-serif text-2xl font-bold text-neutral-900 dark:text-white">Profile</h1>
        <div className="card p-8 text-center"><p className="text-neutral-500">Loading profile...</p></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-bold text-neutral-900 dark:text-white">Admin Profile</h1>
      <div className="card p-6 max-w-2xl">
        <div className="flex items-center gap-6 mb-6">
          <div className="relative">
            {form.profilePicture ? (
              <img src={form.profilePicture} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-neutral-200 dark:border-neutral-700" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-600 dark:text-brand-300 font-medium text-3xl border-4 border-neutral-200 dark:border-neutral-700">
                {form.name?.[0] || form.email?.[0]}
              </div>
            )}
          </div>
          <div>
            <h2 className="font-serif text-xl font-bold text-neutral-900 dark:text-white">{form.name || 'Admin'}</h2>
            <p className="text-neutral-600 dark:text-neutral-400">{form.email}</p>
            <p className="text-sm text-brand-600 dark:text-brand-400 mt-1">Administrator</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Name</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Email</label>
            <input
              className="input bg-neutral-100 dark:bg-neutral-800 cursor-not-allowed"
              value={form.email}
              disabled
            />
            <p className="text-xs text-neutral-500 mt-1">Email cannot be changed</p>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Profile Picture URL</label>
            <input
              className="input"
              value={form.profilePicture}
              onChange={(e) => setForm({ ...form, profilePicture: e.target.value })}
              placeholder="https://example.com/profile.jpg"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Phone</label>
            <input
              className="input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+91 9876543210"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Location</label>
            <input
              className="input"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Aligarh, UP, India"
            />
          </div>
          <div className="pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary flex items-center gap-2"
            >
              <Save size={18} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StoresManagement() {
  const { showToast } = useToast();
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStoreForm, setShowStoreForm] = useState(false);
  const [editingStore, setEditingStore] = useState<any>(null);
  const [form, setForm] = useState({
    name: '',
    address: {
      street: '',
      area: '',
      city: '',
      district: '',
      state: '',
      pincode: '',
      country: 'India'
    },
    coordinates: {
      lat: '',
      lng: ''
    },
    phone: '',
    googleMapsLink: '',
    operating_hours: '9:00 AM - 9:00 PM',
    landmark: '',
    serviceRadius: 50
  });

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ success: boolean; stores: any[] }>('/stores');
      if (response.success) {
        setStores(response.stores || []);
      }
    } catch (error) {
      console.error('Failed to fetch stores:', error);
      showToast('Failed to load stores', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingStore) {
        await api.put(`/stores/${editingStore._id}`, form);
        showToast('Store updated successfully', 'success');
      } else {
        await api.post('/stores', form);
        showToast('Store created successfully', 'success');
      }
      setShowStoreForm(false);
      setEditingStore(null);
      resetForm();
      fetchStores();
    } catch (error) {
      console.error('Failed to save store:', error);
      showToast('Failed to save store', 'error');
    }
  };

  const handleEdit = (store: any) => {
    setEditingStore(store);
    setForm({
      name: store.name,
      address: store.address,
      coordinates: store.coordinates,
      phone: store.phone || '',
      googleMapsLink: store.googleMapsLink || '',
      operating_hours: store.operating_hours || '9:00 AM - 9:00 PM',
      landmark: store.landmark || '',
      serviceRadius: store.serviceRadius || 50
    });
    setShowStoreForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this store?')) return;
    try {
      await api.delete(`/stores/${id}`);
      showToast('Store deleted successfully', 'success');
      fetchStores();
    } catch (error) {
      console.error('Failed to delete store:', error);
      showToast('Failed to delete store', 'error');
    }
  };

  const handleToggleActive = async (store: any) => {
    try {
      await api.patch(`/stores/${store._id}/toggle`);
      showToast(`Store ${store.is_active ? 'deactivated' : 'activated'} successfully`, 'success');
      fetchStores();
    } catch (error) {
      console.error('Failed to toggle store status:', error);
      showToast('Failed to toggle store status', 'error');
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      address: {
        street: '',
        area: '',
        city: '',
        district: '',
        state: '',
        pincode: '',
        country: 'India'
      },
      coordinates: {
        lat: '',
        lng: ''
      },
      phone: '',
      googleMapsLink: '',
      operating_hours: '9:00 AM - 9:00 PM',
      landmark: '',
      serviceRadius: 50
    });
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setForm({
            ...form,
            coordinates: {
              lat: position.coords.latitude.toString(),
              lng: position.coords.longitude.toString()
            }
          });
          showToast('Location captured successfully', 'success');
        },
        (error) => {
          console.error('Geolocation error:', error);
          showToast('Failed to get location', 'error');
        }
      );
    } else {
      showToast('Geolocation not supported', 'error');
    }
  };

  if (showStoreForm) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-2xl font-bold text-neutral-900 dark:text-white">
            {editingStore ? 'Edit Store' : 'Add New Store'}
          </h1>
          <button onClick={() => { setShowStoreForm(false); setEditingStore(null); resetForm(); }} className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white">
            <X size={24} />
          </button>
        </div>
        <div className="card p-6 space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Store Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Mahir & Friends - Aligarh Main Store" />
          </div>

          <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
            <h3 className="font-medium mb-3 text-neutral-900 dark:text-white">Address Details</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Street Address</label>
                <input className="input" value={form.address.street} onChange={(e) => setForm({ ...form, address: { ...form.address, street: e.target.value } })} placeholder="e.g., Shop 123, Main Market" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Area (Optional)</label>
                <input className="input" value={form.address.area} onChange={(e) => setForm({ ...form, address: { ...form.address, area: e.target.value } })} placeholder="e.g., Civil Lines" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">City</label>
                  <input className="input" value={form.address.city} onChange={(e) => setForm({ ...form, address: { ...form.address, city: e.target.value } })} placeholder="e.g., Aligarh" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">District (Optional)</label>
                  <input className="input" value={form.address.district} onChange={(e) => setForm({ ...form, address: { ...form.address, district: e.target.value } })} placeholder="e.g., Aligarh" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">State</label>
                  <input className="input" value={form.address.state} onChange={(e) => setForm({ ...form, address: { ...form.address, state: e.target.value } })} placeholder="e.g., Uttar Pradesh" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Pincode</label>
                  <input className="input" value={form.address.pincode} onChange={(e) => setForm({ ...form, address: { ...form.address, pincode: e.target.value } })} placeholder="e.g., 202001" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Landmark (Optional)</label>
                <input className="input" value={form.landmark} onChange={(e) => setForm({ ...form, landmark: e.target.value })} placeholder="e.g., Near Civil Lines Court" />
              </div>
            </div>
          </div>

          <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
            <h3 className="font-medium mb-3 text-neutral-900 dark:text-white">Location Coordinates</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Latitude</label>
                  <input type="number" step="any" className="input" value={form.coordinates.lat} onChange={(e) => setForm({ ...form, coordinates: { ...form.coordinates, lat: e.target.value } })} placeholder="e.g., 27.8974" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Longitude</label>
                  <input type="number" step="any" className="input" value={form.coordinates.lng} onChange={(e) => setForm({ ...form, coordinates: { ...form.coordinates, lng: e.target.value } })} placeholder="e.g., 78.0880" />
                </div>
              </div>
              <button onClick={getCurrentLocation} className="btn-secondary text-sm flex items-center gap-2">
                <MapPin size={16} />
                Get Current Location
              </button>
              <div>
                <label className="text-sm font-medium mb-1 block">Google Maps Link (Optional)</label>
                <input className="input" value={form.googleMapsLink} onChange={(e) => setForm({ ...form, googleMapsLink: e.target.value })} placeholder="https://www.google.com/maps/..." />
              </div>
            </div>
          </div>

          <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
            <h3 className="font-medium mb-3 text-neutral-900 dark:text-white">Service Settings</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Service Radius (km)</label>
                <input type="number" className="input" value={form.serviceRadius} onChange={(e) => setForm({ ...form, serviceRadius: Number(e.target.value) })} placeholder="e.g., 50" />
                <p className="text-xs text-neutral-500 mt-1">Maximum distance from store for delivery service</p>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Operating Hours</label>
                <input className="input" value={form.operating_hours} onChange={(e) => setForm({ ...form, operating_hours: e.target.value })} placeholder="e.g., 9:00 AM - 9:00 PM" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Phone Number (Optional)</label>
                <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="e.g., +91-9876543210" />
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button onClick={handleSave} className="btn-primary flex-1">
              {editingStore ? 'Update Store' : 'Create Store'}
            </button>
            <button onClick={() => { setShowStoreForm(false); setEditingStore(null); resetForm(); }} className="btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold text-neutral-900 dark:text-white">Stores Management</h1>
        <button onClick={() => { setEditingStore(null); resetForm(); setShowStoreForm(true); }} className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          Add New Store
        </button>
      </div>

      {loading ? (
        <div className="card p-8 text-center">
          <p className="text-neutral-500">Loading stores...</p>
        </div>
      ) : stores.length === 0 ? (
        <div className="card p-8 text-center">
          <MapPin size={40} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-2" />
          <p className="text-neutral-500">No stores added yet</p>
          <p className="text-sm text-neutral-400 mt-1">Add your first store to start delivery operations</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 dark:bg-neutral-800">
                <tr className="text-left text-neutral-500">
                  <th className="p-3 font-medium">Store Name</th>
                  <th className="p-3 font-medium">Location</th>
                  <th className="p-3 font-medium">Service Radius</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stores.map((store) => (
                  <tr key={store._id} className="border-t border-neutral-100 dark:border-neutral-700">
                    <td className="p-3">
                      <div className="font-medium text-neutral-900 dark:text-white">{store.name}</div>
                      <div className="text-xs text-neutral-500">{store.phone || 'No phone'}</div>
                    </td>
                    <td className="p-3">
                      <div className="text-neutral-600 dark:text-neutral-400">
                        {store.address.street}, {store.address.city}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {store.address.state} - {store.address.pincode}
                      </div>
                      {store.googleMapsLink && (
                        <a href={store.googleMapsLink} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-600 hover:underline">
                          View on Maps
                        </a>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="text-neutral-600 dark:text-neutral-400">{store.serviceRadius || 50} km</span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        store.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                      }`}>
                        {store.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEdit(store)} className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded" title="Edit">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleToggleActive(store)} className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded" title="Toggle Status">
                          {store.is_active ? <XCircle size={16} /> : <CheckCircle size={16} />}
                        </button>
                        <button onClick={() => handleDelete(store._id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900 rounded text-red-500" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
