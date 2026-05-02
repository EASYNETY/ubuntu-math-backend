import { Request, Response } from 'express';
import mongoose from 'mongoose';

// Collections your app actually uses — these will NOT be dropped
const KEEP_COLLECTIONS = new Set([
  'users',
  'courses',
  'enrollments',
  'stories',
  'innovations',
  'mathmodules',
  'studentprogresses',
  'subscriptions',
  'certificates',
  'analyticsevents',
  'simulatorsessions',
  'platformcontents',
]);

/**
 * GET /api/admin/collections
 * Lists all collections and flags which ones will be dropped
 */
export const listCollections = async (_req: Request, res: Response) => {
  try {
    const db = mongoose.connection.db;
    if (!db) return res.status(500).json({ message: 'DB not connected' });

    const collections = await db.listCollections().toArray();
    const names = collections.map((c) => c.name).sort();

    res.json({
      total: names.length,
      toKeep: names.filter((n) => KEEP_COLLECTIONS.has(n)),
      toDrop: names.filter((n) => !KEEP_COLLECTIONS.has(n)),
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to list collections', error: err.message });
  }
};

/**
 * POST /api/admin/cleanup-collections
 * Drops all collections NOT in the KEEP_COLLECTIONS set.
 * Requires secret key in body for safety.
 */
export const cleanupCollections = async (req: Request, res: Response) => {
  try {
    // Simple secret check — set CLEANUP_SECRET in your env vars
    const { secret } = req.body;
    const expectedSecret = process.env.CLEANUP_SECRET || 'ubuntu-cleanup-2024';
    if (secret !== expectedSecret) {
      return res.status(403).json({ message: 'Invalid secret' });
    }

    const db = mongoose.connection.db;
    if (!db) return res.status(500).json({ message: 'DB not connected' });

    const collections = await db.listCollections().toArray();
    const names = collections.map((c) => c.name);

    const toDrop = names.filter((n) => !KEEP_COLLECTIONS.has(n));
    const dropped: string[] = [];
    const errors: string[] = [];

    for (const name of toDrop) {
      try {
        await db.dropCollection(name);
        dropped.push(name);
        console.log(`Dropped collection: ${name}`);
      } catch (e: any) {
        errors.push(`${name}: ${e.message}`);
      }
    }

    res.json({
      message: `Cleanup complete. Dropped ${dropped.length} collections.`,
      dropped,
      kept: names.filter((n) => KEEP_COLLECTIONS.has(n)),
      errors,
      remainingCount: names.length - dropped.length,
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Cleanup failed', error: err.message });
  }
};
