'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import FullPageLoader from '@/components/common/FullPageLoader';
import { Box } from '@mui/material';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';

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

interface Subscription {
  status: string;
  current_period_end: string | null;
}

// Kanban Card Component
function KanbanCard({ lead, onView }: { lead: Lead; onView: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleClick = (e: React.MouseEvent) => {
    // Don't navigate if dragging
    if (!isDragging) {
      onView();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className="bg-white rounded-lg shadow p-4 mb-3 cursor-move hover:shadow-md transition-shadow"
    >
      <h3 className="font-semibold text-gray-900 mb-2">{lead.name}</h3>
      <p className="text-sm text-gray-600 mb-1">{lead.email}</p>
      <p className="text-sm text-gray-600 mb-2">{lead.phone}</p>
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-gray-500">{lead.location?.name}</span>
        <span className="text-xs text-gray-400">
          {new Date(lead.created_at).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}

// Kanban Column Component
function KanbanColumn({ 
  id, 
  title, 
  leads, 
  onView 
}: { 
  id: string; 
  title: string; 
  leads: Lead[]; 
  onView: (lead: Lead) => void;
}) {
  const { setNodeRef } = useDroppable({ id });
  const items = leads.map(lead => lead.id);

  return (
    <div ref={setNodeRef} className="flex-1 bg-gray-50 rounded-lg p-4 min-h-[500px]">
      <h2 className="font-semibold text-gray-700 mb-4 sticky top-0 bg-gray-50 py-2">
        {title} ({leads.length})
      </h2>
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {leads.map((lead) => (
          <KanbanCard key={lead.id} lead={lead} onView={() => onView(lead)} />
        ))}
        {leads.length === 0 && (
          <div className="text-center text-gray-400 py-8 text-sm">
            No leads
          </div>
        )}
      </SortableContext>
    </div>
  );
}

export default function ProviderDashboard() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('kanban');
  const [activeId, setActiveId] = useState<number | null>(null);
  const [filters, setFilters] = useState({
    status: '',
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    document.title = 'My Leads - Provider';
    checkAuth();
    fetchSubscriptionStatus();
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
      router.push('/provider/login');
    } else {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  };

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await api.get('/provider/subscription/status');
      setSubscription(response.data.subscription);
      
      // If no active subscription, redirect to subscription page
      if (!response.data.has_active_subscription) {
        router.push('/provider/subscription');
        return;
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        router.push('/provider/login');
      }
    }
  };

  const fetchLeads = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);

      const response = await api.get(`/provider/leads?${params.toString()}`);
      setLeads(response.data.data || response.data);
    } catch (error: any) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        router.push('/provider/login');
      } else if (error.response?.status === 403) {
        // Check if account is inactive or subscription is inactive
        if (error.response?.data?.account_inactive) {
          toast.error('Your account has been deactivated. Please contact admin to activate your account.');
        } else {
          // Subscription not active
          toast.error('Please subscribe to a plan to access leads.');
          router.push('/provider/subscription');
        }
      } else {
        console.error('Failed to fetch leads:', error);
        toast.error('Failed to fetch leads. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/provider/logout');
    } catch (error) {
      // Ignore logout errors
    }
    localStorage.removeItem('token');
    router.push('/provider/login');
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    fetchLeads();
  }, [filters]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const leadId = active.id as number;
    const newStatus = over.id as string;

    // Check if dropped on a valid status column
    if (!['new', 'contacted', 'closed'].includes(newStatus)) return;

    // Find the lead
    const lead = leads.find(l => l.id === leadId);
    if (!lead || lead.status === newStatus) return;

    // Optimistic update
    const updatedLeads = leads.map(l =>
      l.id === leadId ? { ...l, status: newStatus } : l
    );
    setLeads(updatedLeads);

    // Update on server
    try {
      await api.put(`/provider/leads/${leadId}`, { status: newStatus });
    } catch (error: any) {
      // Revert on error
      setLeads(leads);
      alert('Failed to update lead status. Please try again.');
    }
  };

  const getLeadsByStatus = (status: string) => {
    return leads.filter(lead => lead.status === status);
  };

  const handleViewLead = (lead: Lead) => {
    router.push(`/provider/leads/${lead.id}`);
  };

  if (loading) {
    return <FullPageLoader />;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div className="px-4 py-6 sm:px-0">
          {subscription && subscription.status === 'active' && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded mb-4">
              <p className="font-semibold">✓ Your subscription is active</p>
              {subscription.current_period_end && (
                <p className="text-sm mt-1">
                  Renews on: {new Date(subscription.current_period_end).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Filters</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    viewMode === 'table'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Table View
                </button>
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    viewMode === 'kanban'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Kanban Board
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">All</option>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
          </div>

          {viewMode === 'kanban' ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KanbanColumn
                  id="new"
                  title="New"
                  leads={getLeadsByStatus('new')}
                  onView={handleViewLead}
                />
                <KanbanColumn
                  id="contacted"
                  title="Contacted"
                  leads={getLeadsByStatus('contacted')}
                  onView={handleViewLead}
                />
                <KanbanColumn
                  id="closed"
                  title="Closed"
                  leads={getLeadsByStatus('closed')}
                  onView={handleViewLead}
                />
              </div>
              <DragOverlay>
                {activeId ? (
                  <div className="bg-white rounded-lg shadow-lg p-4 w-64">
                    <h3 className="font-semibold text-gray-900">
                      {leads.find(l => l.id === activeId)?.name}
                    </h3>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          ) : (
            <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                      No leads assigned to you
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <tr key={lead.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{lead.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>{lead.email}</div>
                        <div>{lead.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lead.location?.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          lead.status === 'new' ? 'bg-yellow-100 text-yellow-800' :
                          lead.status === 'contacted' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link href={`/provider/leads/${lead.id}`} className="text-indigo-600 hover:text-indigo-900">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          )}
        </div>
    </Box>
  );
}

