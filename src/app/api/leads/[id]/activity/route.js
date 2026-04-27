import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Activity from '@/models/Activity';
import Lead from '@/models/Lead';
import { requireAuth } from '@/middleware/auth';

export async function GET(request, { params }) {
  const { error, session } = await requireAuth(request);
  if (error) return error;

  try {
    await dbConnect();

    // Verify lead exists and access
    const lead = await Lead.findById(params.id);
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    if (
      session.user.role === 'agent' &&
      lead.assignedTo?.toString() !== session.user.id
    ) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const activities = await Activity.find({ lead: params.id })
      .populate('performedBy', 'name role')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({ activities });
  } catch (error) {
    console.error('GET /api/leads/[id]/activity error:', error);
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 });
  }
}
