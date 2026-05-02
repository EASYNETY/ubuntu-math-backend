import mongoose, { Schema, Document } from 'mongoose';

export interface IProcessStep {
  order: number;
  title: string;
  description: string;
  duration?: string;
  equipment?: string[];
  notes?: string;
}

export interface IIndustrialProcess extends Document {
  title: string;
  slug: string;
  category: string;
  description: string;
  inputs: { name: string; quantity: string; unit: string }[];
  steps: IProcessStep[];
  equipment: string[];
  scalingInstructions: string;
  expectedOutput: string;
  safetyNotes: string;
  previewContent: string;
  fullFileUrl?: string;
  coverUrl: string;
  price: number;
  tags: string[];
  published: boolean;
  version: string;
  downloadCount: number;
  purchaseCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProcessStepSchema = new Schema({
  order: Number,
  title: String,
  description: String,
  duration: String,
  equipment: [String],
  notes: String,
});

const IndustrialProcessSchema: Schema = new Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  category: { type: String, default: 'Food Processing' },
  description: { type: String, required: true },
  inputs: [{ name: String, quantity: String, unit: String }],
  steps: [ProcessStepSchema],
  equipment: [{ type: String }],
  scalingInstructions: { type: String, default: '' },
  expectedOutput: { type: String, default: '' },
  safetyNotes: { type: String, default: '' },
  previewContent: { type: String, default: '' },
  fullFileUrl: { type: String },
  coverUrl: { type: String, default: '' },
  price: { type: Number, default: 49.99 },
  tags: [{ type: String }],
  published: { type: Boolean, default: false },
  version: { type: String, default: '1.0' },
  downloadCount: { type: Number, default: 0 },
  purchaseCount: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model<IIndustrialProcess>('IndustrialProcess', IndustrialProcessSchema);
