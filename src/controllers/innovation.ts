import { Request, Response } from 'express';
import Innovation from '../models/Innovation';
import Story from '../models/Story';

export const getInnovationById = async (req: Request, res: Response) => {
    try {
        const innovation = await Innovation.findById(req.params.id);
        if (!innovation) {
            return res.status(404).json({ message: 'Innovation not found' });
        }
        res.status(200).json(innovation);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getInnovationByStory = async (req: Request, res: Response) => {
    try {
        const innovation = await Innovation.findOne({ storyId: req.params.storyId });
        if (!innovation) {
            return res.status(404).json({ message: 'Innovation not found for this story' });
        }
        res.status(200).json(innovation);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
