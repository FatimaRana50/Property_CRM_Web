import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import AdminDashboardClient from '@/components/dashboard/AdminDashboardClient';

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'admin') {
    redirect('/dashboard/agent');
  }

  return <AdminDashboardClient />;
}
