import { User, Subscription } from '@/types/user';

export type Tier = 'free' | 'starter' | 'pro';

/**
 * Determine the user's feature tier based on role and subscription.
 * Admins always get 'pro' access.
 */
export function getTier(user: User | null, subscription: Subscription | null): Tier {
  if (user?.role === 'admin') return 'pro';
  if (!subscription || subscription.status !== 'active') return 'free';
  if (subscription.planType === 'monthly') return 'starter';
  if (subscription.planType === 'yearly' || subscription.planType === 'quarterly') return 'pro';
  return 'free';
}
