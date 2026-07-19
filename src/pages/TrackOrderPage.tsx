import { useState } from 'react';
import { Package, Search, Truck, CheckCircle, Clock, XCircle, MapPin, Navigation } from 'lucide-react';
import { api } from '../lib/api';

export function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) return;

    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const response = await api.get<{ success: boolean; order: any }>(`/orders/${orderNumber}`);
      if (response.success) {
        setOrder(response.order);
      } else {
        setError('Order not found. Please check your order number.');
      }
    } catch (err) {
      setError('Failed to track order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle size={20} className="text-green-600" />;
      case 'cancelled': return <XCircle size={20} className="text-red-600" />;
      case 'shipped':
      case 'out_for_delivery': return <Truck size={20} className="text-blue-600" />;
      default: return <Clock size={20} className="text-amber-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'cancelled': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      case 'confirmed':
      case 'packed': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'shipped':
      case 'out_for_delivery': return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      default: return 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300';
    }
  };

  return (
    <div className="max-w-4xl lg:max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="mb-8 lg:mb-12 text-center">
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 dark:text-white mb-2 lg:mb-3">Track Your Order</h1>
        <p className="text-base lg:text-lg text-neutral-600 dark:text-neutral-400">Enter your order number to check the status</p>
      </div>

      <div className="card p-5 lg:p-8 mb-6 lg:mb-8">
        <form onSubmit={handleTrack} className="flex gap-3 lg:gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
              placeholder="Enter Order Number (e.g., MF123456789012)"
              className="input w-full text-base lg:text-lg"
              required
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2 px-6 lg:px-8">
            {loading ? 'Tracking...' : <><Search size={20} /> Track</>}
          </button>
        </form>
        {error && <p className="text-red-600 text-sm lg:text-base mt-3">{error}</p>}
      </div>

      {order && (
        <div className="card p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6 lg:mb-8 pb-4 lg:pb-6 border-b border-neutral-200 dark:border-neutral-700">
            <div>
              <p className="text-sm lg:text-base text-neutral-500">Order Number</p>
              <p className="font-semibold text-xl lg:text-2xl text-neutral-900 dark:text-white">{order.order_number}</p>
            </div>
            <div className={`px-4 lg:px-6 py-2 lg:py-3 rounded-full text-sm lg:text-base font-medium capitalize ${getStatusColor(order.status)}`}>
              {order.status.replace('_', ' ')}
            </div>
          </div>

          <div className="mb-6 lg:mb-8">
            <h3 className="font-semibold text-lg lg:text-xl text-neutral-900 dark:text-white mb-4 lg:mb-6 flex items-center gap-2">
              <Package size={22} /> Order Timeline
            </h3>
            <div className="space-y-4 lg:space-y-5">
              {order.timeline?.map((event: any, index: number) => (
                <div key={index} className="flex gap-4 lg:gap-6">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center">
                      {getStatusIcon(event.status.toLowerCase().replace(' ', '_'))}
                    </div>
                    {index < order.timeline.length - 1 && <div className="w-0.5 h-10 lg:h-12 bg-neutral-200 dark:bg-neutral-700" />}
                  </div>
                  <div className="flex-1 pb-4 lg:pb-6">
                    <p className="font-medium text-base lg:text-lg text-neutral-900 dark:text-white">{event.status}</p>
                    <p className="text-sm lg:text-base text-neutral-500">{new Date(event.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Tracking Section */}
          {order.status === 'out_for_delivery' || order.status === 'reached_store' || order.status === 'picked_up' || order.status === 'in_transit' ? (
            <div className="mb-6 lg:mb-8 pt-4 lg:pt-6 border-t border-neutral-200 dark:border-neutral-700">
              <h3 className="font-semibold text-lg lg:text-xl text-neutral-900 dark:text-white mb-4 lg:mb-6 flex items-center gap-2">
                <Navigation size={22} /> Live Delivery Tracking
              </h3>
              <div className="bg-neutral-50 dark:bg-neutral-700 rounded-xl p-4 lg:p-6">
                <div className="flex items-start gap-4 lg:gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3 lg:mb-4">
                      <MapPin size={20} className="text-brand-600" />
                      <span className="text-base lg:text-lg font-medium text-neutral-900 dark:text-white">Delivery Partner Location</span>
                    </div>
                    <div className="bg-white dark:bg-neutral-800 rounded-lg h-48 lg:h-56 flex items-center justify-center mb-3 lg:mb-4">
                      <div className="text-center">
                        <Truck size={36} className="text-brand-600 mx-auto mb-2" />
                        <p className="text-sm lg:text-base text-neutral-600 dark:text-neutral-400">
                          {order.status === 'out_for_delivery' ? 'Partner is on the way to store' :
                           order.status === 'reached_store' ? 'Partner at store, picking up order' :
                           order.status === 'picked_up' ? 'Order picked up, heading to you' :
                           'Partner is nearby'}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2 lg:space-y-3 text-sm lg:text-base">
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Estimated Arrival</span>
                        <span className="text-neutral-900 dark:text-white font-medium">
                          {order.delivery?.estimatedTime ? `${order.delivery.estimatedTime} mins` : 'Calculating...'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Delivery Partner</span>
                        <span className="text-neutral-900 dark:text-white font-medium">
                          {order.delivery?.partnerName || 'Assigned Partner'}
                        </span>
                      </div>
                      {order.delivery?.pickupOTP && (
                        <div className="flex justify-between items-center bg-yellow-50 dark:bg-yellow-900/20 p-3 lg:p-4 rounded-lg">
                          <span className="text-neutral-700 dark:text-neutral-300">Pickup OTP</span>
                          <span className="font-mono font-bold text-lg lg:text-xl text-yellow-700 dark:text-yellow-300">{order.delivery.pickupOTP}</span>
                        </div>
                      )}
                      {order.delivery?.deliveryOTP && (
                        <div className="flex justify-between items-center bg-green-50 dark:bg-green-900/20 p-3 lg:p-4 rounded-lg">
                          <span className="text-neutral-700 dark:text-neutral-300">Delivery OTP</span>
                          <span className="font-mono font-bold text-lg lg:text-xl text-green-700 dark:text-green-300">{order.delivery.deliveryOTP}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 pt-4 lg:pt-6 border-t border-neutral-200 dark:border-neutral-700">
            <div>
              <p className="text-sm lg:text-base text-neutral-500">Total Amount</p>
              <p className="font-semibold text-lg lg:text-xl text-neutral-900 dark:text-white">₹{order.total}</p>
            </div>
            <div>
              <p className="text-sm lg:text-base text-neutral-500">Payment Method</p>
              <p className="font-semibold text-base lg:text-lg text-neutral-900 dark:text-white capitalize">{order.payment_method}</p>
            </div>
            <div>
              <p className="text-sm lg:text-base text-neutral-500">Payment Status</p>
              <p className="font-semibold text-base lg:text-lg text-neutral-900 dark:text-white capitalize">{order.payment_status}</p>
            </div>
            <div>
              <p className="text-sm lg:text-base text-neutral-500">Order Date</p>
              <p className="font-semibold text-base lg:text-lg text-neutral-900 dark:text-white">{new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
