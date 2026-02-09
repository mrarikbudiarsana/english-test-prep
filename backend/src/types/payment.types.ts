export type PlanType = 'monthly' | 'quarterly' | 'yearly';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'pending';
export type PaymentStatus = 'pending' | 'capture' | 'settlement' | 'deny' | 'cancel' | 'expire' | 'refund';

export interface PlanConfig {
  type: PlanType;
  label: string;
  durationDays: number;
  price: number;
  currency: string;
}

export const PLAN_CONFIGS: Record<PlanType, PlanConfig> = {
  monthly: {
    type: 'monthly',
    label: 'Monthly Plan',
    durationDays: 30,
    price: 99000,
    currency: 'IDR',
  },
  quarterly: {
    type: 'quarterly',
    label: 'Quarterly Plan',
    durationDays: 90,
    price: 249000,
    currency: 'IDR',
  },
  yearly: {
    type: 'yearly',
    label: 'Yearly Plan',
    durationDays: 365,
    price: 799000,
    currency: 'IDR',
  },
};

export interface Subscription {
  id: string;
  userId: string;
  planType: PlanType;
  status: SubscriptionStatus;
  startsAt: Date;
  expiresAt: Date;
  autoRenew: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  userId: string;
  subscriptionId: string | null;
  midtransOrderId: string;
  midtransTransactionId: string | null;
  snapToken: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentType: string | null;
  midtransResponse: any | null;
  createdAt: Date;
  updatedAt: Date;
}
