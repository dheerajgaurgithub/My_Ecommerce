export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  brand: string;
  category_id: string;
  price: number;
  compare_at_price?: number;
  discount_percent?: number;
  stock: number;
  sku?: string;
  sizes: string[];
  colors: string[];
  material?: string;
  gender?: string;
  images: string[];
  is_published: boolean;
  is_featured: boolean;
  is_trending: boolean;
  is_bestseller: boolean;
  is_new_arrival: boolean;
  is_flash_sale: boolean;
  is_premium: boolean;
  review_count?: number;
  rating?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent_id?: string;
  created_at?: string;
}

export interface Order {
  _id: string;
  order_number: string;
  user_id: string;
  status: 'pending' | 'confirmed' | 'picked' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'returned' | 'refunded';
  total: number;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  coupon_code?: string;
  payment_method: 'cod' | 'razorpay' | 'upi' | 'card' | 'netbanking';
  payment_status: 'paid' | 'pending' | 'failed';
  paid_at?: string;
  payment_details?: any;
  address_snapshot?: any;
  delivery?: {
    required: boolean;
    assigned: boolean;
    partnerId?: string;
    fee?: number;
    distance?: number;
    distanceFee?: number;
    estimatedTime?: number;
    pickupOTP?: string;
    deliveryOTP?: string;
    storeAddress?: string;
    storeCoordinates?: { latitude: number; longitude: number };
    storeContact?: string;
  };
  timeline?: Array<{ status: string; timestamp: string }>;
  items: Array<{
    product_id: string;
    product_name: string;
    product_image?: string;
    price: number;
    quantity: number;
    size?: string;
    color?: string;
    gift_wrap?: boolean;
  }>;
  created_at: string;
  updated_at?: string;
}

export interface Coupon {
  _id: string;
  code: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order: number;
  max_discount?: number;
  is_active: boolean;
  valid_from?: string;
  valid_until?: string;
  usage_count?: number;
  max_usage?: number;
  created_at?: string;
}

export interface ComboPack {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  original_price: number;
  compare_at_price?: number;
  product_ids: string[];
  products: string[];
  images: string[];
  image_url?: string;
  is_published: boolean;
  is_featured: boolean;
  created_at?: string;
}

export interface GiftCard {
  _id: string;
  name: string;
  denomination: number;
  price: number;
  description: string;
  image_url?: string;
  is_published: boolean;
  is_featured: boolean;
  valid_for_months?: number;
  created_at?: string;
}

export interface User {
  _id: string;
  email: string;
  name: string;
  role: 'customer' | 'admin' | 'delivery_partner';
  phone?: string;
  location?: string;
  profilePicture?: string;
  hasUsedFirstOrderDiscount?: boolean;
  created_at?: string;
}

export interface DeliveryPartner {
  _id: string;
  userId: string;
  personalDetails: {
    fullName: string;
    contactNumber: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  vehicleDetails: {
    vehicleType: string;
    vehicleNumber: string;
    vehicleModel?: string;
    vehicleColor?: string;
  };
  kycDetails?: {
    aadharNumber?: string;
    aadharFront?: string;
    aadharBack?: string;
    panNumber?: string;
    panCard?: string;
    drivingLicense?: string;
    selfie?: string;
  };
  workDetails: {
    isOnline: boolean;
    currentLocation?: { latitude: number; longitude: number };
    totalDeliveries: number;
    totalEarnings: number;
    rating?: number;
  };
  status: 'pending' | 'active' | 'suspended' | 'inactive';
  joiningFee?: {
    amount: number;
    isPaid: boolean;
    paidAt?: string;
  };
  renewalFee?: {
    amount: number;
    isPaid: boolean;
    paidAt?: string;
  };
  createdAt?: string;
}
