import { Link } from 'react-router-dom';
import { Shield, Lock, Eye, Database, Cookie, Mail } from 'lucide-react';

export function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link to="/" className="text-brand-600 hover:text-brand-700 font-medium mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="font-serif text-4xl font-bold text-neutral-900 dark:text-white mt-4">Privacy Policy</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-2">Last updated: July 2026</p>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-sm p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
              <Shield className="text-brand-600" size={24} />
              Introduction
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
              At Mahir & Friends, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services. Please read this policy carefully.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
              <Database className="text-brand-600" size={24} />
              Information We Collect
            </h2>
            <div className="space-y-4 text-neutral-600 dark:text-neutral-400">
              <div>
                <h3 className="font-medium text-neutral-900 dark:text-white mb-2">Personal Information</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Name and contact information (email, phone, address)</li>
                  <li>Account credentials (username, password)</li>
                  <li>Payment information (processed securely through third-party payment gateways)</li>
                  <li>Delivery preferences and instructions</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-neutral-900 dark:text-white mb-2">Usage Information</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Browsing history and pages visited</li>
                  <li>Products viewed and purchased</li>
                  <li>Search queries and filters used</li>
                  <li>Device information and IP address</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
              <Eye className="text-brand-600" size={24} />
              How We Use Your Information
            </h2>
            <ul className="list-disc list-inside space-y-2 text-neutral-600 dark:text-neutral-400">
              <li>Process and fulfill your orders</li>
              <li>Send order confirmations and shipping updates</li>
              <li>Provide customer support</li>
              <li>Improve our products and services</li>
              <li>Send marketing communications (with your consent)</li>
              <li>Prevent fraud and ensure security</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
              <Lock className="text-brand-600" size={24} />
              Data Security
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-neutral-600 dark:text-neutral-400 mt-3">
              <li>SSL encryption for data transmission</li>
              <li>Secure payment processing through Razorpay</li>
              <li>Regular security audits and updates</li>
              <li>Restricted access to personal data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
              <Cookie className="text-brand-600" size={24} />
              Cookies and Tracking
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
              We use cookies and similar technologies to enhance your browsing experience, analyze site traffic, and personalize content. You can manage your cookie preferences through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
              <Mail className="text-brand-600" size={24} />
              Your Rights
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
              You have the right to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-neutral-600 dark:text-neutral-400 mt-3">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Delete your account and personal data</li>
              <li>Opt-out of marketing communications</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4">Contact Us</h2>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
              If you have any questions about this Privacy Policy or our data practices, please contact us at:
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
