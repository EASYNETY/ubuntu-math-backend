import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_')),
});
export const upload = multer({ storage, limits: { fileSize: 500 * 1024 * 1024 } });
export const uploadFile = (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const baseUrl = process.env.SERVER_URL || 'http://localhost:5000';
  res.json({ url: baseUrl + '/uploads/' + req.file.filename, filename: req.file.filename, size: req.file.size });
};
