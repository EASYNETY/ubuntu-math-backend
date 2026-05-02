import mongoose, { Schema, Document } from 'mongoose';

export interface ICommunityPost extends Document {
  channel: string;
  userId: mongoose.Types.ObjectId;
  userName: string;
  userRole: string;
  content: string;
  parentId?: mongoose.Types.ObjectId;
  pinned: boolean;
  deleted: boolean;
  likes: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const CommunityPostSchema: Schema = new Schema({
  channel: { type: String, required: true, index: true, default: 'general' },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  userRole: { type: String, default: 'student' },
  content: { type: String, required: true },
  parentId: { type: Schema.Types.ObjectId, ref: 'CommunityPost', default: null },
  pinned: { type: Boolean, default: false },
  deleted: { type: Boolean, default: false },
  likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

export default mongoose.model<ICommunityPost>('CommunityPost', CommunityPostSchema);
