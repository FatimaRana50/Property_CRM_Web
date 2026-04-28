import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { requireAdmin } from '@/middleware/auth';

export async function GET(request) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  try {
    await dbConnect();

    const agents = await User.find({ role: 'agent', isActive: true })
      .select('name email phone role createdAt')
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({ agents });
  } catch (error) {
    console.error('GET /api/agents error:', error);
    return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 });
  }
}
