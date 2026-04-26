import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import SocketInitializer from '@/components/dashboard/SocketInitializer';

export default async function DashboardLayout({ children }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar user={session.user} />
      <main className="flex-1 overflow-y-auto">
        <SocketInitializer userId={session.user.id} role={session.user.role} />
        {children}
      </main>
    </div>
  );
}
