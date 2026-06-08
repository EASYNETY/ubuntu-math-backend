import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  // Identifiers
  paymentId: string;
  userId: mongoose.Types.ObjectId;
  
  // Item Details
  itemType: 'course' | 'book' | 'subscription';
  itemId: string;
  itemName: string;
  
  // Payment Details
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  
  // EvriPay Details
  evripayReference: string;
  evripayPaymentId?: string;
  
  // Enrollment
  enrollmentGranted: boolean;
  enrolledAt?: Date;
  
  // Timestamps
  createdAt: Date;
  completedAt?: Date;
  updatedAt: Date;
  expiresAt?: Date;
  
  // Admin Actions
  failureReason?: string;
  failedBy?: mongoose.Types.ObjectId;
  refundReason?: string;
  refundedBy?: mongoose.Types.ObjectId;
  refundedAt?: Date;
  manualReview: boolean;
}

const PaymentSchema: Schema = new Schema({
  paymentId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  itemType: {
    type: String,
    enum: ['course', 'book', 'subscription'],
    required: true
  },
  itemId: {
    type: String,
    required: true
  },
  itemName: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
    set: (val: number) => Math.round(val * 100) / 100
  },
  currency: {
    type: String,
    default: 'ZAR',
    enum: ['ZAR']
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'pending',
    index: true
  },
  evripayReference: {
    type: String,
    required: true
  },
  evripayPaymentId: String,
  enrollmentGranted: {
    type: Boolean,
    default: false
  },
  enrolledAt: Date,
  completedAt: Date,
  expiresAt: Date,
  failureReason: String,
  failedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  refundReason: String,
  refundedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  refundedAt: Date,
  manualReview: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
PaymentSchema.index({ userId: 1, createdAt: -1 });
PaymentSchema.index({ status: 1, createdAt: -1 });
PaymentSchema.index({ itemType: 1, status: 1 });

// Set expiration date to 48 hours from creation
PaymentSchema.pre('save', function() {
  if (this.isNew && !this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
  }
});

export default mongoose.model<IPayment>('Payment', PaymentSchema);
