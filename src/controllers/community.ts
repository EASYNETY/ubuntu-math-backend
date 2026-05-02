import { Request, Response } from 'express';
import { CommunityPost } from '../models/PlatformContent';

const CHANNELS = ['general', 'essays', 'recipes', 'industrial', 'mathematics', 'announcements'];

export const getChannels = (_req: Request, res: Response) => {
  res.json(CHANNELS.map(id => ({ id, label: id.charAt(0).toUpperCase() + id.slice(1) })));
};

export const getPosts = async (req: Request, res: Response) => {
  try {
    const { channel = 'general', parentId, limit = 50, before } = req.query;
    const query: any = { deleted: false };

    // If no channel specified, get all channels
    if (channel && channel !== 'all') query.channel = channel;

    if (parentId === 'null' || !parentId) query.parentId = null;
    else if (parentId) query.parentId = parentId;

    if (before) query.createdAt = { $lt: new Date(before as string) };

    const posts = await CommunityPost.find(query)
      .sort({ pinned: -1, createdAt: -1 })
      .limit(Number(limit));

    // Attach reply counts
    const withCounts = await Promise.all(posts.map(async (p) => {
      const replyCount = await CommunityPost.countDocuments({ parentId: p._id, deleted: false });
      return { ...p.toObject(), replyCount };
    }));

    res.json(withCounts.reverse());
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
    });
    res.status(201).json(post);
  } catch (err) { res.status(500).json({ message: 'Failed to create post', error: err }); }
};

export const likePost = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const post = await CommunityPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const liked = post.likes.some((id: any) => id.toString() === userId);
    if (liked) {
      post.likes = post.likes.filter((id: any) => id.toString() !== userId) as any;
    } else {
      post.likes.push(userId);
    }
    await post.save();
    res.json({ likes: post.likes.length, liked: !liked });
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
    const post = await CommunityPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const newPinned = !post.pinned;
    await CommunityPost.findByIdAndUpdate(req.params.id, { pinned: newPinned });
    res.json({ pinned: newPinned });
  } catch (err) { res.status(500).json({ message: 'Failed to pin post', error: err }); }
};

export const searchPosts = async (req: Request, res: Response) => {
  try {
    const { q, channel } = req.query;
    if (!q) return res.json([]);
    const query: any = { deleted: false, content: { $regex: q, $options: 'i' } };
    if (channel && channel !== 'all') query.channel = channel;
    const posts = await CommunityPost.find(query).sort({ createdAt: -1 }).limit(30);
    res.json(posts);
  } catch (err) { res.status(500).json({ message: 'Search failed', error: err }); }
};
