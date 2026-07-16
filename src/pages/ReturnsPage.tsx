import { RotateCcw, RefreshCw, Shield, Clock, AlertCircle } from 'lucide-react';

export function ReturnsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-2">Returns & Refunds</h1>
        <p className="text-neutral-600 dark:text-neutral-400">Our hassle-free return policy ensures your satisfaction</p>
      </div>

      <div className="space-y-8">
        <div className="card p-6">
          <h2 className="font-semibold text-xl text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
            <RotateCcw size={24} className="text-brand-600" /> Return Policy
          </h2>
          <div className="space-y-4 text-neutral-700 dark:text-neutral-300">
            <p>We want you to be completely satisfied with your purchase. If you're not happy with your order, we offer easy returns within 7 days of delivery.</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Items must be unworn, unwashed, and in original condition with tags attached</li>
              <li>Original packaging must be intact</li>
              <li>Return request must be initiated within 7 days of delivery</li>
              <li>Proof of purchase (order number) is required</li>
            </ul>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-xl text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
            <RefreshCw size={24} className="text-brand-600" /> Exchange Policy
          </h2>
          <div className="space-y-4 text-neutral-700 dark:text-neutral-300">
            <p>Prefer a different size or color? We offer free exchanges on all items within 7 days of delivery.</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Size exchanges are free of charge</li>
              <li>Color exchanges are subject to availability</li>
              <li>Only one exchange per order allowed</li>
              <li>Exchanged item must be in original condition</li>
            </ul>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-xl text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
            <Shield size={24} className="text-brand-600" /> Refund Process
          </h2>
          <div className="space-y-4 text-neutral-700 dark:text-neutral-300">
            <p>Refunds are processed within 5-7 business days after we receive and inspect your return.</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Refunds are credited to the original payment method</li>
              <li>Bank transfers may take additional 2-3 business days to reflect</li>
              <li>Store credit is available immediately upon return approval</li>
              <li>Shipping charges are non-refundable</li>
            </ul>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-xl text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock size={24} className="text-brand-600" /> Return Timeline
          </h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-brand-100 dark:bg-brand-900 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-brand-600 dark:text-brand-300 font-bold text-sm">1</span>
              </div>
              <div>
                <p className="font-medium text-neutral-900 dark:text-white">Initiate Return</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Contact us within 7 days of delivery</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-brand-100 dark:bg-brand-900 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-brand-600 dark:text-brand-300 font-bold text-sm">2</span>
              </div>
              <div>
                <p className="font-medium text-neutral-900 dark:text-white">Schedule Pickup</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Our courier will pick up the item from your address</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-brand-100 dark:bg-brand-900 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-brand-600 dark:text-brand-300 font-bold text-sm">3</span>
              </div>
              <div>
                <p className="font-medium text-neutral-900 dark:text-white">Quality Check</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">We inspect the returned item (1-2 days)</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-brand-100 dark:bg-brand-900 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-brand-600 dark:text-brand-300 font-bold text-sm">4</span>
              </div>
              <div>
                <p className="font-medium text-neutral-900 dark:text-white">Refund Processed</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Amount credited within 5-7 business days</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
          <h2 className="font-semibold text-xl text-amber-900 dark:text-amber-100 mb-4 flex items-center gap-2">
            <AlertCircle size={24} /> Non-Returnable Items
          </h2>
          <ul className="list-disc list-inside space-y-2 text-amber-800 dark:text-amber-200 ml-2">
            <li>Items marked as "Final Sale" or "Non-Returnable"</li>
            <li>Personalized or customized products</li>
            <li>Innerwear and socks for hygiene reasons</li>
            <li>Items damaged due to customer misuse</li>
            <li>Items without original tags or packaging</li>
          </ul>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-xl text-neutral-900 dark:text-white mb-4">How to Initiate a Return</h2>
          <ol className="list-decimal list-inside space-y-3 text-neutral-700 dark:text-neutral-300 ml-2">
            <li>Go to your Orders section in your account</li>
            <li>Select the order you want to return</li>
            <li>Click on "Return Item" and select the reason</li>
            <li>Choose your preferred refund method (original payment or store credit)</li>
            <li>Schedule a pickup at your convenience</li>
            <li>Hand over the item to our courier partner</li>
            <li>Receive your refund within 5-7 business days</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
