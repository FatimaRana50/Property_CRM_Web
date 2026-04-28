import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Lead from '@/models/Lead';
import User from '@/models/User';
import { requireAdmin } from '@/middleware/auth';

export async function GET(request) {
  const { error, session } = await requireAdmin(request);
  if (error) return error;

  try {
    await dbConnect();

    const [
      totalLeads,
      statusDistribution,
      priorityDistribution,
      agentPerformance,
      recentLeads,
      overdueFollowUps,
    ] = await Promise.all([
      // Total leads count
      Lead.countDocuments(),

      // Status distribution
      Lead.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Priority distribution
      Lead.aggregate([
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),

      // Agent performance
      Lead.aggregate([
        { $match: { assignedTo: { $ne: null } } },
        {
          $group: {
            _id: '$assignedTo',
            totalLeads: { $sum: 1 },
            closedLeads: {
              $sum: { $cond: [{ $eq: ['$status', 'Closed'] }, 1, 0] },
            },
            highPriorityLeads: {
              $sum: { $cond: [{ $eq: ['$priority', 'High'] }, 1, 0] },
            },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'agent',
          },
        },
        { $unwind: '$agent' },
        {
          $project: {
            agentName: '$agent.name',
            agentEmail: '$agent.email',
            totalLeads: 1,
            closedLeads: 1,
            highPriorityLeads: 1,
            conversionRate: {
              $round: [
                { $multiply: [{ $divide: ['$closedLeads', '$totalLeads'] }, 100] },
                1,
              ],
            },
          },
        },
        { $sort: { totalLeads: -1 } },
      ]),

      // Recent leads (last 7 days)
      Lead.find({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      })
        .select('name priority status createdAt')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),

      // Overdue follow-ups
      Lead.countDocuments({
        followUpDate: { $lt: new Date() },
        status: { $nin: ['Closed', 'Lost'] },
      }),
    ]);

    // Format status distribution
    const statusData = statusDistribution.map((s) => ({
      name: s._id,
      value: s.count,
    }));

    // Format priority distribution
    const priorityData = priorityDistribution.map((p) => ({
      name: p._id,
      value: p.count,
    }));

    // Leads per day (last 7 days)
    const leadsPerDay = await Lead.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return NextResponse.json({
      overview: {
        totalLeads,
        overdueFollowUps,
        highPriorityLeads: priorityData.find((p) => p.name === 'High')?.value || 0,
        closedLeads: statusData.find((s) => s.name === 'Closed')?.value || 0,
      },
      statusDistribution: statusData,
      priorityDistribution: priorityData,
      agentPerformance,
      recentLeads,
      leadsPerDay,
    });
  } catch (error) {
    console.error('GET /api/analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
