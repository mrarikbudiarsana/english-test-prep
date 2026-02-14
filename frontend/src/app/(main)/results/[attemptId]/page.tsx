
import React from 'react';
import { Metadata } from 'next';
import { Attempt } from '@/types/test';
import ResultsContent from './ResultsContent';

type Props = {
  params: { attemptId: string } | Promise<{ attemptId: string }>;
};

type ShareInfo = {
  testTitle?: string;
  testType?: string;
  overallBand?: number;
  overallScore?: number;
  completedAt?: string;
  isPartialTest?: boolean;
  singleSection?: { type: string; label: string; score: number } | null;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { attemptId } = await Promise.resolve(params);

  // Fetch public share info for metadata (no auth required)
  let shareInfo: ShareInfo | null = null;
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

  const testTitle = shareInfo.testTitle || 'English Practice Test';
  const isToefl = shareInfo.testType === 'toefl_itp';
  const isPartialTest = shareInfo.isPartialTest && shareInfo.singleSection;

  // For partial tests, use skill-specific score and messaging
  let score: string;
  let skillLabel: string;
  let ogTitle: string;
  let description: string;

  if (isPartialTest && shareInfo.singleSection) {
    skillLabel = shareInfo.singleSection.label;
    score = shareInfo.singleSection.score.toString();
    ogTitle = `My ${skillLabel} Score: Band ${score}`;
    description = `I scored Band ${score} on IELTS ${skillLabel} practice! Check it out!`;
  } else {
    skillLabel = 'Overall';
    score = isToefl
      ? (shareInfo.overallScore ? shareInfo.overallScore.toString() : '-')
      : (shareInfo.overallBand ? shareInfo.overallBand.toString() : '-');
    ogTitle = `My Result: ${testTitle}`;
    description = `I scored Band ${score} on my English practice test! Check it out!`;
  }

  const date = shareInfo.completedAt ? new Date(shareInfo.completedAt).toLocaleDateString() : new Date().toLocaleDateString();

  // For partial tests, show skill name in OG image title
  const ogImageTitle = isPartialTest ? `IELTS ${skillLabel} Practice` : testTitle;
  const ogImageUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.englishwitharik.com'}/api/og?title=${encodeURIComponent(ogImageTitle)}&score=${encodeURIComponent(score)}&date=${encodeURIComponent(date)}`;

  return {
    title: `Result: ${testTitle} | English with Arik`,
    description,
    openGraph: {
      title: ogTitle,
      description,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${testTitle} Scorecard`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function ResultsPage({ params }: Props) {
  const { attemptId } = await Promise.resolve(params);
  return <ResultsContent attemptId={attemptId} />;
}
