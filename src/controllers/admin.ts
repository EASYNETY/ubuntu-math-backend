import { Request, Response } from 'express';
import mongoose from 'mongoose';
import AnalyticsEvent from '../models/AnalyticsEvent';
import User from '../models/User';
import StudentProgress from '../models/StudentProgress';

export const trackEvent = async (req: Request, res: Response) => {
    try {
        const { eventType, eventData, path, userId } = req.body;

        // Simple validation to prevent Mongoose crash on invalid ID
        const validUserId = userId && mongoose.Types.ObjectId.isValid(userId) ? userId : null;

        const event = new AnalyticsEvent({
            userId: validUserId,
            eventType,
            eventData: eventData || {},
            path,
            timestamp: new Date()
        });

        await event.save();
        res.status(201).json({ success: true });
    } catch (error) {
        console.error('Analytics track error full:', error);
        res.status(500).json({ error: 'Failed to track event', details: error instanceof Error ? error.message : String(error) });
    }
};

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        // Basic counts
        const totalUsers = await User.countDocuments();
        const totalBadges = await User.aggregate([
            { $project: { badgeCount: { $size: { $ifNull: ["$badges", []] } } } },
            { $group: { _id: null, total: { $sum: "$badgeCount" } } }
        ]);

        // Conversion Rates (e.g., Story to Module)
        const storyViews = await AnalyticsEvent.countDocuments({ eventType: 'page_view', path: { $regex: /^\/story\// } });
        const moduleStarts = await AnalyticsEvent.countDocuments({ eventType: 'module_start' });
        const moduleCompletes = await AnalyticsEvent.countDocuments({ eventType: 'module_complete' });

        // Engagement Metrics
        const avgTimeSpent = await StudentProgress.aggregate([
            { $group: { _id: null, avgTime: { $avg: "$timeSpentSeconds" } } }
        ]);

        res.json({
            stats: {
                totalUsers,
                totalBadges: totalBadges[0]?.total || 0,
                conversionRate: storyViews > 0 ? (moduleStarts / storyViews * 100).toFixed(1) : 0,
                completionRate: moduleStarts > 0 ? (moduleCompletes / moduleStarts * 100).toFixed(1) : 0,
                avgTimeMinutes: avgTimeSpent[0]?.avgTime ? (avgTimeSpent[0].avgTime / 60).toFixed(1) : 0
            },
            recentEvents: await AnalyticsEvent.find().sort({ timestamp: -1 }).limit(10).populate('userId', 'name email')
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
};

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

export const updateUserRole = async (req: Request, res: Response) => {
    try {
        const { role } = req.body;
        const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update role' });
    }
};
