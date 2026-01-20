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
  CardHeader,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';

interface AnalyticsData {
  summary: {
    total_leads: number;
    new_leads: number;
    contacted_leads: number;
    closed_leads: number;
    conversion_rate: number;
  };
  leads_by_location: Array<{
    id: number;
    name: string;
    leads_count: number;
  }>;
  leads_by_status_daily: Array<{
    date: string;
    total: number;
    new: number;
    contacted: number;
    closed: number;
  }>;
  provider_performance: Array<{
    id: number;
    name: string;
    total_leads: number;
    closed_leads: number;
    conversion_rate: number;
  }>;
  date_range: {
    from: string;
    to: string;
  };
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    document.title = 'Analytics - Admin';
    checkAuth();
    fetchAnalytics();
  }, [dateFrom, dateTo]);

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin/login');
    } else {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/analytics/dashboard', {
        params: { date_from: dateFrom, date_to: dateTo },
      });
      setAnalytics(response.data);
    } catch (error: any) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        router.push('/admin/login');
      } else {
        console.error('Failed to fetch analytics:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <FullPageLoader />;
  }

  if (!analytics) {
    return (
      <Box sx={{ py: 6 }}>
        <Typography color='text.secondary'>No data available.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <Box>
        <Typography variant='h4'>Analytics</Typography>
        <Typography color='text.secondary'>
          Date range: {analytics.date_range.from} → {analytics.date_range.to}
        </Typography>
      </Box>

      <Card>
        <CardHeader title='Date range' />
        <CardContent>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' } }}>
            <TextField
              size='small'
              label='From'
              type='date'
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              size='small'
              label='To'
              type='date'
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <Button variant='contained' onClick={fetchAnalytics}>
              Refresh
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(5, 1fr)' } }}>
        <Card><CardContent><Typography color='text.secondary'>Total</Typography><Typography variant='h3'>{analytics.summary.total_leads}</Typography></CardContent></Card>
        <Card><CardContent><Typography color='text.secondary'>New</Typography><Typography variant='h3' color='warning.main'>{analytics.summary.new_leads}</Typography></CardContent></Card>
        <Card><CardContent><Typography color='text.secondary'>Contacted</Typography><Typography variant='h3' color='info.main'>{analytics.summary.contacted_leads}</Typography></CardContent></Card>
        <Card><CardContent><Typography color='text.secondary'>Closed</Typography><Typography variant='h3' color='success.main'>{analytics.summary.closed_leads}</Typography></CardContent></Card>
        <Card><CardContent><Typography color='text.secondary'>Conversion</Typography><Typography variant='h3' color='primary.main'>{analytics.summary.conversion_rate}%</Typography></CardContent></Card>
      </Box>

      <Card>
        <CardHeader title='Leads by location' />
        <CardContent sx={{ p: 0 }}>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>Location</TableCell>
                <TableCell>Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {analytics.leads_by_location.map((location) => (
                <TableRow key={location.id} hover>
                  <TableCell><Typography fontWeight={600}>{location.name}</Typography></TableCell>
                  <TableCell>{location.leads_count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title='Provider performance' />
        <CardContent sx={{ p: 0 }}>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>Provider</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Closed</TableCell>
                <TableCell>Conversion</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {analytics.provider_performance.map((provider) => (
                <TableRow key={provider.id} hover>
                  <TableCell><Typography fontWeight={600}>{provider.name}</Typography></TableCell>
                  <TableCell>{provider.total_leads}</TableCell>
                  <TableCell>{provider.closed_leads}</TableCell>
                  <TableCell>
                    <Chip
                      size='small'
                      label={`${provider.conversion_rate}%`}
                      color={provider.conversion_rate >= 50 ? 'success' : 'default'}
                      variant='outlined'
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title='Daily trend' />
        <CardContent sx={{ p: 0 }}>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>New</TableCell>
                <TableCell>Contacted</TableCell>
                <TableCell>Closed</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {analytics.leads_by_status_daily.map((day, index) => (
                <TableRow key={index} hover>
                  <TableCell>{day.date}</TableCell>
                  <TableCell>{day.total}</TableCell>
                  <TableCell sx={{ color: 'warning.main' }}>{day.new}</TableCell>
                  <TableCell sx={{ color: 'info.main' }}>{day.contacted}</TableCell>
                  <TableCell sx={{ color: 'success.main' }}>{day.closed}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
}

