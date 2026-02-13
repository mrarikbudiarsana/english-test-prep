'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function PaymentFinishContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');
  const statusCode = searchParams.get('status_code');
  const transactionStatus = searchParams.get('transaction_status');

  const isSuccess =
    transactionStatus === 'settlement' ||
    transactionStatus === 'capture' ||
    statusCode === '200';

  const isPending =
    transactionStatus === 'pending' || statusCode === '201';

  const isFailed =
    transactionStatus === 'deny' ||
    transactionStatus === 'cancel' ||
    transactionStatus === 'expire' ||
    statusCode === '202';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        {isSuccess && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
            <p className="text-gray-600 mb-6">
              Your subscription has been activated. You now have full access to all tests.
            </p>
          </>
        )}

        {isPending && (
          <>
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Pending</h1>
            <p className="text-gray-600 mb-6">
              Your payment is being processed. Your subscription will be activated once the payment is confirmed.
            </p>
          </>
        )}

        {(isFailed || (!isSuccess && !isPending)) && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
            <p className="text-gray-600 mb-6">
              Your payment was not completed. No charges were made. Please try again.
            </p>
          </>
        )}

        {orderId && (
          <p className="text-xs text-gray-400 mb-6">Order ID: {orderId}</p>
        )}

        <div className="flex flex-col gap-3">
          {(isFailed || (!isSuccess && !isPending)) && (
            <Link
              href="/pricing"
              className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Try Again
            </Link>
          )}
          <Link
            href="/dashboard"
            className="w-full bg-gray-100 text-gray-700 py-2.5 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFinishPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <PaymentFinishContent />
    </Suspense>
  );
}
