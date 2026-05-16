import { User, Subscription } from '@/types/user';

export type Tier = 'free' | 'starter' | 'pro';

/**
 * Determine the user's feature tier based on role and subscription.
 * Admins always get 'pro' access.
 */
export function getTier(user: User | null, subscription: Subscription | null): Tier {
  if (user?.role === 'admin') return 'pro';
  if (!subscription || subscription.status !== 'active') return 'free';
  
  // Any active subscription counts as at least 'starter'
  if (subscription.planType === 'monthly') return 'starter';
  if (subscription.planType === 'quarterly' || subscription.planType === 'yearly') return 'pro';
  
  // Fallback for any other active plans (like custom packages)
  return 'starter';
}
