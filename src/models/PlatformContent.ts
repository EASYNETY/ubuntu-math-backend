/**
 * PlatformContent — single shared collection for all new content types.
 *
 * Uses a `contentType` discriminator so Books, Essays, IndustrialProcesses,
 * CommunityPosts, and BookPurchases all live in ONE MongoDB collection
 * (`platformcontents`) instead of 5 separate ones.
 *
 * This is the fix for the Atlas M0 500-collection limit.
 */
import mongoose, { Schema, Document } from 'mongoose';

// ── Base schema ───────────────────────────────────────────────────────────────
export interface IPlatformContent extends Document {
  contentType: string;
  createdAt: Date;
  updatedAt: Date;
}

const PlatformContentSchema = new Schema(
  { contentType: { type: String, required: true, index: true } },
  { timestamps: true, discriminatorKey: 'contentType', collection: 'platformcontents' }
);

export const PlatformContent = mongoose.model<IPlatformContent>(
  'PlatformContent',
  PlatformContentSchema
);

// ── Book discriminator ────────────────────────────────────────────────────────
export interface IBook extends IPlatformContent {
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
}

export const Book = PlatformContent.discriminator<IBook>(
  'book',
  new Schema({
    title: { type: String, required: true },
    slug: { type: String, required: true, index: true },
    author: { type: String, default: 'CAMS Team' },
    description: { type: String, default: '' },
    coverUrl: { type: String, default: '' },
    sampleChapterUrl: String,
    fullFileUrl: String,
    fileType: { type: String, enum: ['pdf', 'epub', 'both'], default: 'pdf' },
    price: { type: Number, default: 39.99 },
    bundleEligible: { type: Boolean, default: true },
    category: { type: String, default: 'Mathematics' },
    tags: [String],
    seriesNumber: Number,
    published: { type: Boolean, default: false },
    downloadCount: { type: Number, default: 0 },
    purchaseCount: { type: Number, default: 0 },
  })
);

// ── BookPurchase discriminator ────────────────────────────────────────────────
export interface IBookPurchase extends IPlatformContent {
  userId: mongoose.Types.ObjectId;
  bookId?: mongoose.Types.ObjectId;
  bundlePurchase: boolean;
  amountPaid: number;
  currency: string;
  paymentGateway: string;
  paymentReference: string;
  status: 'pending' | 'completed' | 'failed';
  downloadCount: number;
}

export const BookPurchase = PlatformContent.discriminator<IBookPurchase>(
  'bookpurchase',
  new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    bookId: { type: Schema.Types.ObjectId },
    bundlePurchase: { type: Boolean, default: false },
    amountPaid: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    paymentGateway: { type: String, enum: ['paystack', 'stripe', 'manual'], default: 'manual' },
    paymentReference: String,
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    downloadCount: { type: Number, default: 0 },
  })
);

// ── Essay discriminator ───────────────────────────────────────────────────────
export interface IEssay extends IPlatformContent {
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
}

export const Essay = PlatformContent.discriminator<IEssay>(
  'essay',
  new Schema({
    title: { type: String, required: true },
    slug: { type: String, required: true, index: true },
    author: { type: String, required: true },
    abstract: { type: String, default: '' },
    fileUrl: { type: String, default: '' },
    category: { type: String, default: 'General' },
    tags: [String],
    published: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },
    viewCount: { type: Number, default: 0 },
    downloadCount: { type: Number, default: 0 },
    academiaUrl: String,
  })
);

// ── IndustrialProcess discriminator ──────────────────────────────────────────
const ProcessStepSchema = new Schema({
  order: Number,
  title: String,
  description: String,
  duration: String,
  equipment: [String],
  notes: String,
});

export interface IIndustrialProcess extends IPlatformContent {
  title: string;
  slug: string;
  category: string;
  description: string;
  inputs: { name: string; quantity: string; unit: string }[];
  steps: any[];
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
}

export const IndustrialProcess = PlatformContent.discriminator<IIndustrialProcess>(
  'industrialprocess',
  new Schema({
    title: { type: String, required: true },
    slug: { type: String, required: true, index: true },
    category: { type: String, default: 'Food Processing' },
    description: { type: String, default: '' },
    inputs: [{ name: String, quantity: String, unit: String }],
    steps: [ProcessStepSchema],
    equipment: [String],
    scalingInstructions: { type: String, default: '' },
    expectedOutput: { type: String, default: '' },
    safetyNotes: { type: String, default: '' },
    previewContent: { type: String, default: '' },
    fullFileUrl: String,
    coverUrl: { type: String, default: '' },
    price: { type: Number, default: 49.99 },
    tags: [String],
    published: { type: Boolean, default: false },
    version: { type: String, default: '1.0' },
    downloadCount: { type: Number, default: 0 },
    purchaseCount: { type: Number, default: 0 },
  })
);

// ── CommunityPost discriminator ───────────────────────────────────────────────
export interface ICommunityPost extends IPlatformContent {
  channel: string;
  userId: mongoose.Types.ObjectId;
  userName: string;
  userRole: string;
  content: string;
  parentId?: mongoose.Types.ObjectId;
  pinned: boolean;
  deleted: boolean;
  likes: mongoose.Types.ObjectId[];
}

export const CommunityPost = PlatformContent.discriminator<ICommunityPost>(
  'communitypost',
  new Schema({
    channel: { type: String, required: true, index: true, default: 'general' },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    userRole: { type: String, default: 'student' },
    content: { type: String, required: true },
    parentId: { type: Schema.Types.ObjectId, default: null },
    pinned: { type: Boolean, default: false },
    deleted: { type: Boolean, default: false },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  })
);
