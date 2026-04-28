'use client';

import { useEffect, useState } from 'react';

export default function AgentsPage() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/agents')
      .then((r) => r.json())
      .then((d) => { setAgents(d.agents || []); setLoading(false); });
  }, []);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Agents</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your CRM agents</p>
      </div>

      <div className="card">
        {loading ? (
          <p className="text-gray-400 text-center py-8">Loading...</p>
        ) : agents.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No agents found. Add agents via signup.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {agents.map((agent) => (
              <div key={agent._id} className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">
                    {agent.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{agent.name}</p>
                    <p className="text-sm text-gray-400">{agent.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span>
                  <p className="text-xs text-gray-400 mt-1">
                    Joined {new Date(agent.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
