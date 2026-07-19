import { useNavigate } from 'react-router-dom';
import { Truck, Package, DollarSign, Clock, ArrowRight, MapPin, ShieldCheck, Users } from 'lucide-react';

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
      {/* Hero Section */}
      <header className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <h1 className="font-bold text-xl text-neutral-900 dark:text-white">
                Delivery Partner Portal
              </h1>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="btn-primary"
            >
              Login
            </button>
          </div>
        </div>
      </header>

      {/* Hero Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-bold text-neutral-900 dark:text-white mb-6">
            Deliver with Us and Earn Money
          </h2>
          <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-8">
            Join our delivery network and start earning on your own schedule. 
            Flexible hours, competitive pay, and easy registration.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="btn-primary text-lg px-8 py-4 flex items-center gap-2 mx-auto"
          >
            Get Started
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white dark:bg-neutral-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h3 className="text-3xl font-bold text-center text-neutral-900 dark:text-white mb-12">
            Why Choose Us?
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="card p-6 text-center">
              <div className="w-14 h-14 bg-brand-100 dark:bg-brand-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Clock className="w-7 h-7 text-brand-600 dark:text-brand-400" />
              </div>
              <h4 className="font-semibold text-lg text-neutral-900 dark:text-white mb-2">
                Flexible Hours
              </h4>
              <p className="text-neutral-600 dark:text-neutral-400">
                Work when you want. Choose your own schedule and deliver at your convenience.
              </p>
            </div>

            <div className="card p-6 text-center">
              <div className="w-14 h-14 bg-green-100 dark:bg-green-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-7 h-7 text-green-600 dark:text-green-400" />
              </div>
              <h4 className="font-semibold text-lg text-neutral-900 dark:text-white mb-2">
                Competitive Pay
              </h4>
              <p className="text-neutral-600 dark:text-neutral-400">
                Earn competitive rates for every delivery. Get paid weekly directly to your bank.
              </p>
            </div>

            <div className="card p-6 text-center">
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Package className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="font-semibold text-lg text-neutral-900 dark:text-white mb-2">
                Easy Registration
              </h4>
              <p className="text-neutral-600 dark:text-neutral-400">
                Simple registration process with quick approval. Start delivering within days.
              </p>
            </div>

            <div className="card p-6 text-center">
              <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-7 h-7 text-purple-600 dark:text-purple-400" />
              </div>
              <h4 className="font-semibold text-lg text-neutral-900 dark:text-white mb-2">
                Local Deliveries
              </h4>
              <p className="text-neutral-600 dark:text-neutral-400">
                Deliver in your local area. No long-distance travel required.
              </p>
            </div>

            <div className="card p-6 text-center">
              <div className="w-14 h-14 bg-yellow-100 dark:bg-yellow-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-7 h-7 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h4 className="font-semibold text-lg text-neutral-900 dark:text-white mb-2">
                Insurance Coverage
              </h4>
              <p className="text-neutral-600 dark:text-neutral-400">
                Comprehensive insurance coverage for you and the packages you deliver.
              </p>
            </div>

            <div className="card p-6 text-center">
              <div className="w-14 h-14 bg-red-100 dark:bg-red-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7 text-red-600 dark:text-red-400" />
              </div>
              <h4 className="font-semibold text-lg text-neutral-900 dark:text-white mb-2">
                Support Team
              </h4>
              <p className="text-neutral-600 dark:text-neutral-400">
                Dedicated support team available 24/7 to help you with any issues.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="card p-12">
            <h3 className="text-3xl font-bold text-neutral-900 dark:text-white mb-4">
              Ready to Start Earning?
            </h3>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-8">
              Join thousands of delivery partners already earning with us. 
              Sign up today and start your journey.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/register')}
                className="btn-primary text-lg px-8 py-4 flex items-center justify-center gap-2"
              >
                Register Now
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="btn-secondary text-lg px-8 py-4"
              >
                Already a Partner? Login
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 dark:bg-black py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-neutral-400">
            © 2024 Delivery Partner Portal. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
