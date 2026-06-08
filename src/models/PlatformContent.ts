/**
 * PlatformContent — single Mongoose model that stores ALL new content types
 * (books, essays, processes, community posts, book purchases) inside the
 * EXISTING `analyticsevents` collection.
 *
 * No new collection is created. Documents are distinguished by `contentType`.
 * All controllers import typed query helpers from this file.
 */
import mongoose, { Schema, Document, Model } from 'mongoose';

// ── Shared document interface ─────────────────────────────────────────────────
export interface IPlatformContent extends Document {
  contentType: string;
  // Book fields
  title?: string;
  slug?: string;
  author?: string;
  description?: string;
  abstract?: string;
  coverUrl?: string;
  sampleChapterUrl?: string;
  fullFileUrl?: string;
  fileUrl?: string;
  fileType?: string;
  price?: number;
  purchasable?: boolean;
  bundleEligible?: boolean;
  category?: string;
  tags?: string[];
  seriesNumber?: number;
  published?: boolean;
  featured?: boolean;
  downloadCount?: number;
  purchaseCount?: number;
  viewCount?: number;
  academiaUrl?: string;
  // Process fields
  inputs?: any[];
  steps?: any[];
  equipment?: string[];
  scalingInstructions?: string;
  expectedOutput?: string;
  safetyNotes?: string;
  previewContent?: string;
  version?: string;
  // Community fields
  channel?: string;
  userId?: mongoose.Types.ObjectId;
  userName?: string;
  userRole?: string;
  content?: string;
  parentId?: mongoose.Types.ObjectId | null;
  pinned?: boolean;
  deleted?: boolean;
  likes?: mongoose.Types.ObjectId[];
  // Purchase fields
  bookId?: mongoose.Types.ObjectId;
  bundlePurchase?: boolean;
  amountPaid?: number;
  currency?: string;
  paymentGateway?: string;
  paymentReference?: string;
  status?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PlatformContentSchema = new Schema<IPlatformContent>(
  {
    contentType: { type: String, required: true, index: true },
    // Book / Essay / Process shared
    title: String,
    slug: { type: String, index: true, sparse: true },
    author: String,
    description: String,
    abstract: String,
    coverUrl: String,
    sampleChapterUrl: String,
    fullFileUrl: String,
    fileUrl: String,
    fileType: String,
    price: { type: Number, default: 0, min: 0 },
    purchasable: { type: Boolean, default: false },
    bundleEligible: Boolean,
    category: String,
    tags: [String],
    seriesNumber: Number,
    published: Boolean,
    featured: Boolean,
    downloadCount: { type: Number, default: 0 },
    purchaseCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    academiaUrl: String,
    // Process
    inputs: [{ name: String, quantity: String, unit: String }],
    steps: [{ order: Number, title: String, description: String, duration: String, equipment: [String], notes: String }],
    equipment: [String],
    scalingInstructions: String,
    expectedOutput: String,
    safetyNotes: String,
    previewContent: String,
    version: String,
    // Community
    channel: { type: String, index: true, sparse: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true, sparse: true },
    userName: String,
    userRole: String,
    content: String,
    parentId: { type: Schema.Types.ObjectId, default: null },
    pinned: { type: Boolean, default: false },
    deleted: { type: Boolean, default: false },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    // Purchase
    bookId: { type: Schema.Types.ObjectId, sparse: true },
    bundlePurchase: Boolean,
    amountPaid: Number,
    currency: String,
    paymentGateway: String,
    paymentReference: String,
    status: String,
  },
  {
    timestamps: true,
    // ⚠️ Reuse existing collection — no new collection created
    collection: 'analyticsevents',
    strict: false,
  }
);

// Single model — all content types share it
const PlatformContent = mongoose.model<IPlatformContent>('PlatformContent', PlatformContentSchema);

// ── Typed query helpers (act like separate models) ────────────────────────────

export const Book = {
  find: (q: object = {}) => PlatformContent.find({ ...q, contentType: 'book' }),
  findOne: (q: object) => PlatformContent.findOne({ ...q, contentType: 'book' }),
  findById: (id: any) => PlatformContent.findOne({ _id: id, contentType: 'book' }),
  findByIdAndUpdate: (id: any, update: object, opts?: object) =>
    PlatformContent.findOneAndUpdate({ _id: id, contentType: 'book' }, update, opts),
  findByIdAndDelete: (id: any) => PlatformContent.findOneAndDelete({ _id: id, contentType: 'book' }),
  create: (data: object) => PlatformContent.create({ ...data, contentType: 'book' }),
  countDocuments: (q: object = {}) => PlatformContent.countDocuments({ ...q, contentType: 'book' }),
};

export const BookPurchase = {
  find: (q: object = {}) => PlatformContent.find({ ...q, contentType: 'bookpurchase' }),
  findOne: (q: object) => PlatformContent.findOne({ ...q, contentType: 'bookpurchase' }),
  findById: (id: any) => PlatformContent.findOne({ _id: id, contentType: 'bookpurchase' }),
  create: (data: object) => PlatformContent.create({ ...data, contentType: 'bookpurchase' }),
};

export const Essay = {
  find: (q: object = {}) => PlatformContent.find({ ...q, contentType: 'essay' }),
  findOne: (q: object) => PlatformContent.findOne({ ...q, contentType: 'essay' }),
  findById: (id: any) => PlatformContent.findOne({ _id: id, contentType: 'essay' }),
  findByIdAndUpdate: (id: any, update: object, opts?: object) =>
    PlatformContent.findOneAndUpdate({ _id: id, contentType: 'essay' }, update, opts),
  findByIdAndDelete: (id: any) => PlatformContent.findOneAndDelete({ _id: id, contentType: 'essay' }),
  create: (data: object) => PlatformContent.create({ ...data, contentType: 'essay' }),
};

export const IndustrialProcess = {
  find: (q: object = {}) => PlatformContent.find({ ...q, contentType: 'industrialprocess' }),
  findOne: (q: object) => PlatformContent.findOne({ ...q, contentType: 'industrialprocess' }),
  findById: (id: any) => PlatformContent.findOne({ _id: id, contentType: 'industrialprocess' }),
  findByIdAndUpdate: (id: any, update: object, opts?: object) =>
    PlatformContent.findOneAndUpdate({ _id: id, contentType: 'industrialprocess' }, update, opts),
  findByIdAndDelete: (id: any) => PlatformContent.findOneAndDelete({ _id: id, contentType: 'industrialprocess' }),
  create: (data: object) => PlatformContent.create({ ...data, contentType: 'industrialprocess' }),
};

export const CommunityPost = {
  find: (q: object = {}) => PlatformContent.find({ ...q, contentType: 'communitypost' }),
  findOne: (q: object) => PlatformContent.findOne({ ...q, contentType: 'communitypost' }),
  findById: (id: any) => PlatformContent.findOne({ _id: id, contentType: 'communitypost' }),
  findByIdAndUpdate: (id: any, update: object, opts?: object) =>
    PlatformContent.findOneAndUpdate({ _id: id, contentType: 'communitypost' }, update, opts),
  findByIdAndDelete: (id: any) => PlatformContent.findOneAndDelete({ _id: id, contentType: 'communitypost' }),
  create: (data: object) => PlatformContent.create({ ...data, contentType: 'communitypost' }),
  countDocuments: (q: object = {}) => PlatformContent.countDocuments({ ...q, contentType: 'communitypost' }),
  // For save() support on existing docs — fetch then save
  findByIdAndSave: async (id: any, updateFn: (doc: IPlatformContent) => void) => {
    const doc = await PlatformContent.findOne({ _id: id, contentType: 'communitypost' });
    if (!doc) return null;
    updateFn(doc);
    return doc.save();
  },
};

export default PlatformContent;
