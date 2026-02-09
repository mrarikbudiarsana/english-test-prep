import admin from 'firebase-admin';
import { env } from './env';
import path from 'path';

const serviceAccountPath = path.resolve(__dirname, '../../', env.firebaseServiceAccountPath);

try {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: env.firebaseStorageBucket,
  });
} catch (error) {
  console.warn('Firebase Admin SDK initialization skipped - service account not found.');
  console.warn('Auth middleware will not work until Firebase is configured.');
}

export const firebaseAdmin = admin;
export const firebaseAuth = admin.auth();
export const firebaseStorage = admin.storage();
export const bucket = admin.storage().bucket();
