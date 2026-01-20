'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography
} from '@mui/material';
import FullPageLoader from '@/components/common/FullPageLoader';

interface Lead {
  id: number;
  name: string;
  phone: string;
  email: string;
  zip_code: string;
  project_type: string;
  timing: string;
  notes: string;
  status: string;
  created_at: string;
  location: { id: number; name: string };
  service_provider: { id: number; name: string } | null;
}

interface ServiceProvider {
  id: number;
  name: string;
}

interface LeadNote {
  id: number;
  note: string;
  type: string;
  created_at: string;
  user: { name: string } | null;
  service_provider: { name: string } | null;
}

export default function LeadDetailPage() {
  const router = useRouter();
  const params = useParams();
  const leadId = params.id as string;
  
  const [lead, setLead] = useState<Lead | null>(null);
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loadingNotes, setLoadingNotes] = useState(false);

  useEffect(() => {
    document.title = 'Lead Details - Admin';
    checkAuth();
    fetchLead();
    fetchProviders();
    fetchNotes();

    // Listen for real-time note updates
    const handleNoteCreated = () => {
      fetchNotes();
    };

    window.addEventListener('leadNoteCreated', handleNoteCreated);
    return () => {
      window.removeEventListener('leadNoteCreated', handleNoteCreated);
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

  const fetchLead = async () => {
    try {
      const response = await api.get(`/admin/leads/${leadId}`);
      setLead(response.data);
      setStatus(response.data.status);
      setSelectedProvider(response.data.service_provider?.id?.toString() || '');
    } catch (error) {
      console.error('Failed to fetch lead:', error);
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

  const handleStatusUpdate = async () => {
    setSaving(true);
    try {
      await api.put(`/admin/leads/${leadId}`, { status });
      await fetchLead();
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleReassign = async () => {
    if (!selectedProvider) return;
    setSaving(true);
    try {
      await api.put(`/admin/leads/${leadId}/reassign`, {
        service_provider_id: parseInt(selectedProvider),
      });
      await fetchLead();
      await fetchNotes();
    } catch (error) {
      console.error('Failed to reassign:', error);
    } finally {
      setSaving(false);
    }
  };

  const fetchNotes = async () => {
    try {
      setLoadingNotes(true);
      const response = await api.get(`/admin/leads/${leadId}/notes`);
      setNotes(response.data);
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    } finally {
      setLoadingNotes(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      await api.post(`/admin/leads/${leadId}/notes`, { note: newNote });
      setNewNote('');
      await fetchNotes();
    } catch (error) {
      console.error('Failed to add note:', error);
      alert('Failed to add note');
    }
  };

  if (loading) {
    return <FullPageLoader />;
  }

  if (!lead) {
    return (
      <Box sx={{ py: 6 }}>
        <Typography color='text.secondary'>Lead not found.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 1000 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Typography variant='h4'>Lead details</Typography>
          <Typography color='text.secondary'>
            <Link href='/admin/dashboard'>Back to leads</Link> • #{lead.id}
          </Typography>
        </Box>
        <Chip
          size='small'
          label={lead.status}
          color={lead.status === 'new' ? 'warning' : lead.status === 'contacted' ? 'info' : 'success'}
          variant='outlined'
        />
      </Box>

      <Card>
        <CardHeader title='Overview' />
        <CardContent>
          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
            <Box><Typography variant='subtitle2'>Name</Typography><Typography>{lead.name}</Typography></Box>
            <Box><Typography variant='subtitle2'>Email</Typography><Typography>{lead.email}</Typography></Box>
            <Box><Typography variant='subtitle2'>Phone</Typography><Typography>{lead.phone}</Typography></Box>
            <Box><Typography variant='subtitle2'>Zip code</Typography><Typography>{lead.zip_code}</Typography></Box>
            <Box><Typography variant='subtitle2'>Project type</Typography><Typography>{lead.project_type}</Typography></Box>
            <Box><Typography variant='subtitle2'>Timing</Typography><Typography>{lead.timing}</Typography></Box>
            <Box><Typography variant='subtitle2'>Location</Typography><Typography>{lead.location.name}</Typography></Box>
            <Box><Typography variant='subtitle2'>Assigned provider</Typography><Typography>{lead.service_provider?.name || 'Unassigned'}</Typography></Box>
            {lead.notes && (
              <Box sx={{ gridColumn: { md: '1 / -1' } }}>
                <Typography variant='subtitle2'>Notes</Typography>
                <Typography>{lead.notes}</Typography>
              </Box>
            )}
          </Box>

          <Box sx={{ mt: 4, pt: 4, borderTop: '1px solid', borderColor: 'divider', display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
            <Box>
              <FormControl fullWidth size='small'>
                <InputLabel id='lead-status-update-label'>Status</InputLabel>
                <Select
                  labelId='lead-status-update-label'
                  label='Status'
                  value={status}
                  onChange={(e) => setStatus(String(e.target.value))}
                >
                  <MenuItem value='new'>New</MenuItem>
                  <MenuItem value='contacted'>Contacted</MenuItem>
                  <MenuItem value='closed'>Closed</MenuItem>
                </Select>
              </FormControl>
              <Button sx={{ mt: 2 }} variant='contained' onClick={handleStatusUpdate} disabled={saving}>
                {saving ? 'Saving…' : 'Update status'}
              </Button>
            </Box>

            <Box>
              <FormControl fullWidth size='small'>
                <InputLabel id='lead-provider-label'>Provider</InputLabel>
                <Select
                  labelId='lead-provider-label'
                  label='Provider'
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(String(e.target.value))}
                >
                  <MenuItem value=''>Select provider</MenuItem>
                  {providers.map((provider) => (
                    <MenuItem key={provider.id} value={provider.id}>
                      {provider.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button sx={{ mt: 2 }} variant='contained' onClick={handleReassign} disabled={saving || !selectedProvider}>
                {saving ? 'Saving…' : 'Reassign'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title='Notes & history' />
        <CardContent>
          <Box component='form' onSubmit={handleAddNote} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
            <TextField
              label='Add a note'
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              multiline
              minRows={3}
            />
            <Box>
              <Button type='submit' variant='contained'>Add note</Button>
            </Box>
          </Box>

          {loadingNotes ? (
            <Typography color='text.secondary'>Loading notes…</Typography>
          ) : notes.length === 0 ? (
            <Typography color='text.secondary'>No notes yet.</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {notes.map(note => (
                <Card key={note.id} variant='outlined'>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                      <Box>
                        <Typography fontWeight={700}>
                          {note.user?.name || note.service_provider?.name || 'System'}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {new Date(note.created_at).toLocaleString()}
                        </Typography>
                      </Box>
                      {note.type !== 'note' && <Chip size='small' label={note.type} color='info' variant='outlined' />}
                    </Box>
                    <Typography sx={{ mt: 2 }}>{note.note}</Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

