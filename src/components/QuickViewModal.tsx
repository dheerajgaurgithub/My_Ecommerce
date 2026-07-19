import { useState } from 'react';
import { X, ShoppingCart, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Product } from '../lib/types';
import { formatPrice } from '../lib/utils';
import { StarRating } from './StarRating';
import { useCart } from '../lib/cart';
import { useAuth } from '../lib/auth';
import { useToast } from '../lib/toast';
import { api } from '../lib/api';

interface QuickViewModalProps {
  product: Product;
  onClose: () => void;
}

export function QuickViewModal({ product, onClose }: QuickViewModalProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [wishlisted, setWishlisted] = useState(false);

  const handleAddToCart = () => {
    if (!selectedSize && product.sizes?.length) {
      showToast('Please select a size', 'info');
      return;
    }
    addToCart(product, quantity, selectedSize, selectedColor);
    showToast('Added to cart', 'success');
    onClose();
  };

  const toggleWishlist = async () => {
    if (!user) {
      showToast('Please login to save to wishlist', 'info');
      return;
    }
    try {
      if (wishlisted) {
        await api.delete(`/wishlist/${product._id}`);
        setWishlisted(false);
        showToast('Removed from wishlist', 'info');
      } else {
        await api.post('/wishlist', { product_id: product._id });
        setWishlisted(true);
        showToast('Added to wishlist', 'success');
      }
    } catch (error) {
      console.error('Failed to toggle wishlist:', error);
    }
  };

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % product.images.length);
  };

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + product.images.length) % product.images.length);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
      <div className="bg-white dark:bg-neutral-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
          <h2 className="font-semibold text-lg text-neutral-900 dark:text-white">Quick View</h2>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-full">
            <X size={20} className="text-neutral-600 dark:text-neutral-400" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 p-4 md:p-6">
          {/* Images */}
          <div className="space-y-4">
            <div className="relative aspect-square sm:aspect-[4/3] md:aspect-square bg-neutral-100 dark:bg-neutral-700 rounded-xl overflow-hidden">
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-neutral-800/90 p-2 rounded-full hover:bg-white dark:hover:bg-neutral-800"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-neutral-800/90 p-2 rounded-full hover:bg-white dark:hover:bg-neutral-800"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 ${selectedImage === i ? 'border-brand-600' : 'border-transparent'}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">{product.brand}</p>
              <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mt-1">{product.name}</h3>
              <div className="mt-2">
                <StarRating rating={product.rating} size={16} showNumber reviewCount={product.review_count} />
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">{formatPrice(product.price)}</span>
              {product.compare_at_price && (
                <span className="text-lg text-neutral-400 line-through">{formatPrice(product.compare_at_price)}</span>
              )}
              {product.discount_percent > 0 && (
                <span className="bg-brand-100 text-brand-700 text-sm font-medium px-2 py-1 rounded">
                  {product.discount_percent}% OFF
                </span>
              )}
            </div>

            <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-3">{product.description}</p>

            {/* Size Selection */}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <p className="text-sm font-medium text-neutral-900 dark:text-white mb-2">Size</p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(selectedSize === size ? '' : size)}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                        selectedSize === size
                          ? 'border-brand-600 bg-brand-50 dark:bg-brand-900 text-brand-700 dark:text-brand-300'
                          : 'border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selection */}
            {product.colors && product.colors.length > 0 && (
              <div>
                <p className="text-sm font-medium text-neutral-900 dark:text-white mb-2">Color</p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(selectedColor === color ? '' : color)}
                      className={`w-10 h-10 rounded-full border-2 transition-all ${
                        selectedColor === color ? 'border-brand-600 ring-2 ring-brand-200' : 'border-neutral-300 dark:border-neutral-600'
                      }`}
                      style={{ backgroundColor: color.toLowerCase() }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <p className="text-sm font-medium text-neutral-900 dark:text-white mb-2">Quantity</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-lg border border-neutral-300 dark:border-neutral-600 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-700"
                >
                  -
                </button>
                <span className="w-12 text-center font-medium text-neutral-900 dark:text-white">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock}
                  className="w-10 h-10 rounded-lg border border-neutral-300 dark:border-neutral-600 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-50"
                >
                  +
                </button>
              </div>
              {product.stock < 10 && product.stock > 0 && (
                <p className="text-xs text-accent-600 dark:text-accent-400 mt-1">Only {product.stock} left!</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-100 w-full sm:w-auto"
              >
                <ShoppingCart size={18} />
                {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
              <button
                onClick={toggleWishlist}
                className="p-3 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700"
              >
                <Heart size={20} className={wishlisted ? 'fill-brand-500 text-brand-500' : 'text-neutral-700 dark:text-neutral-300'} />
              </button>
            </div>

            {/* Product Info */}
            <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-500">SKU</span>
                <span className="text-neutral-900 dark:text-white">{product.sku || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Material</span>
                <span className="text-neutral-900 dark:text-white">{product.material || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
