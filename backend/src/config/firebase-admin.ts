import admin from 'firebase-admin';
import { env } from './env';
import path from 'path';

let initialized = false;

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

  initialized = true;
} catch (error) {
  console.error('Firebase Admin init error:', error);
  console.warn('Firebase Admin SDK initialization skipped.');
}

export const firebaseAdmin = admin;
export const firebaseAuth = initialized ? admin.auth() : null as any;
export const firebaseStorage = initialized ? admin.storage() : null as any;
export const bucket = initialized ? admin.storage().bucket() : null as any;
