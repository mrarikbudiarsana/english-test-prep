import { User, Subscription } from '@/types/user';

export type Tier = 'free' | 'starter' | 'pro';

/**
 * Determine the user's feature tier.
 * In the credit-based system, all authenticated students have full access
 * to progress tracking, performance breakdowns, and answer explanations.
 */
export function getTier(user: User | null, _subscription?: Subscription | null): Tier {
  if (!user) return 'free';
  return 'pro';
}
