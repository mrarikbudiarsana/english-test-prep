import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    // Base backend url (strip trailing /api/v1)
    const backendBase = apiUrl.replace(/\/api\/v1\/?$/, '');

    // Forward verification headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    req.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.startsWith('x-') ||
        lowerKey === 'authorization' ||
        lowerKey === 'content-type'
      ) {
        headers[key] = value;
      }
    });

    // Forward to backend's /api/webhooks/lynk endpoint
    const search = req.nextUrl.search || '';
    const response = await fetch(`${backendBase}/api/webhooks/lynk${search}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Error forwarding Lynk.id webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook proxy error' },
      { status: 500 }
    );
  }
}
