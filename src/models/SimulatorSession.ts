import mongoose, { Schema, Document } from 'mongoose';

export interface ISimulatorSession extends Document {
    studentId: mongoose.Types.ObjectId;
    resourcesCaptured: number;
    communitySize: number;
    innovationType: string;
    modelType: 'ubuntu' | 'traditional';
    socialDividend: number;
    strategicReserves: number;
    communalValueScore: number;
    createdAt: Date;
}

const SimulatorSessionSchema: Schema = new Schema({
    studentId: { type: Schema.Types.ObjectId, ref: 'User' },
    resourcesCaptured: Number,
    communitySize: Number,
    innovationType: String,
    modelType: { type: String, enum: ['ubuntu', 'traditional'] },
    socialDividend: Number,
    strategicReserves: Number,
    communalValueScore: Number,
}, { timestamps: true });

export default mongoose.model<ISimulatorSession>('SimulatorSession', SimulatorSessionSchema);
