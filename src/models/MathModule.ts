import mongoose, { Schema, Document } from 'mongoose';

export interface IMathModule extends Document {
    innovationId: mongoose.Types.ObjectId;
    title: string;
    ubuntuFormula: string;
    difficultyLevel: 'easy' | 'medium' | 'hard';
    problemSet: {
        question: string;
        correctAnswer: number;
        explanation: string;
    }[];
    badgeReward: string;
    estimatedDuration: number;
    createdAt: Date;
}

const MathModuleSchema: Schema = new Schema({
    innovationId: { type: Schema.Types.ObjectId, ref: 'Innovation' },
    title: { type: String, required: true },
    ubuntuFormula: { type: String },
    difficultyLevel: { type: String, enum: ['easy', 'medium', 'hard'] },
    problemSet: [{
        question: String,
        correctAnswer: Number,
        explanation: String
    }],
    badgeReward: { type: String },
    estimatedDuration: { type: Number },
}, { timestamps: true });

export default mongoose.model<IMathModule>('MathModule', MathModuleSchema);
