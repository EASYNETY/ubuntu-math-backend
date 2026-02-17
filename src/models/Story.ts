import mongoose, { Schema, Document } from 'mongoose';

export interface IStory extends Document {
    slug: string;
    title: string;
    description: string;
    videoUrl: string;
    thumbnailUrl: string;
    location: string;
    region: string;
    innovators: string[];
    innovationId: mongoose.Types.ObjectId;
    moduleId: mongoose.Types.ObjectId;
    estimatedReadTime: number;
    createdAt: Date;
    updatedAt: Date;
}

const StorySchema: Schema = new Schema({
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String },
    videoUrl: { type: String },
    thumbnailUrl: { type: String },
    location: { type: String },
    region: { type: String, default: 'West Africa' },
    innovators: [{ type: String }],
    innovationId: { type: Schema.Types.ObjectId, ref: 'Innovation' },
    moduleId: { type: Schema.Types.ObjectId, ref: 'MathModule' },
    estimatedReadTime: { type: Number },
}, { timestamps: true });

export default mongoose.model<IStory>('Story', StorySchema);
