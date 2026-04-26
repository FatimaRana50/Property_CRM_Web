'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

const adminNav = [
  { href: '/dashboard/admin', label: 'Dashboard', icon: '📊' },
  { href: '/dashboard/leads', label: 'All Leads', icon: '👥' },
  { href: '/dashboard/leads/new', label: 'Add Lead', icon: '➕' },
  { href: '/dashboard/agents', label: 'Agents', icon: '🧑‍💼' },
  { href: '/dashboard/analytics', label: 'Analytics', icon: '📈' },
];

const agentNav = [
  { href: '/dashboard/agent', label: 'My Dashboard', icon: '🏠' },
  { href: '/dashboard/leads', label: 'My Leads', icon: '👥' },
  { href: '/dashboard/leads/new', label: 'Add Lead', icon: '➕' },
];

export default function Sidebar({ user }) {
  const pathname = usePathname();
  const navItems = user.role === 'admin' ? adminNav : agentNav;

  return (
    <div className="w-64 bg-blue-900 text-white flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-blue-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-xl">
            🏠
          </div>
          <div>
            <h1 className="font-bold text-sm">Property CRM</h1>
            <p className="text-blue-300 text-xs capitalize">{user.role} Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-blue-200 hover:bg-blue-800 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div className="p-4 border-t border-blue-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-blue-300 truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full text-left px-4 py-2 text-sm text-blue-200 hover:text-white hover:bg-blue-800 rounded-lg transition-colors"
        >
          🚪 Sign Out
        </button>
      </div>
    </div>
  );
}
