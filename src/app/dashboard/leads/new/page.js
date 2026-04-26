'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const PROPERTY_TYPES = ['Residential', 'Commercial', 'Plot', 'Apartment', 'Villa', 'Other'];
const SOURCES = ['Facebook Ads', 'Walk-in', 'Website', 'Referral', 'Other'];

export default function NewLeadPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '', email: '', phone: '', propertyInterest: '', budget: '',
    source: 'Website', notes: '', followUpDate: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Calculate priority preview
  const budgetM = parseFloat(form.budget) / 1000000;
  const previewPriority = budgetM > 20 ? 'High' : budgetM >= 10 ? 'Medium' : 'Low';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, budget: Number(form.budget) }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || 'Failed to create lead');
    } else {
      router.push(`/dashboard/leads/${data.lead._id}`);
    }
  };

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add New Lead</h1>
        <p className="text-gray-500 text-sm mt-1">Enter client details to create a new lead</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-4">
        {/* Client Details */}
        <h2 className="font-semibold text-gray-700 pb-2 border-b">Client Information</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Client Name *</label>
            <input
              type="text"
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Phone Number *</label>
            <input
              type="tel"
              className="input"
              placeholder="923001234567"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
            />
          </div>
        </div>

        <div>
          <label className="label">Email Address</label>
          <input
            type="email"
            className="input"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>

        {/* Property Details */}
        <h2 className="font-semibold text-gray-700 pt-2 pb-2 border-b">Property Requirements</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Property Interest *</label>
            <select
              className="input"
              value={form.propertyInterest}
              onChange={(e) => setForm({ ...form, propertyInterest: e.target.value })}
              required
            >
              <option value="">Select type...</option>
              {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Source</label>
            <select
              className="input"
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
            >
              {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Budget (PKR) *</label>
          <input
            type="number"
            className="input"
            placeholder="e.g. 15000000 for PKR 15M"
            value={form.budget}
            onChange={(e) => setForm({ ...form, budget: e.target.value })}
            required
          />
          {form.budget && (
            <p className="text-xs mt-1 text-gray-500">
              = PKR {(Number(form.budget) / 1000000).toFixed(2)}M →{' '}
              <span className={`font-semibold ${previewPriority === 'High' ? 'text-red-500' : previewPriority === 'Medium' ? 'text-yellow-500' : 'text-green-500'}`}>
                {previewPriority} Priority
              </span>
            </p>
          )}
        </div>

        <div>
          <label className="label">Follow-up Date</label>
          <input
            type="date"
            className="input"
            value={form.followUpDate}
            onChange={(e) => setForm({ ...form, followUpDate: e.target.value })}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div>
          <label className="label">Notes</label>
          <textarea
            className="input"
            rows={3}
            placeholder="Any additional notes about this client..."
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating...' : '✅ Create Lead'}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => router.back()}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
