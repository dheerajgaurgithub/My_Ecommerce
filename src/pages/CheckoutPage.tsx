import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Check, MapPin, CreditCard, Truck, Wallet, Banknote, Shield, Loader2, Lock } from 'lucide-react';
import { useCart } from '../lib/cart';
import { useAuth } from '../lib/auth';
import { useToast } from '../lib/toast';
import { api } from '../lib/api';
import { formatPrice, getDeliveryDate } from '../lib/utils';
import type { Address } from '../lib/types';

export function CheckoutPage() {
  const navigate = useNavigate();
  const { items, cartSubtotal, clearCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({ full_name: '', phone: '', pincode: '', address_line: '', city: '', state: '' });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState<{ orderNumber: string; total: number; paymentMethod: string; paymentStatus: string; firstOrderDiscount?: number } | null>(null);
  const [hasFirstOrderDiscount, setHasFirstOrderDiscount] = useState(false);
  const [deliveryAvailable, setDeliveryAvailable] = useState(false);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [deliveryDays, setDeliveryDays] = useState(2);

  const checkoutData = JSON.parse(sessionStorage.getItem('checkout_data') ?? '{}');
  const baseSubtotal = checkoutData.subtotal ?? cartSubtotal;
  const discount = checkoutData.discount ?? 0;
  const giftWrapFee = checkoutData.giftWrapFee ?? 0;
  
  // Calculate first order discount
  const firstOrderDiscount = hasFirstOrderDiscount ? Math.round(baseSubtotal * 0.10) : 0;
  
  // Calculate tax on subtotal minus discounts
  const taxableAmount = baseSubtotal - discount - firstOrderDiscount;
  const tax = Math.round(taxableAmount * 0.05);
  
  // Shipping: free if delivery available, otherwise use delivery charge from backend or default
  const shipping = deliveryAvailable ? 0 : deliveryCharge;
  
  // Total calculation
  const total = baseSubtotal - discount - firstOrderDiscount + tax + shipping + giftWrapFee;

  // Check delivery availability based on selected address
  const checkDeliveryAvailability = async (addressId: string) => {
    const address = addresses.find(a => a._id === addressId);
    if (address && address.pincode) {
      try {
        const response = await api.get<{ success: boolean; available: boolean; charge?: number; days?: number }>(`/delivery/check/${address.pincode}`);
        setDeliveryAvailable(response.available);
        setDeliveryCharge(response.charge ?? 49);
        setDeliveryDays(response.days ?? 2);
      } catch (error) {
        console.error('Failed to check delivery availability:', error);
        setDeliveryAvailable(false);
        setDeliveryCharge(49);
        setDeliveryDays(2);
      }
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/checkout');
      return;
    }
    if (items.length === 0 && !orderPlaced) {
      navigate('/cart');
      return;
    }
    const fetchAddresses = async () => {
      try {
        const response = await api.get<{ success: boolean; addresses: Address[] }>('/addresses');
        const addr = response.addresses ?? [];
        setAddresses(addr);
        if (addr.length > 0) {
          setSelectedAddressId(addr[0]._id);
          checkDeliveryAvailability(addr[0]._id);
        } else {
          setShowAddressForm(true);
        }
      } catch (error) {
        console.error('Failed to fetch addresses:', error);
      }
    };
    fetchAddresses();

    // Check if user has first order discount available
    const checkFirstOrderDiscount = async () => {
      try {
        const response = await api.get<{ success: boolean; hasUsedFirstOrderDiscount: boolean }>('/users/first-order-status');
        setHasFirstOrderDiscount(!response.hasUsedFirstOrderDiscount);
      } catch (error) {
        console.error('Failed to check first order status:', error);
      }
    };
    checkFirstOrderDiscount();
  }, [user, items.length, navigate, orderPlaced]);

  // Check delivery availability when selected address changes
  useEffect(() => {
    if (selectedAddressId) {
      checkDeliveryAvailability(selectedAddressId);
    }
  }, [selectedAddressId]);

  const addAddress = async () => {
    if (!user) return;
    if (!newAddress.phone || newAddress.phone.trim().length < 10) {
      showToast('A valid mobile number (at least 10 digits) is required', 'error');
      return;
    }
    try {
      const response = await api.post<{ success: boolean; address: Address }>('/addresses', {
        ...newAddress,
        country: 'India',
        is_default: addresses.length === 0,
      });
      const addr = response.address;
      setAddresses((prev) => [...prev, addr]);
      setSelectedAddressId(addr._id);
      checkDeliveryAvailability(addr._id);
      setShowAddressForm(false);
      setNewAddress({ full_name: '', phone: '', pincode: '', address_line: '', city: '', state: '' });
      showToast('Address added', 'success');
    } catch (error) {
      showToast('Failed to add address', 'error');
    }
  };

  const placeOrder = async () => {
    if (!user || !selectedAddressId) {
      showToast('Please select a delivery address', 'error');
      return;
    }
    const address = addresses.find((a) => a._id === selectedAddressId);
    if (!address || !address.phone || address.phone.trim().length < 10) {
      showToast('A valid mobile number (at least 10 digits) is required to place the order', 'error');
      return;
    }
    setPlacing(true);

    // For online payments, show processing animation before creating the order
    if (paymentMethod !== 'cod') {
      setProcessingPayment(true);
      await new Promise((r) => setTimeout(r, 2500));
      setProcessingPayment(false);
    }

    try {
      const response = await api.post<{ success: boolean; order: any; firstOrderDiscount?: number }>('/orders', {
        address_id: selectedAddressId,
        payment_method: paymentMethod,
        delivery_type: deliveryAvailable ? 'express' : 'standard',
        coupon_code: checkoutData.couponCode ?? null,
      });

      if (!response.success) {
        showToast('Failed to place order', 'error');
        setPlacing(false);
        return;
      }

      const order = response.order;
      await clearCart();
      sessionStorage.removeItem('checkout_data');
      setPlacing(false);
      setOrderPlaced({ 
        orderNumber: order.order_number, 
        total: order.total, 
        paymentMethod, 
        paymentStatus: order.payment_status,
        firstOrderDiscount: response.firstOrderDiscount
      });
    } catch (error) {
      showToast('Failed to place order', 'error');
      setPlacing(false);
    }
  };

  if (orderPlaced) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto mb-6">
          <Check size={40} className="text-green-600" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-neutral-900 dark:text-white mb-2">Order Confirmed!</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mb-6">Thank you for your purchase. Your order is being processed.</p>
        {orderPlaced.firstOrderDiscount && orderPlaced.firstOrderDiscount > 0 && (
          <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-4 mb-6">
            <p className="text-green-700 dark:text-green-300 font-medium">🎉 First Order Discount Applied!</p>
            <p className="text-green-600 dark:text-green-400 text-sm">You saved {formatPrice(orderPlaced.firstOrderDiscount)} on your first order.</p>
          </div>
        )}
        <div className="card p-6 mb-6 text-left">
          <div className="flex justify-between mb-2">
            <span className="text-neutral-500 dark:text-neutral-400">Order Number</span>
            <span className="font-mono font-medium text-neutral-900 dark:text-white">{orderPlaced.orderNumber}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-neutral-500 dark:text-neutral-400">Amount {orderPlaced.paymentStatus === 'paid' ? 'Paid' : 'Payable'}</span>
            <span className="font-medium text-neutral-900 dark:text-white">{formatPrice(orderPlaced.total)}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-neutral-500 dark:text-neutral-400">Payment Method</span>
            <span className="font-medium text-neutral-900 dark:text-white uppercase">{orderPlaced.paymentMethod}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500 dark:text-neutral-400">Payment Status</span>
            <span className={`font-medium px-2.5 py-0.5 rounded-full text-xs ${orderPlaced.paymentStatus === 'paid' ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300' : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300'}`}>
              {orderPlaced.paymentStatus === 'paid' ? 'PAID' : 'Pending (Pay on Delivery)'}
            </span>
          </div>
          <div className="flex justify-between mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-700">
            <span className="text-neutral-500 dark:text-neutral-400">Expected Delivery</span>
            <span className="font-medium text-neutral-900 dark:text-white">{getDeliveryDate(3)}</span>
          </div>
        </div>
        <div className="flex gap-3 justify-center">
          <Link to="/account/orders" className="btn-primary">Track Order</Link>
          <Link to="/shop" className="btn-secondary">Continue Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white mb-6">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Address */}
          <section className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <MapPin size={20} className="text-brand-600" />
              <h2 className="font-semibold text-lg text-neutral-900 dark:text-white">Delivery Address</h2>
            </div>
            {addresses.length > 0 && !showAddressForm && (
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <label key={addr._id} className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${selectedAddressId === addr._id ? 'border-brand-600 bg-brand-50 dark:bg-brand-900' : 'border-neutral-200 dark:border-neutral-700'}`}>
                    <input type="radio" name="address" checked={selectedAddressId === addr._id} onChange={() => { setSelectedAddressId(addr._id); checkDeliveryAvailability(addr._id); }} className="mt-1 accent-brand-600" />
                    <div className="text-sm">
                      <p className="font-medium text-neutral-900 dark:text-white">{addr.full_name} <span className="text-neutral-500 font-normal">{addr.phone}</span></p>
                      <p className="text-neutral-600 dark:text-neutral-400 mt-1">{addr.address_line}, {addr.city}, {addr.state} - {addr.pincode}</p>
                    </div>
                  </label>
                ))}
                <button onClick={() => setShowAddressForm(true)} className="text-sm text-brand-600 hover:text-brand-700 font-medium">
                  + Add new address
                </button>
              </div>
            )}
            {showAddressForm && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input className="input" placeholder="Full Name" value={newAddress.full_name} onChange={(e) => setNewAddress({ ...newAddress, full_name: e.target.value })} />
                  <input className="input" placeholder="Mobile Number *" value={newAddress.phone} onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })} maxLength={10} inputMode="numeric" />
                </div>
                <input className="input" placeholder="Address Line" value={newAddress.address_line} onChange={(e) => setNewAddress({ ...newAddress, address_line: e.target.value })} />
                <div className="grid grid-cols-3 gap-3">
                  <input className="input" placeholder="City" value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} />
                  <input className="input" placeholder="State" value={newAddress.state} onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })} />
                  <input className="input" placeholder="Pincode" value={newAddress.pincode} onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })} />
                </div>
                <div className="flex gap-2">
                  <button onClick={addAddress} className="btn-primary text-sm">Save Address</button>
                  {addresses.length > 0 && (
                    <button onClick={() => setShowAddressForm(false)} className="btn-secondary text-sm">Cancel</button>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Delivery Info */}
          <section className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Truck size={20} className="text-brand-600" />
              <h2 className="font-semibold text-lg text-neutral-900 dark:text-white">Delivery Information</h2>
            </div>
            <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4">
              {!selectedAddressId ? (
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Select an address to check delivery availability</p>
              ) : deliveryAvailable ? (
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">✓ Delivery Available in Your Area</p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Estimated delivery: <span className="font-semibold text-neutral-900 dark:text-white">Within 24 hours</span></p>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">FREE Shipping</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">✕ Delivery Not Available in Your Area</p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Estimated delivery: <span className="font-semibold text-neutral-900 dark:text-white">Within 48 hours</span></p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">Shipping charge: <span className="font-semibold text-neutral-900 dark:text-white">{formatPrice(deliveryCharge)}</span></p>
                </div>
              )}
            </div>
          </section>

          {/* Payment */}
          <section className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard size={20} className="text-brand-600" />
              <h2 className="font-semibold text-lg text-neutral-900 dark:text-white">Payment Method</h2>
            </div>
            <div className="space-y-2">
              {[
                { id: 'cod', label: 'Cash on Delivery', icon: Banknote, desc: 'Pay when you receive' },
                { id: 'upi', label: 'UPI', icon: Wallet, desc: 'GPay, PhonePe, Paytm' },
                { id: 'card', label: 'Debit / Credit Card', icon: CreditCard, desc: 'Visa, Mastercard, RuPay' },
                { id: 'netbanking', label: 'Net Banking', icon: Wallet, desc: 'All major banks' },
                { id: 'razorpay', label: 'Razorpay', icon: Shield, desc: 'Secure payment gateway' },
              ].map((method) => (
                <label key={method.id} className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${paymentMethod === method.id ? 'border-brand-600 bg-brand-50 dark:bg-brand-900' : 'border-neutral-200 dark:border-neutral-700'}`}>
                  <input type="radio" checked={paymentMethod === method.id} onChange={() => setPaymentMethod(method.id)} className="accent-brand-600" />
                  <method.icon size={20} className="text-neutral-600 dark:text-neutral-400" />
                  <div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-white">{method.label}</p>
                    <p className="text-xs text-neutral-500">{method.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </section>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="card p-5 sticky top-24">
            <h2 className="font-semibold text-lg text-neutral-900 dark:text-white mb-4">Order Summary</h2>
            <div className="space-y-3 max-h-48 overflow-y-auto mb-4">
              {items.map((item) => {
                const product = typeof item.product_id === 'object' ? item.product_id : item.product;
                return (
                  <div key={item._id} className="flex gap-3 text-sm">
                    <img src={product?.images?.[0]} alt="" className="w-12 h-16 object-cover rounded" />
                    <div className="flex-1 min-w-0">
                      <p className="text-neutral-900 dark:text-white line-clamp-1">{product?.name}</p>
                      <p className="text-xs text-neutral-500">{item.size} &bull; {item.color} &bull; Qty {item.quantity}</p>
                      <p className="font-medium text-neutral-900 dark:text-white">{formatPrice((product?.price ?? 0) * item.quantity)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="space-y-2 text-sm border-t border-neutral-100 dark:border-neutral-700 pt-4">
              <div className="flex justify-between"><span className="text-neutral-600 dark:text-neutral-400">Subtotal</span><span className="font-medium">{formatPrice(baseSubtotal)}</span></div>
              {discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatPrice(discount)}</span></div>}
              {firstOrderDiscount > 0 && <div className="flex justify-between text-green-600"><span>First Order Discount (10%)</span><span>-{formatPrice(firstOrderDiscount)}</span></div>}
              {giftWrapFee > 0 && <div className="flex justify-between"><span className="text-neutral-600 dark:text-neutral-400">Gift Wrap</span><span className="font-medium">{formatPrice(giftWrapFee)}</span></div>}
              <div className="flex justify-between"><span className="text-neutral-600 dark:text-neutral-400">GST</span><span className="font-medium">{formatPrice(tax)}</span></div>
              <div className="flex justify-between"><span className="text-neutral-600 dark:text-neutral-400">Shipping</span><span className="font-medium">{shipping === 0 ? <span className="text-green-600">FREE</span> : formatPrice(shipping)}</span></div>
            </div>
            <div className="flex justify-between border-t border-neutral-100 dark:border-neutral-700 pt-4 mt-4">
              <span className="font-semibold text-neutral-900 dark:text-white">Total</span>
              <span className="font-bold text-lg text-neutral-900 dark:text-white">{formatPrice(total)}</span>
            </div>
            <button onClick={placeOrder} disabled={placing || !selectedAddressId} className="w-full btn-primary mt-5 disabled:opacity-50">
              {placing ? 'Placing Order...' : `Place Order = ${formatPrice(total)}`}
            </button>
            <p className="text-xs text-center text-neutral-500 mt-3 flex items-center justify-center gap-1">
              <Shield size={12} /> Secure & encrypted checkout
            </p>
          </div>
        </div>
      </div>

      {/* Payment Processing Modal */}
      {processingPayment && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl p-8 max-w-sm w-full text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center">
              <Loader2 className="animate-spin text-brand-600" size={32} />
            </div>
            <h2 className="font-serif text-xl font-bold text-neutral-900 dark:text-white mb-2">Processing Payment</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
              {paymentMethod === 'upi' ? 'Completing UPI payment...' : paymentMethod === 'card' ? 'Processing card payment...' : 'Processing payment...'}
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-neutral-400">
              <Lock size={12} /> Secured with 256-bit encryption
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
