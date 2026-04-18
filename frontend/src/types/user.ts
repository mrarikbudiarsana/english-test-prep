export type ExamType = 'toefl_itp';

export interface User {
  id: string;
  firebaseUid: string;
  email: string;
  displayName: string | null;
  photoUrl: string | null;
  role: 'user' | 'admin';
  freeTestsRemaining: number;
  preferredExamType: ExamType | null;
  createdAt: string;
}

export type PlanType = 'monthly' | 'quarterly' | 'yearly';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'pending';

export interface Subscription {
  id: string;
  userId: string;
  planType: PlanType;
  status: SubscriptionStatus;
  startsAt: string;
  expiresAt: string;
  autoRenew: boolean;
}

export interface PlanConfig {
  type: PlanType;
  label: string;
  durationDays: number;
  price: number;
  currency: string;
}

export interface Payment {
  id: string;
  midtransOrderId: string;
  amount: number;
  currency: string;
  status: string;
  paymentType: string | null;
  createdAt: string;
}
