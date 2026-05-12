import { Request } from 'express';

export async function detectLocation(req: Request): Promise<{ country: string | null; city: string | null }> {
  let ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';

  // Clean up IPv6 loopback / local IPv4
  if (
    ip === '::1' ||
    ip === '127.0.0.1' ||
    ip.startsWith('::ffff:127.0.0.1') ||
    ip.startsWith('fe80') ||
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    !ip
  ) {
    // Generate beautiful mock localizations for testing/development
    const mockLocations = [
      { country: 'Indonesia', city: 'Jakarta' },
      { country: 'Indonesia', city: 'Surabaya' },
      { country: 'Indonesia', city: 'Bandung' },
      { country: 'Indonesia', city: 'Medan' },
      { country: 'Indonesia', city: 'Denpasar' },
      { country: 'Indonesia', city: 'Yogyakarta' },
      { country: 'Singapore', city: 'Singapore' },
      { country: 'Malaysia', city: 'Kuala Lumpur' },
    ];
    return mockLocations[Math.floor(Math.random() * mockLocations.length)];
  }

  // Handle multiple IPs in x-forwarded-for (common behind proxies)
  if (ip.includes(',')) {
    ip = ip.split(',')[0].trim();
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);

    const response = await fetch(`http://ip-api.com/json/${ip}`, { signal: controller.signal });
    clearTimeout(timeoutId);

    const data: any = await response.json();
    if (data && data.status === 'success') {
      return {
        country: data.country || null,
        city: data.city || null,
      };
    }
  } catch (err) {
    console.warn('Geolocation lookup failed, falling back to null location:', err);
  }

  return { country: null, city: null };
}
