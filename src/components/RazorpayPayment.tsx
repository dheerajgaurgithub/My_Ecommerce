import { useEffect, useRef } from 'react';
import { api } from '../lib/api';

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: any) => void;
  prefill: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme: {
    color: string;
  };
  modal: {
    ondismiss: () => void;
  };
  method?: {
    upi?: boolean;
    card?: boolean;
    netbanking?: boolean;
    wallet?: boolean;
    emi?: boolean;
    paylater?: boolean;
  };
  config?: {
    display: {
      blocks: {
        [key: string]: {
          name: string;
          instruments: Array<{
            method: string;
            flows?: string[];
          }>;
        };
      };
      sequence: string[];
      preferences: {
        show_default_blocks: boolean;
      };
    };
  };
}

interface PaymentProps {
  amount: number;
  orderId?: string;
  onSuccess: (paymentId: string, orderId: string, signature: string) => void;
  onFailure: (error: string) => void;
  onClose: () => void;
  userInfo?: {
    name: string;
    email: string;
    contact: string;
  };
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function RazorpayPayment({
  amount,
  orderId,
  onSuccess,
  onFailure,
  onClose,
  userInfo,
}: PaymentProps) {
  const razorpayInstanceRef = useRef<any>(null);

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      console.log('Razorpay script loaded');
      initiatePayment();
    };
    script.onerror = () => {
      console.error('Failed to load Razorpay script');
      onFailure('Failed to load payment gateway');
    };
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  const initiatePayment = async () => {
    try {
      // Create Razorpay order
      const response = await api.post<{ success: boolean; order: any; keyId: string }>('/payments/create-order', {
        amount,
        currency: 'INR',
        receipt: orderId || `order_${Date.now()}`,
      });

      if (!response.success) {
        onFailure('Failed to create payment order');
        return;
      }

      const { order, keyId } = response;

      // Initialize Razorpay checkout with all payment methods
      const options: RazorpayOptions = {
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'Mahir & Friends',
        description: 'Payment for your order',
        order_id: order.id,
        handler: (response: any) => {
          // Verify payment on backend
          verifyPayment(response.razorpay_payment_id, response.razorpay_order_id, response.razorpay_signature);
        },
        prefill: {
          name: userInfo?.name,
          email: userInfo?.email,
          contact: userInfo?.contact,
        },
        theme: {
          color: '#4F46E5',
        },
        // Enable all payment methods
        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true,
          emi: true,
          paylater: true,
        },
        // Configure UPI
        config: {
          display: {
            blocks: {
              utib: {
                name: 'Pay via UPI',
                instruments: [
                  {
                    method: 'upi',
                    flows: ['qr', 'collect'],
                  },
                ],
              },
              other: {
                name: 'Other Payment Methods',
                instruments: [
                  {
                    method: 'card',
                  },
                  {
                    method: 'netbanking',
                  },
                ],
              },
            },
            sequence: ['block.utib', 'block.other'],
            preferences: {
              show_default_blocks: false,
            },
          },
        },
        modal: {
          ondismiss: () => {
            onClose();
          },
        },
      };

      if (typeof window.Razorpay !== 'undefined') {
        razorpayInstanceRef.current = new window.Razorpay(options);
        razorpayInstanceRef.current.open();
      } else {
        onFailure('Payment gateway not loaded');
      }
    } catch (error) {
      console.error('Payment initiation error:', error);
      onFailure('Failed to initiate payment');
    }
  };

  const verifyPayment = async (paymentId: string, razorpayOrderId: string, signature: string) => {
    try {
      const response = await api.post<{ success: boolean; verified: boolean; payment: any }>('/payments/verify', {
        orderId: razorpayOrderId,
        paymentId,
        signature,
      });

      if (response.success && response.verified) {
        onSuccess(paymentId, razorpayOrderId, signature);
      } else {
        onFailure('Payment verification failed');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      onFailure('Failed to verify payment');
    }
  };

  return (
    <button
      onClick={initiatePayment}
      className="btn-primary w-full"
      disabled={!window.Razorpay}
    >
      Pay ₹{amount}
    </button>
  );
}
