import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  CardContent,
  Alert,
  Snackbar,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import { apiClient } from '../../utils/api';

interface Product {
  id: string;
  name: string;
  price: number;
}

interface FlashSale {
  id: string;
  product: Product;
  discountPercentage: number;
  salePrice: number;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNote?: string;
}

export const FlashSaleManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  
  const [selectedProductId, setSelectedProductId] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState<number | ''>('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const [startFocused, setStartFocused] = useState(false);
  const [endFocused, setEndFocused] = useState(false);

  const [loading, setLoading] = useState(false);
  
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const showToast = (message: string, severity: 'success' | 'error') => setToast({ open: true, message, severity });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, flashSalesRes] = await Promise.all([
        apiClient.get('/seller/products'),
        apiClient.get('/flash-sales/seller'),
      ]);
      setProducts(productsRes.data.data?.items || productsRes.data.data || productsRes.data || []);
      setFlashSales(flashSalesRes.data.data || flashSalesRes.data || []);
    } catch (error) {
      showToast('Failed to load data', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !discountPercentage || !startTime || !endTime) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    
    setLoading(true);
    try {
      await apiClient.post('/flash-sales', {
        productId: selectedProductId,
        discountPercentage: Number(discountPercentage),
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
      });
      showToast('Flash sale requested successfully', 'success');
      // Reset form
      setSelectedProductId('');
      setDiscountPercentage('');
      setStartTime('');
      setEndTime('');
      // Reload list
      fetchData();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to request flash sale', 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectedProduct = products.find(p => p.id === selectedProductId);
  const originalPrice = selectedProduct ? Number(selectedProduct.price) : 0;
  const salePrice = discountPercentage ? originalPrice * (1 - Number(discountPercentage) / 100) : originalPrice;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F9FAFB', py: 4, px: { xs: 2, md: 4 } }}>
      <Paper elevation={0} sx={{ mx: 'auto', border: '1px solid #E5E7EB', borderRadius: 3, overflow: 'hidden', mb: 4 }}>
        <Box sx={{ bgcolor: '#FF4742', px: 4, py: 3 }}>
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>
            Request New Flash Sale
          </Typography>
          <Typography variant="body2" sx={{ color: 'white', opacity: 0.9, mt: 0.5 }}>
            Select a product and configure flash sale discount and timeframe.
          </Typography>
        </Box>

        <CardContent sx={{ p: 4 }}>
          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <FormControl fullWidth required>
                <InputLabel id="product-select-label">Product</InputLabel>
                <Select
                  labelId="product-select-label"
                  label="Product"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value as string)}
                >
                  {products.map(p => (
                    <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                required
                label="Discount Percentage"
                type="number"
                slotProps={{ htmlInput: { min: 1, max: 99 } }}
                fullWidth
                value={discountPercentage}
                onChange={(e) => setDiscountPercentage(e.target.value === '' ? '' : Number(e.target.value))}
                helperText="Enter a value between 1 and 99"
              />

              {selectedProduct && discountPercentage !== '' && (
                <Alert severity="info">
                  <strong>Preview:</strong> Original Price: ${originalPrice.toFixed(2)} &rarr; Flash Sale Price: <strong style={{ color: '#d32f2f' }}>${salePrice.toFixed(2)}</strong>
                </Alert>
              )}

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 3 }}>
                <TextField
                  required
                  label="Start Time"
                  type={startTime || startFocused ? 'datetime-local' : 'text'}
                  fullWidth
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  onFocus={() => setStartFocused(true)}
                  onBlur={() => setStartFocused(false)}
                />
                <TextField
                  required
                  label="End Time"
                  type={endTime || endFocused ? 'datetime-local' : 'text'}
                  fullWidth
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  onFocus={() => setEndFocused(true)}
                  onBlur={() => setEndFocused(false)}
                />
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 2 }}>
                <Button 
                  type="submit" 
                  variant="contained" 
                  disabled={loading} 
                  sx={{ bgcolor: '#FF4742', '&:hover': { bgcolor: '#e63f3a' }, px: 4, py: 1.2, fontWeight: 'bold' }}
                >
                  {loading ? 'Submitting...' : 'Request Flash Sale'}
                </Button>
              </Box>
            </Stack>
          </form>
        </CardContent>
      </Paper>

      <Paper elevation={0} sx={{ border: '1px solid #E5E7EB', borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ px: 4, py: 3, borderBottom: '1px solid #E5E7EB' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Your Flash Sales
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#F9FAFB' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Discount</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Timeframe</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {flashSales.map((fs) => (
                <TableRow key={fs.id}>
                  <TableCell>{fs.product?.name}</TableCell>
                  <TableCell>
                    {fs.discountPercentage}% <br/>
                    <Typography variant="caption" color="error" sx={{ fontWeight: 'bold' }}>
                      ${Number(fs.salePrice).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{new Date(fs.startTime).toLocaleString()}</Typography>
                    <Typography variant="body2" color="textSecondary">to {new Date(fs.endTime).toLocaleString()}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={fs.status} 
                      size="small"
                      title={fs.adminNote}
                      color={
                        fs.status === 'APPROVED' ? 'success' :
                        fs.status === 'REJECTED' ? 'error' :
                        'warning'
                      }
                      sx={{ fontWeight: 'bold' }}
                    />
                  </TableCell>
                </TableRow>
              ))}
              {flashSales.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No flash sales found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Snackbar open={toast.open} autoHideDuration={6000} onClose={() => setToast(prev => ({ ...prev, open: false }))}>
        <Alert onClose={() => setToast(prev => ({ ...prev, open: false }))} severity={toast.severity} sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
