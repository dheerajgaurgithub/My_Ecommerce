
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Star, Package, Truck, Heart, Send, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '../lib/toast';

export function FeedbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const orderId = searchParams.get('orderId');
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    productQuality: { rating: 5, comments: '' },
    deliveryExperience: { rating: 5, comments: '' },
    overallService: { rating: 5, comments: '' },
    queries: '',
    suggestions: '',
    wouldRecommend: true
  });

  useEffect(() => {
    if (!orderId) {
      showToast('Invalid feedback link', 'error');
      navigate('/');
      return;
    }
    // You could optionally fetch order details here
    setLoading(false);
  }, [orderId, navigate, showToast]);

  const handleRatingChange = (category: 'productQuality' | 'deliveryExperience' | 'overallService', rating: number) => {
    setFormData(prev => ({
      ...prev,
      [category]: { ...prev[category], rating }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('http://localhost:5000/api/feedback/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          ...formData
        })
      });

      const data = await response.json();
      if (data.success) {
        setSubmitted(true);
        showToast('Thank you for your feedback!', 'success');
      } else {
        showToast(data.message || 'Failed to submit feedback', 'error');
      }
    } catch (error) {
      showToast('Error submitting feedback', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ rating, onRate }: { rating: number; onRate: (rating: number) => void }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRate(star)}
          className="transition-transform hover:scale-110"
        >
          <Star
            size={24}
            className={star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-neutral-300'}
          />
        </button>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin text-4xl">⏳</div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-neutral-900 dark:to-neutral-800 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-8 max-w-md w-full text-center shadow-xl">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
            Thank You!
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            Your feedback has been submitted successfully. We appreciate your input and will use it to improve our services.
          </p>
          <button
            onClick={() => navigate('/')}
            className="btn-primary w-full"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-neutral-900 dark:to-neutral-800 py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-8 shadow-xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
              Share Your Experience
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              Help us improve by sharing your feedback on your recent order
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Product Quality */}
            <div className="bg-neutral-50 dark:bg-neutral-700 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Package className="text-purple-600" size={24} />
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                  Product Quality
                </h2>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  How would you rate the product quality?
                </label>
                <StarRating
                  rating={formData.productQuality.rating}
                  onRate={(rating) => handleRatingChange('productQuality', rating)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Additional comments (optional)
                </label>
                <textarea
                  value={formData.productQuality.comments}
                  onChange={(e) => setFormData({
                    ...formData,
                    productQuality: { ...formData.productQuality, comments: e.target.value }
                  })}
                  className="input w-full min-h-[80px]"
                  placeholder="Tell us about the product quality..."
                />
              </div>
            </div>

            {/* Delivery Experience */}
            <div className="bg-neutral-50 dark:bg-neutral-700 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Truck className="text-blue-600" size={24} />
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                  Delivery Experience
                </h2>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  How would you rate the delivery experience?
                </label>
                <StarRating
                  rating={formData.deliveryExperience.rating}
                  onRate={(rating) => handleRatingChange('deliveryExperience', rating)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Additional comments (optional)
                </label>
                <textarea
                  value={formData.deliveryExperience.comments}
                  onChange={(e) => setFormData({
                    ...formData,
                    deliveryExperience: { ...formData.deliveryExperience, comments: e.target.value }
                  })}
                  className="input w-full min-h-[80px]"
                  placeholder="Tell us about the delivery experience..."
                />
              </div>
            </div>

            {/* Overall Service */}
            <div className="bg-neutral-50 dark:bg-neutral-700 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Heart className="text-red-600" size={24} />
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                  Overall Service
                </h2>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  How would you rate our overall service?
                </label>
                <StarRating
                  rating={formData.overallService.rating}
                  onRate={(rating) => handleRatingChange('overallService', rating)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Additional comments (optional)
                </label>
                <textarea
                  value={formData.overallService.comments}
                  onChange={(e) => setFormData({
                    ...formData,
                    overallService: { ...formData.overallService, comments: e.target.value }
                  })}
                  className="input w-full min-h-[80px]"
                  placeholder="Tell us about your overall experience..."
                />
              </div>
            </div>

            {/* Queries */}
            <div className="bg-neutral-50 dark:bg-neutral-700 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                Do you have any queries or concerns?
              </h2>
              <textarea
                value={formData.queries}
                onChange={(e) => setFormData({ ...formData, queries: e.target.value })}
                className="input w-full min-h-[100px]"
                placeholder="If you have any questions or concerns, please let us know..."
              />
            </div>

            {/* Suggestions */}
            <div className="bg-neutral-50 dark:bg-neutral-700 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                Suggestions for Improvement
              </h2>
              <textarea
                value={formData.suggestions}
                onChange={(e) => setFormData({ ...formData, suggestions: e.target.value })}
                className="input w-full min-h-[100px]"
                placeholder="How can we improve our products and services?"
              />
            </div>

            {/* Recommendation */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-neutral-700 dark:to-neutral-600 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                Would you recommend Mahir & Friends to others?
              </h2>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, wouldRecommend: true })}
                  className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all ${
                    formData.wouldRecommend
                      ? 'bg-green-500 text-white'
                      : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-2 border-neutral-300 dark:border-neutral-600'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle size={20} />
                    Yes, I would
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, wouldRecommend: false })}
                  className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all ${
                    !formData.wouldRecommend
                      ? 'bg-red-500 text-white'
                      : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-2 border-neutral-300 dark:border-neutral-600'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <XCircle size={20} />
                    No, I wouldn't
                  </div>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={20} />
                  Submit Feedback
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
