'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/utils/api';

export interface ProductReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { name: string };
}

interface EligibleOrder {
  orderId: string;
}

interface ProductReviewsSectionProps {
  productId: string;
  averageRating: number;
  initialReviews: ProductReview[];
  reviewOrderFromUrl?: string;
}

function StarIcon({ filled, size = 'md' }: { filled: boolean; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass =
    size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5';

  return (
    <svg
      className={`${sizeClass} ${filled ? 'text-[#F59E0B] fill-current' : 'text-gray-300 fill-current'}`}
      viewBox="0 0 20 20"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

function StarRatingDisplay({
  rating,
  size = 'md',
}: {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
}) {
  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon key={star} filled={star <= Math.round(rating)} size={size} />
      ))}
    </div>
  );
}

export default function ProductReviewsSection({
  productId,
  averageRating,
  initialReviews,
  reviewOrderFromUrl,
}: ProductReviewsSectionProps) {
  const router = useRouter();
  const [reviews, setReviews] = useState<ProductReview[]>(initialReviews);
  const [selectedRating, setSelectedRating] = useState(5);
  const [comment, setComment] = useState('');
  const [activeOrderId, setActiveOrderId] = useState<string | null>(
    reviewOrderFromUrl ?? null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchReviews = useCallback(async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '').endsWith('/api') ? process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '') : `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/+$/, '')}/api`}/products/${productId}/reviews`,
        { cache: 'no-store' },
      );
      if (response.ok) {
        const data = await response.json();
        setReviews(data);
      }
    } catch {
      // Giữ reviews hiện tại nếu fetch thất bại
    }
  }, [productId]);

  const detectEligibleOrder = useCallback(async () => {
    if (reviewOrderFromUrl) {
      setActiveOrderId(reviewOrderFromUrl);
      return;
    }

    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('accessToken')
        : null;
    if (!token) return;

    try {
      const response = await apiClient.get<{
        data: {
          items: Array<{
            orderId: string;
            status: string;
            items: Array<{
              productId: string;
              hasReviewed: boolean;
            }>;
          }>;
        };
      }>('/orders/my-orders?status=DELIVERED');

      const eligibleOrders: EligibleOrder[] = [];

      for (const order of response.data.data.items) {
        if (order.status !== 'DELIVERED') continue;
        for (const item of order.items) {
          if (item.productId === productId && !item.hasReviewed) {
            eligibleOrders.push({ orderId: order.orderId });
          }
        }
      }

      if (eligibleOrders.length > 0) {
        setActiveOrderId(eligibleOrders[0].orderId);
      }
    } catch {
      // User chưa đăng nhập hoặc không có đơn hợp lệ
    }
  }, [productId, reviewOrderFromUrl]);

  useEffect(() => {
    detectEligibleOrder();
  }, [detectEligibleOrder]);

  useEffect(() => {
    if (reviewOrderFromUrl) {
      setActiveOrderId(reviewOrderFromUrl);
    }
  }, [reviewOrderFromUrl]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrderId) return;

    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await apiClient.post(`/products/${productId}/reviews`, {
        orderId: activeOrderId,
        rating: selectedRating,
        comment: comment.trim() || undefined,
      });

      setSuccessMessage('Your review has been successfully submitted!');
      setComment('');
      setActiveOrderId(null);

      await fetchReviews();
      router.refresh();
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { data?: { message?: string | string[] } };
      };
      const message = axiosError.response?.data?.message;
      setError(
        Array.isArray(message)
          ? message.join(', ')
          : message || 'Failed to submit review. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const commentLength = comment.length;
  const maxCommentLength = 200;

  return (
    <section className="mt-10 border-t border-gray-100 pt-10">
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-gray-900 lg:text-2xl">
          Product Reviews
        </h2>
        <div className="flex items-center gap-3">
          <StarRatingDisplay rating={averageRating} size="md" />
          <span className="text-lg font-bold text-[#F59E0B]">
            {averageRating > 0 ? averageRating.toFixed(1) : '0.0'}
          </span>
          <span className="text-sm text-gray-500">
            ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
          </span>
        </div>
      </div>

      {activeOrderId && (
        <div className="mb-8 rounded-xl border border-gray-100 bg-gray-50 p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Write Your Review
          </h3>

          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Select star rating
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setSelectedRating(star)}
                    className="rounded p-0.5 transition hover:scale-110"
                    aria-label={`${star} star${star > 1 ? 's' : ''}`}
                  >
                    <StarIcon filled={star <= selectedRating} size="lg" />
                  </button>
                ))}
                <span className="ml-2 text-sm font-medium text-gray-600">
                  {selectedRating}/5
                </span>
              </div>
            </div>

            <div>
              <label
                htmlFor="review-comment"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Comment (optional)
              </label>
              <textarea
                id="review-comment"
                value={comment}
                onChange={(e) => {
                  if (e.target.value.length <= maxCommentLength) {
                    setComment(e.target.value);
                  }
                }}
                rows={4}
                placeholder="Share your experience with this product..."
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#FF4742] focus:outline-none focus:ring-1 focus:ring-[#FF4742]"
              />
              <p
                className={`mt-1 text-right text-xs ${commentLength >= maxCommentLength ? 'text-red-500' : 'text-gray-400'}`}
              >
                {commentLength}/{maxCommentLength}
              </p>
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
                {error}
              </p>
            )}

            {successMessage && (
              <p className="rounded-lg bg-green-50 px-4 py-2 text-sm text-green-600">
                {successMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-lg bg-[#FF4742] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#E63E39] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-12 text-center">
          <p className="text-gray-500">
            No reviews yet for this product.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {reviews.map((review) => (
            <li
              key={review.id}
              className="rounded-xl border border-gray-100 bg-white p-5"
            >
              <div className="mb-2 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF4742]/10 text-sm font-bold text-[#FF4742]">
                    {review.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {review.user.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {isMounted ? new Date(review.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      }) : ''}
                    </p>
                  </div>
                </div>
                <StarRatingDisplay rating={review.rating} size="sm" />
              </div>
              {review.comment && (
                <p className="mt-3 text-sm leading-relaxed text-gray-600">
                  {review.comment}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
