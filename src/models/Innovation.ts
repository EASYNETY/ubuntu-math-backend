import mongoose, { Schema, Document } from 'mongoose';

export interface IInnovation extends Document {
    storyId: mongoose.Types.ObjectId;
    name: string;
    technicalSpecs: any;
    ubuntuValueFormula: string;
    cakeChainModel: {
        nodes: any[];
        edges: any[];
    };
    impactMetrics: any;
    createdAt: Date;
}

const InnovationSchema: Schema = new Schema({
    storyId: { type: Schema.Types.ObjectId, ref: 'Story' },
    name: { type: String, required: true },
    technicalSpecs: { type: Schema.Types.Mixed },
    ubuntuValueFormula: { type: String },
    cakeChainModel: {
        nodes: [{ type: Schema.Types.Mixed }],
        edges: [{ type: Schema.Types.Mixed }]
    },
    impactMetrics: { type: Schema.Types.Mixed },
}, { timestamps: true });

export default mongoose.model<IInnovation>('Innovation', InnovationSchema);
