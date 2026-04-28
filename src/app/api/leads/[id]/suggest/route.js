import { NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import dbConnect from '@/lib/db';
import Lead from '@/models/Lead';
import Activity from '@/models/Activity';

export async function POST(request, { params }) {
  const { error, session } = await requireAuth(request);
  if (error) return error;

  try {
    await dbConnect();

    const lead = await Lead.findById(params.id)
      .populate('assignedTo', 'name')
      .lean();

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const activities = await Activity.find({ lead: params.id })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Build context for AI
    const budgetInM = (lead.budget / 1000000).toFixed(1);
    const daysSinceCreated = Math.floor(
      (Date.now() - new Date(lead.createdAt)) / (1000 * 60 * 60 * 24)
    );
    const lastActivity = activities[0];
    const daysSinceLastActivity = lastActivity
      ? Math.floor(
          (Date.now() - new Date(lastActivity.createdAt)) / (1000 * 60 * 60 * 24)
        )
      : daysSinceCreated;

    // Use OpenAI if key exists, otherwise use rule-based fallback
    if (process.env.OPENAI_API_KEY) {
      const prompt = `You are a CRM assistant for a Pakistani property dealer. Analyze this lead and suggest follow-up actions.

Lead Details:
- Name: ${lead.name}
- Property Interest: ${lead.propertyInterest}
- Budget: PKR ${budgetInM}M
- Status: ${lead.status}
- Priority: ${lead.priority}
- Source: ${lead.source}
- Days since created: ${daysSinceCreated}
- Days since last activity: ${daysSinceLastActivity}
- Recent activities: ${activities.map((a) => a.description).join(', ') || 'None'}

Provide 3 specific, actionable follow-up suggestions for this lead. Be concise and practical. Format as a JSON array of strings.`;

      const response = await fetch('https://api.x.ai/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
  },
  body: JSON.stringify({
    model: 'grok-3-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 400,
          temperature: 0.7,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.choices[0]?.message?.content || '';
        try {
          const clean = text.replace(/```json|```/g, '').trim();
          const suggestions = JSON.parse(clean);
          return NextResponse.json({ suggestions, source: 'ai' });
        } catch {
          // Fall through to rule-based
        }
      }
    }

    // Rule-based fallback suggestions
    const suggestions = [];

    if (lead.status === 'New') {
      suggestions.push(`Call ${lead.name} to introduce yourself and understand their requirements in detail`);
      suggestions.push(`Send a WhatsApp message with your property portfolio matching their budget of PKR ${budgetInM}M`);
    }

    if (lead.priority === 'High' && daysSinceLastActivity > 2) {
      suggestions.push(`This is a HIGH priority lead (PKR ${budgetInM}M budget) — schedule an in-person meeting immediately`);
    }

    if (lead.status === 'Contacted' && daysSinceLastActivity > 5) {
      suggestions.push(`Follow up with ${lead.name} — it has been ${daysSinceLastActivity} days since last contact`);
    }

    if (lead.propertyInterest === 'Commercial') {
      suggestions.push('Share commercial property ROI analysis and rental yield calculations to build investor interest');
    }

    if (suggestions.length < 3) {
      suggestions.push(`Schedule a property site visit for ${lead.name} to convert from ${lead.status} to Negotiation stage`);
    }

    return NextResponse.json({ suggestions: suggestions.slice(0, 3), source: 'rules' });
  } catch (error) {
    console.error('AI suggestion error:', error);
    return NextResponse.json({ error: 'Failed to generate suggestions' }, { status: 500 });
  }
}
