import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingBag, Tag, MapPin, Users, LogOut,
  TrendingUp, DollarSign, Clock, XCircle, CheckCircle, Plus, Edit, Trash2,
  Eye, Search, X, Save, Gift, Download, Bell, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useToast } from '../lib/toast';
import { api } from '../lib/api';
import { formatPrice, formatDate } from '../lib/utils';
import type { Product, Category, Order, Coupon, ComboPack, GiftCard } from '../lib/types';
import { StatsCardSkeleton } from '../components/LoadingSkeleton';
import { AdminAnalytics } from '../components/AdminAnalytics';

type AdminTab = 'dashboard' | 'products' | 'categories' | 'orders' | 'coupons' | 'combos' | 'giftcards' | 'delivery' | 'delivery-partners' | 'users' | 'notifications' | 'analytics';

export function AdminPage() {
  const navigate = useNavigate();
  const { isAdmin, adminSignOut } = useAuth();
  const { showToast } = useToast();
  const [tab, setTab] = useState<AdminTab>('dashboard');
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
  const [loading, setLoading] = useState(true);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (!isAdmin) { navigate('/admin/login'); return; }
    fetchAll();

    // Poll for order updates every 30 seconds
    const interval = setInterval(() => {
      fetchAll();
    }, 30000);

    return () => clearInterval(interval);
  }, [isAdmin, navigate]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [productsRes, ordersRes, catsRes, couponsRes, combosRes, gcRes, partnersRes, notifRes] = await Promise.all([
        api.get<{ success: boolean; products: Product[] }>('/products'),
        api.get<{ success: boolean; orders: Order[] }>('/orders'),
        api.get<{ success: boolean; categories: Category[] }>('/categories'),
        api.get<{ success: boolean; coupons: Coupon[] }>('/coupons'),
        api.get<{ success: boolean; combos: ComboPack[] }>('/combos'),
        api.get<{ success: boolean; giftCards: GiftCard[] }>('/gift-cards'),
        api.get<{ success: boolean; partners: any[] }>('/orders/active-delivery-partners'),
        api.get<{ success: boolean; notifications: any[] }>('/notifications'),
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
    if (!confirm('Delete this product?')) return;
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
      setOrders((prev) => prev.map((o) => o._id === orderId ? { ...o, status, timeline: update.timeline } : o));
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
          pickupOTP: o.delivery?.pickupOTP ?? null,
          deliveryOTP: o.delivery?.deliveryOTP ?? null,
          storeAddress: o.delivery?.storeAddress ?? null,
          storeCoordinates: o.delivery?.storeCoordinates,
          storeContact: o.delivery?.storeContact ?? null,
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
    if (!confirm('Delete this coupon?')) return;
    try {
      await api.delete(`/coupons/${id}`);
      setCoupons((prev) => prev.filter((c) => c._id !== id));
      showToast('Coupon deleted', 'info');
    } catch (error) {
      console.error('Failed to delete coupon:', error);
    }
  };

  const deleteCombo = async (id: string) => {
    if (!confirm('Delete this combo pack?')) return;
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
    if (!confirm('Delete this gift card?')) return;
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
    { id: 'users' as AdminTab, label: 'Users', icon: Users },
    { id: 'analytics' as AdminTab, label: 'Analytics', icon: TrendingUp },
    { id: 'notifications' as AdminTab, label: 'Notifications', icon: Bell },
  ];

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex">
      <aside className="w-64 bg-neutral-900 text-white flex-shrink-0 hidden lg:flex flex-col fixed inset-y-0 left-0 z-40">
        <div className="p-6 border-b border-neutral-800">
          <Link to="/" className="font-serif text-xl font-bold">MAHIR <span className="text-brand-500">& FRIENDS</span></Link>
          <p className="text-xs text-neutral-400 mt-1">Admin Panel</p>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => setTab(item.id)} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === item.id ? 'bg-brand-600 text-white' : 'text-neutral-300 hover:bg-neutral-800'}`}>
              <item.icon size={18} /> {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-neutral-800">
          <button onClick={() => { adminSignOut(); navigate('/'); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-neutral-800">
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-neutral-900 z-40 flex justify-around py-2 overflow-x-auto scrollbar-hide">
        {navItems.map((item) => (
          <button key={item.id} onClick={() => setTab(item.id)} className={`p-2 flex-shrink-0 ${tab === item.id ? 'text-brand-500' : 'text-neutral-400'}`}>
            <item.icon size={20} />
          </button>
        ))}
      </div>

      <main className="flex-1 lg:ml-64 p-4 sm:p-6 pb-20 lg:pb-6">
        <div className="lg:hidden mb-4">
          <Link to="/" className="font-serif text-lg font-bold text-neutral-900 dark:text-white">MAHIR <span className="text-brand-600">& FRIENDS</span></Link>
          <p className="text-xs text-neutral-500">Admin Panel</p>
        </div>

        {tab === 'dashboard' && (
          <div className="space-y-6">
            <h1 className="font-serif text-2xl font-bold text-neutral-900 dark:text-white">Dashboard</h1>

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

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => <StatsCardSkeleton key={i} />)
              ) : [
                { label: 'Total Sales', value: formatPrice(stats.totalSales), icon: DollarSign, color: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300' },
                { label: "Today's Sales", value: formatPrice(stats.todaySales), icon: TrendingUp, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' },
                { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingBag, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300' },
                { label: 'Products', value: stats.totalProducts, icon: Package, color: 'bg-accent-100 text-accent-600 dark:bg-accent-900 dark:text-accent-300' },
                { label: 'Customers', value: stats.totalCustomers, icon: Users, color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300' },
                { label: 'Pending Orders', value: stats.pendingOrders, icon: Clock, color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300' },
                { label: 'Delivered', value: stats.deliveredOrders, icon: CheckCircle, color: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300' },
                { label: 'Cancelled', value: stats.cancelledOrders, icon: XCircle, color: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300' },
              ].map((stat, i) => (
                <div key={i} className="card p-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${stat.color}`}><stat.icon size={20} /></div>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stat.value}</p>
                  <p className="text-xs text-neutral-500 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="card p-5">
              <h2 className="font-semibold text-lg text-neutral-900 dark:text-white mb-4">Recent Orders</h2>
              {recentOrders.length === 0 ? <p className="text-neutral-500 text-sm">No orders yet</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-left text-neutral-500 border-b border-neutral-100 dark:border-neutral-700">
                      <th className="pb-2 font-medium">Order #</th><th className="pb-2 font-medium">Date</th><th className="pb-2 font-medium">Total</th><th className="pb-2 font-medium">Status</th>
                    </tr></thead>
                    <tbody>{recentOrders.map((order) => (
                      <tr key={order._id} className="border-b border-neutral-50 dark:border-neutral-800">
                        <td className="py-3 font-mono text-xs">{order.order_number}</td>
                        <td className="py-3 text-neutral-500">{formatDate(order.created_at)}</td>
                        <td className="py-3 font-medium">{formatPrice(order.total)}</td>
                        <td className="py-3"><span className="text-xs px-2 py-1 rounded-full bg-neutral-100 dark:bg-neutral-700 capitalize">{order.status}</span></td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="card p-5">
                <h2 className="font-semibold text-lg text-neutral-900 dark:text-white mb-4">Top Products</h2>
                <div className="space-y-2">
                  {products.slice(0, 5).map((p) => (
                    <div key={p._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800">
                      <img src={p.images[0]} alt="" className="w-10 h-12 object-cover rounded" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 dark:text-white line-clamp-1">{p.name}</p>
                        <p className="text-xs text-neutral-500">{formatPrice(p.price)} &bull; Stock: {p.stock}</p>
                      </div>
                      <span className="text-xs text-neutral-500">{p.review_count} reviews</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card p-5">
                <h2 className="font-semibold text-lg text-neutral-900 dark:text-white mb-4">Sales by Category</h2>
                <div className="space-y-3">
                  {categories.slice(0, 5).map((cat) => {
                    const categoryOrders = orders.filter(o => o.items?.some((i: any) => i.category_id === cat._id));
                    const categorySales = categoryOrders.reduce((sum, o) => sum + o.total, 0);
                    const percentage = stats.totalSales > 0 ? (categorySales / stats.totalSales) * 100 : 0;
                    return (
                      <div key={cat._id}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-neutral-700 dark:text-neutral-300">{cat.name}</span>
                          <span className="text-neutral-500">{formatPrice(categorySales)}</span>
                        </div>
                        <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-500 rounded-full" style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="card p-5">
              <h2 className="font-semibold text-lg text-neutral-900 dark:text-white mb-4">Order Status Distribution</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Pending', count: stats.pendingOrders, color: 'bg-yellow-500' },
                  { label: 'Confirmed', count: orders.filter(o => o.status === 'confirmed').length, color: 'bg-blue-500' },
                  { label: 'Processing', count: orders.filter(o => o.status === 'processing').length, color: 'bg-purple-500' },
                  { label: 'Out for Delivery', count: orders.filter(o => o.status === 'out_for_delivery').length, color: 'bg-orange-500' },
                  { label: 'Delivered', count: stats.deliveredOrders, color: 'bg-green-500' },
                  { label: 'Cancelled', count: stats.cancelledOrders, color: 'bg-red-500' },
                  { label: 'Returned', count: orders.filter(o => o.status === 'returned').length, color: 'bg-gray-500' },
                  { label: 'Refunded', count: orders.filter(o => o.status === 'refunded').length, color: 'bg-pink-500' },
                ].map((status) => (
                  <div key={status.label} className="text-center">
                    <div className={`w-12 h-12 ${status.color} rounded-full flex items-center justify-center mx-auto mb-2`}>
                      <span className="text-white font-bold">{status.count}</span>
                    </div>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">{status.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'products' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h1 className="font-serif text-2xl font-bold text-neutral-900 dark:text-white">Products</h1>
              <button onClick={() => { setEditingProduct(null); setShowProductForm(true); }} className="btn-primary text-sm flex items-center gap-2"><Plus size={16} /> Add Product</button>
            </div>
            <div className="relative max-w-sm">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input type="text" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
            </div>
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 dark:bg-neutral-800"><tr className="text-left text-neutral-500">
                    <th className="p-3 font-medium">Product</th><th className="p-3 font-medium">Price</th><th className="p-3 font-medium">Stock</th><th className="p-3 font-medium">Status</th><th className="p-3 font-medium">Actions</th>
                  </tr></thead>
                  <tbody>{filteredProducts.map((p) => (
                    <tr key={p._id} className="border-t border-neutral-100 dark:border-neutral-700">
                      <td className="p-3"><div className="flex items-center gap-2">
                        <img src={p.images[0]} alt="" className="w-10 h-12 object-cover rounded" />
                        <div className="min-w-0"><p className="font-medium text-neutral-900 dark:text-white line-clamp-1">{p.name}</p><p className="text-xs text-neutral-500">{p.sku}</p></div>
                      </div></td>
                      <td className="p-3 font-medium">{formatPrice(p.price)}</td>
                      <td className="p-3"><span className={p.stock < 10 ? 'text-red-500 font-medium' : ''}>{p.stock}</span></td>
                      <td className="p-3"><span className={`text-xs px-2 py-1 rounded-full ${p.is_published ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300' : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-700'}`}>{p.is_published ? 'Published' : 'Hidden'}</span></td>
                      <td className="p-3"><div className="flex gap-1">
                        <Link to={`/product/${p.slug}`} target="_blank" className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded" title="View"><Eye size={16} /></Link>
                        <button onClick={() => { setEditingProduct(p); setShowProductForm(true); }} className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded" title="Edit"><Edit size={16} /></button>
                        <button onClick={() => togglePublish(p)} className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded" title="Toggle publish">{p.is_published ? <XCircle size={16} /> : <CheckCircle size={16} />}</button>
                        <button onClick={() => deleteProduct(p._id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900 rounded text-red-500" title="Delete"><Trash2 size={16} /></button>
                      </div></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === 'orders' && (
          <div className="space-y-4">
            <h1 className="font-serif text-2xl font-bold text-neutral-900 dark:text-white">Orders</h1>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {['all', 'pending', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'].map((status) => (
                <button key={status} onClick={() => setOrderFilter(status)} className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-all ${orderFilter === status ? 'bg-brand-600 text-white' : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700'}`}>
                  {status === 'all' ? 'All' : status.replace('_', ' ')}
                </button>
              ))}
            </div>
            {filteredOrders.length === 0 ? (
              <div className="card p-8 text-center"><ShoppingBag size={40} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-2" /><p className="text-neutral-500">No orders found</p></div>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map((order) => (
                  <div key={order._id} className="card p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div><p className="font-mono text-sm font-medium text-neutral-900 dark:text-white">{order.order_number}</p><p className="text-xs text-neutral-500">{formatDate(order.created_at)} &bull; {formatPrice(order.total)}</p></div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-700 capitalize">{order.status.replace('_', ' ')}</span>
                        <select value={order.status} onChange={(e) => updateOrderStatus(order._id, e.target.value)} className="text-xs px-2 py-1 rounded border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800">
                          {['pending', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'].map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      {order.items?.map((item: any, i: number) => (
                        <div key={i} className="flex gap-2 items-center text-sm">
                          <img src={item.product_image ?? ''} alt="" className="w-8 h-10 object-cover rounded" />
                          <span className="flex-1 line-clamp-1">{item.product_name}</span>
                          <span className="text-neutral-500">x{item.quantity}</span>
                          <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-700 flex justify-between text-xs text-neutral-500">
                      <span>Payment: {order.payment_method.toUpperCase()} <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-medium ${order.payment_status === 'paid' ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300' : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300'}`}>{order.payment_status === 'paid' ? 'PAID' : 'PENDING'}</span></span>
                      <span>{order.address_snapshot?.city}, {order.address_snapshot?.state}</span>
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
        {tab === 'users' && <UsersManagement />}
        {tab === 'analytics' && <AdminAnalytics />}
        {tab === 'notifications' && (
          <div className="space-y-4">
            <h1 className="font-serif text-2xl font-bold text-neutral-900 dark:text-white">Notifications</h1>
            <div className="card p-5">
              {notifications.length === 0 ? (
                <p className="text-neutral-500 text-sm">No notifications</p>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notif) => (
                    <div key={notif._id} className={`p-4 rounded-lg border ${notif.is_read ? 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700' : 'bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-800'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h3 className="font-medium text-neutral-900 dark:text-white">{notif.title}</h3>
                          <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1">{notif.message}</p>
                          <p className="text-xs text-neutral-400 mt-2">{formatDate(notif.createdAt)}</p>
                        </div>
                        {!notif.is_read && (
                          <span className="w-2 h-2 bg-brand-500 rounded-full flex-shrink-0 mt-2"></span>
                        )}
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
  const [form, setForm] = useState({
    name: product?.name ?? '', slug: product?.slug ?? '', description: product?.description ?? '', brand: product?.brand ?? 'MAHIR & FRIENDS',
    category_id: product?.category_id ?? categories[0]?._id ?? '', price: product?.price ?? 0, compare_at_price: product?.compare_at_price ?? 0,
    stock: product?.stock ?? 0, sku: product?.sku ?? '', sizes: product?.sizes?.join(', ') ?? '', colors: product?.colors?.join(', ') ?? '',
    material: product?.material ?? '', gender: product?.gender ?? 'unisex',
    images: product?.images?.join('\n') ?? 'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=600',
    is_published: product?.is_published ?? true, is_featured: product?.is_featured ?? false, is_trending: product?.is_trending ?? false,
    is_bestseller: product?.is_bestseller ?? false, is_new_arrival: product?.is_new_arrival ?? false, is_flash_sale: product?.is_flash_sale ?? false, is_premium: product?.is_premium ?? false,
  });

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
      images: form.images.split('\n').map((s) => s.trim()).filter(Boolean), is_published: form.is_published, is_featured: form.is_featured,
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
          <div><label className="text-sm font-medium mb-1 block">Image URLs (one per line)</label><textarea className="input min-h-[80px]" value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} /></div>
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
    if (!confirm('Delete this delivery location?')) return;
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
    if (!confirm('Delete this category?')) return;
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
        showToast('Partner approved successfully', 'success');
        fetchPartners();
      } else {
        showToast(data.message || 'Failed to approve partner', 'error');
      }
    } catch (error) {
      showToast('Error approving partner', 'error');
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

  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  const [showPartnerDetails, setShowPartnerDetails] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editFormData, setEditFormData] = useState<any>(null);

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

  const filteredPartners = filter === 'all' ? partners : partners.filter(p => p.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold text-neutral-900 dark:text-white">Delivery Partners</h1>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {['pending', 'approved', 'payment_pending', 'active', 'inactive', 'suspended', 'rejected', 'all'].map((status) => (
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
                        partner.status === 'approved' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' :
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
                        <button onClick={() => downloadPartnerPDF(partner._id, partner.personalDetails?.fullName)} className="text-purple-600 hover:text-purple-700" title="Download PDF">
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
                              if (reason) updatePartnerStatus(partner._id, 'rejected', reason);
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
    </div>
  );
}

function UsersManagement() {
  const [users, setUsers] = useState<any[]>([]);
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get<{ success: boolean; orders: Order[] }>('/orders');
        const userMap = new Map();
        response.orders?.forEach((o) => {
          if (!userMap.has(o.user_id)) userMap.set(o.user_id, { id: o.user_id, orders: 0, spent: 0 });
          const u = userMap.get(o.user_id);
          u.orders += 1; u.spent += o.total;
        });
        setUsers(Array.from(userMap.values()));
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    };
    fetchUsers();
  }, []);
  return (
    <div className="space-y-4">
      <h1 className="font-serif text-2xl font-bold text-neutral-900 dark:text-white">Customers</h1>
      {users.length === 0 ? (
        <div className="card p-8 text-center"><Users size={40} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-2" /><p className="text-neutral-500">No customers yet</p></div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 dark:bg-neutral-800"><tr className="text-left text-neutral-500">
                <th className="p-3 font-medium">Customer ID</th><th className="p-3 font-medium">Orders</th><th className="p-3 font-medium">Total Spent</th>
              </tr></thead>
              <tbody>{users.map((u) => (
                <tr key={u.id} className="border-t border-neutral-100 dark:border-neutral-700">
                  <td className="p-3 font-mono text-xs">{u.id.slice(0, 8)}...</td>
                  <td className="p-3">{u.orders}</td>
                  <td className="p-3 font-medium">{formatPrice(u.spent)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
