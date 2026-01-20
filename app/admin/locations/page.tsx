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
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import FullPageLoader from '@/components/common/FullPageLoader';

interface Location {
  id: number;
  name: string;
  slug: string;
  address: string;
  service_providers: Array<{ id: number; name: string }>;
}

interface ServiceProvider {
  id: number;
  name: string;
}

export default function LocationsPage() {
  const router = useRouter();
  const [locations, setLocations] = useState<Location[]>([]);
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [assigningLocation, setAssigningLocation] = useState<Location | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    address: '',
    assignment_algorithm: 'round_robin',
  });
  const [selectedProviders, setSelectedProviders] = useState<number[]>([]);

  useEffect(() => {
    document.title = 'Locations - Admin';
    checkAuth();
    fetchLocations();
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

  const fetchLocations = async () => {
    try {
      const response = await api.get('/admin/locations');
      setLocations(response.data);
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProviders = async () => {
    try {
      const response = await api.get('/admin/service-providers');
      setProviders(response.data);
    } catch (error) {
      console.error('Failed to fetch providers:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLocation) {
        await api.put(`/admin/locations/${editingLocation.id}`, formData);
      } else {
        await api.post('/admin/locations', formData);
      }
      setShowModal(false);
      setEditingLocation(null);
      setFormData({ name: '', slug: '', address: '', assignment_algorithm: 'round_robin' });
      fetchLocations();
    } catch (error) {
      console.error('Failed to save location:', error);
      alert('Failed to save location');
    }
  };

  const handleAssignProviders = async () => {
    if (!assigningLocation) return;
    try {
      await api.post(`/admin/locations/${assigningLocation.id}/assign-providers`, {
        service_provider_ids: selectedProviders,
      });
      setShowAssignModal(false);
      setAssigningLocation(null);
      setSelectedProviders([]);
      fetchLocations();
    } catch (error) {
      console.error('Failed to assign providers:', error);
      alert('Failed to assign providers');
    }
  };

  const openEditModal = (location: Location) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      slug: location.slug,
      address: location.address || '',
      assignment_algorithm: (location as any).assignment_algorithm || 'round_robin',
    });
    setShowModal(true);
  };

  const openAssignModal = (location: Location) => {
    setAssigningLocation(location);
    setSelectedProviders(location.service_providers.map(p => p.id));
    setShowAssignModal(true);
  };

  if (loading) {
    return <FullPageLoader />;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Typography variant='h4'>Locations</Typography>
          <Typography color='text.secondary'>Manage locations and provider assignments.</Typography>
        </Box>
        <Button
          variant='contained'
          onClick={() => {
            setEditingLocation(null);
            setFormData({ name: '', slug: '', address: '', assignment_algorithm: 'round_robin' });
            setShowModal(true);
          }}
        >
          Add location
        </Button>
      </Box>

      <Card>
        <CardHeader title='Locations' />
        <CardContent sx={{ p: 0 }}>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Slug</TableCell>
                <TableCell>Address</TableCell>
                <TableCell>Algorithm</TableCell>
                <TableCell>Providers</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {locations.map((location) => (
                <TableRow key={location.id} hover>
                  <TableCell>
                    <Typography fontWeight={600}>{location.name}</Typography>
                  </TableCell>
                  <TableCell>{location.slug}</TableCell>
                  <TableCell>{location.address || '-'}</TableCell>
                  <TableCell>
                    <Chip size='small' label={String((location as any).assignment_algorithm || 'round_robin')} color='info' variant='outlined' />
                  </TableCell>
                  <TableCell>
                    {location.service_providers.length > 0
                      ? location.service_providers.map(p => p.name).join(', ')
                      : 'No providers assigned'}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Button size='small' variant='text' onClick={() => openEditModal(location)}>
                        Edit
                      </Button>
                      <Button size='small' variant='outlined' onClick={() => openAssignModal(location)}>
                        Assign providers
                      </Button>
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
          setEditingLocation(null);
        }}
        fullWidth
        maxWidth='sm'
      >
        <DialogTitle>{editingLocation ? 'Edit location' : 'Add location'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box component='form' onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label='Name'
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <TextField
              label='Slug'
              required
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder='auto-generated if empty'
            />
            <TextField
              label='Address'
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              multiline
              minRows={3}
            />
            <FormControl>
              <InputLabel id='location-algorithm-label'>Assignment algorithm</InputLabel>
              <Select
                labelId='location-algorithm-label'
                label='Assignment algorithm'
                value={formData.assignment_algorithm}
                onChange={(e) => setFormData({ ...formData, assignment_algorithm: String(e.target.value) })}
              >
                <MenuItem value='round_robin'>Round Robin</MenuItem>
                <MenuItem value='geographic'>Geographic</MenuItem>
                <MenuItem value='load_balance'>Load Balance</MenuItem>
                <MenuItem value='manual'>Manual</MenuItem>
              </Select>
            </FormControl>

            <DialogActions sx={{ px: 0 }}>
              <Button onClick={() => { setShowModal(false); setEditingLocation(null); }}>Cancel</Button>
              <Button type='submit' variant='contained'>Save</Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showAssignModal && !!assigningLocation}
        onClose={() => {
          setShowAssignModal(false);
          setAssigningLocation(null);
        }}
        fullWidth
        maxWidth='sm'
      >
        <DialogTitle>
          {assigningLocation ? `Assign providers — ${assigningLocation.name}` : 'Assign providers'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 320, overflow: 'auto' }}>
            {providers.map((provider) => (
              <Box key={provider.id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <input
                  type='checkbox'
                  checked={selectedProviders.includes(provider.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedProviders([...selectedProviders, provider.id]);
                    } else {
                      setSelectedProviders(selectedProviders.filter((id) => id !== provider.id));
                    }
                  }}
                />
                <Typography>{provider.name}</Typography>
              </Box>
            ))}
          </Box>
          <DialogActions sx={{ px: 0, mt: 3 }}>
            <Button onClick={() => { setShowAssignModal(false); setAssigningLocation(null); }}>Cancel</Button>
            <Button variant='contained' onClick={handleAssignProviders}>Save</Button>
          </DialogActions>
        </DialogContent>
      </Dialog>
    </Box>
  );
}

