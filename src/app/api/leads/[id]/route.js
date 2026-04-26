import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Lead from '@/models/Lead';
import User from '@/models/User';
import { requireAuth } from '@/middleware/auth';
import { rateLimit } from '@/middleware/rateLimit';
import { logActivity } from '@/lib/activityLogger';
import { sendLeadAssignmentEmail } from '@/lib/email';
import { emitToAll, emitToRoom, SOCKET_EVENTS, ROOMS } from '@/lib/socket';

export async function GET(request, { params }) {
  const { error, session } = await requireAuth(request);
  if (error) return error;

  try {
    await dbConnect();

    const lead = await Lead.findById(params.id)
      .populate('assignedTo', 'name email phone')
      .populate('createdBy', 'name email');

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Agents can only view their assigned leads
    if (
      session.user.role === 'agent' &&
      lead.assignedTo?._id?.toString() !== session.user.id
    ) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ lead });
  } catch (error) {
    console.error('GET /api/leads/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch lead' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const { error, session } = await requireAuth(request);
  if (error) return error;

  const rateLimitError = rateLimit(session.user.id, session.user.role);
  if (rateLimitError) return rateLimitError;

  try {
    const body = await request.json();
    let updatePayload = body;
    await dbConnect();

    const existingLead = await Lead.findById(params.id);
    if (!existingLead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Agents can only update their assigned leads (status, notes, followUpDate)
    if (session.user.role === 'agent') {
      if (existingLead.assignedTo?.toString() !== session.user.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
      // Agents can only update limited fields
      const { status, notes, followUpDate } = body;
      const updates = {};
      if (status) updates.status = status;
      if (notes !== undefined) updates.notes = notes;
      if (followUpDate !== undefined) updates.followUpDate = followUpDate;
      updatePayload = updates;
    }

    const previousStatus = existingLead.status;
    const previousAssignedTo = existingLead.assignedTo?.toString();

    // If assigning to agent (admin only)
    if (updatePayload.assignedTo && session.user.role === 'admin') {
      const agent = await User.findById(updatePayload.assignedTo);
      if (!agent) {
        return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
      }

      // Log assignment activity
      const isReassignment = !!previousAssignedTo;
      await logActivity(
        params.id,
        session.user.id,
        isReassignment ? 'LEAD_REASSIGNED' : 'LEAD_ASSIGNED',
        isReassignment
          ? `Lead reassigned to ${agent.name}`
          : `Lead assigned to ${agent.name}`,
        { agentId: updatePayload.assignedTo, agentName: agent.name }
      );

      // Send assignment email
      try {
        const updatedLeadForEmail = { ...existingLead.toObject(), ...updatePayload };
        await sendLeadAssignmentEmail(updatedLeadForEmail, agent);
      } catch (emailError) {
        console.error('Assignment email failed:', emailError);
      }
    }

    // Track status changes
    if (updatePayload.status && updatePayload.status !== previousStatus) {
      await logActivity(
        params.id,
        session.user.id,
        'STATUS_UPDATED',
        `Status changed from ${previousStatus} to ${updatePayload.status}`,
        { from: previousStatus, to: updatePayload.status }
      );
    }

    // Track notes updates
    if (updatePayload.notes && updatePayload.notes !== existingLead.notes) {
      await logActivity(
        params.id,
        session.user.id,
        'NOTES_UPDATED',
        'Notes updated',
        {}
      );
    }

    // Track follow-up date
    if (updatePayload.followUpDate !== undefined) {
      await logActivity(
        params.id,
        session.user.id,
        'FOLLOW_UP_SET',
        `Follow-up date set to ${updatePayload.followUpDate ? new Date(updatePayload.followUpDate).toLocaleDateString() : 'cleared'}`,
        { followUpDate: updatePayload.followUpDate }
      );
    }

    updatePayload.lastActivityAt = new Date();

    const updatedLead = await Lead.findByIdAndUpdate(
      params.id,
      { $set: updatePayload },
      { new: true, runValidators: true }
    )
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name');

    // Real-time notification
    emitToAll(SOCKET_EVENTS.LEAD_UPDATED, {
      lead: updatedLead.toObject(),
      updatedBy: session.user.id,
    });

    if (updatePayload.assignedTo) {
      emitToRoom(ROOMS.agent(updatePayload.assignedTo), SOCKET_EVENTS.LEAD_ASSIGNED, {
        lead: updatedLead.toObject(),
        message: `New lead assigned: ${updatedLead.name}`,
      });
    }

    return NextResponse.json({ lead: updatedLead });
  } catch (error) {
    console.error('PUT /api/leads/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { error, session } = await requireAuth(request);
  if (error) return error;

  // Only admins can delete
  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    await dbConnect();

    const lead = await Lead.findByIdAndDelete(params.id);
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    await logActivity(
      params.id,
      session.user.id,
      'LEAD_DELETED',
      `Lead ${lead.name} deleted`,
      {}
    );

    emitToAll(SOCKET_EVENTS.LEAD_DELETED, { leadId: params.id });

    return NextResponse.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/leads/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 });
  }
}
