'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import FullPageLoader from '@/components/common/FullPageLoader';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material';

interface SubscriptionPlan {
  id: number;
  name: string;
  stripe_price_id: string;
  price: number | string;
  interval: 'monthly' | 'yearly';
  trial_days: number;
  features: string[];
  is_active: boolean;
  sort_order: number;
}

export default function PlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    stripe_price_id: '',
    price: '',
    interval: 'monthly' as 'monthly' | 'yearly',
    trial_days: '0',
    features: [] as string[],
    is_active: true,
    sort_order: '0',
  });
  const [featureInput, setFeatureInput] = useState('');

  useEffect(() => {
    document.title = 'Subscription Plans - Admin';
    checkAuth();
    fetchPlans();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin/login');
    } else {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await api.get('/admin/plans');
      setPlans(response.data);
    } catch (error: any) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        router.push('/admin/login');
      } else {
        console.error('Failed to fetch plans:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      stripe_price_id: '',
      price: '',
      interval: 'monthly',
      trial_days: '0',
      features: [],
      is_active: true,
      sort_order: '0',
    });
    setFeatureInput('');
    setShowModal(true);
  };

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      stripe_price_id: plan.stripe_price_id,
      price: String(plan.price),
      interval: plan.interval,
      trial_days: plan.trial_days.toString(),
      features: plan.features || [],
      is_active: plan.is_active,
      sort_order: plan.sort_order.toString(),
    });
    setFeatureInput('');
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;

    try {
      await api.delete(`/admin/plans/${id}`);
      fetchPlans();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete plan');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        trial_days: parseInt(formData.trial_days),
        sort_order: parseInt(formData.sort_order),
      };

      if (editingPlan) {
        await api.put(`/admin/plans/${editingPlan.id}`, payload);
      } else {
        await api.post('/admin/plans', payload);
      }

      setShowModal(false);
      fetchPlans();
    } catch (error: any) {
      alert(error.response?.data?.errors ? JSON.stringify(error.response.data.errors) : 'Failed to save plan');
    }
  };

  const addFeature = () => {
    if (featureInput.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, featureInput.trim()],
      });
      setFeatureInput('');
    }
  };

  const removeFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return <FullPageLoader />;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Typography variant='h4'>Plans</Typography>
          <Typography color='text.secondary'>Manage subscription plans available to providers.</Typography>
        </Box>
        <Button variant='contained' onClick={handleCreate}>Create plan</Button>
      </Box>

      <Stack spacing={3}>
        {plans.map((plan) => (
          <Card key={plan.id}>
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 3, justifyContent: 'space-between' }}>
                <Box sx={{ minWidth: 0 }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                    <Typography fontWeight={700}>{plan.name}</Typography>
                    {!plan.is_active && <Chip size='small' label='Inactive' variant='outlined' />}
                    <Chip size='small' label={plan.interval} color='info' variant='outlined' />
                  </Box>
                  <Typography color='text.secondary' sx={{ mt: 1 }}>
                    ${Number(plan.price).toFixed(2)}
                    {plan.trial_days > 0 && ` • ${plan.trial_days} day trial`}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    Stripe price: {plan.stripe_price_id}
                  </Typography>
                  {plan.features?.length > 0 && (
                    <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {plan.features.map((f, idx) => (
                        <Chip key={`${f}-${idx}`} size='small' label={f} variant='outlined' />
                      ))}
                    </Box>
                  )}
                </Box>

                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Button size='small' variant='outlined' onClick={() => handleEdit(plan)}>
                    Edit
                  </Button>
                  <Button size='small' variant='text' color='error' onClick={() => handleDelete(plan.id)}>
                    Delete
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Dialog open={showModal} onClose={() => setShowModal(false)} fullWidth maxWidth='sm'>
        <DialogTitle>{editingPlan ? 'Edit plan' : 'Create plan'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box component='form' onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label='Name'
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <TextField
              label='Stripe price ID'
              required
              value={formData.stripe_price_id}
              onChange={(e) => setFormData({ ...formData, stripe_price_id: e.target.value })}
            />

            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
              <TextField
                label='Price'
                type='number'
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                inputProps={{ step: '0.01' }}
              />
              <FormControl>
                <InputLabel id='plan-interval-label'>Interval</InputLabel>
                <Select
                  labelId='plan-interval-label'
                  label='Interval'
                  value={formData.interval}
                  onChange={(e) => setFormData({ ...formData, interval: e.target.value as 'monthly' | 'yearly' })}
                >
                  <MenuItem value='monthly'>Monthly</MenuItem>
                  <MenuItem value='yearly'>Yearly</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
              <TextField
                label='Trial days'
                type='number'
                value={formData.trial_days}
                onChange={(e) => setFormData({ ...formData, trial_days: e.target.value })}
                inputProps={{ min: 0 }}
              />
              <TextField
                label='Sort order'
                type='number'
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
              />
            </Box>

            <Box>
              <Typography variant='subtitle2' sx={{ mb: 1 }}>
                Features
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  size='small'
                  fullWidth
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  placeholder='Add a feature'
                />
                <Button variant='outlined' onClick={addFeature}>
                  Add
                </Button>
              </Box>
              {formData.features.length > 0 && (
                <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {formData.features.map((f, idx) => (
                    <Chip key={`${f}-${idx}`} size='small' label={f} onDelete={() => removeFeature(idx)} />
                  ))}
                </Box>
              )}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <input
                type='checkbox'
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
              <Typography>Active</Typography>
            </Box>

            <DialogActions sx={{ px: 0 }}>
              <Button onClick={() => setShowModal(false)}>Cancel</Button>
              <Button type='submit' variant='contained'>{editingPlan ? 'Update' : 'Create'}</Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}

