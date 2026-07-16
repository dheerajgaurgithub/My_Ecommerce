import { Truck, Clock, MapPin, Package, Shield } from 'lucide-react';

export function ShippingPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-2">Shipping Information</h1>
        <p className="text-neutral-600 dark:text-neutral-400">Everything you need to know about delivery</p>
      </div>

      <div className="space-y-8">
        <div className="card p-6">
          <h2 className="font-semibold text-xl text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
            <Truck size={24} className="text-brand-600" /> Delivery Areas
          </h2>
          <div className="space-y-4 text-neutral-700 dark:text-neutral-300">
            <p>We deliver to over 19,000 pin codes across India. Our delivery network covers major cities, towns, and rural areas.</p>
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                <p className="font-medium text-neutral-900 dark:text-white mb-2">Metro Cities</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Delhi, Mumbai, Bangalore, Chennai, Kolkata, Hyderabad</p>
              </div>
              <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                <p className="font-medium text-neutral-900 dark:text-white mb-2">Tier 2 Cities</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Aligarh, Lucknow, Jaipur, Ahmedabad, Pune, Chandigarh</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-xl text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock size={24} className="text-brand-600" /> Delivery Timeline
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
              <div>
                <p className="font-medium text-neutral-900 dark:text-white">Metro Cities</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Delhi, Mumbai, Bangalore, etc.</p>
              </div>
              <p className="font-semibold text-brand-600">2-3 Business Days</p>
            </div>
            <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
              <div>
                <p className="font-medium text-neutral-900 dark:text-white">Tier 2 Cities</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Lucknow, Jaipur, Ahmedabad, etc.</p>
              </div>
              <p className="font-semibold text-brand-600">3-5 Business Days</p>
            </div>
            <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
              <div>
                <p className="font-medium text-neutral-900 dark:text-white">Other Areas</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Towns and rural locations</p>
              </div>
              <p className="font-semibold text-brand-600">5-7 Business Days</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-xl text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
            <Package size={24} className="text-brand-600" /> Shipping Charges
          </h2>
          <div className="space-y-4 text-neutral-700 dark:text-neutral-300">
            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div>
                <p className="font-medium text-green-900 dark:text-green-100">FREE Shipping</p>
                <p className="text-sm text-green-700 dark:text-green-300">Orders above ₹999</p>
              </div>
              <p className="font-bold text-green-600 text-lg">FREE</p>
            </div>
            <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
              <div>
                <p className="font-medium text-neutral-900 dark:text-white">Standard Delivery</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Orders below ₹999</p>
              </div>
              <p className="font-bold text-neutral-900 dark:text-white text-lg">₹49</p>
            </div>
            <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
              <div>
                <p className="font-medium text-neutral-900 dark:text-white">Express Delivery</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Priority shipping (select cities)</p>
              </div>
              <p className="font-bold text-neutral-900 dark:text-white text-lg">₹99</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-xl text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
            <MapPin size={24} className="text-brand-600" /> Order Tracking
          </h2>
          <div className="space-y-4 text-neutral-700 dark:text-neutral-300">
            <p>Track your order in real-time with our tracking system. You'll receive updates at every stage of delivery.</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>SMS notifications for order confirmation and dispatch</li>
              <li>Email updates with tracking link</li>
              <li>Real-time location tracking on our website</li>
              <li>Delivery confirmation with proof of delivery</li>
            </ul>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-xl text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
            <Shield size={24} className="text-brand-600" /> Secure Packaging
          </h2>
          <div className="space-y-4 text-neutral-700 dark:text-neutral-300">
            <p>We take extra care to ensure your products reach you in perfect condition.</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Premium quality packaging materials</li>
              <li>Water-resistant outer covers</li>
              <li>Tamper-evident seals</li>
              <li>Branded Mahir & Friends boxes</li>
              <li>Eco-friendly packaging wherever possible</li>
            </ul>
          </div>
        </div>

        <div className="card p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <h2 className="font-semibold text-xl text-blue-900 dark:text-blue-100 mb-4">Important Notes</h2>
          <ul className="list-disc list-inside space-y-2 text-blue-800 dark:text-blue-200 ml-2">
            <li>Delivery timeline may vary during peak seasons and festivals</li>
            <li>We do not deliver on Sundays and public holidays</li>
            <li>COD available only for orders below ₹10,000</li>
            <li>Multiple orders may be shipped together to reduce environmental impact</li>
            <li>Recipient must be available at the delivery address to receive the package</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
