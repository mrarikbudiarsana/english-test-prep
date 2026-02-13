import cloudinary from '../config/cloudinary';
import { ValidationError } from '../middleware/errorHandler';
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

  try {
    // Convert buffer to stream for Cloudinary
    const stream = Readable.from(file.buffer);

    // Determine resource type based on file mimetype
    let resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto';
    if (file.mimetype.startsWith('audio/')) {
      resourceType = 'video'; // Cloudinary uses 'video' for audio files
    } else if (file.mimetype.startsWith('image/')) {
      resourceType = 'image';
    }

    // Upload to Cloudinary
    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          public_id: uniqueId,
          resource_type: resourceType,
          format: ext.replace('.', '') || undefined,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      stream.pipe(uploadStream);
    });

    // Return the secure URL
    return result.secure_url;
  } catch (error: any) {
    console.error('Error uploading to Cloudinary:', error);
    throw new ValidationError(`Failed to upload file: ${error.message || 'Unknown error'}`);
  }
}

