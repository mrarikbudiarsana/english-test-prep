
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
                        backgroundImage: 'radial-gradient(circle at 25px 25px, lightgray 2%, transparent 0%), radial-gradient(circle at 75px 75px, lightgray 2%, transparent 0%)',
                        backgroundSize: '100px 100px',
                        fontFamily: 'sans-serif',
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
                            border: '4px solid #F3F4F6', // gray-100
                            borderRadius: '24px',
                            padding: '40px 80px',
                            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                        }}
                    >
                        {/* Logo / Brand */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                marginBottom: '20px',
                            }}
                        >
                            <span style={{ fontSize: 24, fontWeight: 600, color: '#374151' }}>
                                English with Arik
                            </span>
                        </div>

                        {/* Practice Label */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#EFF6FF', // blue-50
                                color: '#2563EB', // blue-600
                                padding: '8px 20px',
                                borderRadius: '50px',
                                fontSize: 18,
                                fontWeight: 600,
                                marginTop: '10px',
                                marginBottom: '20px',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                            }}
                        >
                            Practice Test Result
                        </div>

                        {/* Test Title */}
                        <div style={{ fontSize: 36, color: '#111827', textAlign: 'center', marginBottom: '20px', fontWeight: 800, lineHeight: 1.2, maxWidth: '800px' }}>
                            {title}
                        </div>

                        {/* Score Circle */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '180px',
                                height: '180px',
                                borderRadius: '50%',
                                backgroundColor: scoreColor,
                                color: 'white',
                                marginBottom: '40px',
                                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                                position: 'relative',
                            }}
                        >
                            {/* Inner Ring to make it look nicer */}
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '10px',
                                    left: '10px',
                                    right: '10px',
                                    bottom: '10px',
                                    borderRadius: '50%',
                                    border: '2px solid rgba(255,255,255,0.3)',
                                }}
                            />

                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{ fontSize: 16, textTransform: 'uppercase', opacity: 0.9, letterSpacing: '1px' }}>Band Score</div>
                                <div style={{ fontSize: 72, fontWeight: 900, lineHeight: 1 }}>{score}</div>
                            </div>
                        </div>

                        {/* Date */}
                        <div style={{ fontSize: 20, color: '#6B7280', fontWeight: 500 }}>
                            Completed on {date}
                        </div>

                        {/* Footer disclaimer */}
                        <div style={{ position: 'absolute', bottom: '20px', fontSize: 14, color: '#9CA3AF' }}>
                            * Unofficial score for practice purposes only • English with Arik
                        </div>
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
