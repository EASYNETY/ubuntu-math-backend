import { Request, Response } from 'express';
import Story from '../models/Story';

export const getStories = async (req: Request, res: Response) => {
    try {
        const stories = await Story.find();
        res.status(200).json(stories);
    } catch (error: any) {
        res.status(404).json({ message: error.message });
    }
}

export const getStoryBySlug = async (req: Request, res: Response) => {
    const { slug } = req.params;
    try {
        const story = await Story.findOne({ slug });
        res.status(200).json(story);
    } catch (error: any) {
        res.status(404).json({ message: error.message });
    }
}

export const createStory = async (req: Request, res: Response) => {
    try {
        const story = new Story(req.body);
        await story.save();
        res.status(201).json(story);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const updateStory = async (req: Request, res: Response) => {
    try {
        const story = await Story.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(story);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteStory = async (req: Request, res: Response) => {
    try {
        await Story.findByIdAndDelete(req.params.id);
        res.json({ message: 'Story deleted' });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};
