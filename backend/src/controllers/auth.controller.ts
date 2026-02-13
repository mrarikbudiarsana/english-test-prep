/// <reference path="../types/express.d.ts" />
import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { firebaseUid, email, displayName, photoUrl } = req.body;
    const user = await authService.registerUser(firebaseUid, email, displayName, photoUrl);
    res.status(201).json({ data: user });
  } catch (error) {
    next(error);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { firebaseUid } = req.body;
    const user = await authService.getUserByFirebaseUid(firebaseUid);
    res.json({ data: user });
  } catch (error) {
    next(error);
  }
}

export async function getProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const profile = await authService.getUserById(req.user!.id);
    res.json({ data: profile });
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { displayName, photoUrl } = req.body;
    const updated = await authService.updateProfile(req.user!.id, { displayName, photoUrl });
    res.json({ data: updated });
  } catch (error) {
    next(error);
  }
}

export async function updateExamPreference(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { preferredExamType } = req.body;
    if (!preferredExamType) {
      res.status(400).json({ error: 'preferredExamType is required' });
      return;
    }
    const updated = await authService.updateExamPreference(req.user!.id, preferredExamType);
    res.json({ data: updated });
  } catch (error) {
    next(error);
  }
}
