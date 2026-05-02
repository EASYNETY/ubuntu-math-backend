import mongoose, { Schema, Document } from 'mongoose';

export interface IBookPurchase extends Document {
  userId: mongoose.Types.ObjectId;
  bookId?: mongoose.Types.ObjectId;
  bundlePurchase: boolean;
  amountPaid: number;
  currency: string;
  paymentGateway: string;
  paymentReference: string;
  status: 'pending' | 'completed' | 'failed';
  downloadCount: number;
  createdAt: Date;
}

const BookPurchaseSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  bookId: { type: Schema.Types.ObjectId, ref: 'Book' },
  bundlePurchase: { type: Boolean, default: false },
  amountPaid: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  paymentGateway: { type: String, enum: ['paystack', 'stripe', 'manual'], default: 'manual' },
  paymentReference: { type: String },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  downloadCount: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model<IBookPurchase>('BookPurchase', BookPurchaseSchema);
