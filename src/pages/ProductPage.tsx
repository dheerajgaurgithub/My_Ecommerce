import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Heart, Share2, ShoppingBag, Truck, RefreshCw, Shield, Check,
  ChevronRight, Plus, Minus, MapPin, ZoomIn
} from 'lucide-react';
import { api } from '../lib/api';
import type { Product, Review } from '../lib/types';
import { useCart } from '../lib/cart';
import { useAuth } from '../lib/auth';
import { useToast } from '../lib/toast';
import { formatPrice, getDeliveryDate } from '../lib/utils';
import { StarRating } from '../components/StarRating';
import { ProductCard } from '../components/ProductCard';

export function ProductPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [pincode, setPincode] = useState('');
  const [deliveryInfo, setDeliveryInfo] = useState<{ available: boolean; charge: number; days: number; free: boolean } | null>(null);
  const [zoom, setZoom] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'reviews' | 'questions'>('description');
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd || !product) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && activeImage < product.images.length - 1) {
      setActiveImage(activeImage + 1);
    }
    if (isRightSwipe && activeImage > 0) {
      setActiveImage(activeImage - 1);
    }
  };

  const goToPreviousImage = () => {
    if (activeImage > 0) setActiveImage(activeImage - 1);
  };

  const goToNextImage = () => {
    if (product && activeImage < product.images.length - 1) setActiveImage(activeImage + 1);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    setActiveImage(0);
    setDeliveryInfo(null);

    const fetchProduct = async () => {
      try {
        const response = await api.get<{ success: boolean; product: Product }>(`/products/${slug}`);
        if (!response.success || !response.product) {
          setLoading(false);
          return;
        }
        const product = response.product;
        setProduct(product);
        setSelectedSize(product.sizes?.[0] ?? '');
        setSelectedColor(product.colors?.[0] ?? '');

        const [revData, relData] = await Promise.all([
          api.get<{ success: boolean; reviews: Review[] }>(`/reviews/product/${product._id}`),
          api.get<{ success: boolean; products: Product[] }>(`/products?category=${product.category_id}&limit=4`),
        ]);
        setReviews(revData.reviews ?? []);
        setRelated(relData.products?.filter((p: Product) => p._id !== product._id).slice(0, 4) ?? []);
      } catch (error) {
        console.error('Failed to fetch product:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug]);

  const checkDelivery = async () => {
    if (!pincode) return;
    try {
      const response = await api.get<{ success: boolean; available: boolean; charge: number; days: number; free: boolean }>(`/delivery/check/${pincode}`);
      setDeliveryInfo(response);
    } catch (error) {
      setDeliveryInfo({ available: false, charge: 99, days: 6, free: false });
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      showToast('Please login to add items to cart', 'info');
      navigate('/login');
      return;
    }
    if (product && selectedSize && selectedColor) {
      await addToCart(product, quantity, selectedSize, selectedColor);
      showToast('Added to cart!', 'success');
    }
  };

  const toggleWishlist = async () => {
    if (!user) { showToast('Please login to save to wishlist', 'info'); return; }
    if (!product) return;
    try {
      const response = await api.get<{ success: boolean; wishlisted: boolean }>(`/wishlist/check/${product._id}`);
      if (response.wishlisted) {
        await api.delete(`/wishlist/${product._id}`);
        showToast('Removed from wishlist', 'info');
      } else {
        await api.post('/wishlist', { product_id: product._id });
        showToast('Added to wishlist', 'success');
      }
    } catch (error) {
      console.error('Failed to toggle wishlist:', error);
    }
  };

  const shareProduct = () => {
    if (navigator.share) {
      navigator.share({ title: product?.name, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Link copied to clipboard', 'success');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="aspect-square skeleton rounded-xl" />
          <div className="space-y-4">
            <div className="h-8 w-1/3 skeleton rounded" />
            <div className="h-12 w-3/4 skeleton rounded" />
            <div className="h-6 w-1/4 skeleton rounded" />
            <div className="h-32 skeleton rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <p className="text-xl text-neutral-500">Product not found.</p>
        <Link to="/shop" className="mt-4 inline-block text-brand-600 hover:text-brand-700">Back to Shop</Link>
      </div>
    );
  }

  const discount = product.compare_at_price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : product.discount_percent;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-neutral-500 dark:text-neutral-400 mb-6">
        <Link to="/" className="hover:text-brand-600">Home</Link>
        <ChevronRight size={14} />
        <Link to="/shop" className="hover:text-brand-600">Shop</Link>
        <ChevronRight size={14} />
        <span className="text-neutral-900 dark:text-white truncate">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Images */}
        <div>
          <div
            className="relative aspect-square rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 group cursor-zoom-in"
            onClick={() => setZoom(!zoom)}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <img
              src={product.images[activeImage]}
              alt={product.name}
              className={`w-full h-full object-cover transition-transform duration-500 ${zoom ? 'scale-150' : 'group-hover:scale-110'}`}
            />
            <button className="absolute top-3 right-3 bg-white/80 dark:bg-neutral-800/80 p-2 rounded-full">
              <ZoomIn size={18} />
            </button>
            {discount > 0 && (
              <span className="absolute top-3 left-3 bg-brand-600 text-white text-sm font-semibold px-3 py-1.5 rounded">
                {discount}% OFF
              </span>
            )}
            {/* Navigation arrows */}
            {product.images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); goToPreviousImage(); }}
                  className={`absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-neutral-800/90 p-2 rounded-full shadow-lg transition-opacity ${activeImage === 0 ? 'opacity-30 cursor-not-allowed' : 'opacity-100 hover:opacity-100'}`}
                  disabled={activeImage === 0}
                >
                  <ChevronRight size={20} className="rotate-180" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); goToNextImage(); }}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-neutral-800/90 p-2 rounded-full shadow-lg transition-opacity ${activeImage === product.images.length - 1 ? 'opacity-30 cursor-not-allowed' : 'opacity-100 hover:opacity-100'}`}
                  disabled={activeImage === product.images.length - 1}
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
            {/* Image indicator */}
            {product.images.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1 rounded-full">
                {activeImage + 1} / {product.images.length}
              </div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${activeImage === idx ? 'border-brand-600' : 'border-transparent opacity-60 hover:opacity-100'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">{product.brand}</p>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white mt-1">{product.name}</h1>
          <div className="flex items-center gap-3 mt-3">
            <StarRating rating={product.rating} size={18} showNumber reviewCount={product.review_count} />
            <span className="text-sm text-neutral-400">|</span>
            <span className="text-sm text-neutral-500 dark:text-neutral-400">SKU: {product.sku}</span>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <span className="text-3xl font-bold text-neutral-900 dark:text-white">{formatPrice(product.price)}</span>
            {product.compare_at_price && (
              <span className="text-lg text-neutral-400 line-through">{formatPrice(product.compare_at_price)}</span>
            )}
            {discount > 0 && (
              <span className="text-sm font-medium text-green-600 dark:text-green-400">Save {discount}%</span>
            )}
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Inclusive of all taxes</p>

          {/* Sizes */}
          {product.sizes.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-neutral-900 dark:text-white">Select Size</p>
                <button className="text-xs text-brand-600 hover:underline">Size Guide</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`min-w-[3rem] px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${selectedSize === size ? 'border-brand-600 bg-brand-50 dark:bg-brand-900 text-brand-700 dark:text-brand-300' : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-400'}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Colors */}
          {product.colors.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-neutral-900 dark:text-white mb-2">Color: <span className="text-neutral-500">{selectedColor}</span></p>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-4 py-2 rounded-lg border-2 text-sm transition-all ${selectedColor === color ? 'border-brand-600 bg-brand-50 dark:bg-brand-900' : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-400'}`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="mt-4">
            <p className="text-sm font-medium text-neutral-900 dark:text-white mb-2">Quantity</p>
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-neutral-300 dark:border-neutral-600 rounded-lg">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-l-lg">
                  <Minus size={16} />
                </button>
                <span className="px-4 font-medium">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="p-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-r-lg">
                  <Plus size={16} />
                </button>
              </div>
              {product.stock < 10 && product.stock > 0 && (
                <span className="text-sm text-accent-600 dark:text-accent-400">Only {product.stock} left in stock!</span>
              )}
              {product.stock === 0 && <span className="text-sm text-red-500">Out of stock</span>}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="flex-1 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 py-3.5 rounded-lg font-medium hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <ShoppingBag size={18} /> Add to Cart
            </button>
            <button onClick={toggleWishlist} className="p-3.5 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all">
              <Heart size={20} />
            </button>
            <button onClick={shareProduct} className="p-3.5 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all">
              <Share2 size={20} />
            </button>
          </div>

          {/* Delivery checker */}
          <div className="mt-6 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={18} className="text-brand-600" />
              <p className="text-sm font-medium text-neutral-900 dark:text-white">Check Delivery</p>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter pincode (e.g. 202001)"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900"
              />
              <button onClick={checkDelivery} className="px-4 py-2 text-sm bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg font-medium hover:bg-neutral-800 dark:hover:bg-neutral-100">
                Check
              </button>
            </div>
            {deliveryInfo && (
              <div className="mt-3 animate-fade-in">
                {deliveryInfo.available ? (
                  <div className="flex items-start gap-2 text-sm">
                    <Check size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-green-600 dark:text-green-400">Delivery Available</p>
                      <p className="text-neutral-600 dark:text-neutral-400">
                        {deliveryInfo.free ? 'FREE DELIVERY' : `Delivery charge: ${formatPrice(deliveryInfo.charge)}`} &bull; By {getDeliveryDate(deliveryInfo.days)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm">
                    <p className="font-medium text-red-500">Delivery unavailable in your area.</p>
                    <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                      Alternative delivery available: {formatPrice(deliveryInfo.charge)} &bull; By {getDeliveryDate(deliveryInfo.days)}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Trust badges */}
          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-700">
              <Truck className="w-5 h-5 mx-auto text-brand-600 mb-1" />
              <p className="text-xs text-neutral-600 dark:text-neutral-400">Free Delivery*</p>
            </div>
            <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-700">
              <RefreshCw className="w-5 h-5 mx-auto text-brand-600 mb-1" />
              <p className="text-xs text-neutral-600 dark:text-neutral-400">7-Day Returns</p>
            </div>
            <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-700">
              <Shield className="w-5 h-5 mx-auto text-brand-600 mb-1" />
              <p className="text-xs text-neutral-600 dark:text-neutral-400">Warranty</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-12">
        <div className="flex gap-6 border-b border-neutral-200 dark:border-neutral-700 overflow-x-auto scrollbar-hide">
          {[
            { key: 'description', label: 'Description' },
            { key: 'specs', label: 'Specifications' },
            { key: 'reviews', label: `Reviews (${reviews.length})` },
            { key: 'questions', label: 'Questions' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`pb-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${activeTab === tab.key ? 'border-brand-600 text-brand-600' : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="py-6">
          {activeTab === 'description' && (
            <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed max-w-3xl">{product.description}</p>
          )}
          {activeTab === 'specs' && (
            <div className="max-w-2xl">
              <table className="w-full">
                <tbody>
                  {Object.entries(product.specifications || {}).map(([key, value]) => (
                    <tr key={key} className="border-b border-neutral-100 dark:border-neutral-800">
                      <td className="py-3 text-sm font-medium text-neutral-900 dark:text-white w-1/3">{key}</td>
                      <td className="py-3 text-sm text-neutral-600 dark:text-neutral-400">{value}</td>
                    </tr>
                  ))}
                  <tr className="border-b border-neutral-100 dark:border-neutral-800">
                    <td className="py-3 text-sm font-medium text-neutral-900 dark:text-white">Material</td>
                    <td className="py-3 text-sm text-neutral-600 dark:text-neutral-400">{product.material}</td>
                  </tr>
                  <tr className="border-b border-neutral-100 dark:border-neutral-800">
                    <td className="py-3 text-sm font-medium text-neutral-900 dark:text-white">Brand</td>
                    <td className="py-3 text-sm text-neutral-600 dark:text-neutral-400">{product.brand}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
          {activeTab === 'reviews' && (
            <div className="max-w-3xl">
              {reviews.length === 0 ? (
                <p className="text-neutral-500 dark:text-neutral-400">No reviews yet. Be the first to review!</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="card p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center font-medium text-brand-700 dark:text-brand-300">
                            {review.user_name?.[0] ?? 'U'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-neutral-900 dark:text-white">{review.user_name ?? 'Anonymous'}</p>
                            {review.is_verified && <p className="text-xs text-green-600 dark:text-green-400">Verified Purchase</p>}
                          </div>
                        </div>
                        <StarRating rating={review.rating} size={14} />
                      </div>
                      {review.title && <p className="font-medium text-sm text-neutral-900 dark:text-white mt-2">{review.title}</p>}
                      {review.body && <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{review.body}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {activeTab === 'questions' && (
            <p className="text-neutral-500 dark:text-neutral-400">No questions yet. Have a question? Contact our support team.</p>
          )}
        </div>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <div className="mt-12">
          <h2 className="font-serif text-2xl font-bold text-neutral-900 dark:text-white mb-6">You May Also Like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}
