import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, CircularProgress, Rating, TextField, Button, Tabs, Tab } from '@mui/material';
import { apiClient } from '../../utils/api';
import SendIcon from '@mui/icons-material/Send';

interface ReviewProduct {
  id: string;
  name: string;
  images: string[];
}

interface ReviewUser {
  id: string;
  name: string;
}

interface ReviewReply {
  id: string;
  comment: string;
  createdAt: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: ReviewUser;
  product: ReviewProduct;
  reply: ReviewReply | null;
}

export const ReviewsPage: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterRating, setFilterRating] = useState<number | 'ALL'>('ALL');
  
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [isReplying, setIsReplying] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await apiClient.get<Review[]>('/seller/reviews');
        setReviews(response.data);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Could not load reviews.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchReviews();
  }, []);

  const submitReply = async (reviewId: string) => {
    const comment = replyText[reviewId];
    if (!comment?.trim()) return;

    setIsReplying((prev) => ({ ...prev, [reviewId]: true }));
    try {
      const response = await apiClient.post(`/seller/reviews/${reviewId}/reply`, { comment });
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId ? { ...r, reply: response.data } : r
        )
      );
      setReplyText((prev) => ({ ...prev, [reviewId]: '' }));
    } catch (err: any) {
      console.error('Failed to submit reply:', err);
      alert(err?.response?.data?.message || 'Failed to submit reply');
    } finally {
      setIsReplying((prev) => ({ ...prev, [reviewId]: false }));
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number | 'ALL') => {
    setFilterRating(newValue);
  };

  const filteredReviews = reviews.filter(review => filterRating === 'ALL' || review.rating === filterRating);

  return (
    <Box sx={{ bgcolor: '#F9FAFB', minHeight: '100%' }}>
      <Box sx={{ maxWidth: 1280, mx: 'auto', p: { xs: 2, md: 4 } }}>
        <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 3, border: '1px solid #E5E7EB', bgcolor: 'white', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#111827' }}>
            Review Management
          </Typography>
          <Typography variant="body2" sx={{ color: '#6B7280', mt: 1, mb: 4 }}>
            Monitor and respond to customer feedback across all your products.
          </Typography>

          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={filterRating} 
              onChange={handleTabChange} 
              aria-label="review filters"
              sx={{
                '& .MuiTabs-indicator': { backgroundColor: '#FF4742' },
                '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, color: '#6B7280' },
                '& .Mui-selected': { color: '#FF4742 !important' },
              }}
            >
              <Tab label="All Reviews" value="ALL" />
              <Tab label="5 Stars" value={5} />
              <Tab label="4 Stars" value={4} />
              <Tab label="3 Stars" value={3} />
              <Tab label="2 Stars" value={2} />
              <Tab label="1 Star" value={1} />
            </Tabs>
          </Box>
        </Paper>

        {error && (
          <Box className="mb-6 border border-red-200 bg-red-50 p-4 text-red-700 rounded-xl">
            {error}
          </Box>
        )}

        {isLoading ? (
          <Box className="flex justify-center items-center py-20">
            <CircularProgress size={40} sx={{ color: '#FF4742' }} />
          </Box>
        ) : filteredReviews.length === 0 ? (
          <Box className="bg-white rounded-xl border border-slate-100 p-12 text-center text-slate-500 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)]">
            No reviews found for this filter.
          </Box>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredReviews.map((review) => (
              <div key={review.id} className="bg-white rounded-xl border border-slate-100 p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] flex flex-col h-full">
                {/* Product Info Summary */}
                <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="w-12 h-12 rounded bg-white overflow-hidden border border-slate-100 shrink-0">
                    {review.product.images.length > 0 ? (
                      <img src={review.product.images[0]} alt={review.product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">No Img</div>
                    )}
                  </div>
                  <Typography className="text-sm font-semibold text-slate-900 line-clamp-2">
                    {review.product.name}
                  </Typography>
                </div>

                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                      {review.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <Typography className="font-bold text-slate-900">{review.user.name}</Typography>
                      <Typography className="text-xs text-slate-400">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </Typography>
                    </div>
                  </div>
                  <Rating value={review.rating} readOnly size="small" />
                </div>
                
                <Typography className="text-slate-700 mb-6 flex-grow">
                  {review.comment || 'No text review provided.'}
                </Typography>

                {/* Inline Reply */}
                <div className="mt-auto">
                  {review.reply ? (
                    <div className="bg-emerald-50/50 p-4 rounded-lg border border-emerald-100">
                      <Typography className="text-xs font-bold text-emerald-800 mb-1 flex items-center gap-1">
                        Seller Reply
                      </Typography>
                      <Typography className="text-sm text-slate-700">{review.reply.comment}</Typography>
                      <Typography className="text-xs text-slate-400 mt-2">
                        {new Date(review.reply.createdAt).toLocaleDateString()}
                      </Typography>
                    </div>
                  ) : (
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <div className="flex gap-2">
                        <TextField
                          size="small"
                          fullWidth
                          placeholder="Respond to this review..."
                          variant="outlined"
                          value={replyText[review.id] || ''}
                          onChange={(e) => setReplyText(prev => ({ ...prev, [review.id]: e.target.value }))}
                          sx={{ 
                            bgcolor: 'white', 
                            '& .MuiOutlinedInput-root': { borderRadius: 2 } 
                          }}
                        />
                        <Button
                          variant="contained"
                          sx={{ bgcolor: '#FF4742', '&:hover': { bgcolor: '#e63f3a' }, minWidth: '48px', px: 2 }}
                          onClick={() => submitReply(review.id)}
                          disabled={isReplying[review.id] || !replyText[review.id]?.trim()}
                        >
                          {isReplying[review.id] ? <CircularProgress size={20} color="inherit" /> : <SendIcon fontSize="small" />}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Box>
    </Box>
  );
};
