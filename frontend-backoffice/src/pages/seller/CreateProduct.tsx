import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../utils/api';

interface FormErrors {
  name?: string;
  description?: string;
  price?: string;
  category?: string;
  stock?: string;
  images?: string;
}

const categories = [
  { label: 'Electronics', value: 'Electronics' },
  { label: 'Fashion', value: 'Fashion' },
  { label: 'Home & Living', value: 'Home_Living' },
  { label: 'Cosmetics', value: 'Cosmetics' },
  { label: 'Food', value: 'Food' },
];

export const CreateProduct: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [stock, setStock] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    return name.trim() && description.trim() && price && category && stock && images.length > 0;
  }, [category, description, images.length, name, price, stock]);

  const validate = () => {
    const nextErrors: FormErrors = {};

    if (!name.trim()) {
      nextErrors.name = 'Product name is required.';
    } else if (name.trim().length > 100) {
      nextErrors.name = 'Name must be at most 100 characters.';
    }

    if (!description.trim()) {
      nextErrors.description = 'Description is required.';
    } else if (description.trim().length > 2000) {
      nextErrors.description = 'Description must be at most 2000 characters.';
    }

    const priceValue = Number(price);
    if (!price) {
      nextErrors.price = 'Price is required.';
    } else if (!Number.isFinite(priceValue) || priceValue <= 0) {
      nextErrors.price = 'Price must be greater than 0.';
    }

    if (!category) {
      nextErrors.category = 'Category is required.';
    }

    const stockValue = Number(stock);
    if (!stock) {
      nextErrors.stock = 'Stock is required.';
    } else if (!Number.isInteger(stockValue) || stockValue < 0) {
      nextErrors.stock = 'Stock must be a non-negative integer.';
    }

    if (images.length === 0) {
      nextErrors.images = 'Please upload at least one image.';
    } else if (images.length > 5) {
      nextErrors.images = 'You can upload up to 5 images.';
    }

    const invalidFiles = images.filter((file) => {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      return !allowedTypes.includes(file.type) || file.size > 5 * 1024 * 1024;
    });

    if (invalidFiles.length > 0) {
      nextErrors.images = 'Each image must be jpg, png, or webp and smaller than 5MB.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    const nextFiles = [...images, ...selectedFiles].slice(0, 5);
    const nextPreviewUrls = nextFiles.map((file) => URL.createObjectURL(file));

    setImages(nextFiles);
    setPreviewUrls(nextPreviewUrls);
    setErrors((current) => ({ ...current, images: undefined }));
  };

  const removeImage = (index: number) => {
    const nextFiles = images.filter((_, fileIndex) => fileIndex !== index);
    const nextPreviews = previewUrls.filter((_, fileIndex) => fileIndex !== index);

    setImages(nextFiles);
    setPreviewUrls(nextPreviews);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError('');

    if (!validate()) {
      return;
    }

    const formData = new FormData();
    formData.append('name', name.trim());
    formData.append('description', description.trim());
    formData.append('price', price);
    formData.append('category', category);
    formData.append('stock', stock);

    images.forEach((image) => {
      formData.append('images', image);
    });

    try {
      setIsSubmitting(true);
      await apiClient.post('/seller/products', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccessMessage('Product created successfully');
      setTimeout(() => {
        navigate('/seller/dashboard');
      }, 800);
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Unable to create product. Please try again.';
      setSubmitError(typeof message === 'string' ? message : 'Unable to create product. Please try again.');
    } finally {
      setIsSubmitting(false);
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
            Create New Product
          </Typography>
          <Typography variant="body2" sx={{ color: 'white', opacity: 0.9, mt: 0.5 }}>
            Add product details and upload up to 5 images.
          </Typography>
        </Box>

        <CardContent sx={{ p: 4 }}>
          <form onSubmit={handleSubmit}>
            {submitError ? (
              <Alert severity="error" sx={{ mb: 3 }}>
                {submitError}
              </Alert>
            ) : null}

            <Snackbar
              open={Boolean(successMessage)}
              autoHideDuration={2000}
              onClose={() => setSuccessMessage('')}
              anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <Alert severity="success" onClose={() => setSuccessMessage('')}>
                {successMessage}
              </Alert>
            </Snackbar>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.3fr 0.7fr' }, gap: 3 }}>
              <Box>
                <Stack spacing={2.5}>
                  <TextField
                    label="Product Name"
                    fullWidth
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value);
                      setErrors((current) => ({ ...current, name: undefined }));
                    }}
                    error={Boolean(errors.name)}
                    helperText={errors.name}
                  />

                  <TextField
                    label="Description"
                    fullWidth
                    multiline
                    minRows={5}
                    value={description}
                    onChange={(event) => {
                      setDescription(event.target.value);
                      setErrors((current) => ({ ...current, description: undefined }));
                    }}
                    error={Boolean(errors.description)}
                    helperText={errors.description}
                  />

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>
                    <Box>
                      <TextField
                        label="Price"
                        fullWidth
                        type="number"
                        value={price}
                        onChange={(event) => {
                          setPrice(event.target.value);
                          setErrors((current) => ({ ...current, price: undefined }));
                        }}
                        error={Boolean(errors.price)}
                        helperText={errors.price}
                      />
                    </Box>
                    <Box>
                      <TextField
                        label="Stock"
                        fullWidth
                        type="number"
                        value={stock}
                        onChange={(event) => {
                          setStock(event.target.value);
                          setErrors((current) => ({ ...current, stock: undefined }));
                        }}
                        error={Boolean(errors.stock)}
                        helperText={errors.stock}
                      />
                    </Box>
                  </Box>

                  <FormControl fullWidth error={Boolean(errors.category)}>
                    <InputLabel id="category-select-label">Category</InputLabel>
                    <Select
                      labelId="category-select-label"
                      value={category}
                      label="Category"
                      onChange={(event) => {
                        setCategory(event.target.value as string);
                        setErrors((current) => ({ ...current, category: undefined }));
                      }}
                    >
                      {categories.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.category ? <Typography color="error" variant="caption">{errors.category}</Typography> : null}
                  </FormControl>
                </Stack>
              </Box>

              <Box>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>
                      Product Images
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Upload up to 5 images. Supported formats: JPG, PNG, WEBP. Max size: 5MB each.
                    </Typography>

                    <Button
                      variant="outlined"
                      component="label"
                      fullWidth
                      sx={{ mb: 2, borderColor: '#FF4742', color: '#FF4742' }}
                    >
                      📷 Choose Images
                      <input hidden accept="image/jpeg,image/jpg,image/png,image/webp" multiple type="file" onChange={handleImageSelect} />
                    </Button>

                    {errors.images ? (
                      <Typography color="error" variant="caption" sx={{ display: 'block', mb: 2 }}>
                        {errors.images}
                      </Typography>
                    ) : null}

                    {previewUrls.length > 0 ? (
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1.5 }}>
                        {previewUrls.map((previewUrl, index) => (
                          <Box key={`${previewUrl}-${index}`}>
                            <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden', border: '1px solid #E5E7EB' }}>
                              <img src={previewUrl} alt={`Preview ${index + 1}`} style={{ width: '100%', height: 110, objectFit: 'cover' }} />
                              <Button
                                size="small"
                                color="error"
                                variant="contained"
                                onClick={() => removeImage(index)}
                                sx={{ position: 'absolute', top: 6, right: 6, minWidth: 0, px: 1, py: 0.5 }}
                              >
                                🗑
                              </Button>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    ) : (
                      <Box sx={{ border: '2px dashed #D1D5DB', borderRadius: 2, py: 6, textAlign: 'center', color: 'text.secondary' }}>
                        <Typography variant="h4" sx={{ mb: 1 }}>📷</Typography>
                        <Typography variant="body2">No images selected yet.</Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Box>
            </Box>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 4 }}>
              <Button variant="outlined" color="inherit" onClick={() => navigate('/seller/dashboard')}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={!canSubmit || isSubmitting} sx={{ bgcolor: '#FF4742', '&:hover': { bgcolor: '#e63f3a' } }}>
                {isSubmitting ? 'Creating...' : 'Create Product'}
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Paper>
    </Box>
  );
};
