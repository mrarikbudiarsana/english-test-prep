import { Request } from 'express';
import { env } from '../config/env';

export async function detectLocation(req: Request): Promise<{ country: string | null; city: string | null }> {
  const vercelLocation = getVercelLocation(req);
  if (vercelLocation.country || vercelLocation.city) {
    return vercelLocation;
  }

  const ip = getRequestIp(req);

  if (!ip || isPrivateIp(ip)) {
    if (env.nodeEnv !== 'development') {
      return { country: null, city: null };
    }

    // Generate mock localizations for local development.
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

function getVercelLocation(req: Request) {
  const countryCode = getHeader(req, 'x-vercel-ip-country')?.toUpperCase() || null;
  const city = decodeHeaderValue(getHeader(req, 'x-vercel-ip-city'));

  return {
    country: countryCode ? getCountryName(countryCode) : null,
    city,
  };
}

function getRequestIp(req: Request) {
  const forwardedFor =
    getHeader(req, 'x-vercel-forwarded-for') ||
    getHeader(req, 'x-forwarded-for') ||
    getHeader(req, 'x-real-ip') ||
    req.socket.remoteAddress ||
    '';

  return forwardedFor.split(',')[0].trim().replace(/^::ffff:/, '');
}

function getHeader(req: Request, headerName: string) {
  const value = req.headers[headerName];
  return Array.isArray(value) ? value[0] : value;
}

function decodeHeaderValue(value?: string) {
  if (!value) return null;

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function getCountryName(countryCode: string) {
  try {
    const displayNames = new (Intl as any).DisplayNames(['en'], { type: 'region' });
    return displayNames.of(countryCode) || countryCode;
  } catch {
    return countryCode;
  }
}

function isPrivateIp(ip: string) {
  return (
    ip === '::1' ||
    ip === '127.0.0.1' ||
    ip.startsWith('fe80') ||
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)
  );
}
