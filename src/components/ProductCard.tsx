import { Link } from 'react-router-dom';
import { Heart, Eye } from 'lucide-react';
import type { Product } from '../lib/types';
import { formatPrice } from '../lib/utils';
import { StarRating } from './StarRating';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { useToast } from '../lib/toast';
import { useState } from 'react';

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
}

export function ProductCard({ product, onQuickView }: ProductCardProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [wishlisted, setWishlisted] = useState(false);

  const discount = product.compare_at_price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : product.discount_percent;

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group card overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-neutral-100 dark:bg-neutral-700">
        <img
          src={product.images[0]}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-brand-600 text-white text-xs font-semibold px-2 py-1 rounded">
            {discount}% OFF
          </span>
        )}
        {product.is_flash_sale && (
          <span className="absolute top-2 right-2 bg-accent-500 text-white text-xs font-semibold px-2 py-1 rounded animate-pulse">
            FLASH SALE
          </span>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          {onQuickView && (
            <button
              onClick={(e) => { e.preventDefault(); onQuickView(product); }}
              className="bg-white/90 text-neutral-900 p-2.5 rounded-full hover:bg-white transition-all hover:scale-110"
            >
              <Eye size={18} />
            </button>
          )}
        </div>
        <button
          onClick={toggleWishlist}
          className="absolute bottom-2 right-2 bg-white/90 dark:bg-neutral-800/90 p-2 rounded-full hover:scale-110 transition-all"
        >
          <Heart size={18} className={wishlisted ? 'fill-brand-500 text-brand-500' : 'text-neutral-700 dark:text-neutral-200'} />
        </button>
      </div>
      <div className="p-3 flex flex-col flex-1">
        <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">{product.brand}</p>
        <h3 className="text-sm font-medium text-neutral-900 dark:text-white line-clamp-2 mt-1 group-hover:text-brand-600 transition-colors">
          {product.name}
        </h3>
        <div className="mt-1.5">
          <StarRating rating={product.rating} size={12} showNumber reviewCount={product.review_count} />
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-base font-semibold text-neutral-900 dark:text-white">{formatPrice(product.price)}</span>
          {product.compare_at_price && (
            <span className="text-sm text-neutral-400 line-through">{formatPrice(product.compare_at_price)}</span>
          )}
        </div>
        {product.stock < 10 && product.stock > 0 && (
          <p className="text-xs text-accent-600 dark:text-accent-400 mt-1">Only {product.stock} left!</p>
        )}
        {product.stock === 0 && (
          <p className="text-xs text-red-500 mt-1">Out of stock</p>
        )}
      </div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="aspect-[3/4] skeleton" />
      <div className="p-3 space-y-2">
        <div className="h-3 w-1/3 skeleton rounded" />
        <div className="h-4 w-3/4 skeleton rounded" />
        <div className="h-3 w-1/2 skeleton rounded" />
        <div className="h-5 w-2/3 skeleton rounded" />
      </div>
    </div>
  );
}
