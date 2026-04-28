'use client';

import { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts';
import Link from 'next/link';

const STATUS_COLORS = {
  New: '#3b82f6',
  Contacted: '#8b5cf6',
  'In Progress': '#f59e0b',
  Negotiation: '#f97316',
  Closed: '#10b981',
  Lost: '#ef4444',
};

const PRIORITY_COLORS = {
  High: '#ef4444',
  Medium: '#f59e0b',
  Low: '#10b981',
};

export default function AdminDashboardClient() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/analytics');
      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();

    // Listen for real-time updates
    const handleLeadCreated = () => fetchAnalytics();
    const handleLeadUpdated = () => fetchAnalytics();
    window.addEventListener('crm:lead-created', handleLeadCreated);
    window.addEventListener('crm:lead-updated', handleLeadUpdated);

    return () => {
      window.removeEventListener('crm:lead-created', handleLeadCreated);
      window.removeEventListener('crm:lead-updated', handleLeadUpdated);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  const { overview, statusDistribution, priorityDistribution, agentPerformance, leadsPerDay } = analytics || {};

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Property Dealer CRM Overview</p>
        </div>
        <div className="flex gap-3">
          <a
            href="/api/export?format=excel"
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            📊 Export Excel
          </a>
          <Link href="/dashboard/leads/new" className="btn-primary text-sm">
            + New Lead
          </Link>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Leads"
          value={overview?.totalLeads || 0}
          icon="👥"
          color="blue"
        />
        <StatCard
          title="High Priority"
          value={overview?.highPriorityLeads || 0}
          icon="🔥"
          color="red"
        />
        <StatCard
          title="Closed Leads"
          value={overview?.closedLeads || 0}
          icon="✅"
          color="green"
        />
        <StatCard
          title="Overdue Follow-ups"
          value={overview?.overdueFollowUps || 0}
          icon="⚠️"
          color="yellow"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">Lead Status</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={statusDistribution}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={70}
                label={({ name, value }) => `${name}: ${value}`}
                labelLine={false}
              >
                {statusDistribution?.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#6b7280'} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Priority Distribution */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">Lead Priority</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={priorityDistribution}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={70}
                label={({ name, value }) => `${name}: ${value}`}
              >
                {priorityDistribution?.map((entry) => (
                  <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name] || '#6b7280'} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Leads per day */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">Leads This Week</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={leadsPerDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="_id"
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => v?.slice(5)}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Agent Performance */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">Agent Performance</h2>
        {agentPerformance?.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No agent data yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left pb-3 text-gray-500 font-medium">Agent</th>
                  <th className="text-center pb-3 text-gray-500 font-medium">Total Leads</th>
                  <th className="text-center pb-3 text-gray-500 font-medium">Closed</th>
                  <th className="text-center pb-3 text-gray-500 font-medium">High Priority</th>
                  <th className="text-center pb-3 text-gray-500 font-medium">Conversion Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {agentPerformance?.map((agent) => (
                  <tr key={agent._id} className="hover:bg-gray-50">
                    <td className="py-3">
                      <div className="font-medium text-gray-800">{agent.agentName}</div>
                      <div className="text-xs text-gray-400">{agent.agentEmail}</div>
                    </td>
                    <td className="text-center py-3 font-semibold">{agent.totalLeads}</td>
                    <td className="text-center py-3 text-green-600 font-medium">{agent.closedLeads}</td>
                    <td className="text-center py-3 text-red-500 font-medium">{agent.highPriorityLeads}</td>
                    <td className="text-center py-3">
                      <span className={`font-semibold ${agent.conversionRate >= 50 ? 'text-green-600' : agent.conversionRate >= 25 ? 'text-yellow-600' : 'text-red-500'}`}>
                        {agent.conversionRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
  };

  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${colorMap[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
