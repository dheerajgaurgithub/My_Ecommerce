import { Link } from 'react-router-dom';
import { FileText, ShoppingCart, AlertCircle, CreditCard, Package, Users } from 'lucide-react';

export function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link to="/" className="text-brand-600 hover:text-brand-700 font-medium mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="font-serif text-4xl font-bold text-neutral-900 dark:text-white mt-4">Terms of Service</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-2">Last updated: July 2026</p>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-sm p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText className="text-brand-600" size={24} />
              Agreement to Terms
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
              By accessing or using Mahir & Friends services, you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
              <ShoppingCart className="text-brand-600" size={24} />
              Products and Services
            </h2>
            <div className="space-y-4 text-neutral-600 dark:text-neutral-400">
              <p>We strive to provide accurate product descriptions, images, and pricing. However:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Colors may vary slightly due to monitor settings</li>
                <li>Product measurements are approximate</li>
                <li>We reserve the right to modify prices without prior notice</li>
                <li>Availability is subject to stock levels</li>
                <li>Some products may be discontinued without notice</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
              <CreditCard className="text-brand-600" size={24} />
              Orders and Payment
            </h2>
            <div className="space-y-4 text-neutral-600 dark:text-neutral-400">
              <ul className="list-disc list-inside space-y-2">
                <li>All prices are in Indian Rupees (INR)</li>
                <li>We accept payments via Razorpay, including credit/debit cards, UPI, and net banking</li>
                <li>Cash on Delivery (COD) is available for eligible orders</li>
                <li>Payment information is processed securely through encrypted channels</li>
                <li>We reserve the right to cancel orders due to payment issues or stock unavailability</li>
                <li>Order confirmation is sent via email upon successful payment</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
              <Package className="text-brand-600" size={24} />
              Shipping and Delivery
            </h2>
            <div className="space-y-4 text-neutral-600 dark:text-neutral-400">
              <ul className="list-disc list-inside space-y-2">
                <li>Standard delivery: 5-7 business days</li>
                <li>Express delivery: 2-3 business days (additional charges apply)</li>
                <li>Delivery times are estimates and not guaranteed</li>
                <li>We are not responsible for delays caused by courier services</li>
                <li>Free shipping is available on orders above ₹999</li>
                <li>You will receive tracking information via email and SMS</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
              <AlertCircle className="text-brand-600" size={24} />
              Returns and Refunds
            </h2>
            <div className="space-y-4 text-neutral-600 dark:text-neutral-400">
              <ul className="list-disc list-inside space-y-2">
                <li>Returns are accepted within 7 days of delivery</li>
                <li>Items must be unworn, unwashed, and with original tags</li>
                <li>Refunds are processed within 7-10 business days</li>
                <li>Shipping charges are non-refundable</li>
                <li>Final sale items cannot be returned or exchanged</li>
                <li>Contact our support team to initiate a return</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
              <Users className="text-brand-600" size={24} />
              User Accounts
            </h2>
            <div className="space-y-4 text-neutral-600 dark:text-neutral-400">
              <ul className="list-disc list-inside space-y-2">
                <li>You are responsible for maintaining account security</li>
                <li>Provide accurate and complete information</li>
                <li>Notify us immediately of unauthorized access</li>
                <li>One account per person is allowed</li>
                <li>We reserve the right to suspend accounts for violations</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4">Intellectual Property</h2>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
              All content on this website, including text, images, logos, and designs, is the property of Mahir & Friends and protected by copyright laws. You may not use, reproduce, or distribute our content without prior written consent.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4">Limitation of Liability</h2>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Mahir & Friends shall not be liable for any indirect, incidental, special, or consequential damages arising from the use of our products or services. Our total liability shall not exceed the purchase price of the product.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4">Governing Law</h2>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
              These terms shall be governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Aligarh, Uttar Pradesh.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4">Changes to Terms</h2>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
              We reserve the right to modify these terms at any time. Continued use of our services after changes constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4">Contact Us</h2>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
              For questions about these Terms of Service, please contact us at:
            </p>
            <div className="mt-3 text-neutral-600 dark:text-neutral-400">
              <p>Email: replybymahirandfriends@gmail.com</p>
              <p>Phone: +91 6397684456</p>
              <p>Address: Aligarh, Uttar Pradesh, India - 202001</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
