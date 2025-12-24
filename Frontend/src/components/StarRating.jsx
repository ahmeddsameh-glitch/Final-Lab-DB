import { Star } from 'lucide-react';
import '../Styles/StarRating.css';

export default function StarRating({ rating, onRatingChange, readonly = false }) {
    return (
        <div className="star-rating">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    className={`star-btn ${readonly ? 'readonly' : ''}`}
                    onClick={() => !readonly && onRatingChange && onRatingChange(star)}
                    disabled={readonly}
                    aria-label={`${star} star${star > 1 ? 's' : ''}`}
                >
                    <Star
                        size={24}
                        fill={star <= rating ? '#fbbf24' : 'none'}
                        stroke={star <= rating ? '#fbbf24' : '#d1d5db'}
                        strokeWidth={2}
                    />
                </button>
            ))}
        </div>
    );
}
