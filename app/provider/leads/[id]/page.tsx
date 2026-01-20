'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import FullPageLoader from '@/components/common/FullPageLoader';
import { Box } from '@mui/material';

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

interface LeadNote {
  id: number;
  note: string;
  type: string;
  created_at: string;
  user: { name: string } | null;
  service_provider: { name: string } | null;
}

export default function ProviderLeadDetailPage() {
  const router = useRouter();
  const params = useParams();
  const leadId = params.id as string;
  
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    document.title = 'Lead Details - Provider';
    checkAuth();
    fetchLead();
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
      router.push('/provider/login');
    } else {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  };

  const fetchLead = async () => {
    try {
      const response = await api.get(`/provider/leads/${leadId}`);
      setLead(response.data);
      setStatus(response.data.status);
    } catch (error: any) {
      if (error.response?.status === 403) {
        alert('You do not have access to this lead');
        router.push('/provider/dashboard');
      } else if (error.response?.status === 401) {
        localStorage.removeItem('token');
        router.push('/provider/login');
      } else {
        console.error('Failed to fetch lead:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchNotes = async () => {
    setLoadingNotes(true);
    try {
      const response = await api.get(`/provider/leads/${leadId}/notes`);
      setNotes(response.data);
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    } finally {
      setLoadingNotes(false);
    }
  };

  const handleStatusUpdate = async () => {
    setSaving(true);
    try {
      await api.put(`/provider/leads/${leadId}`, { status });
      await fetchLead();
      await fetchNotes(); // Refresh notes to see status change note
      toast.success('Status updated successfully');
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error('You do not have access to this lead');
      } else {
        console.error('Failed to update status:', error);
        toast.error(error.response?.data?.message || 'Failed to update status');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) {
      toast.error('Please enter a note');
      return;
    }

    setAddingNote(true);
    try {
      await api.post(`/provider/leads/${leadId}/notes`, { note: newNote });
      setNewNote('');
      await fetchNotes();
      toast.success('Note added successfully');
    } catch (error: any) {
      console.error('Failed to add note:', error);
      toast.error(error.response?.data?.message || 'Failed to add note');
    } finally {
      setAddingNote(false);
    }
  };

  if (loading) {
    return <FullPageLoader />;
  }

  if (!lead) {
    return <div className="p-8">Lead not found</div>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h1 className="text-2xl font-bold mb-6">Lead Details</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <p className="text-gray-900">{lead.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-gray-900">{lead.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <p className="text-gray-900">{lead.phone}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
                <p className="text-gray-900">{lead.zip_code}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Type</label>
                <p className="text-gray-900">{lead.project_type}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timing</label>
                <p className="text-gray-900">{lead.timing}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <p className="text-gray-900">{lead.location.name}</p>
              </div>
              {lead.notes && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <p className="text-gray-900">{lead.notes}</p>
                </div>
              )}
            </div>

            <div className="border-t pt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <div className="flex gap-4">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="closed">Closed</option>
                  </select>
                  <button
                    onClick={handleStatusUpdate}
                    disabled={saving}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Update Status'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="bg-white shadow rounded-lg p-6 mt-6">
            <h2 className="text-xl font-bold mb-4">Notes & History</h2>
            
            <form onSubmit={handleAddNote} className="mb-6">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 mb-2"
                rows={3}
              />
              <button
                type="submit"
                disabled={addingNote || !newNote.trim()}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {addingNote ? 'Adding...' : 'Add Note'}
              </button>
            </form>

            <div className="space-y-4">
              {loadingNotes ? (
                <p className="text-gray-500">Loading notes...</p>
              ) : notes.length === 0 ? (
                <p className="text-gray-500">No notes yet</p>
              ) : (
                notes.map((note) => (
                  <div key={note.id} className="border-l-4 border-indigo-500 pl-4 py-2">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <p className="text-sm text-gray-600">
                          {note.user?.name || note.service_provider?.name || 'System'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(note.created_at).toLocaleString()}
                        </p>
                      </div>
                      {note.type !== 'note' && (
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          {note.type}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-900">{note.note}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
    </Box>
  );
}

