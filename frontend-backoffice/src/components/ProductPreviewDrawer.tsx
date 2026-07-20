import React, { useEffect, useState } from 'react';
import { Typography, Chip, CircularProgress, Rating, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { createPortal } from 'react-dom';

const STATUS_COLORS: Record<string, 'warning' | 'success' | 'error' | 'default'> = {
  Pending: 'warning',
  Published: 'success',
  Hidden: 'default',
  Draft: 'default',
};

interface ProductPreviewDrawerProps {
  open: boolean;
  onClose: () => void;
  productId: string;
}

export const ProductPreviewDrawer: React.FC<ProductPreviewDrawerProps> = ({ open, onClose, productId }) => {
  const [product, setProduct] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
  const token = localStorage.getItem('accessToken');

  useEffect(() => {
    if (!open || !productId) return;

    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/admin/products/${productId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          setProduct(await res.json());
        }
      } catch (e) {
        console.error('Failed to fetch product', e);
      } finally {
        setLoading(false);
      }
    };

    const fetchReviews = async () => {
      setReviewsLoading(true);
      try {
        const res = await fetch(`${API_BASE}/products/${productId}/reviews`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          setReviews(await res.json());
        }
      } catch (e) {
        console.error('Failed to fetch reviews', e);
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchProduct();
    fetchReviews();
  }, [open, productId, token, API_BASE]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1300] overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/25 transition-opacity" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 z-[1301] max-w-full flex">
        <div className="w-full w-screen max-w-md lg:max-w-xl flex flex-col bg-white shadow-2xl h-full slide-in-right transform transition-all duration-300">
          
          {/* Drawer Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
            <Typography variant="h6" className="font-bold text-slate-900">Product Preview</Typography>
            <IconButton onClick={onClose} size="small" className="text-slate-400 hover:text-slate-600">
              <CloseIcon />
            </IconButton>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
            {loading ? (
              <div className="flex justify-center p-8"><CircularProgress size={32} sx={{ color: '#2563EB' }} /></div>
            ) : product ? (
              <>
                <div className="bg-white rounded-xl border border-slate-100 p-4 mb-6 flex gap-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)]">
                  <div className="w-24 h-24 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                    {product.images && product.images.length > 0 ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-400 text-sm">No image</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <Typography className="font-bold text-slate-900 mb-1">{product.name}</Typography>
                    <Typography className="text-sm text-slate-500 mb-2">Category: {product.category?.name || product.category || 'N/A'}</Typography>
                    <div className="flex justify-between items-center mb-2">
                      <Typography className="text-lg font-bold text-emerald-600">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price || 0)}
                      </Typography>
                      <Chip size="small" label={`Stock: ${product.stock || 0}`} className="bg-slate-100 text-slate-700 font-semibold" />
                    </div>
                    <Chip
                      label={product.status || 'N/A'}
                      sx={{ fontWeight: 700, height: 24, fontSize: '0.75rem' }}
                      color={STATUS_COLORS[product.status] ?? 'default'}
                    />
                  </div>
                </div>

                {product.description && (
                  <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] mb-6">
                    <Typography variant="h6" className="font-bold text-slate-900 mb-2">Description</Typography>
                    <Typography className="text-slate-700 text-sm whitespace-pre-wrap">{product.description}</Typography>
                  </div>
                )}

                <Typography variant="h6" className="font-bold text-slate-900 mb-4">Customer Reviews</Typography>
                {reviewsLoading ? (
                  <div className="flex justify-center p-8"><CircularProgress size={32} sx={{ color: '#2563EB' }} /></div>
                ) : reviews.length === 0 ? (
                  <div className="text-center p-8 text-slate-500 bg-white rounded-xl border border-slate-100 border-dashed">
                    No reviews yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="bg-white p-5 rounded-xl border border-slate-100 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)]">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm">
                              {review.user?.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div>
                              <Typography className="font-bold text-slate-900 text-sm">{review.user?.name}</Typography>
                              <Typography className="text-xs text-slate-400">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </Typography>
                            </div>
                          </div>
                          <Rating value={review.rating} readOnly size="small" />
                        </div>
                        <Typography className="text-slate-700 text-sm mb-4">{review.comment || 'No comment provided.'}</Typography>

                        {review.reply && (
                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mt-3">
                            <Typography className="text-xs font-bold text-slate-900 mb-1">Reply:</Typography>
                            <Typography className="text-sm text-slate-700">{review.reply.comment}</Typography>
                            <Typography className="text-xs text-slate-400 mt-1">
                              {new Date(review.reply.createdAt).toLocaleDateString()}
                            </Typography>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center p-8 text-slate-500">Failed to load product details</div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
