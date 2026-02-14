
import React from 'react';
import { Metadata } from 'next';
import { Attempt } from '@/types/test';
import ResultsContent from './ResultsContent';

type Props = {
  params: { attemptId: string } | Promise<{ attemptId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { attemptId } = await Promise.resolve(params);

  // Fetch public share info for metadata (no auth required)
  let shareInfo: { testTitle?: string; testType?: string; overallBand?: number; overallScore?: number; completedAt?: string } | null = null;
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/attempts/${attemptId}/share`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    if (res.ok) {
      shareInfo = await res.json();
    }
  } catch (e) {
    console.error('Error fetching share info for metadata', e);
  }

  if (!shareInfo) {
    return {
      title: 'Test Result | English with Arik',
    };
  }

  const title = shareInfo.testTitle || 'English Practice Test';
  const isToefl = shareInfo.testType === 'toefl_itp';
  const score = isToefl
    ? (shareInfo.overallScore ? shareInfo.overallScore.toString() : '-')
    : (shareInfo.overallBand ? shareInfo.overallBand.toString() : '-');
  const date = shareInfo.completedAt ? new Date(shareInfo.completedAt).toLocaleDateString() : new Date().toLocaleDateString();

  const ogImageUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.englishwitharik.com'}/api/og?title=${encodeURIComponent(title)}&score=${encodeURIComponent(score)}&date=${encodeURIComponent(date)}`;

  return {
    title: `Result: ${title} | English with Arik`,
    description: `I scored Band ${score} on my English practice test!`,
    openGraph: {
      title: `My Result: ${title}`,
      description: `I scored Band ${score} on my English practice test! Check it out!`,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${title} Scorecard`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `My Result: ${title}`,
      description: `I scored Band ${score} on my English practice test!`,
      images: [ogImageUrl],
    },
  };
}

export default async function ResultsPage({ params }: Props) {
  const { attemptId } = await Promise.resolve(params);
  return <ResultsContent attemptId={attemptId} />;
}
