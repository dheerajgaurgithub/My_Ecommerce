import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Trash2 } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useToast } from '../lib/toast';
import { api } from '../lib/api';
import type { Product } from '../lib/types';
import { ProductCard } from '../components/ProductCard';

export function WishlistPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/wishlist');
      return;
    }
    const fetchWishlist = async () => {
      try {
        const response = await api.get<{ success: boolean; products: Product[] }>('/wishlist');
        setItems(response.products ?? []);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch wishlist:', error);
        setLoading(false);
      }
    };
    fetchWishlist();
  }, [user, navigate]);

  const removeItem = async (productId: string) => {
    if (!user) return;
    try {
      await api.delete(`/wishlist/${productId}`);
      setItems((prev) => prev.filter((p) => p._id !== productId));
      showToast('Removed from wishlist', 'info');
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="h-8 w-48 skeleton rounded mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-[3/4] skeleton rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white mb-6">My Wishlist</h1>
      {items.length === 0 ? (
        <div className="text-center py-20">
          <Heart size={64} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-4" />
          <p className="text-neutral-500 dark:text-neutral-400 text-lg mb-2">Your wishlist is empty</p>
          <p className="text-sm text-neutral-400 mb-6">Save items you love to buy them later.</p>
          <Link to="/shop" className="btn-primary inline-block">Browse Products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((p) => (
            <div key={p._id} className="relative">
              <ProductCard product={p} />
              <button
                onClick={() => removeItem(p._id)}
                className="absolute top-2 right-2 z-10 bg-white/90 dark:bg-neutral-800/90 p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900"
              >
                <Trash2 size={14} className="text-red-500" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
