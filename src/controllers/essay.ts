import { Request, Response } from 'express';
import { Essay } from '../models/PlatformContent';

export const getEssays = async (req: Request, res: Response) => {
  try {
    const { category, tag, search } = req.query;
    const query: any = { published: true };
    if (category) query.category = category;
    if (tag) query.tags = tag;
    if (search) query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { author: { $regex: search, $options: 'i' } },
      { abstract: { $regex: search, $options: 'i' } },
    ];
    const essays = await Essay.find(query).sort({ featured: -1, createdAt: -1 });
    res.json(essays);
  } catch (err) { res.status(500).json({ message: 'Failed to fetch essays', error: err }); }
};

export const getEssayBySlug = async (req: Request, res: Response) => {
  try {
    const essay = await Essay.findOne({ slug: req.params.slug, published: true });
    if (!essay) return res.status(404).json({ message: 'Essay not found' });
    await Essay.findByIdAndUpdate(essay._id, { $inc: { viewCount: 1 } });
    res.json(essay);
  } catch (err) { res.status(500).json({ message: 'Failed to fetch essay', error: err }); }
};

export const downloadEssay = async (req: Request, res: Response) => {
  try {
    const essay = await Essay.findById(req.params.id);
    if (!essay) return res.status(404).json({ message: 'Essay not found' });
    await Essay.findByIdAndUpdate(essay._id, { $inc: { downloadCount: 1 } });
    res.json({ downloadUrl: essay.fileUrl });
  } catch (err) { res.status(500).json({ message: 'Download failed', error: err }); }
};

export const getAllEssays = async (_req: Request, res: Response) => {
  try { const essays = await Essay.find().sort({ createdAt: -1 }); res.json(essays); }
  catch (err) { res.status(500).json({ message: 'Failed', error: err }); }
};

export const createEssay = async (req: Request, res: Response) => {
  try { const essay = await Essay.create(req.body); res.status(201).json(essay); }
  catch (err) { res.status(500).json({ message: 'Failed to create essay', error: err }); }
};

export const updateEssay = async (req: Request, res: Response) => {
  try {
    const essay = await Essay.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!essay) return res.status(404).json({ message: 'Essay not found' });
    res.json(essay);
  } catch (err) { res.status(500).json({ message: 'Failed to update essay', error: err }); }
};

export const deleteEssay = async (req: Request, res: Response) => {
  try { await Essay.findByIdAndDelete(req.params.id); res.json({ message: 'Essay deleted' }); }
  catch (err) { res.status(500).json({ message: 'Failed to delete essay', error: err }); }
};
