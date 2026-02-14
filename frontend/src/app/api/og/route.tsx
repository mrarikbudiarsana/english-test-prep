
import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);

        // Dynamic params
        const title = searchParams.get('title') || 'English Test Result';
        const score = searchParams.get('score') || '-';
        const date = searchParams.get('date') || new Date().toLocaleDateString();

        // Determine color based on score (simplified logic for visual flair)
        // You could map this to your band color logic if you want strict consistency
        const scoreNum = parseFloat(score);
        let scoreColor = '#4B5563'; // gray-600
        if (!isNaN(scoreNum)) {
            if (scoreNum >= 8) scoreColor = '#16A34A'; // green-600
            else if (scoreNum >= 6.5) scoreColor = '#2563EB'; // blue-600
            else if (scoreNum >= 5) scoreColor = '#D97706'; // amber-600
            else scoreColor = '#DC2626'; // red-600
        }

        return new ImageResponse(
            (
                <div
                    style={{
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'white',
                        padding: '40px',
                    }}
                >
                    {/* Main Card */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'white',
                            border: '4px solid #E5E7EB',
                            borderRadius: '24px',
                            padding: '40px 80px',
                        }}
                    >
                        {/* Logo / Brand */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                marginBottom: '16px',
                                fontSize: 28,
                                fontWeight: 700,
                                color: '#374151',
                            }}
                        >
                            English with Arik
                        </div>

                        {/* Practice Label */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#DBEAFE',
                                color: '#2563EB',
                                padding: '8px 24px',
                                borderRadius: '50px',
                                fontSize: 16,
                                fontWeight: 600,
                                marginBottom: '24px',
                            }}
                        >
                            PRACTICE TEST RESULT
                        </div>

                        {/* Test Title */}
                        <div
                            style={{
                                display: 'flex',
                                fontSize: 32,
                                color: '#111827',
                                textAlign: 'center',
                                marginBottom: '32px',
                                fontWeight: 800,
                                maxWidth: '700px',
                            }}
                        >
                            {title}
                        </div>

                        {/* Score Circle */}
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '160px',
                                height: '160px',
                                borderRadius: '50%',
                                backgroundColor: scoreColor,
                                color: 'white',
                                marginBottom: '32px',
                            }}
                        >
                            <div style={{ display: 'flex', fontSize: 14, fontWeight: 600 }}>BAND SCORE</div>
                            <div style={{ display: 'flex', fontSize: 64, fontWeight: 900 }}>{score}</div>
                        </div>

                        {/* Date */}
                        <div style={{ display: 'flex', fontSize: 18, color: '#6B7280', fontWeight: 500 }}>
                            Completed on {date}
                        </div>
                    </div>

                    {/* Footer disclaimer */}
                    <div style={{ display: 'flex', marginTop: '20px', fontSize: 14, color: '#9CA3AF' }}>
                        Unofficial score for practice purposes only
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 630,
            }
        );
    } catch (e: any) {
        console.log(`${e.message}`);
        return new Response(`Failed to generate the image`, {
            status: 500,
        });
    }
}
