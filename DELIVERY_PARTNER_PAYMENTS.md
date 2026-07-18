# Delivery Partner Payment Integration Guide

This guide explains the payment system for delivery partner joining fees and renewal fees using Razorpay.

## Overview

Delivery partners need to pay:
- **Joining Fee**: ₹500 (one-time payment when approved)
- **Renewal Fee**: ₹200 (monthly renewal to keep account active)

## Payment Flow

### Joining Fee Flow

1. Partner registers and gets approved by admin
2. Partner navigates to delivery partner dashboard
3. System shows "Pay Joining Fee" screen with amount
4. Partner clicks "Pay Joining Fee" button
5. Payment QR modal opens with:
   - QR code for UPI payment
   - "Pay Online" button for Razorpay checkout
6. Partner completes payment via UPI or Razorpay
7. Payment is verified on backend
8. Partner account becomes active
9. Renewal due date is set to 30 days from now

### Renewal Fee Flow

1. Partner's renewal due date approaches (5 days before)
2. Dashboard shows renewal fee warning
3. On due date, partner is prompted to pay renewal fee
4. Partner clicks "Pay Renewal Fee" button
5. Payment QR modal opens
6. Partner completes payment
7. Payment is verified
8. Renewal due date is extended by 30 days
9. Partner account remains active

## Backend Implementation

### New Files Created

**`backend/utils/qrCode.js`**
- `generateQRCode()` - Generates QR code from data
- `generateUPILink()` - Creates UPI payment link
- `createFeePaymentOrder()` - Creates Razorpay order and generates QR
- `createUPIPaymentQR()` - Creates UPI payment QR (alternative)

### Modified Files

**`backend/models/DeliveryPartner.js`**
- Added `razorpayOrderId` and `signature` fields to `joiningFee`
- Added `paymentId`, `razorpayOrderId`, and `signature` fields to `renewalFee`

**`backend/routes/deliveryPartners.js`**
- Added `/joining-fee-qr` - Generate payment QR for joining fee
- Added `/verify-joining-fee` - Verify joining fee payment
- Added `/renewal-fee-qr` - Generate payment QR for renewal fee
- Added `/verify-renewal-fee` - Verify renewal fee payment
- Kept legacy `/pay-joining-fee` and `/pay-renewal-fee` for backward compatibility

### API Endpoints

#### Generate Joining Fee QR
```http
POST /api/delivery-partners/joining-fee-qr
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Payment QR code generated successfully",
  "data": {
    "orderId": "order_123",
    "amount": 500,
    "currency": "INR",
    "receipt": "joining_fee_partnerId_timestamp",
    "qrCode": "data:image/png;base64,...",
    "paymentLink": "https://rzp.io/i/orderId",
    "notes": {...}
  }
}
```

#### Verify Joining Fee Payment
```http
POST /api/delivery-partners/verify-joining-fee
Authorization: Bearer <token>
Content-Type: application/json

{
  "razorpay_order_id": "order_123",
  "razorpay_payment_id": "pay_123",
  "razorpay_signature": "signature_hash"
}

Response:
{
  "success": true,
  "message": "Joining fee paid successfully. You can now start working!",
  "data": { ...partnerData }
}
```

#### Generate Renewal Fee QR
```http
POST /api/delivery-partners/renewal-fee-qr
Authorization: Bearer <token>

Response: (same structure as joining fee)
```

#### Verify Renewal Fee Payment
```http
POST /api/delivery-partners/verify-renewal-fee
Authorization: Bearer <token>
Content-Type: application/json

{
  "razorpay_order_id": "order_123",
  "razorpay_payment_id": "pay_123",
  "razorpay_signature": "signature_hash"
}

Response:
{
  "success": true,
  "message": "Renewal fee paid successfully. Your account is active for another 30 days!",
  "data": { ...partnerData }
}
```

## Frontend Implementation

### New Files Created

**`src/components/PaymentQR.tsx`**
- React component for payment QR modal
- Loads Razorpay script dynamically
- Generates QR code via API
- Opens Razorpay checkout for online payment
- Verifies payment on completion
- Handles success/error states

### Modified Files

**`src/pages/DeliveryPartnerPage.tsx`**
- Imported `PaymentQR` component
- Added state for payment modal (`showPaymentQR`, `paymentFeeType`)
- Updated `payJoiningFee()` to show QR modal instead of simulated payment
- Updated `payRenewalFee()` to show QR modal instead of simulated payment
- Added success handlers for both fee types
- Rendered `PaymentQR` component conditionally

