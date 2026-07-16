import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  Rating,
  TextField,
  TablePagination,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../utils/api';
import { useAuthStore } from '../../stores/authStore';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';

interface SellerProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  status: string;
  images: string[];
  isRejected?: boolean;
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
  reply: ReviewReply | null;
}

const badgeColors: Record<string, { background: string; color: string }> = {
  Published: { background: '#DCFCE7', color: '#166534' },
  Pending: { background: '#FEF3C7', color: '#92400E' },
  Hidden: { background: '#F3F4F6', color: '#374151' },
  Draft: { background: '#FFE8D9', color: '#9A3412' },
};

export const ProductList: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<SellerProduct | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isReviewsLoading, setIsReviewsLoading] = useState(false);
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [isReplying, setIsReplying] = useState<{ [key: string]: boolean }>({});

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const total = products.length;

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const fetchProducts = async (status = '') => {
    setIsLoading(true);
    setError('');
    try {
      const response = await apiClient.get<SellerProduct[]>('/seller/products', {
        params: status ? { status } : {},
      });
      setProducts(response.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not load products.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(statusFilter);
  }, [statusFilter]);

  const handleStatusToggle = async (product: SellerProduct) => {
    const nextStatus = product.status === 'Hidden' ? 'Published' : 'Hidden';
    try {
      await apiClient.patch(`/seller/products/${product.id}/status`, { status: nextStatus });
      setProducts((current) =>
        current.map((item) => (item.id === product.id ? { ...item, status: nextStatus } : item)),
      );
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to update product status.');
    }
  };

  const canToggleVisibility = (status: string) => status === 'Published' || status === 'Hidden';

  const handleViewProduct = async (product: SellerProduct) => {
    setSelectedProduct(product);
    setIsDrawerOpen(true);
    setIsReviewsLoading(true);
    setReviews([]);
    try {
      const response = await apiClient.get<Review[]>('/seller/reviews', {
        params: { productId: product.id },
      });
      setReviews(response.data);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setIsReviewsLoading(false);
    }
  };

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
    } catch (err) {
      console.error('Failed to submit reply:', err);
    } finally {
      setIsReplying((prev) => ({ ...prev, [reviewId]: false }));
    }
  };

  return (
    <Box sx={{ bgcolor: '#F9FAFB', minHeight: '100%' }}>
      <Box sx={{ maxWidth: 1280, mx: 'auto', p: { xs: 2, md: 4 } }}>
        <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 3, border: '1px solid #E5E7EB', bgcolor: 'white', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#111827' }}>
            Product Management
          </Typography>
          <Typography variant="body2" sx={{ color: '#6B7280', mt: 1 }}>
            Manage your listings, review product status, and keep your catalog up to date.
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap', mt: 3 }}>
            <Select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              displayEmpty
              size="small"
              sx={{ minWidth: 180, bgcolor: '#FFFFFF' }}
            >
              <MenuItem value="">All status</MenuItem>
              <MenuItem value="Published">Active</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="Hidden">Hidden</MenuItem>
              <MenuItem value="Draft">Draft</MenuItem>
            </Select>

            <Button
              variant="contained"
              sx={{ bgcolor: '#FF4742', '&:hover': { bgcolor: '#e63f3a' } }}
              onClick={() => navigate('/seller/products/new')}
            >
              Add product
            </Button>
          </Box>
        </Paper>

        {error ? (
          <Box sx={{ mb: 3, border: '1px solid #FECACA', bgcolor: '#FEF2F2', p: 2, color: '#B91C1C', borderRadius: 2 }}>
            {error}
          </Box>
        ) : null}

        <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid #E5E7EB', boxShadow: 'none' }}>
          <Table>
            <TableHead sx={{ bgcolor: '#F3F4F6' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Product</TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>Price</TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>Stock</TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ py: 8, textAlign: 'center', color: '#6B7280' }}>
                    <CircularProgress size={24} sx={{ color: '#FF4742' }} />
                  </TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ py: 8, textAlign: 'center', color: '#6B7280' }}>
                    No products found.
                  </TableCell>
                </TableRow>
              ) : (
                products.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((product) => (
                  <TableRow key={product.id} hover>
                    <TableCell sx={{ py: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ width: 64, height: 64, borderRadius: 2, overflow: 'hidden', bgcolor: '#F3F4F6' }}>
                          {product.images.length > 0 ? (
                            <img src={product.images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <Box sx={{ alignItems: 'center', display: 'flex', height: '100%', justifyContent: 'center', color: '#9CA3AF' }}>
                              No image
                            </Box>
                          )}
                        </Box>
                        <Box>
                          <Typography sx={{ fontWeight: 700, color: '#111827' }}>{product.name}</Typography>
                          <Typography variant="caption" sx={{ color: '#6B7280' }}>
                            ID: {product.id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 3, color: '#111827', textAlign: 'right' }}>
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
                    </TableCell>
                    <TableCell sx={{ py: 3, color: '#111827', textAlign: 'right' }}>{product.stock}</TableCell>
                    <TableCell sx={{ py: 3, textAlign: 'center' }}>
                      <Chip
                        label={product.status}
                        sx={{
                          backgroundColor: badgeColors[product.status]?.background ?? '#F3F4F6',
                          color: badgeColors[product.status]?.color ?? '#374151',
                          fontWeight: 700,
                        }}
                        size="small"
                      />
                    </TableCell>
                    <TableCell sx={{ py: 3 }}>
                      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1, justifyContent: 'center' }}>
                        <IconButton
                          color="primary"
                          onClick={() => handleViewProduct(product)}
                          sx={{ color: '#6B7280', '&:hover': { color: '#111827', bgcolor: '#F3F4F6' } }}
                          title="View"
                        >
                          <VisibilityIcon />
                        </IconButton>
                        <Button
                          variant="outlined"
                          disabled={product.isRejected}
                          sx={{ borderColor: '#E5E7EB', color: '#111827', textTransform: 'none' }}
                          onClick={() => navigate(`/seller/products/${product.id}/edit`)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outlined"
                          disabled={product.isRejected || !canToggleVisibility(product.status)}
                          sx={{ borderColor: '#E5E7EB', color: '#111827', textTransform: 'none' }}
                          onClick={() => handleStatusToggle(product)}
                        >
                          {product.status === 'Hidden' ? 'Unhide' : 'Hide'}
                        </Button>
                      </Box>
                      {product.isRejected && (
                        <Typography variant="caption" sx={{ color: '#DC2626', display: 'block', mt: 1, fontWeight: 500, textAlign: 'center' }}>
                          Rejected by Admin
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Rows per page:"
        />
        </TableContainer>
      </Box>

      {/* Slide-over Drawer for Product Info & Reviews */}
      {isDrawerOpen &&
        createPortal(
          <div className="fixed inset-0 z-[1300] overflow-hidden">
            <div className="absolute inset-0 bg-slate-900/25 transition-opacity" onClick={() => setIsDrawerOpen(false)} />

            <div className="fixed inset-y-0 right-0 z-[1301] max-w-full flex">
              <div className="w-full w-screen max-w-md lg:max-w-xl flex flex-col bg-white shadow-2xl h-full slide-in-right transform transition-all duration-300">
              
              {/* Drawer Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <Typography variant="h6" className="font-bold text-slate-900">Product Details</Typography>
                <IconButton onClick={() => setIsDrawerOpen(false)} size="small" className="text-slate-400 hover:text-slate-600">
                  <CloseIcon />
                </IconButton>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                {selectedProduct && (
                  <div className="bg-white rounded-xl border border-slate-100 p-4 mb-6 flex gap-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)]">
                    <div className="w-24 h-24 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                      {selectedProduct.images.length > 0 ? (
                        <img src={selectedProduct.images[0]} alt={selectedProduct.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex items-center justify-center h-full text-slate-400 text-sm">No image</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <Typography className="font-bold text-slate-900 mb-1">{selectedProduct.name}</Typography>
                      <div className="flex justify-between items-center mb-2">
                        <Typography className="text-lg font-bold text-emerald-600">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedProduct.price)}
                        </Typography>
                        <Chip size="small" label={`Stock: ${selectedProduct.stock}`} className="bg-slate-100 text-slate-700 font-semibold" />
                      </div>
                      <Chip
                        label={selectedProduct.status}
                        sx={{
                          backgroundColor: badgeColors[selectedProduct.status]?.background ?? '#F3F4F6',
                          color: badgeColors[selectedProduct.status]?.color ?? '#374151',
                          fontWeight: 700,
                          height: 24,
                          fontSize: '0.75rem'
                        }}
                      />
                    </div>
                  </div>
                )}

                <Typography variant="h6" className="font-bold text-slate-900 mb-4">Customer Reviews</Typography>
                
                {isReviewsLoading ? (
                  <div className="flex justify-center p-8">
                    <CircularProgress size={32} sx={{ color: '#FF4742' }} />
                  </div>
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
                              {review.user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <Typography className="font-bold text-slate-900 text-sm">{review.user.name}</Typography>
                              <Typography className="text-xs text-slate-400">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </Typography>
                            </div>
                          </div>
                          <Rating value={review.rating} readOnly size="small" />
                        </div>
                        <Typography className="text-slate-700 text-sm mb-4">{review.comment || 'No comment provided.'}</Typography>

                        {/* Inline Reply Section */}
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mt-3">
                          {review.reply ? (
                            <div>
                              <Typography className="text-xs font-bold text-slate-900 mb-1">Your Reply:</Typography>
                              <Typography className="text-sm text-slate-700">{review.reply.comment}</Typography>
                              <Typography className="text-xs text-slate-400 mt-1">
                                {new Date(review.reply.createdAt).toLocaleDateString()}
                              </Typography>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <TextField
                                size="small"
                                fullWidth
                                placeholder="Write a reply..."
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
                                sx={{ bgcolor: '#FF4742', '&:hover': { bgcolor: '#e63f3a' }, minWidth: '40px', p: 1 }}
                                onClick={() => submitReply(review.id)}
                                disabled={isReplying[review.id] || !replyText[review.id]?.trim()}
                              >
                                {isReplying[review.id] ? <CircularProgress size={20} color="inherit" /> : <SendIcon fontSize="small" />}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>,
          document.body,
        )}
    </Box>
  );
};
