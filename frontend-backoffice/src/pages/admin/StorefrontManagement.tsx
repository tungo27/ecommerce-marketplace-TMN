import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Paper, TextField, Button, Alert, CircularProgress,
  MenuItem, Select, FormControl, Chip, OutlinedInput, Stack,
  Dialog, DialogTitle, DialogContent, DialogActions,
  List, ListItem, ListItemAvatar, ListItemText, Avatar, InputAdornment,
  ToggleButtonGroup, ToggleButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { adminApi } from '../../hooks/useAdminApi';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

interface Product {
  id: string;
  name: string;
  images?: string[];
  price: number;
}

// ── Section wrapper ────────────────────────────────────────────────────────
function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid #E5E7EB' }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#111827', mb: 0.5 }}>
        {title}
      </Typography>
      <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', mb: 2 }}>
        {description}
      </Typography>
      {children}
    </Paper>
  );
}

// ── Product Picker Dialog ──────────────────────────────────────────────────
function ProductPickerDialog({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (product: Product) => void;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const token = localStorage.getItem('accessToken');
    const q = search ? `&search=${encodeURIComponent(search)}` : '';
    fetch(`${API_BASE}/products?limit=20${q}`, {
      headers: { Authorization: token ? `Bearer ${token}` : '' },
    })
      .then((r) => r.json())
      .then((data) => setProducts(data.products || data.data?.products || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [open, search]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, fontSize: 16 }}>Select a product as Hero Banner</DialogTitle>
      <DialogContent dividers>
        <TextField
          fullWidth
          size="small"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#9CA3AF', fontSize: 18 }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{ mb: 2 }}
        />
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} sx={{ color: '#2563EB' }} />
          </Box>
        ) : (
          <List disablePadding>
            {products.map((p) => (
              <ListItem
                key={p.id}
                onClick={() => { onSelect(p); onClose(); }}
                sx={{
                  borderRadius: 1.5,
                  mb: 0.5,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: '#F3F4F6' },
                }}
              >
                <ListItemAvatar>
                  <Avatar
                    src={p.images?.[0]}
                    variant="rounded"
                    sx={{ width: 48, height: 48, mr: 1, bgcolor: '#F3F4F6' }}
                  />
                </ListItemAvatar>
                <ListItemText
                  primary={<Typography variant="body2" sx={{ fontWeight: 600 }}>{p.name}</Typography>}
                  secondary={`$${p.price?.toLocaleString()}`}
                />
              </ListItem>
            ))}
            {products.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No products found.
              </Typography>
            )}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ textTransform: 'none', color: '#374151' }}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export const StorefrontManagement: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [heroMode, setHeroMode] = useState<'url' | 'product'>('url');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [categories, setCategories] = useState<any[]>([]);
  const [config, setConfig] = useState({
    theme: 'light',
    heroImage: '',
    heroProductId: '',
    announcement: '',
    featuredCategoryIds: [] as string[],
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [configData, catData] = await Promise.all([
        adminApi.getStorefrontConfig(),
        adminApi.getCategories(),
      ]);
      setCategories(catData);
      if (configData && Object.keys(configData).length > 0) {
        const loaded = {
          theme: configData.theme || 'light',
          heroImage: configData.heroImage || '',
          heroProductId: configData.heroProductId || '',
          announcement: configData.announcement || '',
          featuredCategoryIds: configData.featuredCategoryIds || [],
        };
        setConfig(loaded);
        if (loaded.heroProductId) setHeroMode('product');
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Failed to load configuration.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(t);
    }
  }, [message]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminApi.updateStorefrontConfig(config);
      setMessage({ type: 'success', text: 'Configuration saved. Changes are now live on the storefront.' });
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Failed to save configuration.' });
    } finally {
      setSaving(false);
    }
  };

  const handleCategoryChange = (event: any) => {
    const { target: { value } } = event;
    setConfig({ ...config, featuredCategoryIds: typeof value === 'string' ? value.split(',') : value });
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setConfig({ ...config, heroProductId: product.id, heroImage: product.images?.[0] || '' });
  };

  const handleHeroModeChange = (_: any, mode: 'url' | 'product') => {
    if (!mode) return;
    setHeroMode(mode);
    if (mode === 'url') { setConfig({ ...config, heroProductId: '' }); setSelectedProduct(null); }
    else { setConfig({ ...config, heroImage: '' }); }
  };

  return (
    <Box sx={{ p: 4, maxWidth: 860 }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#111827' }}>
            Storefront Configuration
          </Typography>
          <Typography variant="body2" sx={{ color: '#6B7280', mt: 0.5 }}>
            Manage what visitors see on the homepage. Changes take effect immediately after saving.
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || loading}
          sx={{ bgcolor: '#2563EB', '&:hover': { bgcolor: '#1D4ED8' }, textTransform: 'none', fontWeight: 600 }}
          disableElevation
        >
          {saving ? <CircularProgress size={18} color="inherit" /> : 'Save Changes'}
        </Button>
      </Box>

      {message && (
        <Alert severity={message.type} onClose={() => setMessage(null)} sx={{ mb: 3 }}>
          {message.text}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress sx={{ color: '#2563EB' }} />
        </Box>
      ) : (
        <Stack spacing={3}>

          {/* Announcement Banner */}
          <Section
            title="Announcement Banner"
            description="A notice bar displayed at the top of the homepage. Leave empty to hide it."
          >
            <TextField
              fullWidth
              variant="outlined"
              placeholder="e.g. Free shipping on all orders over $50!"
              value={config.announcement}
              onChange={(e) => setConfig({ ...config, announcement: e.target.value })}
              sx={{ bgcolor: '#F9FAFB' }}
            />
            {config.announcement && (
              <Box sx={{ mt: 1.5, p: 2, bgcolor: '#EFF6FF', borderRadius: 1.5, border: '1px solid #BFDBFE' }}>
                <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', mb: 0.5 }}>Preview</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500, color: '#1D4ED8' }}>
                  {config.announcement}
                </Typography>
              </Box>
            )}
          </Section>

          {/* Hero Banner */}
          <Section
            title="Hero Banner"
            description="The large image displayed at the top of the homepage. Use a direct image URL or pick a product from the store."
          >
            <ToggleButtonGroup
              value={heroMode}
              exclusive
              onChange={handleHeroModeChange}
              size="small"
              sx={{ mb: 2 }}
            >
              <ToggleButton value="url" sx={{ textTransform: 'none', px: 2, '&.Mui-selected': { bgcolor: '#DBEAFE', color: '#1D4ED8', fontWeight: 700 } }}>
                Image URL
              </ToggleButton>
              <ToggleButton value="product" sx={{ textTransform: 'none', px: 2, '&.Mui-selected': { bgcolor: '#DBEAFE', color: '#1D4ED8', fontWeight: 700 } }}>
                Pick a Product
              </ToggleButton>
            </ToggleButtonGroup>

            {heroMode === 'url' ? (
              <TextField
                fullWidth
                variant="outlined"
                placeholder="https://example.com/banner.jpg"
                value={config.heroImage}
                onChange={(e) => setConfig({ ...config, heroImage: e.target.value, heroProductId: '' })}
                sx={{ bgcolor: '#F9FAFB' }}
                helperText="Enter a public image URL to use as the banner."
              />
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => setPickerOpen(true)}
                  sx={{ textTransform: 'none', borderColor: '#D1D5DB', color: '#374151', fontWeight: 500 }}
                >
                  {selectedProduct ? `Selected: ${selectedProduct.name}` : 'Select a product'}
                </Button>
                {selectedProduct && (
                  <Typography variant="caption" sx={{ color: '#6B7280' }}>
                    The product's first image will be used as the banner.
                  </Typography>
                )}
              </Box>
            )}

            {config.heroImage && (
              <Box sx={{ mt: 2, borderRadius: 2, overflow: 'hidden', height: 200, border: '1px solid #E5E7EB', bgcolor: '#F3F4F6' }}>
                <img
                  src={config.heroImage}
                  alt="Hero Preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </Box>
            )}
          </Section>

          {/* Featured Categories */}
          <Section
            title="Featured Categories"
            description="Select which categories appear in the 'Top Categories' section on the homepage. If none are selected, the first 5 categories are shown by default."
          >
            <FormControl fullWidth>
              <Select
                multiple
                value={config.featuredCategoryIds}
                onChange={handleCategoryChange}
                input={<OutlinedInput />}
                sx={{ bgcolor: '#F9FAFB' }}
                displayEmpty
                renderValue={(selected) =>
                  selected.length === 0 ? (
                    <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                      All categories (default)
                    </Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => {
                        const cat = categories.find((c) => c.id === value);
                        return (
                          <Chip
                            key={value}
                            label={cat ? cat.name : value}
                            size="small"
                            sx={{ bgcolor: '#DBEAFE', color: '#1E40AF', fontWeight: 600 }}
                          />
                        );
                      })}
                    </Box>
                  )
                }
              >
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.name}
                    {cat.description && (
                      <Typography variant="caption" sx={{ ml: 1, color: '#9CA3AF' }}>
                        — {cat.description}
                      </Typography>
                    )}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="caption" sx={{ color: '#6B7280', mt: 0.5, display: 'block' }}>
              {config.featuredCategoryIds.length === 0
                ? 'Showing the first 5 categories by default.'
                : `${config.featuredCategoryIds.length} categor${config.featuredCategoryIds.length > 1 ? 'ies' : 'y'} selected.`}
            </Typography>
          </Section>

          {/* Theme */}
          <Section
            title="Theme"
            description="Switch the storefront between light and dark mode."
          >
            <FormControl sx={{ minWidth: 200 }}>
              <Select
                value={config.theme}
                onChange={(e) => setConfig({ ...config, theme: e.target.value })}
                sx={{ bgcolor: '#F9FAFB' }}
              >
                <MenuItem value="light">Light</MenuItem>
                <MenuItem value="dark">Dark</MenuItem>
              </Select>
            </FormControl>
          </Section>

        </Stack>
      )}

      <ProductPickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelectProduct}
      />
    </Box>
  );
};
