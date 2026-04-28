'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function AgentDashboard() {
  const { data: session } = useSession();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = async () => {
    try {
      const res = await fetch('/api/leads?limit=10');
      const data = await res.json();
      setLeads(data.leads || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();

    const handleUpdate = () => fetchLeads();
    window.addEventListener('crm:lead-updated', handleUpdate);
    window.addEventListener('crm:lead-assigned', handleUpdate);
    return () => {
      window.removeEventListener('crm:lead-updated', handleUpdate);
      window.removeEventListener('crm:lead-assigned', handleUpdate);
    };
  }, []);

  const now = new Date();
  const overdueLeads = leads.filter(
    (l) => l.followUpDate && new Date(l.followUpDate) < now && l.status !== 'Closed'
  );
  const highPriority = leads.filter((l) => l.priority === 'High');

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {session?.user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">Here are your assigned leads</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-3xl font-bold text-blue-600">{leads.length}</p>
          <p className="text-sm text-gray-500 mt-1">My Leads</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-red-500">{highPriority.length}</p>
          <p className="text-sm text-gray-500 mt-1">High Priority</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-yellow-500">{overdueLeads.length}</p>
          <p className="text-sm text-gray-500 mt-1">Overdue Follow-ups</p>
        </div>
      </div>

      {/* Overdue follow-ups alert */}
      {overdueLeads.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 flex items-center gap-2">
            ⚠️ Overdue Follow-ups ({overdueLeads.length})
          </h3>
          <div className="mt-2 space-y-2">
            {overdueLeads.slice(0, 3).map((lead) => (
              <Link
                key={lead._id}
                href={`/dashboard/leads/${lead._id}`}
                className="flex items-center justify-between bg-white rounded-lg p-3 hover:bg-yellow-50 transition-colors"
              >
                <div>
                  <span className="font-medium text-gray-800">{lead.name}</span>
                  <span className={`ml-2 text-xs badge-${lead.priority.toLowerCase()}`}>
                    {lead.priority}
                  </span>
                </div>
                <span className="text-xs text-red-500">
                  Due: {new Date(lead.followUpDate).toLocaleDateString()}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* My leads */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">My Leads</h2>
          <Link href="/dashboard/leads" className="text-blue-600 text-sm hover:underline">
            View all →
          </Link>
        </div>

        {loading ? (
          <p className="text-gray-400 text-sm py-4 text-center">Loading...</p>
        ) : leads.length === 0 ? (
          <p className="text-gray-400 text-sm py-8 text-center">
            No leads assigned yet. Check back soon.
          </p>
        ) : (
          <div className="space-y-3">
            {leads.slice(0, 8).map((lead) => (
              <Link
                key={lead._id}
                href={`/dashboard/leads/${lead._id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                    {lead.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{lead.name}</p>
                    <p className="text-xs text-gray-400">{lead.propertyInterest} • PKR {(lead.budget / 1000000).toFixed(1)}M</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge-${lead.priority.toLowerCase()}`}>{lead.priority}</span>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {lead.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
