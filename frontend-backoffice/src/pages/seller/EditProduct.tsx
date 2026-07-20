import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '../../utils/api';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';

interface ProductDetail {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  status: string;
  images: string[];
}

interface ImageItem {
  type: 'existing' | 'new';
  url: string;
  file?: File;
}

const categories = ['Electronics', 'Fashion', 'Home_Living', 'Cosmetics', 'Food'];

export const EditProduct: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [stock, setStock] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [imageItems, setImageItems] = useState<ImageItem[]>([]);
  const [imageError, setImageError] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) {
        setError('Product id is required');
        setIsLoading(false);
        return;
      }

      try {
        const response = await apiClient.get<ProductDetail>(`/seller/products/${id}`);
        setName(response.data.name);
        setDescription(response.data.description);
        setPrice(response.data.price.toString());
        setCategory(response.data.category);
        setStock(response.data.stock.toString());
        setImageItems((response.data.images ?? []).map((imageUrl) => ({ type: 'existing' as const, url: imageUrl })));
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Unable to load product details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);

    if (selectedFiles.length === 0) {
      return;
    }

    if (imageItems.length + selectedFiles.length > 5) {
      setImageError('You can upload up to 5 images.');
      event.target.value = '';
      return;
    }

    const nextItems = [
      ...imageItems,
      ...selectedFiles.map((file) => ({
        type: 'new' as const,
        url: URL.createObjectURL(file),
        file,
      })),
    ];

    setImageItems(nextItems);
    setImageError('');
    event.target.value = '';
  };

  const removeImage = (index: number) => {
    const itemToRemove = imageItems[index];
    if (itemToRemove?.type === 'new' && itemToRemove.url) {
      URL.revokeObjectURL(itemToRemove.url);
    }

    setImageItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleSave = async () => {
    setError('');
    setSuccessMessage('');

    if (!name.trim()) {
      setError('Product name is required');
      return;
    }
    if (!description.trim()) {
      setError('Product description is required');
      return;
    }
    const priceValue = Number(price);
    if (!price || !Number.isFinite(priceValue) || priceValue <= 0) {
      setError('Price must be greater than 0');
      return;
    }
    const stockValue = Number(stock);
    if (!stock || !Number.isInteger(stockValue) || stockValue < 0) {
      setError('Stock must be a non-negative integer');
      return;
    }

    try {
      setIsSaving(true);
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('description', description.trim());
      formData.append('price', priceValue.toString());
      formData.append('category', category);
      formData.append('stock', stockValue.toString());

      imageItems
        .filter((item) => item.type === 'existing')
        .forEach((item) => {
          formData.append('existingImages', item.url);
        });

      imageItems
        .filter((item) => item.type === 'new' && item.file)
        .forEach((item) => {
          formData.append('images', item.file as File);
        });

      await apiClient.put(`/seller/products/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSuccessMessage('Product details saved successfully');
      setTimeout(() => {
        navigate('/seller/products');
      }, 1000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save product details.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F9FAFB', py: 4, px: { xs: 2, md: 4 } }}>
      <Paper elevation={0} sx={{ maxWidth: 900, mx: 'auto', border: '1px solid #E5E7EB', borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ bgcolor: '#FF4742', px: 4, py: 3 }}>
          <Button sx={{ color: 'white', fontWeight: 700, fontSize: '1rem' }} onClick={() => navigate('/seller/products')}>
            ← Back to Product List
          </Button>
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>
            Edit Product
          </Typography>
          <Typography variant="body2" sx={{ color: 'white', opacity: 0.9, mt: 0.5 }}>
            Update product details and submit for review.
          </Typography>
        </Box>

        <CardContent sx={{ p: 4 }}>
          {error ? (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          ) : null}

          <Snackbar
            open={Boolean(successMessage)}
            autoHideDuration={5000}
            onClose={() => setSuccessMessage('')}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <Alert severity="success" onClose={() => setSuccessMessage('')}>
              {successMessage}
            </Alert>
          </Snackbar>

          {isLoading ? (
            <Box sx={{ py: 12, textAlign: 'center', color: 'text.secondary' }}>Loading product data...</Box>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.3fr 0.7fr' }, gap: 3 }}>
              <Box>
                <Stack spacing={2.5}>
                  <TextField
                    required
                    label="Product Name"
                    fullWidth
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    size="small"
                  />

                  <TextField
                    required
                    label="Description"
                    fullWidth
                    multiline
                    minRows={5}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    size="small"
                  />

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>
                    <Box>
                      <TextField
                        required
                        label="Price"
                        fullWidth
                        type="number"
                        value={price}
                        onChange={(event) => setPrice(event.target.value)}
                        size="small"
                      />
                    </Box>
                    <Box>
                      <TextField
                        required
                        label="Stock"
                        fullWidth
                        type="number"
                        value={stock}
                        onChange={(event) => setStock(event.target.value)}
                        size="small"
                      />
                    </Box>
                  </Box>

                  <FormControl fullWidth size="small">
                    <InputLabel id="edit-category-label" required>Category</InputLabel>
                    <Select
                      labelId="edit-category-label"
                      value={category}
                      label="Category"
                      onChange={(event) => setCategory(event.target.value as string)}
                    >
                      {categories.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option === 'Home_Living' ? 'Home & Living' : option}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>
              </Box>

              <Box>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>
                      Product Images <span style={{ color: '#d32f2f' }}>*</span>
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      The first image is always the main thumbnail. You can remove any image and add more until the total reaches 5.
                    </Typography>

                    <Button
                      variant="outlined"
                      component="label"
                      fullWidth
                      sx={{ mb: 2, borderColor: '#FF4742', color: '#FF4742', py: 1.2 }}
                    >
                      <PhotoCameraOutlinedIcon sx={{ mr: 1 }} />
                      Add Images
                      <input hidden accept="image/jpeg,image/jpg,image/png,image/webp" multiple type="file" onChange={handleImageSelect} />
                    </Button>

                    {imageError ? (
                      <Typography color="error" variant="caption" sx={{ display: 'block', mb: 2 }}>
                        {imageError}
                      </Typography>
                    ) : null}

                    {imageItems.length > 0 ? (
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1.5 }}>
                        {imageItems.map((item, index) => (
                          <Box key={`${item.type}-${item.url}-${index}`}>
                            <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden', border: '1px solid #E5E7EB' }}>
                              <img src={item.url} alt={`Product image ${index + 1}`} style={{ width: '100%', height: 110, objectFit: 'cover' }} />
                              {index === 0 ? (
                                <Chip
                                  label="Cover"
                                  size="small"
                                  sx={{ position: 'absolute', top: 6, left: 6, bgcolor: '#FF4742', color: 'white', fontWeight: 700 }}
                                />
                              ) : null}
                              <IconButton
                                size="small"
                                onClick={() => removeImage(index)}
                                sx={{ position: 'absolute', top: 6, right: 6, bgcolor: 'rgba(255,255,255,0.9)', '&:hover': { bgcolor: 'white' } }}
                              >
                                <span aria-label="remove" style={{ fontSize: '0.95rem', lineHeight: 1 }}>
                                  ×
                                </span>
                              </IconButton>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    ) : (
                      <Box sx={{ border: '2px dashed #D1D5DB', borderRadius: 2, py: 6, textAlign: 'center', color: 'text.secondary' }}>
                        <Typography variant="h4" sx={{ mb: 1 }}>📷</Typography>
                        <Typography variant="body2">No images available yet.</Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Box>
            </Box>
          )}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 4 }}>
            <Button variant="outlined" color="inherit" onClick={() => navigate('/seller/products')}>
              Cancel
            </Button>
            <Button
              variant="contained"
              disabled={isSaving}
              onClick={handleSave}
              sx={{ bgcolor: '#FF4742', '&:hover': { bgcolor: '#e63f3a' } }}
            >
              {isSaving ? 'Saving...' : 'Save changes'}
            </Button>
          </Stack>
        </CardContent>
      </Paper>
    </Box>
  );
};
