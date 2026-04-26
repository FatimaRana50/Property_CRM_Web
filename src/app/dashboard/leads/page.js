'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

const STATUSES = ['', 'New', 'Contacted', 'In Progress', 'Negotiation', 'Closed', 'Lost'];
const PRIORITIES = ['', 'High', 'Medium', 'Low'];

export default function LeadsPage() {
  const { data: session } = useSession();
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' });
  const [loading, setLoading] = useState(true);

  const fetchLeads = useCallback(async (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 15 });
    if (filters.status) params.set('status', filters.status);
    if (filters.priority) params.set('priority', filters.priority);
    if (filters.search) params.set('search', filters.search);

    const res = await fetch(`/api/leads?${params}`);
    const data = await res.json();
    setLeads(data.leads || []);
    setPagination(data.pagination || {});
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    fetchLeads(1);

    const handleCRMEvent = () => fetchLeads(pagination.page);
    window.addEventListener('crm:lead-created', handleCRMEvent);
    window.addEventListener('crm:lead-updated', handleCRMEvent);
    window.addEventListener('crm:lead-deleted', handleCRMEvent);
    return () => {
      window.removeEventListener('crm:lead-created', handleCRMEvent);
      window.removeEventListener('crm:lead-updated', handleCRMEvent);
      window.removeEventListener('crm:lead-deleted', handleCRMEvent);
    };
  }, [fetchLeads]);

  const deleteLead = async (id) => {
    if (!confirm('Delete this lead? This cannot be undone.')) return;
    await fetch(`/api/leads/${id}`, { method: 'DELETE' });
    fetchLeads(pagination.page);
  };

  const priorityBadge = (p) => {
    const cls = { High: 'badge-high', Medium: 'badge-medium', Low: 'badge-low' };
    return <span className={cls[p] || 'text-gray-500 text-xs'}>{p}</span>;
  };

  const statusColor = {
    New: 'bg-blue-100 text-blue-700',
    Contacted: 'bg-purple-100 text-purple-700',
    'In Progress': 'bg-yellow-100 text-yellow-700',
    Negotiation: 'bg-orange-100 text-orange-700',
    Closed: 'bg-green-100 text-green-700',
    Lost: 'bg-red-100 text-red-700',
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {session?.user?.role === 'admin' ? 'All Leads' : 'My Leads'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">{pagination.total} leads total</p>
        </div>
        <Link href="/dashboard/leads/new" className="btn-primary text-sm">
          + Add Lead
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by name, email, phone..."
          className="input max-w-xs"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <select
          className="input w-36"
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">All Status</option>
          {STATUSES.slice(1).map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          className="input w-36"
          value={filters.priority}
          onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
        >
          <option value="">All Priority</option>
          {PRIORITIES.slice(1).map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Leads Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading leads...</div>
        ) : leads.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <p className="text-4xl mb-2">📭</p>
            <p>No leads found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Client</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Interest</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Budget</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Priority</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Status</th>
                  {session?.user?.role === 'admin' && (
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Assigned To</th>
                  )}
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leads.map((lead) => (
                  <tr
                    key={lead._id}
                    className={`hover:bg-gray-50 transition-colors ${lead.priority === 'High' ? 'border-l-4 border-red-400' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{lead.name}</div>
                      <div className="text-xs text-gray-400">{lead.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{lead.propertyInterest}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      PKR {(lead.budget / 1000000).toFixed(1)}M
                    </td>
                    <td className="px-4 py-3">{priorityBadge(lead.priority)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[lead.status] || 'bg-gray-100 text-gray-600'}`}>
                        {lead.status}
                      </span>
                    </td>
                    {session?.user?.role === 'admin' && (
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {lead.assignedTo?.name || (
                          <span className="text-gray-400 italic">Unassigned</span>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/leads/${lead._id}`}
                          className="text-blue-600 hover:underline text-xs font-medium"
                        >
                          View
                        </Link>
                        {/* WhatsApp */}
                        <a
                          href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 text-xs hover:underline"
                          title="WhatsApp"
                        >
                          💬
                        </a>
                        {session?.user?.role === 'admin' && (
                          <button
                            onClick={() => deleteLead(lead._id)}
                            className="text-red-500 hover:underline text-xs"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => fetchLeads(p)}
              className={`w-8 h-8 rounded-lg text-sm font-medium ${
                p === pagination.page
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 border hover:bg-gray-50'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
