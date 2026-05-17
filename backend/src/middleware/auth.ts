import { Request, Response, NextFunction } from 'express';
import { firebaseAuth } from '../config/firebase-admin';
import { query } from '../config/database';
import { AuthenticatedUser } from '../types/express';

// In-memory caches for maximum serverless response speed:
// 1. userCache: firebase_uid -> { user, expiresAt } (bypasses DB query)
// 2. tokenCache: token_string -> { user, expiresAt } (bypasses Firebase verification AND DB query)
const USER_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const userCache = new Map<string, { user: AuthenticatedUser; expiresAt: number }>();
const tokenCache = new Map<string, { user: AuthenticatedUser; expiresAt: number }>();

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

    // 1. Check verified token cache first — completely bypasses verifyIdToken AND database query!
    const cachedToken = tokenCache.get(token);
    if (cachedToken && cachedToken.expiresAt > Date.now()) {
      req.user = cachedToken.user;
      return next();
    }

    // If token is not cached, we verify it via Firebase Admin SDK
    const decodedToken = await firebaseAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // 2. Check user profile cache by UID next (handles refreshed tokens with active profiles)
    const cachedUser = userCache.get(uid);
    if (cachedUser && cachedUser.expiresAt > Date.now()) {
      req.user = cachedUser.user;
      // Also cache this token string for next time
      tokenCache.set(token, { user: cachedUser.user, expiresAt: cachedUser.expiresAt });
      return next();
    }

    // 3. Fallback: Query the database
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

    const expiresAt = Date.now() + USER_CACHE_TTL_MS;
    userCache.set(uid, { user, expiresAt });
    tokenCache.set(token, { user, expiresAt });

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
  // Also delete all token entries belonging to this user
  for (const [token, cached] of tokenCache.entries()) {
    if (cached.user.firebaseUid === firebaseUid) {
      tokenCache.delete(token);
    }
  }
}
