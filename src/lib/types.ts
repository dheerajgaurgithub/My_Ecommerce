export interface Category {
  _id: string;
  id: string; // For backward compatibility
  name: string;
  slug: string;
  parent_id: string | null;
  image_url: string | null;
  is_featured: boolean;
  sort_order: number;
}

export interface Product {
  _id: string;
  id: string; // For backward compatibility
  name: string;
  slug: string;
  description: string | null;
  brand: string | null;
  category_id: string | null;
  price: number;
  compare_at_price: number | null;
  discount_percent: number;
  stock: number;
  sku: string | null;
  sizes: string[];
  colors: string[];
  material: string | null;
  gender: string | null;
  rating: number;
  review_count: number;
  images: string[];
  video_url: string | null;
  is_published: boolean;
  is_featured: boolean;
  is_trending: boolean;
  is_bestseller: boolean;
  is_new_arrival: boolean;
  is_flash_sale: boolean;
  is_premium: boolean;
  specifications: Record<string, string>;
  tags: string[];
  createdAt: string;
  created_at: string; // For backward compatibility
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  user_name: string | null;
  rating: number;
  title: string | null;
  body: string | null;
  photos: string[];
  is_verified: boolean;
  helpful_count: number;
  created_at: string;
}

export interface CartItem {
  _id: string;
  id: string; // For backward compatibility
  user_id: string;
  product_id: string | Product;
  quantity: number;
  size: string | null;
  color: string | null;
  gift_wrap: boolean;
  saved_for_later: boolean;
  product?: Product;
}

export interface WishlistItem {
  _id: string;
  id: string; // For backward compatibility
  user_id: string;
  product_id: string | Product;
  product?: Product;
}

export interface Address {
  _id: string;
  id: string; // For backward compatibility
  user_id: string;
  full_name: string;
  phone: string;
  pincode: string;
  address_line: string;
  city: string;
  district: string | null;
  state: string;
  country: string;
  is_default: boolean;
}

export interface Order {
  _id: string;
  id: string; // For backward compatibility
  user_id: string;
  order_number: string;
  status: string;
  total: number;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  coupon_code: string | null;
  payment_method: string;
  payment_status: string;
  paid_at: string | null;
  address_snapshot: Record<string, string> | null;
  delivery?: {
    required: boolean;
    assigned: boolean;
    partnerId: string | null;
    fee: number;
    distance: number;
    distanceFee: number;
    estimatedTime: number;
    pickupOTP: string | null;
    deliveryOTP: string | null;
    storeAddress: string | null;
    storeCoordinates?: {
      latitude: number;
      longitude: number;
    };
    storeContact: string | null;
  };
  timeline: { status: string; timestamp: string }[];
  createdAt: string;
  created_at: string; // For backward compatibility
  items?: OrderItem[];
}

export interface OrderItem {
  _id: string;
  id: string; // For backward compatibility
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_image: string | null;
  price: number;
  quantity: number;
  size: string | null;
  color: string | null;
  gift_wrap: boolean;
}

export interface Coupon {
  _id: string;
  id: string; // For backward compatibility
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'flat';
  discount_value: number;
  min_order: number;
  max_discount: number | null;
  usage_limit: number | null;
  used_count: number;
  is_active: boolean;
  valid_from: string | null;
  valid_until: string | null;
}

export interface DeliveryLocation {
  id: string;
  pincode: string;
  city: string;
  district: string | null;
  state: string;
  country: string;
  is_available: boolean;
  is_free_delivery: boolean;
  delivery_charge: number;
  estimated_days: number;
  is_express: boolean;
}

export interface ComboPack {
  _id: string;
  id: string; // For backward compatibility
  name: string;
  description: string | null;
  slug: string;
  price: number;
  compare_at_price: number | null;
  product_ids: string[];
  image_url: string | null;
  is_published: boolean;
  is_featured: boolean;
  createdAt: string;
  created_at: string; // For backward compatibility
}

export interface GiftCard {
  _id: string;
  id: string; // For backward compatibility
  name: string;
  denomination: number;
  price: number;
  description: string | null;
  image_url: string | null;
  is_published: boolean;
  is_featured: boolean;
  createdAt: string;
  created_at: string; // For backward compatibility
}

export interface AdminUser {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  nickname?: string;
  profilePicture?: string;
  location?: string;
  phone?: string;
  role: 'customer' | 'admin';
}
