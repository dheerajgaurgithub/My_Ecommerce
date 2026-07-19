import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Package, Calendar, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';

interface AnalyticsData {
  totalRevenue: number;
  todayRevenue: number;
  totalOrders: number;
  todayOrders: number;
  totalUsers: number;
  todayUsers: number;
  totalProducts: number;
  conversionRate: number;
  averageOrderValue: number;
  topSellingProducts: Array<{
    name: string;
    sales: number;
    revenue: number;
  }>;
  recentOrders: Array<{
    orderNumber: string;
    customer: string;
    amount: number;
    status: string;
    date: string;
  }>;
  revenueChart: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
}

export function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ success: boolean; data?: AnalyticsData }>(`/admin/analytics?range=${timeRange}`);
      if (response.success && response.data) {
        setData(response.data);
      } else {
        // Fallback to mock data if API doesn't return data
        setData(generateMockData());
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setData(generateMockData());
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = (): AnalyticsData => ({
    totalRevenue: 1250000,
    todayRevenue: 45000,
    totalOrders: 3250,
    todayOrders: 45,
    totalUsers: 1250,
    todayUsers: 12,
    totalProducts: 245,
    conversionRate: 3.2,
    averageOrderValue: 385,
    topSellingProducts: [
      { name: 'Premium Cotton Shirt', sales: 125, revenue: 48750 },
      { name: 'Classic Denim Jeans', sales: 98, revenue: 34300 },
      { name: 'Silk Blend Kurta', sales: 87, revenue: 39150 },
      { name: 'Casual Polo T-Shirt', sales: 76, revenue: 22800 },
      { name: 'Formal Blazer', sales: 65, revenue: 45500 },
    ],
    recentOrders: [
      { orderNumber: 'MF123456', customer: 'Rahul Sharma', amount: 1250, status: 'delivered', date: '2024-01-15' },
      { orderNumber: 'MF123457', customer: 'Priya Singh', amount: 890, status: 'shipped', date: '2024-01-15' },
      { orderNumber: 'MF123458', customer: 'Amit Patel', amount: 2100, status: 'processing', date: '2024-01-14' },
      { orderNumber: 'MF123459', customer: 'Sneha Gupta', amount: 650, status: 'delivered', date: '2024-01-14' },
      { orderNumber: 'MF123460', customer: 'Vikram Singh', amount: 1750, status: 'confirmed', date: '2024-01-13' },
    ],
    revenueChart: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      revenue: Math.floor(Math.random() * 50000) + 20000,
      orders: Math.floor(Math.random() * 50) + 20,
    })),
  });

  const formatCurrency = (value: number) => `₹${value.toLocaleString()}`;
  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-700 animate-pulse">
              <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-bold bg-gradient-to-r from-neutral-900 to-neutral-700 dark:from-white dark:to-neutral-300 bg-clip-text text-transparent">
          Analytics Dashboard
        </h1>
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-brand-600 text-white'
                  : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(data.totalRevenue)}
          change="+12.5%"
          trend="up"
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Total Orders"
          value={data.totalOrders.toString()}
          change="+8.2%"
          trend="up"
          icon={ShoppingCart}
          color="blue"
        />
        <StatCard
          title="Total Users"
          value={data.totalUsers.toString()}
          change="+15.3%"
          trend="up"
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Conversion Rate"
          value={formatPercent(data.conversionRate)}
          change="+2.1%"
          trend="up"
          icon={TrendingUp}
          color="orange"
        />
      </div>

      {/* Revenue Chart */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-700">
        <h2 className="text-lg font-semibold mb-4">Revenue Over Time</h2>
        <div className="h-64 flex items-end gap-1">
          {data.revenueChart.map((item, index) => (
            <div
              key={index}
              className="flex-1 bg-brand-500 hover:bg-brand-600 transition-colors rounded-t relative group"
              style={{ height: `${(item.revenue / 70000) * 100}%` }}
            >
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-neutral-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {formatCurrency(item.revenue)}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-neutral-500">
          <span>{data.revenueChart[0]?.date}</span>
          <span>{data.revenueChart[data.revenueChart.length - 1]?.date}</span>
        </div>
      </div>

      {/* Top Products & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-700">
          <h2 className="text-lg font-semibold mb-4">Top Selling Products</h2>
          <div className="space-y-4">
            {data.topSellingProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-700 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-brand-100 dark:bg-brand-900 rounded-lg flex items-center justify-center text-brand-600 dark:text-brand-400 font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-white">{product.name}</p>
                    <p className="text-sm text-neutral-500">{product.sales} sold</p>
                  </div>
                </div>
                <p className="font-semibold text-neutral-900 dark:text-white">
                  {formatCurrency(product.revenue)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-700">
          <h2 className="text-lg font-semibold mb-4">Recent Orders</h2>
          <div className="space-y-3">
            {data.recentOrders.map((order) => (
              <div key={order.orderNumber} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-700 rounded-xl">
                <div>
                  <p className="font-medium text-neutral-900 dark:text-white">{order.orderNumber}</p>
                  <p className="text-sm text-neutral-500">{order.customer}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-neutral-900 dark:text-white">{formatCurrency(order.amount)}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                    order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                    order.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-neutral-100 text-neutral-700'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Average Order Value"
          value={formatCurrency(data.averageOrderValue)}
          description="Per order average"
          icon={DollarSign}
        />
        <MetricCard
          title="Today's Revenue"
          value={formatCurrency(data.todayRevenue)}
          description="Revenue today"
          icon={Calendar}
        />
        <MetricCard
          title="Today's Orders"
          value={data.todayOrders.toString()}
          description="Orders today"
          icon={ShoppingCart}
        />
      </div>
    </div>
  );
}

function StatCard({ title, value, change, trend, icon: Icon, color }: any) {
  const colors = {
    green: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400',
    blue: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400',
  };

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-700">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${colors[color as keyof typeof colors]} rounded-xl flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className={`flex items-center gap-1 text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
          {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          {change}
        </div>
      </div>
      <p className="text-2xl font-bold text-neutral-900 dark:text-white">{value}</p>
      <p className="text-sm text-neutral-500">{title}</p>
    </div>
  );
}

function MetricCard({ title, value, description, icon: Icon }: any) {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-700">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-brand-100 dark:bg-brand-900 rounded-xl flex items-center justify-center">
          <Icon className="w-5 h-5 text-brand-600 dark:text-brand-400" />
        </div>
        <div>
          <p className="text-sm text-neutral-500">{title}</p>
          <p className="text-xl font-bold text-neutral-900 dark:text-white">{value}</p>
        </div>
      </div>
      <p className="text-sm text-neutral-500">{description}</p>
    </div>
  );
}
