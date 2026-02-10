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
  const fileName = `${uniqueId}${ext}`;

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

/**
 * Generate a signed URL for direct client-side uploads to Cloudinary.
 * The client can use this URL to upload a file directly.
 */
export async function getSignedUploadUrl(
  key: string,
  contentType: string,
): Promise<string> {
  if (!key) {
    throw new ValidationError('File key is required');
  }
  if (!contentType) {
    throw new ValidationError('Content type is required');
  }

  try {
    // Determine resource type
    let resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto';
    if (contentType.startsWith('audio/')) {
      resourceType = 'video';
    } else if (contentType.startsWith('image/')) {
      resourceType = 'image';
    }

    // Generate timestamp for signature
    const timestamp = Math.round(Date.now() / 1000);

    // Generate signature
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp: timestamp,
        public_id: key,
        resource_type: resourceType,
      },
      cloudinary.config().api_secret || ''
    );

    // Construct upload URL
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudinary.config().cloud_name}/${resourceType}/upload`;

    // Return URL with signature parameters
    return `${uploadUrl}?timestamp=${timestamp}&public_id=${key}&signature=${signature}&api_key=${cloudinary.config().api_key}`;
  } catch (error: any) {
    console.error('Error generating signed URL:', error);
    throw new ValidationError(
      `Failed to generate signed URL: ${error.message || 'Unknown error'}`,
    );
  }
}

/**
 * Delete a file from Cloudinary by its public ID or URL.
 */
export async function deleteFile(filePathOrUrl: string): Promise<void> {
  if (!filePathOrUrl) {
    throw new ValidationError('File path or URL is required');
  }

  try {
    // Extract public ID from URL if needed
    let publicId = filePathOrUrl;

    // If it's a Cloudinary URL, extract the public ID
    if (filePathOrUrl.includes('cloudinary.com')) {
      // Example URL: https://res.cloudinary.com/demo/image/upload/v1234567890/folder/filename.jpg
      const matches = filePathOrUrl.match(/\/([^/]+\/[^/]+)\.(jpg|png|mp3|mp4|wav|webm)/);
      if (matches) {
        publicId = matches[1];
      }
    }

    // Determine resource type based on URL or extension
    let resourceType: 'image' | 'video' | 'raw' = 'image';
    if (filePathOrUrl.includes('/video/') || /\.(mp3|mp4|wav|webm|m4a)$/.test(filePathOrUrl)) {
      resourceType = 'video';
    }

    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (error: any) {
    console.error('Error deleting from Cloudinary:', error);
    throw new ValidationError(
      `Failed to delete file: ${error.message || 'Unknown error'}`,
    );
  }
}