## Environment Variables

Add these to your `.env` files:

### Frontend (`.env`)
```env
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

### Backend (`backend/.env`)
```env
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret
MERCHANT_UPI_ID=your_upi_id@upi
```

### Example `.env.example`
```env
VITE_API_URL=http://localhost:5000/api
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret
MERCHANT_UPI_ID=your_upi_id@upi
```

## Payment Methods

### 1. UPI Payment (QR Code)
- Partner scans QR code with any UPI app (GPay, PhonePe, Paytm)
- QR code contains UPI payment link with amount and transaction ID
- Payment is completed in UPI app
- Partner must manually verify payment (or implement webhook)

### 2. Online Payment (Razorpay)
- Partner clicks "Pay Online" button
- Razorpay checkout modal opens
- Multiple payment options:
  - Credit/Debit Cards
  - UPI
  - Net Banking
  - Wallets
  - EMI
- Payment is automatically verified via Razorpay signature

## Payment Status Tracking

### Joining Fee
```javascript
{
  amount: 500,
  paid: true,
  paidAt: Date,
  paymentId: "razorpay_payment_id",
  razorpayOrderId: "razorpay_order_id",
  signature: "razorpay_signature"
}
```

### Renewal Fee
```javascript
{
  amount: 200,
  lastPaidAt: Date,
  nextDueDate: Date,
  isPaid: true,
  paymentId: "razorpay_payment_id",
  razorpayOrderId: "razorpay_order_id",
  signature: "razorpay_signature"
}
```

## Partner Status Flow

```
pending → approved → payment_pending → active → (renewal due) → active
                                    ↓
                                 rejected
```

- **pending**: Initial registration status
- **approved**: Admin approved the application
- **payment_pending**: Approved but joining fee not paid
- **active**: Joining fee paid, can accept orders
- **renewal due**: Renewal fee payment required
- **rejected**: Application rejected by admin

## Testing

### Test Mode Setup

1. Use Razorpay Test Mode keys in `.env`
2. Test with Razorpay test card: `4242 4242 4242 4242`
3. Any expiry date and CVV work for test card

### Test Scenarios

1. **Joining Fee Payment**
   - Register as delivery partner
   - Get approved by admin
   - Navigate to delivery partner dashboard
   - Click "Pay Joining Fee"
   - Complete payment with test card
   - Verify account becomes active

2. **Renewal Fee Payment**
   - Set renewal due date to today (manually in DB)
   - Navigate to delivery partner dashboard
   - See renewal fee prompt
   - Click "Pay Renewal Fee"
   - Complete payment
   - Verify renewal date extended

3. **Payment Verification**
   - Try to pay joining fee twice (should fail)
   - Try to pay with invalid signature (should fail)
   - Verify payment details are saved correctly

## Security Considerations

1. **Signature Verification**: All payments are verified using Razorpay signature
2. **Double Payment Prevention**: Backend checks if fee already paid
3. **Status Validation**: Only approved partners can pay joining fee
4. **Active Account Check**: Only active partners can pay renewal fee
5. **Environment Variables**: Never commit `.env` files to version control

## Troubleshooting

### QR Code Not Generating
- Check Razorpay API keys are correct
- Verify backend is running
- Check browser console for errors

### Payment Verification Fails
- Ensure signature is being passed correctly
- Check Razorpay secret key matches
- Verify order ID is valid

### Partner Status Not Updating
- Check backend logs for errors
- Verify payment was successful
- Check database for payment details

### Razorpay Checkout Not Opening
- Ensure Razorpay script is loaded
- Check `VITE_RAZORPAY_KEY_ID` is set
- Verify order ID is valid

## Future Enhancements

1. **Webhook Integration**: Automatically verify UPI payments via webhooks
2. **Payment History**: Track all payments in a separate collection
3. **Refund Support**: Handle refund scenarios
4. **Partial Payments**: Support for partial fee payments
5. **Promo Codes**: Discount codes for joining/renewal fees
6. **Multiple Payment Options**: Add more payment gateways

## Support

For Razorpay-specific issues:
- [Razorpay Documentation](https://razorpay.com/docs/)
- [Razorpay Support](https://razorpay.com/contact/)

For integration issues:
- Check backend logs in `backend/` directory
- Check browser console for frontend errors
- Verify all environment variables are set correctly
