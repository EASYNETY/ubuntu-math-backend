import mongoose, { Schema, Document } from 'mongoose';

export interface IBook extends Document {
  title: string;
  slug: string;
  author: string;
  description: string;
  coverUrl: string;
  sampleChapterUrl?: string;
  fullFileUrl?: string;
  fileType: 'pdf' | 'epub' | 'both';
  price: number;
  bundleEligible: boolean;
  category: string;
  tags: string[];
  seriesNumber?: number;
  published: boolean;
  downloadCount: number;
  purchaseCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const BookSchema: Schema = new Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  author: { type: String, default: 'CAMS Team' },
  description: { type: String, required: true },
  coverUrl: { type: String, default: '' },
  sampleChapterUrl: { type: String },
  fullFileUrl: { type: String },
  fileType: { type: String, enum: ['pdf', 'epub', 'both'], default: 'pdf' },
  price: { type: Number, default: 39.99 },
  bundleEligible: { type: Boolean, default: true },
  category: { type: String, default: 'Mathematics' },
  tags: [{ type: String }],
  seriesNumber: { type: Number },
  published: { type: Boolean, default: false },
  downloadCount: { type: Number, default: 0 },
  purchaseCount: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model<IBook>('Book', BookSchema);
