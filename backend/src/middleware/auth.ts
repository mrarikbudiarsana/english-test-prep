import { Request, Response, NextFunction } from 'express';
import { firebaseAuth } from '../config/firebase-admin';
import { query } from '../config/database';
import { AuthenticatedUser } from '../types/express';

// In-memory user cache: firebase_uid -> { user, expiresAt }
const USER_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const userCache = new Map<string, { user: AuthenticatedUser; expiresAt: number }>();

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await firebaseAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // Check cache first — avoids a DB round-trip on every request
    const cached = userCache.get(uid);
    if (cached && cached.expiresAt > Date.now()) {
      req.user = cached.user;
      return next();
    }

    const { rows } = await query(
      'SELECT id, firebase_uid, email, display_name, role, free_tests_remaining FROM users WHERE firebase_uid = $1',
      [uid]
    );

    if (rows.length === 0) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    const user: AuthenticatedUser = {
      id: rows[0].id,
      firebaseUid: rows[0].firebase_uid,
      email: rows[0].email,
      displayName: rows[0].display_name,
      role: rows[0].role,
      freeTestsRemaining: rows[0].free_tests_remaining,
    };

    userCache.set(uid, { user, expiresAt: Date.now() + USER_CACHE_TTL_MS });
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
}

/** Call this after role/profile updates so the stale cache entry is evicted. */
export function invalidateUserCache(firebaseUid: string) {
  userCache.delete(firebaseUid);
}
