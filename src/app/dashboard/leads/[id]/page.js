'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const STATUSES = ['New', 'Contacted', 'In Progress', 'Negotiation', 'Closed', 'Lost'];

export default function LeadDetailPage({ params }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [lead, setLead] = useState(null);
  const [agents, setAgents] = useState([]);
  const [activities, setActivities] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  // Editable fields
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  const fetchLead = async () => {
    const res = await fetch(`/api/leads/${params.id}`);
    if (!res.ok) { router.push('/dashboard/leads'); return; }
    const data = await res.json();
    setLead(data.lead);
    setStatus(data.lead.status);
    setNotes(data.lead.notes || '');
    setAssignedTo(data.lead.assignedTo?._id || '');
    setFollowUpDate(
      data.lead.followUpDate
        ? new Date(data.lead.followUpDate).toISOString().split('T')[0]
        : ''
    );
    setLoading(false);
  };

  const fetchActivities = async () => {
    const res = await fetch(`/api/leads/${params.id}/activity`);
    const data = await res.json();
    setActivities(data.activities || []);
  };

  const fetchAgents = async () => {
    if (session?.user?.role !== 'admin') return;
    const res = await fetch('/api/agents');
    const data = await res.json();
    setAgents(data.agents || []);
  };

  useEffect(() => {
    fetchLead();
    fetchActivities();
    fetchAgents();
  }, [params.id, session]);

  const handleSave = async () => {
    setSaving(true);
    const body = { status, notes, followUpDate: followUpDate || null };
    if (session?.user?.role === 'admin') body.assignedTo = assignedTo || null;

    await fetch(`/api/leads/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    await fetchLead();
    await fetchActivities();
    setSaving(false);
  };

  const fetchSuggestions = async () => {
    setLoadingSuggestions(true);
    const res = await fetch(`/api/leads/${params.id}/suggest`, { method: 'POST' });
    const data = await res.json();
    setSuggestions(data.suggestions || []);
    setLoadingSuggestions(false);
  };

  if (loading) {
    return <div className="p-6 text-gray-400">Loading lead details...</div>;
  }

  const priorityColor = { High: 'text-red-600 bg-red-50', Medium: 'text-yellow-600 bg-yellow-50', Low: 'text-green-600 bg-green-50' };
  const whatsappUrl = `https://wa.me/${lead.phone?.replace(/[^0-9]/g, '')}`;

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">{lead.name}</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${priorityColor[lead.priority]}`}>
              {lead.priority} Priority
            </span>
          </div>
          <p className="text-gray-500 text-sm">
            {lead.propertyInterest} • PKR {(lead.budget / 1000000).toFixed(1)}M • Score: {lead.score}
          </p>
        </div>
        <div className="flex gap-2">
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
            className="btn-secondary text-sm flex items-center gap-1">
            💬 WhatsApp
          </a>
          <Link href="/dashboard/leads" className="btn-secondary text-sm">← Back</Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {['details', 'activity', 'suggestions'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'suggestions' ? '🤖 AI Suggestions' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Details Tab */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lead Info */}
          <div className="card">
            <h2 className="font-semibold text-gray-800 mb-4">Client Details</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-gray-500">Phone</dt><dd className="font-medium">{lead.phone}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Email</dt><dd className="font-medium">{lead.email || '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Source</dt><dd className="font-medium">{lead.source}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Created</dt><dd className="font-medium">{new Date(lead.createdAt).toLocaleDateString()}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Created By</dt><dd className="font-medium">{lead.createdBy?.name}</dd></div>
            </dl>
          </div>

          {/* Update Form */}
          <div className="card space-y-4">
            <h2 className="font-semibold text-gray-800">Update Lead</h2>

            <div>
              <label className="label">Status</label>
              <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {session?.user?.role === 'admin' && (
              <div>
                <label className="label">Assign to Agent</label>
                <select className="input" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
                  <option value="">Unassigned</option>
                  {agents.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="label">Follow-up Date</label>
              <input type="date" className="input" value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)} />
            </div>

            <div>
              <label className="label">Notes</label>
              <textarea className="input" rows={3} value={notes}
                onChange={(e) => setNotes(e.target.value)} />
            </div>

            <button className="btn-primary w-full" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : '💾 Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">Activity Timeline</h2>
          {activities.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No activity recorded yet</p>
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
              <div className="space-y-4">
                {activities.map((activity, i) => (
                  <div key={activity._id} className="flex gap-4 relative">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm z-10 flex-shrink-0">
                      {activity.action === 'LEAD_CREATED' ? '🆕'
                        : activity.action === 'STATUS_UPDATED' ? '🔄'
                        : activity.action === 'LEAD_ASSIGNED' ? '👤'
                        : activity.action === 'NOTES_UPDATED' ? '📝'
                        : activity.action === 'FOLLOW_UP_SET' ? '📅'
                        : '✏️'}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm text-gray-800">{activity.description}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        by {activity.performedBy?.name} •{' '}
                        {new Date(activity.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Suggestions Tab */}
      {activeTab === 'suggestions' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">AI Follow-up Suggestions</h2>
            <button
              className="btn-primary text-sm"
              onClick={fetchSuggestions}
              disabled={loadingSuggestions}
            >
              {loadingSuggestions ? 'Generating...' : '✨ Generate Suggestions'}
            </button>
          </div>

          {suggestions.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-4xl mb-2">🤖</p>
              <p>Click "Generate Suggestions" to get AI-powered follow-up recommendations</p>
            </div>
          ) : (
            <div className="space-y-3">
              {suggestions.map((suggestion, i) => (
                <div key={i} className="flex gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <span className="text-blue-500 font-bold text-sm flex-shrink-0">{i + 1}.</span>
                  <p className="text-sm text-gray-700">{suggestion}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
