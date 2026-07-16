import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  size?: number;
  showNumber?: boolean;
  reviewCount?: number;
}

export function StarRating({ rating, size = 16, showNumber = false, reviewCount }: StarRatingProps) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            className={
              star <= Math.round(rating)
                ? 'fill-accent-400 text-accent-400'
                : 'fill-neutral-200 text-neutral-200 dark:fill-neutral-600 dark:text-neutral-600'
            }
          />
        ))}
      </div>
      {showNumber && (
        <span className="text-sm text-neutral-600 dark:text-neutral-400 ml-1">
          {rating.toFixed(1)}
          {reviewCount !== undefined && ` (${reviewCount})`}
        </span>
      )}
    </div>
  );
}
