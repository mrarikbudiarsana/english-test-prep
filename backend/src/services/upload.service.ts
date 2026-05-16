import cloudinary from '../config/cloudinary';
import { env } from '../config/env';
import { ValidationError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import crypto from 'crypto';
import path from 'path';
import { Readable } from 'stream';

/**
 * Upload a file to Cloudinary from an Express Multer file object.
 * Returns the public URL of the uploaded file.
 */
export async function uploadFile(
  file: Express.Multer.File,
  folder: string,
): Promise<string> {
  if (!file || !file.buffer) {
    throw new ValidationError('No file provided');
  }

  const uniqueId = crypto.randomUUID();
  const ext = path.extname(file.originalname) || '';

  logger.info('Starting file upload to Cloudinary', {
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    folder,
    uniqueId,
  });

  try {
    // Upload to Cloudinary using a promise-wrapped stream
    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          public_id: uniqueId,
          resource_type: 'auto', // Cloudinary detects type automatically (image, video/audio, raw)
        },
        (error, result) => {
          if (error) {
            logger.error('Cloudinary upload stream callback error:', { error, uniqueId });
            reject(error);
          } else {
            logger.info('Cloudinary upload successful', { public_id: result.public_id, uniqueId });
            resolve(result);
          }
        }
      );

      // Explicitly handle stream errors
      uploadStream.on('error', (err) => {
        logger.error('Cloudinary upload stream error event:', { err, uniqueId });
        reject(err);
      });

      // CRITICAL: end() the stream with the buffer to ensure it finishes correctly.
      // Using .end(buffer) is more reliable than .pipe() for in-memory buffers.
      uploadStream.end(file.buffer);
    });

    return result.secure_url;
  } catch (error: any) {
    logger.error('Error in uploadFile service:', {
      message: error.message,
      stack: error.stack,
      uniqueId,
    });
    throw new ValidationError(`Failed to upload file: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Generate a signature for a signed upload to Cloudinary directly from the frontend.
 */
export function generateSignature(folder: string) {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp: timestamp,
      folder: folder,
    },
    env.cloudinary.apiSecret
  );

  return {
    signature,
    timestamp,
    cloudName: env.cloudinary.cloudName,
    apiKey: env.cloudinary.apiKey,
    folder,
  };
}

