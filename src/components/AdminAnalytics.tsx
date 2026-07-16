import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users, Package } from 'lucide-react';

interface AnalyticsData {
  salesOverTime: { date: string; sales: number; orders: number }[];
  topProducts: { name: string; sales: number; revenue: number }[];
  categoryPerformance: { category: string; revenue: number; percentage: number }[];
  customerGrowth: { date: string; customers: number }[];
}

export function AdminAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    // Simulate fetching analytics data
    setTimeout(() => {
      setData({
        salesOverTime: generateSalesData(timeRange),
        topProducts: [
          { name: 'Classic White Shirt', sales: 156, revenue: 234000 },
          { name: 'Denim Jacket', sales: 98, revenue: 196000 },
          { name: 'Summer Dress', sales: 87, revenue: 130500 },
          { name: 'Casual Sneakers', sales: 76, revenue: 114000 },
          { name: 'Wool Sweater', sales: 65, revenue: 97500 },
        ],
        categoryPerformance: [
          { category: 'Men', revenue: 450000, percentage: 35 },
          { category: 'Women', revenue: 520000, percentage: 40 },
          { category: 'Kids', revenue: 180000, percentage: 14 },
          { category: 'Accessories', revenue: 130000, percentage: 11 },
        ],
        customerGrowth: generateCustomerData(timeRange),
      });
      setLoading(false);
    }, 1000);
  }, [timeRange]);

  const generateSalesData = (range: string) => {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    return Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() - (days - i) * 86400000).toLocaleDateString(),
      sales: Math.floor(Math.random() * 50000) + 20000,
      orders: Math.floor(Math.random() * 200) + 50,
    }));
  };

  const generateCustomerData = (range: string) => {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    return Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() - (days - i) * 86400000).toLocaleDateString(),
      customers: Math.floor(Math.random() * 50) + 10,
    }));
  };

  if (loading) {
    return <div className="p-6">Loading analytics...</div>;
  }

  if (!data) return null;

  const totalRevenue = data.salesOverTime.reduce((sum, d) => sum + d.sales, 0);
  const totalOrders = data.salesOverTime.reduce((sum, d) => sum + d.orders, 0);
  const avgOrderValue = totalRevenue / totalOrders;
  const prevRevenue = totalRevenue * 0.85;
  const revenueGrowth = ((totalRevenue - prevRevenue) / prevRevenue) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Analytics Dashboard</h2>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as any)}
          className="px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm"
        >
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Revenue"
          value={`₹${(totalRevenue / 1000).toFixed(0)}K`}
          change={revenueGrowth}
          icon={DollarSign}
        />
        <MetricCard
          title="Total Orders"
          value={totalOrders}
          change={12.5}
          icon={ShoppingBag}
        />
        <MetricCard
          title="Avg Order Value"
          value={`₹${avgOrderValue.toFixed(0)}`}
          change={8.2}
          icon={Package}
        />
        <MetricCard
          title="Total Customers"
          value="2,456"
          change={15.3}
          icon={Users}
        />
      </div>

      {/* Sales Chart */}
      <div className="card p-6">
        <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">Revenue Over Time</h3>
        <div className="h-64 flex items-end gap-1">
          {data.salesOverTime.map((point, i) => {
            const maxSales = Math.max(...data.salesOverTime.map(d => d.sales));
            const height = (point.sales / maxSales) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-brand-500 rounded-t transition-all hover:bg-brand-600"
                  style={{ height: `${height}%` }}
                  title={`${point.date}: ₹${point.sales.toLocaleString()}`}
                />
                <span className="text-xs text-neutral-500 rotate-45 origin-left">
                  {point.date.split('/').slice(0, 2).join('/')}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="card p-6">
          <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">Top Products</h3>
          <div className="space-y-3">
            {data.topProducts.map((product, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-brand-100 dark:bg-brand-900 rounded-full flex items-center justify-center text-brand-600 font-medium text-sm">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-900 dark:text-white">{product.name}</p>
                  <p className="text-xs text-neutral-500">{product.sales} sold</p>
                </div>
                <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                  ₹{(product.revenue / 1000).toFixed(0)}K
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Category Performance */}
        <div className="card p-6">
          <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">Category Performance</h3>
          <div className="space-y-4">
            {data.categoryPerformance.map((cat, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-neutral-700 dark:text-neutral-300">{cat.category}</span>
                  <span className="text-neutral-500">₹{(cat.revenue / 1000).toFixed(0)}K ({cat.percentage}%)</span>
                </div>
                <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-500 rounded-full transition-all"
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Customer Growth */}
      <div className="card p-6">
        <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">Customer Growth</h3>
        <div className="h-48 flex items-end gap-1">
          {data.customerGrowth.map((point, i) => {
            const maxCustomers = Math.max(...data.customerGrowth.map(d => d.customers));
            const height = (point.customers / maxCustomers) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-green-500 rounded-t transition-all hover:bg-green-600"
                  style={{ height: `${height}%` }}
                  title={`${point.date}: ${point.customers} customers`}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, change, icon: Icon }: any) {
  const isPositive = change >= 0;
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <Icon size={18} className="text-neutral-500" />
        <span className={`text-xs font-medium flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {Math.abs(change).toFixed(1)}%
        </span>
      </div>
      <p className="text-2xl font-bold text-neutral-900 dark:text-white">{value}</p>
      <p className="text-xs text-neutral-500 mt-1">{title}</p>
    </div>
  );
}
