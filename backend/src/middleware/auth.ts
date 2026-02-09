import { Request, Response, NextFunction } from 'express';
import { firebaseAuth } from '../config/firebase-admin';
import { query } from '../config/database';

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

    const { rows } = await query(
      'SELECT id, firebase_uid, email, display_name, role, free_tests_remaining FROM users WHERE firebase_uid = $1',
      [decodedToken.uid]
    );

    if (rows.length === 0) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    req.user = {
      id: rows[0].id,
      firebaseUid: rows[0].firebase_uid,
      email: rows[0].email,
      displayName: rows[0].display_name,
      role: rows[0].role,
      freeTestsRemaining: rows[0].free_tests_remaining,
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
}
