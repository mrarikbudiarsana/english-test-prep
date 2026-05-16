import { Request, Response, NextFunction } from 'express';
import * as uploadService from '../services/upload.service';
import { logger } from '../utils/logger';

export async function uploadAudio(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'No audio file provided' });
      return;
    }
    logger.info('Received audio upload request', { filename: file.originalname, size: file.size });
    const url = await uploadService.uploadFile(file, 'audio');
    logger.info('Audio upload completed', { url });
    res.json({ url });
  } catch (error) {
    next(error);
  }
}

export async function uploadImage(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'No image file provided' });
      return;
    }
    const url = await uploadService.uploadFile(file, 'images');
    res.json({ url });
  } catch (error) {
    next(error);
  }
}

export async function uploadVideo(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'No video file provided' });
      return;
    }
    const url = await uploadService.uploadFile(file, 'videos');
    res.json({ url });
  } catch (error) {
    next(error);
  }
}
