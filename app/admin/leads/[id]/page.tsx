'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

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

  useEffect(() => {
    document.title = 'Lead Details - Admin';
    checkAuth();
    fetchLead();
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
    } catch (error) {
      console.error('Failed to reassign:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!lead) {
    return <div className="p-8">Lead not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/admin/dashboard" className="text-gray-500 hover:text-gray-700">
                ← Back to Leads
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Provider</label>
                <p className="text-gray-900">{lead.service_provider?.name || 'Unassigned'}</p>
              </div>
              {lead.notes && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <p className="text-gray-900">{lead.notes}</p>
                </div>
              )}
            </div>

            <div className="border-t pt-6 space-y-4">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reassign Provider</label>
                <div className="flex gap-4">
                  <select
                    value={selectedProvider}
                    onChange={(e) => setSelectedProvider(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 flex-1"
                  >
                    <option value="">Select provider</option>
                    {providers.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleReassign}
                    disabled={saving || !selectedProvider}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Reassign'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

