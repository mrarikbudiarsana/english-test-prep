import * as userModel from '../models/user.model';
import { NotFoundError } from '../middleware/errorHandler';

/**
 * Register a new user in the database after Firebase authentication.
 * If the user already exists (by firebaseUid), returns the existing user.
 */
export async function registerUser(
  firebaseUid: string,
  email: string,
  displayName?: string,
  photoUrl?: string,
) {
  // Check if user already exists
  const existing = await userModel.findByFirebaseUid(firebaseUid);
  if (existing) {
    return existing;
  }

  const user = await userModel.create({
    firebaseUid,
    email,
    displayName,
    photoUrl,
  });

  return user;
}

/**
 * Find a user by their Firebase UID. Throws NotFoundError if not found.
 */
export async function getUserByFirebaseUid(firebaseUid: string) {
  const user = await userModel.findByFirebaseUid(firebaseUid);
  if (!user) {
    throw new NotFoundError('User not found');
  }
  return user;
}

/**
 * Find a user by their internal database ID. Throws NotFoundError if not found.
 */
export async function getUserById(id: string) {
  const user = await userModel.findById(id);
  if (!user) {
    throw new NotFoundError('User not found');
  }
  return user;
}

/**
 * Update a user's profile information (display name and/or photo URL).
 */
export async function updateProfile(
  id: string,
  data: { displayName?: string; photoUrl?: string },
) {
  // Verify the user exists first
  const existing = await userModel.findById(id);
  if (!existing) {
    throw new NotFoundError('User not found');
  }

  const updated = await userModel.update(id, {
    displayName: data.displayName,
    photoUrl: data.photoUrl,
  });

  return updated;
}

/**
 * Valid exam types for preference selection.
 */
const VALID_EXAM_TYPES = ['ielts', 'toefl_ibt', 'toefl_itp', 'pte'];

/**
 * Update a user's preferred exam type.
 */
export async function updateExamPreference(
  id: string,
  preferredExamType: string,
) {
  // Validate exam type
  if (!VALID_EXAM_TYPES.includes(preferredExamType)) {
    throw new Error(`Invalid exam type. Must be one of: ${VALID_EXAM_TYPES.join(', ')}`);
  }

  // Verify the user exists first
  const existing = await userModel.findById(id);
  if (!existing) {
    throw new NotFoundError('User not found');
  }

  const updated = await userModel.update(id, { preferredExamType });
  return updated;
}
