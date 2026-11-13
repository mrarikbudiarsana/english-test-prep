'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SubscriptionRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/pricing');
  }, [router]);

  return (
    <div className="max-w-md mx-auto py-20 text-center space-y-4">
      <div className="w-10 h-10 border-4 border-[#08507f] border-t-transparent rounded-full animate-spin mx-auto" />
      <h1 className="text-xl font-bold text-slate-900">Redirecting to Test Credits & Pricing...</h1>
      <p className="text-sm text-slate-500">
        We&apos;ve switched to pay-as-you-go test credits.{' '}
        <Link href="/pricing" className="text-[#08507f] font-semibold hover:underline">
          Click here
        </Link>{' '}
        if you are not redirected automatically.
      </p>
    </div>
  );
}
