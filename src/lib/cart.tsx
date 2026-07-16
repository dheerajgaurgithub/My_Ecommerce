import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { api } from './api';
import { useAuth } from './auth';
import { cartPersistence } from './cartPersistence';
import type { CartItem, Product } from './types';

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  addToCart: (product: Product, quantity?: number, size?: string, color?: string, giftWrap?: boolean) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  saveForLater: (id: string, saved: boolean) => Promise<void>;
  toggleGiftWrap: (id: string, giftWrap: boolean) => Promise<void>;
  clearCart: () => Promise<void>;
  cartCount: number;
  cartSubtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!user) {
      // Load cart from localStorage for guest users
      const localCart = cartPersistence.loadCart();
      setItems(localCart);
      return;
    }
    setLoading(true);
    try {
      const response = await api.get<{ success: boolean; items: any[] }>('/cart');
      if (response.success) {
        setItems(response.items);
        cartPersistence.saveCart(response.items);
      }
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Check for abandoned cart and trigger recovery
  useEffect(() => {
    if (!user || items.length === 0) return;

    if (cartPersistence.isCartAbandoned(24) && cartPersistence.shouldSendRecovery(48)) {
      // Trigger abandoned cart recovery (this would typically send an email or notification)
      console.log('Abandoned cart detected - recovery triggered');
      cartPersistence.markRecoverySent();
    }
  }, [user, items]);

  const addToCart = async (product: Product, quantity = 1, size?: string, color?: string, giftWrap = false) => {
    if (!user) return;
    try {
      await api.post('/cart', {
        product_id: product._id,
        quantity,
        size: size || null,
        color: color || null,
        gift_wrap: giftWrap
      });
      await fetchCart();
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  const updateQuantity = async (id: string, quantity: number) => {
    if (quantity < 1) return;
    try {
      await api.patch(`/cart/${id}`, { quantity });
      setItems((prev) => prev.map((i) => (i._id === id ? { ...i, quantity } : i)));
    } catch (error) {
      console.error('Failed to update quantity:', error);
    }
  };

  const removeItem = async (id: string) => {
    try {
      await api.delete(`/cart/${id}`);
      setItems((prev) => prev.filter((i) => i._id !== id));
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  };

  const saveForLater = async (id: string, saved: boolean) => {
    try {
      await api.patch(`/cart/${id}/save`, { saved });
      setItems((prev) => prev.filter((i) => i._id !== id));
    } catch (error) {
      console.error('Failed to save for later:', error);
    }
  };

  const toggleGiftWrap = async (id: string, giftWrap: boolean) => {
    try {
      await api.patch(`/cart/${id}/gift-wrap`, { gift_wrap: giftWrap });
      setItems((prev) => prev.map((i) => (i._id === id ? { ...i, gift_wrap: giftWrap } : i)));
    } catch (error) {
      console.error('Failed to toggle gift wrap:', error);
    }
  };

  const clearCart = async () => {
    if (!user) return;
    try {
      await api.delete('/cart');
      setItems([]);
    } catch (error) {
      console.error('Failed to clear cart:', error);
    }
  };

  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const cartSubtotal = items.reduce((sum, i) => {
    const price = typeof i.product_id === 'object' ? i.product_id.price : (i.product?.price ?? 0);
    const giftFee = i.gift_wrap ? 50 : 0;
    return sum + price * i.quantity + giftFee * i.quantity;
  }, 0);

  return (
    <CartContext.Provider value={{ items, loading, addToCart, updateQuantity, removeItem, saveForLater, toggleGiftWrap, clearCart, cartCount, cartSubtotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
