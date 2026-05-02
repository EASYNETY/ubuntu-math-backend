import mongoose, { Schema, Document } from 'mongoose';

export interface IEssay extends Document {
  title: string;
  slug: string;
  author: string;
  abstract: string;
  fileUrl: string;
  category: string;
  tags: string[];
  published: boolean;
  featured: boolean;
  viewCount: number;
  downloadCount: number;
  academiaUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EssaySchema: Schema = new Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  author: { type: String, required: true },
  abstract: { type: String, required: true },
  fileUrl: { type: String, required: true },
  category: { type: String, default: 'General' },
  tags: [{ type: String }],
  published: { type: Boolean, default: false },
  featured: { type: Boolean, default: false },
  viewCount: { type: Number, default: 0 },
  downloadCount: { type: Number, default: 0 },
  academiaUrl: { type: String },
}, { timestamps: true });

export default mongoose.model<IEssay>('Essay', EssaySchema);
