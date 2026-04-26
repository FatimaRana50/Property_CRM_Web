import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Lead from '@/models/Lead';
import User from '@/models/User';
import { requireAuth } from '@/middleware/auth';
import { rateLimit } from '@/middleware/rateLimit';
import { validateLead, validateQueryParams } from '@/middleware/validation';
import { logActivity } from '@/lib/activityLogger';
import { sendNewLeadEmail } from '@/lib/email';
import { emitToAll, emitToRoom, SOCKET_EVENTS, ROOMS } from '@/lib/socket';

export async function GET(request) {
  const { error, session } = await requireAuth(request);
  if (error) return error;

  // Rate limiting
  const rateLimitError = rateLimit(session.user.id, session.user.role);
  if (rateLimitError) return rateLimitError;

  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const params = validateQueryParams(searchParams, [
      'status', 'priority', 'source', 'assignedTo', 'page', 'limit', 'search', 'startDate', 'endDate'
    ]);

    const filter = {};

    // Agents can only see their assigned leads
    if (session.user.role === 'agent') {
      filter.assignedTo = session.user.id;
    }

    // Apply filters
    if (params.status) filter.status = params.status;
    if (params.priority) filter.priority = params.priority;
    if (params.source) filter.source = params.source;
    if (params.assignedTo && session.user.role === 'admin') {
      filter.assignedTo = params.assignedTo;
    }

    // Date range filter
    if (params.startDate || params.endDate) {
      filter.createdAt = {};
      if (params.startDate) filter.createdAt.$gte = new Date(params.startDate);
      if (params.endDate) filter.createdAt.$lte = new Date(params.endDate);
    }

    // Search filter
    if (params.search) {
      filter.$or = [
        { name: { $regex: params.search, $options: 'i' } },
        { email: { $regex: params.search, $options: 'i' } },
        { phone: { $regex: params.search, $options: 'i' } },
      ];
    }

    const page = parseInt(params.page) || 1;
    const limit = parseInt(params.limit) || 20;
    const skip = (page - 1) * limit;

    const [leads, total] = await Promise.all([
      Lead.find(filter)
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name')
        .sort({ score: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Lead.countDocuments(filter),
    ]);

    return NextResponse.json({
      leads,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('GET /api/leads error:', error);
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }
}

export async function POST(request) {
  const { error, session } = await requireAuth(request);
  if (error) return error;

  const rateLimitError = rateLimit(session.user.id, session.user.role);
  if (rateLimitError) return rateLimitError;

  try {
    const body = await request.json();

    const validationError = validateLead(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    await dbConnect();

    const lead = await Lead.create({
      ...body,
      createdBy: session.user.id,
    });

    await lead.populate('createdBy', 'name email');

    // Log activity
    await logActivity(
      lead._id,
      session.user.id,
      'LEAD_CREATED',
      `Lead created for ${lead.name} with ${lead.priority} priority`,
      { budget: lead.budget, priority: lead.priority }
    );

    // Real-time notification
    emitToAll(SOCKET_EVENTS.LEAD_CREATED, {
      lead: lead.toObject(),
      message: `New ${lead.priority} priority lead: ${lead.name}`,
    });

    // Send email notification to admin
    try {
      const admins = await User.find({ role: 'admin' }).select('email');
      for (const admin of admins) {
        await sendNewLeadEmail(lead, admin.email);
      }
    } catch (emailError) {
      console.error('Email notification failed:', emailError);
    }

    return NextResponse.json({ lead }, { status: 201 });
  } catch (error) {
    console.error('POST /api/leads error:', error);
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
  }
}
