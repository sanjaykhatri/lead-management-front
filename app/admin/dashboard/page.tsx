'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import FullPageLoader from '@/components/common/FullPageLoader';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
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

interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
  location: { name: string };
  service_provider: { name: string } | null;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    location_id: '',
    status: '',
    date_from: '',
    date_to: '',
  });

  useEffect(() => {
    document.title = 'Leads Dashboard - Admin';
    checkAuth();
    fetchLeads();

    // Listen for real-time lead updates
    const handleLeadAssigned = () => {
      fetchLeads(); // Refresh leads when new lead is assigned
    };

    const handleStatusUpdated = () => {
      fetchLeads(); // Refresh leads when status is updated
    };

    window.addEventListener('leadAssigned', handleLeadAssigned);
    window.addEventListener('leadStatusUpdated', handleStatusUpdated);

    return () => {
      window.removeEventListener('leadAssigned', handleLeadAssigned);
      window.removeEventListener('leadStatusUpdated', handleStatusUpdated);
    };
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin/login');
    } else {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  };

  const fetchLeads = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.location_id) params.append('location_id', filters.location_id);
      if (filters.status) params.append('status', filters.status);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);

      const response = await api.get(`/admin/leads?${params.toString()}`);
      setLeads(response.data.data || response.data);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    fetchLeads();
  }, [filters]);

  if (loading) {
    return <FullPageLoader />;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <Box>
        <Typography variant='h4'>Leads</Typography>
        <Typography color='text.secondary'>Review and manage incoming leads.</Typography>
      </Box>

      <Card>
        <CardHeader title='Filters' />
        <CardContent>
          <Box sx={{ display: 'grid', gap: 4, gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' } }}>
            <FormControl size='small' fullWidth>
              <InputLabel id='lead-status-label'>Status</InputLabel>
              <Select
                labelId='lead-status-label'
                label='Status'
                value={filters.status}
                onChange={(e) => handleFilterChange('status', String(e.target.value))}
              >
                <MenuItem value=''>All</MenuItem>
                <MenuItem value='new'>New</MenuItem>
                <MenuItem value='contacted'>Contacted</MenuItem>
                <MenuItem value='closed'>Closed</MenuItem>
              </Select>
            </FormControl>

            <TextField
              size='small'
              label='Date from'
              type='date'
              value={filters.date_from}
              onChange={(e) => handleFilterChange('date_from', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              size='small'
              label='Date to'
              type='date'
              value={filters.date_to}
              onChange={(e) => handleFilterChange('date_to', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title='Results' />
        <CardContent sx={{ p: 0 }}>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Provider</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leads.map((lead) => (
                <TableRow key={lead.id} hover>
                  <TableCell>
                    <Typography fontWeight={600}>{lead.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant='body2'>{lead.email}</Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {lead.phone}
                    </Typography>
                  </TableCell>
                  <TableCell>{lead.location?.name}</TableCell>
                  <TableCell>{lead.service_provider?.name || 'Unassigned'}</TableCell>
                  <TableCell>
                    <Chip
                      size='small'
                      label={lead.status}
                      color={lead.status === 'new' ? 'warning' : lead.status === 'contacted' ? 'info' : 'success'}
                      variant='outlined'
                    />
                  </TableCell>
                  <TableCell>{new Date(lead.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Link href={`/admin/leads/${lead.id}`}>View</Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
}

