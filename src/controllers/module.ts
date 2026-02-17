import { Request, Response } from 'express';
import mongoose from 'mongoose';
import MathModule from '../models/MathModule';

export const getModuleById = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid module ID format' });
        }

        const module = await MathModule.findById(id);
        if (!module) {
            return res.status(404).json({ message: 'Module not found' });
        }
        res.status(200).json(module);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getModuleByInnovation = async (req: Request, res: Response) => {
    try {
        const module = await MathModule.findOne({ innovationId: req.params.innovationId });
        if (!module) {
            return res.status(404).json({ message: 'Module not found for this innovation' });
        }
        res.status(200).json(module);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
export const getModules = async (req: Request, res: Response) => {
    try {
        const modules = await MathModule.find();
        res.status(200).json(modules);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const createModule = async (req: Request, res: Response) => {
    try {
        const module = new MathModule(req.body);
        await module.save();
        res.status(201).json(module);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const updateModule = async (req: Request, res: Response) => {
    try {
        const module = await MathModule.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json(module);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteModule = async (req: Request, res: Response) => {
    try {
        await MathModule.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Module deleted successfully' });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};
