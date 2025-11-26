'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

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
      setFormData({ name: '', slug: '', address: '' });
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
    });
    setShowModal(true);
  };

  const openAssignModal = (location: Location) => {
    setAssigningLocation(location);
    setSelectedProviders(location.service_providers.map(p => p.id));
    setShowAssignModal(true);
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">Locations</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link href="/admin/dashboard" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Leads
                </Link>
                <Link href="/admin/service-providers" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Service Providers
                </Link>
                <Link href="/admin/locations" className="border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Locations
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => {
                  setEditingLocation(null);
                  setFormData({ name: '', slug: '', address: '' });
                  setShowModal(true);
                }}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Add Location
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Providers</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {locations.map((location) => (
                  <tr key={location.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{location.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{location.slug}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{location.address || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {location.service_providers.length > 0
                        ? location.service_providers.map(p => p.name).join(', ')
                        : 'No providers assigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => openEditModal(location)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => openAssignModal(location)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Assign Providers
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold mb-4">
              {editingLocation ? 'Edit Location' : 'Add Location'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="auto-generated if empty"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingLocation(null);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAssignModal && assigningLocation && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold mb-4">Assign Providers to {assigningLocation.name}</h3>
            <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
              {providers.map((provider) => (
                <label key={provider.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedProviders.includes(provider.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedProviders([...selectedProviders, provider.id]);
                      } else {
                        setSelectedProviders(selectedProviders.filter(id => id !== provider.id));
                      }
                    }}
                    className="mr-2"
                  />
                  <span>{provider.name}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAssignProviders}
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setAssigningLocation(null);
                }}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

