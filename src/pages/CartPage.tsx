import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingBag, Tag, Gift, X, ArrowRight } from 'lucide-react';
import { useCart } from '../lib/cart';
import { useAuth } from '../lib/auth';
import { useToast } from '../lib/toast';
import { api } from '../lib/api';
import { formatPrice } from '../lib/utils';
import type { Coupon } from '../lib/types';

export function CartPage() {
  const navigate = useNavigate();
  const { items, loading, updateQuantity, removeItem, toggleGiftWrap, saveForLater, cartSubtotal } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');

  const giftWrapFee = items.filter((i) => i.gift_wrap).reduce((sum, i) => sum + 50 * i.quantity, 0);
  const baseSubtotal = cartSubtotal - giftWrapFee;
  const discount = appliedCoupon
    ? appliedCoupon.discount_type === 'percentage'
      ? Math.min((baseSubtotal * appliedCoupon.discount_value) / 100, appliedCoupon.max_discount ?? Infinity)
      : appliedCoupon.discount_value
    : 0;
  const taxableAmount = baseSubtotal - discount;
  const tax = Math.round(taxableAmount * 0.05);
  const shipping = taxableAmount > 999 || taxableAmount === 0 ? 0 : 49;
  const total = taxableAmount + tax + shipping + giftWrapFee;

  const applyCoupon = async () => {
    if (!couponCode) return;
    setCouponError('');
    try {
      const response = await api.post<{ success: boolean; valid: boolean; coupon?: Coupon; message?: string }>('/coupons/validate', {
        code: couponCode.toUpperCase(),
        orderValue: baseSubtotal
      });
      if (!response.valid || !response.coupon) {
        setCouponError(response.message ?? 'Invalid coupon code');
        setAppliedCoupon(null);
        return;
      }
      setAppliedCoupon(response.coupon);
      showToast('Coupon applied successfully!', 'success');
    } catch (error) {
      setCouponError('Invalid coupon code');
      setAppliedCoupon(null);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const handleCheckout = () => {
    if (!user) {
      showToast('Please login to checkout', 'info');
      navigate('/login?redirect=/checkout');
      return;
    }
    if (items.length === 0) return;
    const checkoutData = {
      subtotal: baseSubtotal,
      discount,
      tax,
      shipping,
      giftWrapFee,
      total,
      couponCode: appliedCoupon?.code ?? null,
    };
    sessionStorage.setItem('checkout_data', JSON.stringify(checkoutData));
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="h-8 w-48 skeleton rounded mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 skeleton rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <ShoppingBag size={64} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-4" />
        <h1 className="font-serif text-2xl font-bold text-neutral-900 dark:text-white mb-2">Your cart is empty</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mb-6">Looks like you haven't added anything yet.</p>
        <Link to="/shop" className="btn-primary inline-flex items-center gap-2">
          Start Shopping <ArrowRight size={18} />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white mb-6">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const product = typeof item.product_id === 'object' ? item.product_id : item.product;
            return (
              <div key={item._id} className="card p-4 flex gap-4">
                <Link to={`/product/${product?.slug}`} className="flex-shrink-0">
                  <img src={product?.images?.[0]} alt={product?.name} className="w-24 h-32 object-cover rounded-lg" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/product/${product?.slug}`}>
                    <h3 className="font-medium text-neutral-900 dark:text-white hover:text-brand-600 line-clamp-2">{product?.name}</h3>
                  </Link>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{product?.brand}</p>
                  <div className="flex gap-3 mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                    {item.size && <span>Size: {item.size}</span>}
                    {item.color && <span>Color: {item.color}</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-semibold text-neutral-900 dark:text-white">{formatPrice(product?.price ?? 0)}</span>
                    {product?.compare_at_price && (
                      <span className="text-sm text-neutral-400 line-through">{formatPrice(product.compare_at_price)}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-3 flex-wrap">
                    <div className="flex items-center border border-neutral-300 dark:border-neutral-600 rounded-lg">
                      <button onClick={() => updateQuantity(item._id, item.quantity - 1)} className="p-1.5 hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded-l-lg">
                        <Minus size={14} />
                      </button>
                      <span className="px-3 text-sm font-medium">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item._id, item.quantity + 1)} className="p-1.5 hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded-r-lg">
                        <Plus size={14} />
                      </button>
                    </div>
                    <button
                      onClick={() => toggleGiftWrap(item._id, !item.gift_wrap)}
                      className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-all ${item.gift_wrap ? 'border-accent-500 bg-accent-50 dark:bg-accent-900 text-accent-700 dark:text-accent-300' : 'border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400'}`}
                    >
                      <Gift size={14} /> Gift Wrap (+Rs 50)
                    </button>
                    <button onClick={() => saveForLater(item._id, true)} className="text-xs text-neutral-500 hover:text-brand-600">
                      Save for Later
                    </button>
                    <button onClick={() => removeItem(item._id)} className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1">
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="card p-5 sticky top-24">
            <h2 className="font-semibold text-lg text-neutral-900 dark:text-white mb-4">Order Summary</h2>

            {/* Coupon */}
            <div className="mb-4">
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Tag size={16} className="text-green-600" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-400">{appliedCoupon.code}</span>
                  </div>
                  <button onClick={removeCoupon} className="text-green-600 hover:text-green-700">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800"
                    />
                    <button onClick={applyCoupon} className="px-4 py-2 text-sm bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg font-medium">
                      Apply
                    </button>
                  </div>
                  {couponError && <p className="text-xs text-red-500 mt-1">{couponError}</p>}
                  <p className="text-xs text-neutral-500 mt-2">Try: WELCOME10, FLAT100, FESTIVE25</p>
                </>
              )}
            </div>

            <div className="space-y-2 text-sm border-t border-neutral-100 dark:border-neutral-700 pt-4">
              <div className="flex justify-between">
                <span className="text-neutral-600 dark:text-neutral-400">Subtotal</span>
                <span className="font-medium text-neutral-900 dark:text-white">{formatPrice(baseSubtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              {giftWrapFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">Gift Wrap</span>
                  <span className="font-medium text-neutral-900 dark:text-white">{formatPrice(giftWrapFee)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-neutral-600 dark:text-neutral-400">GST (5%)</span>
                <span className="font-medium text-neutral-900 dark:text-white">{formatPrice(tax)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600 dark:text-neutral-400">Shipping</span>
                <span className="font-medium text-neutral-900 dark:text-white">
                  {shipping === 0 ? <span className="text-green-600">FREE</span> : formatPrice(shipping)}
                </span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-neutral-500">Add {formatPrice(999 - taxableAmount)} more for free delivery</p>
              )}
            </div>

            <div className="flex justify-between border-t border-neutral-100 dark:border-neutral-700 pt-4 mt-4">
              <span className="font-semibold text-neutral-900 dark:text-white">Total</span>
              <span className="font-bold text-lg text-neutral-900 dark:text-white">{formatPrice(total)}</span>
            </div>

            <button onClick={handleCheckout} className="w-full btn-primary mt-5 flex items-center justify-center gap-2">
              Proceed to Checkout <ArrowRight size={18} />
            </button>
            <Link to="/shop" className="block text-center text-sm text-neutral-500 hover:text-brand-600 mt-3">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
