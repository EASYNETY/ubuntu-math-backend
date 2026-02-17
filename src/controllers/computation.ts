import { Request, Response } from 'express';
import { runUbuntuComparison } from '../lib/ubuntu';

export const calculateUbuntu = (req: Request, res: Response) => {
    try {
        const { resourcesCaptured, communitySize, innovationType, innovations, operatingCosts, durationYears, initialGrowthRate } = req.body;
        const result = runUbuntuComparison({
            resourcesCaptured,
            communitySize,
            innovationType,
            innovations,
            operatingCosts,
            durationYears,
            initialGrowthRate
        });
        res.status(200).json(result);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
}
