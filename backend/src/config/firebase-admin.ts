import admin from 'firebase-admin';
import { env } from './env';
import path from 'path';

try {
  let serviceAccount;

  // 1. Try loading from Environment Variable (Best for Vercel/Render)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }
  // 2. Fallback to file path (Local development)
  else {
    const serviceAccountPath = path.resolve(__dirname, '../../', env.firebaseServiceAccountPath);
    serviceAccount = require(serviceAccountPath);
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: env.firebaseStorageBucket,
  });
} catch (error) {
  console.error('Firebase Admin init error:', error);
  console.warn('Firebase Admin SDK initialization skipped.');
}

export const firebaseAdmin = admin;
export const firebaseAuth = admin.auth();
export const firebaseStorage = admin.storage();
export const bucket = admin.storage().bucket();
