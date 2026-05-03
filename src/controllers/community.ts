import { Request, Response } from 'express';
import { CommunityPost } from '../models/PlatformContent';
import PlatformContent from '../models/PlatformContent';

const CHANNELS = ['general', 'essays', 'recipes', 'industrial', 'mathematics', 'announcements'];

export const getChannels = (_req: Request, res: Response) => {
  res.json(CHANNELS.map(id => ({ id, label: id.charAt(0).toUpperCase() + id.slice(1) })));
};

export const getPosts = async (req: Request, res: Response) => {
  try {
    const { channel, parentId, limit = 50, before } = req.query;
    const query: any = { deleted: false };

    if (channel && channel !== 'all') query.channel = channel;
    if (parentId === 'null' || !parentId) query.parentId = null;
    else if (parentId) query.parentId = parentId;
    if (before) query.createdAt = { $lt: new Date(before as string) };

    const posts = await CommunityPost.find(query);
    const sorted = (posts as any[]).sort((a: any, b: any) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }).slice(0, Number(limit));

    // Attach reply counts
    const withCounts = await Promise.all(sorted.map(async (p: any) => {
      const replyCount = await CommunityPost.countDocuments({ parentId: p._id, deleted: false });
      return { ...p.toObject(), replyCount };
    }));

    res.json(withCounts);
  } catch (err) { res.status(500).json({ message: 'Failed to fetch posts', error: err }); }
};

export const createPost = async (req: Request, res: Response) => {
  try {
    const { channel, userId, userName, userRole, content, parentId } = req.body;
    if (!content?.trim()) return res.status(400).json({ message: 'Content is required' });
    if (!userId) return res.status(400).json({ message: 'userId is required' });
    if (!userName) return res.status(400).json({ message: 'userName is required' });

    const post = await CommunityPost.create({
      channel: channel || 'general',
      userId,
      userName,
      userRole: userRole || 'student',
      content: content.trim(),
      parentId: parentId || null,
      pinned: false,
      deleted: false,
      likes: [],
    });
    res.status(201).json(post);
  } catch (err) { res.status(500).json({ message: 'Failed to create post', error: err }); }
};

export const likePost = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const result = await CommunityPost.findByIdAndSave(req.params.id, (doc: any) => {
      const likes: string[] = (doc.likes || []).map((id: any) => id.toString());
      const liked = likes.includes(userId);
      if (liked) {
        doc.likes = likes.filter((id: string) => id !== userId);
      } else {
        doc.likes = [...likes, userId];
      }
    });
    if (!result) return res.status(404).json({ message: 'Post not found' });
    res.json({ likes: (result as any).likes?.length || 0 });
  } catch (err) { res.status(500).json({ message: 'Failed to like post', error: err }); }
};

export const deletePost = async (req: Request, res: Response) => {
  try {
    await CommunityPost.findByIdAndUpdate(req.params.id, { deleted: true, content: '[deleted]' });
    res.json({ message: 'Post deleted' });
  } catch (err) { res.status(500).json({ message: 'Failed to delete post', error: err }); }
};

export const pinPost = async (req: Request, res: Response) => {
  try {
    const result = await CommunityPost.findByIdAndSave(req.params.id, (doc: any) => {
      doc.pinned = !doc.pinned;
    });
    if (!result) return res.status(404).json({ message: 'Post not found' });
    res.json({ pinned: (result as any).pinned });
  } catch (err) { res.status(500).json({ message: 'Failed to pin post', error: err }); }
};

export const searchPosts = async (req: Request, res: Response) => {
  try {
    const { q, channel } = req.query;
    if (!q) return res.json([]);
    const query: any = { deleted: false, content: { $regex: q, $options: 'i' } };
    if (channel && channel !== 'all') query.channel = channel;
    const posts = await CommunityPost.find(query);
    res.json((posts as any[]).slice(0, 30));
  } catch (err) { res.status(500).json({ message: 'Search failed', error: err }); }
};
