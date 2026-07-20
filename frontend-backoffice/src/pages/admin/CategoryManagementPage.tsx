import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, IconButton, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions, TextField
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { adminApi } from '../../hooks/useAdminApi';

export const CategoryManagementPage: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<any | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getCategories();
      setCategories(data);
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Failed to load categories' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleOpenDialog = (category?: any) => {
    if (category) {
      setEditCategory(category);
      setFormData({ name: category.name, description: category.description || '' });
    } else {
      setEditCategory(null);
      setFormData({ name: '', description: '' });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditCategory(null);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;
    setSubmitting(true);
    try {
      if (editCategory) {
        await adminApi.updateCategory(editCategory.id, formData);
        setMessage({ type: 'success', text: 'Category updated successfully' });
      } else {
        await adminApi.createCategory(formData);
        setMessage({ type: 'success', text: 'Category created successfully' });
      }
      handleCloseDialog();
      fetchCategories();
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Failed to save category' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await adminApi.deleteCategory(id);
      setMessage({ type: 'success', text: 'Category deleted successfully' });
      fetchCategories();
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Failed to delete category' });
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#111827' }}>Categories</Typography>
          <Typography variant="body2" sx={{ color: '#6B7280', mt: 0.5 }}>Manage product categories</Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => handleOpenDialog()}
          sx={{ bgcolor: '#2563EB', '&:hover': { bgcolor: '#1D4ED8' }, textTransform: 'none', fontWeight: 600 }}
          disableElevation
        >
          Add Category
        </Button>
      </Box>

      {message && <Alert severity={message.type} onClose={() => setMessage(null)} sx={{ mb: 2 }}>{message.text}</Alert>}

      <Paper elevation={0} sx={{ border: '1px solid #E5E7EB', borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.8rem', borderBottom: '1px solid #E5E7EB' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.8rem', borderBottom: '1px solid #E5E7EB' }}>Slug</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.8rem', borderBottom: '1px solid #E5E7EB' }}>Description</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#374151', fontSize: '0.8rem', borderBottom: '1px solid #E5E7EB' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} sx={{ textAlign: 'center', py: 6 }}><CircularProgress size={28} sx={{ color: '#2563EB' }} /></TableCell></TableRow>
              ) : categories.length === 0 ? (
                <TableRow><TableCell colSpan={4} sx={{ textAlign: 'center', py: 6, color: '#9CA3AF' }}>No categories found</TableCell></TableRow>
              ) : (
                categories.map((c: any) => (
                  <TableRow key={c.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell sx={{ fontWeight: 600, color: '#111827', fontSize: '0.875rem' }}>{c.name}</TableCell>
                    <TableCell sx={{ color: '#6B7280', fontSize: '0.875rem' }}>{c.slug}</TableCell>
                    <TableCell sx={{ color: '#6B7280', fontSize: '0.875rem' }}>{c.description || <em className="text-slate-400">None</em>}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleOpenDialog(c)} sx={{ color: '#2563EB', mr: 1, '&:hover': { bgcolor: '#EFF6FF' } }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(c.id)} sx={{ color: '#DC2626', '&:hover': { bgcolor: '#FEF2F2' } }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#111827' }}>
          {editCategory ? 'Edit Category' : 'New Category'}
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, px: 3 }}>
          <Button onClick={handleCloseDialog} sx={{ color: '#6B7280', textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disableElevation
            disabled={submitting || !formData.name.trim()}
            sx={{ bgcolor: '#2563EB', '&:hover': { bgcolor: '#1D4ED8' }, textTransform: 'none', fontWeight: 600 }}
          >
            {submitting ? <CircularProgress size={20} color="inherit" /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
