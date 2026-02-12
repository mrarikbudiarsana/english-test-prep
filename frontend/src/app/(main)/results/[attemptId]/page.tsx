
import React from 'react';
import { Metadata } from 'next';
import { Attempt } from '@/types/test';
import ResultsContent from './ResultsContent';

type Props = {
  params: { attemptId: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const attemptId = params.attemptId;

  // Fetch attempt data for metadata
  let attempt: Attempt | null = null;
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/attempts/${attemptId}/results`, {
      cache: 'no-store'
    });
    if (res.ok) {
      attempt = await res.json();
    }
  } catch (e) {
    console.error('Error fetching attempt for metadata', e);
  }

  if (!attempt) {
    return {
      title: 'Test Result | English with Arik',
    };
  }

  const title = attempt.test?.title || 'English Practice Test';
  const score = attempt.overallBand ? attempt.overallBand.toString() : '-';
  const date = attempt.completedAt ? new Date(attempt.completedAt).toLocaleDateString() : new Date().toLocaleDateString();

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

export default function ResultsPage({ params }: Props) {
  return <ResultsContent attemptId={params.attemptId} />;
}
