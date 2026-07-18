import { useState, useEffect } from 'react';
import { api } from '../lib/api';

interface PaymentQRProps {
  feeType: 'joining' | 'renewal';
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PaymentQR({ feeType, amount, onSuccess, onCancel }: PaymentQRProps) {
  const [qrCode, setQrCode] = useState<string>('');
  const [orderId, setOrderId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string>('');

  const endpoint = feeType === 'joining' ? '/delivery-partners/joining-fee-qr' : '/delivery-partners/renewal-fee-qr';
  const verifyEndpoint = feeType === 'joining' ? '/delivery-partners/verify-joining-fee' : '/delivery-partners/verify-renewal-fee';

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    generateQR();

    return () => {
      document.body.removeChild(script);
    };
  }, [feeType]);

  const generateQR = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.post<{ success: boolean; data: any }>(endpoint);
      
      if (response.success) {
        setQrCode(response.data.qrCode);
        setOrderId(response.data.orderId);
      } else {
        setError('Failed to generate payment QR code');
      }
    } catch (err) {
      setError('Failed to generate payment QR code');
      console.error('Error generating QR:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string) => {
    try {
      setVerifying(true);
      setError('');

      const response = await api.post<{ success: boolean }>(verifyEndpoint, {
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature
      });

      if (response.success) {
        onSuccess();
      } else {
        setError('Payment verification failed');
      }
    } catch (err) {
      setError('Payment verification failed');
      console.error('Error verifying payment:', err);
    } finally {
      setVerifying(false);
    }
  };

  const openRazorpayCheckout = () => {
    if (!window.Razorpay) {
      setError('Razorpay SDK not loaded');
      return;
    }

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: amount * 100,
      currency: 'INR',
      name: 'Mahir & Friends',
      description: `${feeType === 'joining' ? 'Joining Fee' : 'Renewal Fee'} Payment`,
      order_id: orderId,
      handler: function (response: any) {
        handlePaymentSuccess(
          response.razorpay_order_id,
          response.razorpay_payment_id,
          response.razorpay_signature
        );
      },
      prefill: {
        name: '',
        email: '',
        contact: ''
      },
      theme: {
        color: '#667eea'
      },
      modal: {
        ondismiss: function () {
          // User closed the modal without paying
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Generating payment QR code...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-8 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-serif text-xl font-bold text-neutral-900 dark:text-white">
            {feeType === 'joining' ? 'Pay Joining Fee' : 'Pay Renewal Fee'}
          </h2>
          <button
            onClick={onCancel}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="bg-neutral-50 dark:bg-neutral-700 rounded-xl p-6 mb-6">
          <div className="text-center mb-4">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">Amount to Pay</p>
            <p className="text-3xl font-bold text-neutral-900 dark:text-white">₹{amount}</p>
          </div>

          {qrCode && (
            <div className="flex justify-center mb-4">
              <img
                src={qrCode}
                alt="Payment QR Code"
                className="w-48 h-48 rounded-lg border-2 border-neutral-200 dark:border-neutral-600"
              />
            </div>
          )}

          <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center mb-4">
            Scan QR code with any UPI app or pay online
          </p>

          <button
            onClick={openRazorpayCheckout}
            disabled={verifying}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl font-medium hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {verifying ? 'Verifying Payment...' : 'Pay Online'}
          </button>
        </div>

        <div className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Secure payment via Razorpay</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Instant activation after payment</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Multiple payment options available</span>
          </div>
        </div>

        <button
          onClick={onCancel}
          className="w-full mt-6 text-sm text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
        >
          Cancel Payment
        </button>
      </div>
    </div>
  );
}
