import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed') {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Enhanced logging for production debugging
  logger.error('Unhandled Error:', {
    name: err.name,
    message: err.message,
    statusCode: err.statusCode,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Structural check: if the error has a statusCode (custom app error)
  if (err.statusCode && typeof err.statusCode === 'number') {
    res.status(err.statusCode).json({ error: err.message || 'An error occurred' });
    return;
  }

  // Handle common Postgres errors if they bubble up
  if (err.code === '22P02') {
    res.status(400).json({ error: 'Invalid ID format' });
    return;
  }

  res.status(err.statusCode || 500).json({
    error: err.statusCode ? err.message : 'Internal server error',
    message: err.message, // Always include message for debugging
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
}
