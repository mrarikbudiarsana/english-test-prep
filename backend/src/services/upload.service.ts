import { bucket } from '../config/firebase-admin';
import { ValidationError } from '../middleware/errorHandler';
import crypto from 'crypto';
import path from 'path';

/**
 * Upload a file to Firebase Storage from an Express Multer file object.
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
  const filePath = `${folder}/${uniqueId}${ext}`;

  const fileRef = bucket.file(filePath);

  try {
    await fileRef.save(file.buffer, {
      metadata: {
        contentType: file.mimetype,
      },
    });

    // Make the file publicly accessible
    await fileRef.makePublic();

    // Return the public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
    return publicUrl;
  } catch (error: any) {
    console.error('Error uploading to Firebase Storage:', error);
    throw new ValidationError(`Failed to upload file: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Generate a signed URL for direct client-side uploads.
 * The client can use this URL to upload a file directly to Firebase Storage.
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

  const fileRef = bucket.file(key);

  try {
    const [signedUrl] = await fileRef.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 60 * 60 * 1000, // 1 hour
      contentType,
    });

    return signedUrl;
  } catch (error: any) {
    console.error('Error generating signed URL:', error);
    throw new ValidationError(
      `Failed to generate signed URL: ${error.message || 'Unknown error'}`,
    );
  }
}

/**
 * Delete a file from Firebase Storage by its path.
 */
export async function deleteFile(filePath: string): Promise<void> {
  if (!filePath) {
    throw new ValidationError('File path is required');
  }

  // Extract the path from a full URL if needed
  let storagePath = filePath;
  const bucketUrl = `https://storage.googleapis.com/${bucket.name}/`;
  if (filePath.startsWith(bucketUrl)) {
    storagePath = filePath.replace(bucketUrl, '');
  }

  const fileRef = bucket.file(storagePath);

  try {
    await fileRef.delete();
  } catch (error: any) {
    console.error('Error deleting from Firebase Storage:', error);
    throw new ValidationError(
      `Failed to delete file: ${error.message || 'Unknown error'}`,
    );
  }
}
