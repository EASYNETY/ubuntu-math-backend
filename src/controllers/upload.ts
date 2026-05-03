/**
 * Upload controller — Cloudinary-backed file storage.
 *
 * Files are uploaded directly to Cloudinary (persistent, CDN-delivered).
 * No local disk storage — safe for Render/Vercel ephemeral environments.
 *
 * Supports: PDF, EPUB, images, videos, ZIP
 *
 * Required env vars:
 *   CLOUDINARY_CLOUD_NAME
 *   CLOUDINARY_API_KEY
 *   CLOUDINARY_API_SECRET
 */
import { Request, Response } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// ── Cloudinary config ─────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// ── Multer — memory storage (buffer, no disk write) ───────────────────────────
const memoryStorage = multer.memoryStorage();

export const upload = multer({
  storage: memoryStorage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/epub+zip',
      'application/zip',
      'application/x-zip-compressed',
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'application/octet-stream', // generic binary (some EPUBs)
    ];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(pdf|epub|zip|jpg|jpeg|png|webp|gif|mp4|webm|mov)$/i)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed: ${file.mimetype}`));
    }
  },
});

// ── Helper: upload buffer to Cloudinary ───────────────────────────────────────
function uploadToCloudinary(
  buffer: Buffer,
  filename: string,
  folder: string,
  resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto'
): Promise<any> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: filename.replace(/\.[^/.]+$/, '').replace(/\s+/g, '_'),
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true,
        overwrite: false,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(stream);
  });
}

// ── Determine folder and resource type from file ──────────────────────────────
function getUploadConfig(file: Express.Multer.File): { folder: string; resourceType: 'image' | 'video' | 'raw' | 'auto' } {
  const mime = file.mimetype;
  const name = file.originalname.toLowerCase();

  if (mime.startsWith('image/')) return { folder: 'cams/images', resourceType: 'image' };
  if (mime.startsWith('video/')) return { folder: 'cams/videos', resourceType: 'video' };
  if (mime === 'application/pdf' || name.endsWith('.pdf')) return { folder: 'cams/documents', resourceType: 'raw' };
  if (mime === 'application/epub+zip' || name.endsWith('.epub')) return { folder: 'cams/ebooks', resourceType: 'raw' };
  if (mime.includes('zip') || name.endsWith('.zip')) return { folder: 'cams/packages', resourceType: 'raw' };
  return { folder: 'cams/files', resourceType: 'raw' };
}

// ── Single file upload ────────────────────────────────────────────────────────
export const uploadFile = async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  try {
    const { folder, resourceType } = getUploadConfig(req.file);
    const result = await uploadToCloudinary(req.file.buffer, req.file.originalname, folder, resourceType);

    res.json({
      url: result.secure_url,
      publicId: result.public_id,
      filename: req.file.originalname,
      size: req.file.size,
      format: result.format,
      resourceType: result.resource_type,
      folder: result.folder,
      bytes: result.bytes,
    });
  } catch (err: any) {
    console.error('Cloudinary upload error:', err);
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
};

// ── Multiple files upload ─────────────────────────────────────────────────────
export const uploadMultiple = multer({
  storage: memoryStorage,
  limits: { fileSize: 500 * 1024 * 1024 },
});

export const uploadFiles = async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) return res.status(400).json({ message: 'No files uploaded' });

  try {
    const results = await Promise.all(
      files.map(async (file) => {
        const { folder, resourceType } = getUploadConfig(file);
        const result = await uploadToCloudinary(file.buffer, file.originalname, folder, resourceType);
        return {
          url: result.secure_url,
          publicId: result.public_id,
          filename: file.originalname,
          size: file.size,
          format: result.format,
          resourceType: result.resource_type,
        };
      })
    );
    res.json({ files: results, count: results.length });
  } catch (err: any) {
    console.error('Cloudinary multi-upload error:', err);
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
};

// ── Delete file from Cloudinary ───────────────────────────────────────────────
export const deleteFile = async (req: Request, res: Response) => {
  try {
    const { publicId, resourceType = 'raw' } = req.body;
    if (!publicId) return res.status(400).json({ message: 'publicId required' });
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType as any });
    res.json({ result, deleted: result.result === 'ok' });
  } catch (err: any) {
    res.status(500).json({ message: 'Delete failed', error: err.message });
  }
};

// ── List files in a folder ────────────────────────────────────────────────────
export const listFiles = async (req: Request, res: Response) => {
  try {
    const folder = (req.query.folder as string) || 'cams';
    const resourceType = (req.query.type as string) || 'raw';
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: folder,
      resource_type: resourceType as any,
      max_results: 100,
    });
    res.json({
      files: result.resources.map((r: any) => ({
        url: r.secure_url,
        publicId: r.public_id,
        format: r.format,
        bytes: r.bytes,
        createdAt: r.created_at,
      })),
      total: result.resources.length,
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to list files', error: err.message });
  }
};
