import { useState } from 'react';
import { Star, ThumbsUp, ThumbsDown, Filter, SortDesc } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useToast } from '../lib/toast';
import { api } from '../lib/api';
import { formatDate } from '../lib/utils';

interface Review {
  _id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  rating: number;
  title: string;
  comment: string;
  pros: string[];
  cons: string[];
  images: string[];
  verified_purchase: boolean;
  helpful_count: number;
  not_helpful_count: number;
  created_at: string;
}

interface ProductReviewsProps {
  productId: string;
  averageRating: number;
  reviewCount: number;
}

export function ProductReviews({ productId, averageRating, reviewCount }: ProductReviewsProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'verified' | 'with_images'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'helpful' | 'rating_high' | 'rating_low'>('recent');

  useState(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ success: boolean; reviews: Review[] }>(`/products/${productId}/reviews`);
      if (response.success) {
        setReviews(response.reviews);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleHelpful = async (reviewId: string, helpful: boolean) => {
    if (!user) {
      showToast('Please login to mark reviews as helpful', 'info');
      return;
    }
    try {
      await api.post(`/reviews/${reviewId}/helpful`, { helpful });
      setReviews(reviews.map(r => 
        r._id === reviewId 
          ? { 
              ...r, 
              helpful_count: helpful ? r.helpful_count + 1 : r.helpful_count,
              not_helpful_count: !helpful ? r.not_helpful_count + 1 : r.not_helpful_count
            }
          : r
      ));
      showToast('Thanks for your feedback', 'success');
    } catch (error) {
      console.error('Failed to mark review as helpful:', error);
    }
  };

  const filteredReviews = reviews.filter(r => {
    if (filter === 'verified' && !r.verified_purchase) return false;
    if (filter === 'with_images' && r.images.length === 0) return false;
    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'helpful':
        return b.helpful_count - a.helpful_count;
      case 'rating_high':
        return b.rating - a.rating;
      case 'rating_low':
        return a.rating - b.rating;
      default:
        return 0;
    }
  });

  const ratingDistribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => Math.round(r.rating) === star).length,
    percentage: reviews.length > 0 ? (reviews.filter(r => Math.round(r.rating) === star).length / reviews.length) * 100 : 0
  }));

  return (
    <div className="space-y-8">
      {/* Rating Summary */}
      <div className="card p-6">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="text-center md:text-left">
            <div className="flex items-center gap-3 justify-center md:justify-start">
              <span className="text-5xl font-bold text-neutral-900 dark:text-white">{averageRating.toFixed(1)}</span>
              <div>
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={20}
                      className={i < Math.round(averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-neutral-300'}
                    />
                  ))}
                </div>
                <p className="text-sm text-neutral-500 mt-1">{reviewCount} reviews</p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {ratingDistribution.map(({ star, count, percentage }) => (
              <div key={star} className="flex items-center gap-2">
                <span className="text-sm text-neutral-600 dark:text-neutral-400 w-6">{star}★</span>
                <div className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${percentage}%` }} />
                </div>
                <span className="text-sm text-neutral-500 w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Write Review Button */}
      {user && (
        <button
          onClick={() => setShowReviewForm(true)}
          className="btn-primary w-full md:w-auto"
        >
          Write a Review
        </button>
      )}

      {/* Filters and Sort */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-neutral-500" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm"
          >
            <option value="all">All Reviews</option>
            <option value="verified">Verified Purchases</option>
            <option value="with_images">With Images</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <SortDesc size={18} className="text-neutral-500" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm"
          >
            <option value="recent">Most Recent</option>
            <option value="helpful">Most Helpful</option>
            <option value="rating_high">Highest Rating</option>
            <option value="rating_low">Lowest Rating</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/4 mb-2" />
              <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 mb-4" />
              <div className="h-20 bg-neutral-200 dark:bg-neutral-700 rounded" />
            </div>
          ))}
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-neutral-500">No reviews yet. Be the first to review this product!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <ReviewCard key={review._id} review={review} onHelpful={handleHelpful} />
          ))}
        </div>
      )}

      {/* Review Form Modal */}
      {showReviewForm && (
        <ReviewForm
          productId={productId}
          onClose={() => setShowReviewForm(false)}
          onSubmitted={() => {
            setShowReviewForm(false);
            fetchReviews();
          }}
        />
      )}
    </div>
  );
}

function ReviewCard({ review, onHelpful }: { review: Review; onHelpful: (id: string, helpful: boolean) => void }) {
  return (
    <div className="card p-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-brand-100 dark:bg-brand-900 rounded-full flex items-center justify-center text-brand-600 font-semibold">
          {review.user_name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-neutral-900 dark:text-white">{review.user_name}</span>
            {review.verified_purchase && (
              <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-2 py-0.5 rounded">
                Verified Purchase
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  className={i < Math.round(review.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-neutral-300'}
                />
              ))}
            </div>
            <span className="text-xs text-neutral-500">{formatDate(review.created_at)}</span>
          </div>
          <h4 className="font-medium text-neutral-900 dark:text-white mb-2">{review.title}</h4>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">{review.comment}</p>
          
          {review.pros.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-green-600 mb-1">Pros:</p>
              <div className="flex flex-wrap gap-1">
                {review.pros.map((pro, i) => (
                  <span key={i} className="text-xs bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-300 px-2 py-0.5 rounded">
                    {pro}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {review.cons.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-red-600 mb-1">Cons:</p>
              <div className="flex flex-wrap gap-1">
                {review.cons.map((con, i) => (
                  <span key={i} className="text-xs bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-300 px-2 py-0.5 rounded">
                    {con}
                  </span>
                ))}
              </div>
            </div>
          )}

          {review.images.length > 0 && (
            <div className="flex gap-2 mb-4">
              {review.images.map((img, i) => (
                <img key={i} src={img} alt="" className="w-20 h-20 object-cover rounded-lg" />
              ))}
            </div>
          )}

          <div className="flex items-center gap-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <p className="text-sm text-neutral-500">Was this helpful?</p>
            <button
              onClick={() => onHelpful(review._id, true)}
              className="flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-400 hover:text-brand-600"
            >
              <ThumbsUp size={16} />
              {review.helpful_count}
            </button>
            <button
              onClick={() => onHelpful(review._id, false)}
              className="flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-400 hover:text-red-600"
            >
              <ThumbsDown size={16} />
              {review.not_helpful_count}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewForm({ productId, onClose, onSubmitted }: { productId: string; onClose: () => void; onSubmitted: () => void }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [pros, setPros] = useState('');
  const [cons, setCons] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('Please login to submit a review', 'info');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/products/${productId}/reviews`, {
        rating,
        title,
        comment,
        pros: pros.split(',').map(p => p.trim()).filter(Boolean),
        cons: cons.split(',').map(c => c.trim()).filter(Boolean),
      });
      showToast('Review submitted successfully', 'success');
      onSubmitted();
    } catch (error) {
      console.error('Failed to submit review:', error);
      showToast('Failed to submit review', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-neutral-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">Write a Review</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Rating</label>
            <div className="flex gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRating(i + 1)}
                  className="p-1"
                >
                  <Star
                    size={28}
                    className={i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-neutral-300'}
                  />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input w-full"
              required
              placeholder="Summarize your experience"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Review</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="input w-full h-32 resize-none"
              required
              placeholder="Tell us about your experience with this product"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Pros (comma separated)</label>
            <input
              type="text"
              value={pros}
              onChange={(e) => setPros(e.target.value)}
              className="input w-full"
              placeholder="e.g., Good quality, Fast delivery"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Cons (comma separated)</label>
            <input
              type="text"
              value={cons}
              onChange={(e) => setCons(e.target.value)}
              className="input w-full"
              placeholder="e.g., Size runs small"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1">
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
