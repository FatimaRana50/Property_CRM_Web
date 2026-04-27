import Activity from '@/models/Activity';

export async function logActivity(leadId, userId, action, description, metadata = {}) {
  try {
    await Activity.create({
      lead: leadId,
      performedBy: userId,
      action,
      description,
      metadata,
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}
