import { CartItem } from './types';

const CART_STORAGE_KEY = 'mahir_cart';
const CART_TIMESTAMP_KEY = 'mahir_cart_timestamp';
const CART_RECOVERY_SENT_KEY = 'mahir_cart_recovery_sent';

export const cartPersistence = {
  saveCart: (items: CartItem[]) => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      localStorage.setItem(CART_TIMESTAMP_KEY, Date.now().toString());
    } catch (error) {
      console.error('Failed to save cart:', error);
    }
  },

  loadCart: (): CartItem[] => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load cart:', error);
      return [];
    }
  },

  getCartTimestamp: (): number | null => {
    try {
      const timestamp = localStorage.getItem(CART_TIMESTAMP_KEY);
      return timestamp ? parseInt(timestamp) : null;
    } catch (error) {
      return null;
    }
  },

  clearCart: () => {
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
      localStorage.removeItem(CART_TIMESTAMP_KEY);
      localStorage.removeItem(CART_RECOVERY_SENT_KEY);
    } catch (error) {
      console.error('Failed to clear cart:', error);
    }
  },

  isCartAbandoned: (thresholdHours: number = 24): boolean => {
    const timestamp = cartPersistence.getCartTimestamp();
    if (!timestamp) return false;
    
    const hoursSinceUpdate = (Date.now() - timestamp) / (1000 * 60 * 60);
    return hoursSinceUpdate >= thresholdHours;
  },

  markRecoverySent: () => {
    try {
      localStorage.setItem(CART_RECOVERY_SENT_KEY, Date.now().toString());
    } catch (error) {
      console.error('Failed to mark recovery sent:', error);
    }
  },

  shouldSendRecovery: (cooldownHours: number = 48): boolean => {
    try {
      const lastSent = localStorage.getItem(CART_RECOVERY_SENT_KEY);
      if (!lastSent) return true;
      
      const hoursSinceSent = (Date.now() - parseInt(lastSent)) / (1000 * 60 * 60);
      return hoursSinceSent >= cooldownHours;
    } catch (error) {
      return true;
    }
  }
};
