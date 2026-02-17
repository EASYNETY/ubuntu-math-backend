import { Request, Response } from 'express';
import StudentProgress from '../models/StudentProgress';
import User from '../models/User';

export const updateProgress = async (req: Request, res: Response) => {
    try {
        const { userId, storyId, innovationId, moduleId, completionPercentage, problemsAttempted, problemsSolved, timeSpentSeconds } = req.body;

        if (!userId || !storyId) {
            return res.status(400).json({ message: "Missing required fields: userId or storyId" });
        }

        // Use storyId and studentId as base key. If moduleId exists, include it.
        const query: any = { studentId: userId, storyId };
        if (moduleId) query.moduleId = moduleId;

        const progress = await StudentProgress.findOneAndUpdate(
            query,
            {
                studentId: userId,
                storyId,
                innovationId,
                moduleId,
                completionPercentage,
                problemsAttempted,
                problemsSolved,
                timeSpentSeconds,
                updatedAt: new Date()
            },
            { upsert: true, new: true }
        );

        res.status(200).json(progress);
    } catch (error: any) {
        console.error('Update progress error:', error);
        res.status(500).json({ message: error.message });
    }
};

export const completeModule = async (req: Request, res: Response) => {
    try {
        const { userId, moduleId, problemsSolved, problemsAttempted, timeSpentSeconds, badge } = req.body;

        const completionPercentage = (problemsSolved / problemsAttempted) * 100;

        // Update progress
        await StudentProgress.findOneAndUpdate(
            { studentId: userId, moduleId },
            {
                completionPercentage,
                problemsAttempted,
                problemsSolved,
                timeSpentSeconds,
                'phaseCompleted.phase3': completionPercentage >= 80,
                updatedAt: new Date()
            },
            { upsert: true }
        );

        // Award badge if completion >= 80%
        if (completionPercentage >= 80 && badge) {
            await User.findByIdAndUpdate(
                userId,
                { $addToSet: { badges: badge } }
            );
        }

        res.status(200).json({ success: true, badgeAwarded: completionPercentage >= 80 });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getProgress = async (req: Request, res: Response) => {
    try {
        const progress = await StudentProgress.find({ studentId: req.params.userId });
        res.status(200).json(progress);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
