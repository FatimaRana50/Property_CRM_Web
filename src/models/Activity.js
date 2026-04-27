import mongoose from 'mongoose';

const ActivitySchema = new mongoose.Schema(
  {
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
      index: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'LEAD_CREATED',
        'STATUS_UPDATED',
        'LEAD_ASSIGNED',
        'LEAD_REASSIGNED',
        'NOTES_UPDATED',
        'FOLLOW_UP_SET',
        'PRIORITY_CHANGED',
        'LEAD_DELETED',
        'LEAD_UPDATED',
      ],
    },
    description: {
      type: String,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Activity || mongoose.model('Activity', ActivitySchema);
