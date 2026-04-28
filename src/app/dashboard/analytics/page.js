import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import AdminDashboardClient from '@/components/dashboard/AdminDashboardClient';

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'admin') {
    redirect('/dashboard/agent');
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
        <p className="text-gray-500 text-sm mt-1">Detailed insights into your CRM performance</p>
      </div>
      <AdminDashboardClient />
    </div>
  );
}
