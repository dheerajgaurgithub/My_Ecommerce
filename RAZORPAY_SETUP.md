# Razorpay Payment Integration Setup Guide

This guide will help you set up and configure Razorpay payment integration for your e-commerce application.

## Prerequisites

1. **Razorpay Account**: You need a Razorpay account. Sign up at [https://razorpay.com](https://razorpay.com)
2. **API Keys**: You'll need your Razorpay Key ID and Key Secret from the Razorpay dashboard

## Step 1: Get Razorpay API Keys

1. Log in to your Razorpay dashboard
2. Navigate to **Settings** → **API Keys**
3. You'll see two sets of keys:
   - **Test Mode**: For development/testing
   - **Live Mode**: For production (requires KYC verification)
4. Copy the **Key ID** and **Key Secret** for the appropriate mode

## Step 2: Configure Environment Variables

Add the following environment variables to your backend `.env` file:

```env
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret
```

### Environment Variables Explained

- **RAZORPAY_KEY_ID**: Your Razorpay Key ID (public key)
- **RAZORPAY_KEY_SECRET**: Your Razorpay Key Secret (private key - never share this)
- **RAZORPAY_WEBHOOK_SECRET**: Secret for verifying webhook signatures (optional but recommended)

## Step 3: Configure Webhooks (Optional but Recommended)

Webhooks allow Razorpay to notify your backend about payment events.

### Setting up Webhooks in Razorpay Dashboard

1. Go to **Settings** → **Webhooks** in your Razorpay dashboard
2. Click **Add New Webhook**
3. Enter your webhook URL: `https://your-domain.com/api/payments/webhook`
4. Select the events you want to receive:
   - `payment.captured` - When payment is successfully captured
   - `payment.failed` - When payment fails
   - `refund.processed` - When a refund is processed
5. Copy the **Webhook Secret** and add it to your `.env` file as `RAZORPAY_WEBHOOK_SECRET`

### Webhook Events Handled

The integration currently handles these webhook events:

- **payment.captured**: Updates order status and sends confirmation
- **payment.failed**: Handles failed payments
- **refund.processed**: Processes refund notifications

## Step 4: Test the Integration

### Testing with Test Mode

1. Use your **Test Mode** API keys in the `.env` file
2. Add items to cart and proceed to checkout
3. Select **Razorpay** as payment method
4. Complete the payment using Razorpay's test payment methods:
   - **Card**: Use any valid card format (e.g., 4242 4242 4242 4242)
   - **UPI**: Use any UPI ID
   - **Net Banking**: Select any bank

### Test Card Details

Razorpay provides test card details for testing:

- **Success**: `4242 4242 4242 4242` (any expiry date, any CVV)
- **Failure**: `4000 0000 0000 0002` (for testing failed payments)
- **International**: `4000 0060 0000 0004`

## Step 5: Go Live

### Switching to Live Mode

1. Complete KYC verification in your Razorpay dashboard
2. Update your `.env` file with **Live Mode** API keys
3. Update your webhook URL to the production URL
4. Test with a small amount first

### Important Notes

- Never commit `.env` file to version control
- Use different API keys for development and production
- Always verify webhook signatures for security
- Monitor payment failures and handle edge cases

## Integration Components

### Backend Files

- **`backend/utils/razorpay.js`**: Razorpay utility functions (create order, verify signature, refund)
- **`backend/routes/payments.js`**: Payment API routes
- **`backend/models/Order.js`**: Updated Order model with payment_details field

### Frontend Files

- **`src/components/RazorpayPayment.tsx`**: Razorpay checkout component
- **`src/pages/CheckoutPage.tsx`**: Updated checkout page with Razorpay integration

## API Endpoints

### Create Payment Order
```http
POST /api/payments/create-order
Content-Type: application/json
Authorization: Bearer <token>

{
  "amount": 1000,
  "currency": "INR",
  "receipt": "order_123"
}
```

### Verify Payment
```http
POST /api/payments/verify
Content-Type: application/json
Authorization: Bearer <token>

{
  "orderId": "order_123",
  "paymentId": "pay_123",
  "signature": "signature_hash"
}
```

### Get Payment Details
```http
GET /api/payments/:paymentId
Authorization: Bearer <token>
```

### Process Refund
```http
POST /api/payments/refund
Content-Type: application/json
Authorization: Bearer <token>

{
  "paymentId": "pay_123",
  "amount": 500
}
```

### Webhook Endpoint
```http
POST /api/payments/webhook
Content-Type: application/json
X-Razorpay-Signature: <signature>
```

## Payment Flow

1. **User selects Razorpay** at checkout
2. **Frontend creates Razorpay order** via API
3. **Razorpay checkout opens** with payment options
4. **User completes payment**
5. **Payment is verified** on backend
6. **Order is created** with payment details
7. **User receives confirmation**

## Security Best Practices

1. **Never expose Key Secret** in frontend code
2. **Always verify signatures** for webhooks
3. **Use HTTPS** in production
4. **Implement rate limiting** on payment endpoints
5. **Log all payment events** for auditing
6. **Handle payment failures** gracefully

## Troubleshooting

### Payment fails with "Invalid signature"
- Ensure Key Secret is correct in `.env`
- Check that signature verification logic is correct
- Verify webhook secret if using webhooks

### Razorpay checkout doesn't load
- Check that Razorpay script is loading: `https://checkout.razorpay.com/v1/checkout.js`
- Ensure Key ID is correct
- Check browser console for errors

### Order not created after payment
- Verify payment verification is successful
- Check backend logs for errors
- Ensure payment_details are being saved correctly

### Webhook not receiving events
- Verify webhook URL is accessible from internet
- Check webhook secret matches in Razorpay dashboard
- Ensure webhook route is registered without auth middleware

## Support

For Razorpay-specific issues:
- [Razorpay Documentation](https://razorpay.com/docs/)
- [Razorpay Support](https://razorpay.com/contact/)

For integration issues:
- Check backend logs in `backend/` directory
- Check browser console for frontend errors
- Verify all environment variables are set correctly

## Additional Features

### Refunds
The integration supports partial and full refunds via the refund endpoint.

### Payment Details
Payment details (payment_id, razorpay_order_id, signature) are stored in the Order model for reference.

### Multiple Payment Methods
Razorpay supports:
- Credit/Debit Cards
- UPI (GPay, PhonePe, Paytm)
- Net Banking
- Wallets
- EMI
