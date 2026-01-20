'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import FullPageLoader from '@/components/common/FullPageLoader';

interface ServiceProvider {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  is_active: boolean;
  stripe_subscription: {
    status: string;
    current_period_end: string | null;
  } | null;
}

export default function ServiceProvidersPage() {
  const router = useRouter();
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ServiceProvider | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
  });

  useEffect(() => {
    document.title = 'Service Providers - Admin';
    checkAuth();
    fetchProviders();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin/login');
    } else {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  };

  const fetchProviders = async () => {
    try {
      const response = await api.get('/admin/service-providers');
      setProviders(response.data);
    } catch (error) {
      console.error('Failed to fetch providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCheckout = async (providerId: number) => {
    try {
      const response = await api.post(`/admin/service-providers/${providerId}/stripe-checkout`);
      window.location.href = response.data.checkout_url;
    } catch (error) {
      console.error('Failed to create checkout:', error);
      alert('Failed to create checkout session');
    }
  };

  const handleBillingPortal = async (providerId: number) => {
    try {
      const response = await api.get(`/admin/service-providers/${providerId}/billing-portal`);
      window.location.href = response.data.portal_url;
    } catch (error) {
      console.error('Failed to open billing portal:', error);
      alert('Failed to open billing portal');
    }
  };

  const handleActivate = async (providerId: number) => {
    try {
      await api.post(`/admin/service-providers/${providerId}/activate`);
      fetchProviders();
      alert('Provider account activated successfully');
    } catch (error) {
      console.error('Failed to activate provider:', error);
      alert('Failed to activate provider');
    }
  };

  const handleDeactivate = async (providerId: number) => {
    if (!confirm('Are you sure you want to deactivate this provider? They will not be able to login or access leads.')) {
      return;
    }
    try {
      await api.post(`/admin/service-providers/${providerId}/deactivate`);
      fetchProviders();
      alert('Provider account deactivated successfully');
    } catch (error) {
      console.error('Failed to deactivate provider:', error);
      alert('Failed to deactivate provider');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProvider) {
        await api.put(`/admin/service-providers/${editingProvider.id}`, formData);
      } else {
        await api.post('/admin/service-providers', formData);
      }
      setShowModal(false);
      setEditingProvider(null);
      setFormData({ name: '', email: '', phone: '', address: '', password: '' });
      fetchProviders();
    } catch (error) {
      console.error('Failed to save provider:', error);
      alert('Failed to save provider');
    }
  };

  const openEditModal = (provider: ServiceProvider) => {
    setEditingProvider(provider);
    setFormData({
      name: provider.name,
      email: provider.email,
      phone: provider.phone || '',
      address: provider.address || '',
      password: '', // Don't pre-fill password for security
    });
    setShowModal(true);
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return <Chip size='small' label='No subscription' variant='outlined' />;
    if (status === 'active') return <Chip size='small' label='active' color='success' variant='outlined' />;
    if (status === 'canceled') return <Chip size='small' label='canceled' color='error' variant='outlined' />;
    if (status === 'past_due') return <Chip size='small' label='past_due' color='warning' variant='outlined' />;
    if (status === 'trialing') return <Chip size='small' label='trialing' color='info' variant='outlined' />;
    return <Chip size='small' label={status} variant='outlined' />;
  };

  if (loading) {
    return <FullPageLoader />;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Typography variant='h4'>Service providers</Typography>
          <Typography color='text.secondary'>Manage provider accounts and subscriptions.</Typography>
        </Box>
        <Button
          variant='contained'
          onClick={() => {
            setEditingProvider(null);
            setFormData({ name: '', email: '', phone: '', address: '', password: '' });
            setShowModal(true);
          }}
        >
          Add provider
        </Button>
      </Box>

      <Card>
        <CardHeader title='Providers' />
        <CardContent sx={{ p: 0 }}>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Subscription</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {providers.map((provider) => (
                <TableRow key={provider.id} hover>
                  <TableCell>
                    <Typography fontWeight={600}>{provider.name}</Typography>
                  </TableCell>
                  <TableCell>{provider.email}</TableCell>
                  <TableCell>{provider.phone || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      size='small'
                      label={provider.is_active ? 'Active' : 'Inactive'}
                      color={provider.is_active ? 'success' : 'error'}
                      variant='outlined'
                    />
                  </TableCell>
                  <TableCell>{getStatusBadge(provider.stripe_subscription?.status || null)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      <Button size='small' variant='text' onClick={() => openEditModal(provider)}>
                        Edit
                      </Button>
                      {provider.is_active ? (
                        <Button size='small' variant='text' color='error' onClick={() => handleDeactivate(provider.id)}>
                          Deactivate
                        </Button>
                      ) : (
                        <Button size='small' variant='text' color='success' onClick={() => handleActivate(provider.id)}>
                          Activate
                        </Button>
                      )}
                      {!provider.stripe_subscription && (
                        <Button size='small' variant='outlined' onClick={() => handleCreateCheckout(provider.id)}>
                          Subscribe
                        </Button>
                      )}
                      {provider.stripe_subscription && (
                        <Button size='small' variant='outlined' onClick={() => handleBillingPortal(provider.id)}>
                          Billing
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingProvider(null);
        }}
        fullWidth
        maxWidth='sm'
      >
        <DialogTitle>{editingProvider ? 'Edit provider' : 'Add provider'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box component='form' onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label='Name'
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <TextField
              label='Email'
              type='email'
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <TextField
              label='Phone'
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <TextField
              label='Address'
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              multiline
              minRows={3}
            />
            <TextField
              label={`Password ${editingProvider ? '(leave blank to keep current)' : ''}`}
              type='password'
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!editingProvider}
            />

            <DialogActions sx={{ px: 0 }}>
              <Button onClick={() => { setShowModal(false); setEditingProvider(null); }}>Cancel</Button>
              <Button type='submit' variant='contained'>Save</Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}

