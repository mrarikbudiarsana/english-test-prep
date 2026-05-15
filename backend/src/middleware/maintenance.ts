import { Request, Response, NextFunction } from 'express';
import { isMaintenanceMode } from '../services/settings.service';
import { firebaseAuth } from '../config/firebase-admin';
import { query } from '../config/database';

export async function maintenanceMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // 1. Check if maintenance mode is active
  const maintenanceMode = await isMaintenanceMode();

  if (!maintenanceMode) {
    return next();
  }

  // 2. If maintenance is ON, check if it's an allowed path
  const allowedPaths = [
    '/api/v1/auth/me',
    '/api/v1/auth/login',
    '/api/v1/system/status',
    '/health',
    '/'
  ];

  if (allowedPaths.some(path => req.path === path)) {
    return next();
  }

  // 3. If maintenance is ON and not an allowed path, check if user is admin
  // We check req.user first (if authMiddleware already ran)
  if (req.user?.role === 'admin') {
    return next();
  }

  // If req.user is not set, try to verify token manually to check for admin role
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split('Bearer ')[1];
      const decodedToken = await firebaseAuth.verifyIdToken(token);
      
      const { rows } = await query(
        'SELECT role FROM users WHERE firebase_uid = $1',
        [decodedToken.uid]
      );

      if (rows.length > 0 && rows[0].role === 'admin') {
        return next();
      }
    } catch (error) {
      // Token invalid or other error, proceed to block
    }
  }

  // 4. Block access
  res.status(503).json({
    error: 'Maintenance Mode',
    code: 'MAINTENANCE_MODE',
    message: 'The platform is currently undergoing maintenance. Please try again later.'
  });
}
