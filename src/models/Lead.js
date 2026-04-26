import mongoose from 'mongoose';

const LeadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Client name is required'],
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    propertyInterest: {
      type: String,
      required: [true, 'Property interest is required'],
      enum: ['Residential', 'Commercial', 'Plot', 'Apartment', 'Villa', 'Other'],
    },
    budget: {
      type: Number,
      required: [true, 'Budget is required'],
      min: [0, 'Budget cannot be negative'],
    },
    status: {
      type: String,
      enum: ['New', 'Contacted', 'In Progress', 'Negotiation', 'Closed', 'Lost'],
      default: 'New',
    },
    priority: {
      type: String,
      enum: ['High', 'Medium', 'Low'],
      default: 'Low',
    },
    score: {
      type: Number,
      default: 0,
    },
    source: {
      type: String,
      enum: ['Facebook Ads', 'Walk-in', 'Website', 'Referral', 'Other'],
      default: 'Other',
    },
    notes: {
      type: String,
      maxlength: [2000, 'Notes cannot exceed 2000 characters'],
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    followUpDate: {
      type: Date,
      default: null,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-scoring middleware before save
LeadSchema.pre('save', function (next) {
  // Score based on budget (in PKR millions)
  const budgetInMillions = this.budget / 1000000;

  if (budgetInMillions > 20) {
    this.priority = 'High';
    this.score = 100;
  } else if (budgetInMillions >= 10) {
    this.priority = 'Medium';
    this.score = 60;
  } else {
    this.priority = 'Low';
    this.score = 20;
  }

  next();
});

// Index for faster queries
LeadSchema.index({ assignedTo: 1, status: 1 });
LeadSchema.index({ priority: 1, createdAt: -1 });

export default mongoose.models.Lead || mongoose.model('Lead', LeadSchema);
