import mongoose, { Schema, Document } from 'mongoose';

export interface IStudentProgress extends Document {
    studentId: mongoose.Types.ObjectId;
    storyId: mongoose.Types.ObjectId;
    innovationId: mongoose.Types.ObjectId;
    moduleId: mongoose.Types.ObjectId;
    completionPercentage: number;
    problemsAttempted: number;
    problemsSolved: number;
    timeSpentSeconds: number;
    phaseCompleted: {
        phase1: boolean;
        phase2: boolean;
        phase3: boolean;
    };
    updatedAt: Date;
}

const StudentProgressSchema: Schema = new Schema({
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    storyId: { type: Schema.Types.ObjectId, ref: 'Story', required: true, index: true },
    innovationId: { type: Schema.Types.ObjectId, ref: 'Innovation' },
    moduleId: { type: Schema.Types.ObjectId, ref: 'MathModule' },
    completionPercentage: { type: Number, default: 0 },
    problemsAttempted: { type: Number, default: 0 },
    problemsSolved: { type: Number, default: 0 },
    timeSpentSeconds: { type: Number, default: 0 },
    phaseCompleted: {
        phase1: { type: Boolean, default: false },
        phase2: { type: Boolean, default: false },
        phase3: { type: Boolean, default: false },
    },
}, { timestamps: true });

export default mongoose.model<IStudentProgress>('StudentProgress', StudentProgressSchema);
