import mongoose from 'mongoose';

const analyticsEventSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    eventType: {
        type: String,
        required: true,
        enum: [
            'page_view',
            'video_watch',
            'video_watch_complete',
            'start_journey',
            'explore_logic',
            'module_start',
            'module_complete',
            'badge_earned',
            'simulation_run'
        ]
    },
    eventData: { type: mongoose.Schema.Types.Mixed, default: {} },
    path: { type: String },
    timestamp: { type: Date, default: Date.now }
});

export default mongoose.model('AnalyticsEvent', analyticsEventSchema);
