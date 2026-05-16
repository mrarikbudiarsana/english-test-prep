import { query } from '../config/database';
import { logger } from '../utils/logger';

interface SystemSetting {
  key: string;
  value: any;
  updated_at: Date;
}

// Simple in-memory cache for settings
const cache: Record<string, { value: any; expiresAt: number }> = {};
const CACHE_TTL = 30000; // 30 seconds

export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  const now = Date.now();
  
  // Check cache
  if (cache[key] && cache[key].expiresAt > now) {
    return cache[key].value as T;
  }

  try {
    const result = await query(
      'SELECT value FROM system_settings WHERE key = $1',
      [key]
    );

    let value = defaultValue;
    if (result && result.rows && result.rows.length > 0) {
      value = result.rows[0].value;
      
      // Handle cases where JSONB might return string "true"/"false" instead of boolean
      if (typeof defaultValue === 'boolean' && typeof value === 'string') {
        if (value === 'true') value = true as any;
        if (value === 'false') value = false as any;
      }
    }

    // Update cache
    cache[key] = {
      value,
      expiresAt: now + CACHE_TTL
    };

    return value;
  } catch (error) {
    // Log the error but don't crash the request
    console.error(`Error fetching system setting ${key}:`, error);
    return defaultValue;
  }
}

export async function setSetting(key: string, value: any): Promise<void> {
  try {
    await query(
      `INSERT INTO system_settings (key, value, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
      [key, JSON.stringify(value)]
    );

    // Update cache
    cache[key] = {
      value,
      expiresAt: Date.now() + CACHE_TTL
    };
    
    logger.info(`System setting ${key} updated`, { value });
  } catch (error) {
    logger.error(`Error updating system setting ${key}:`, { error: error instanceof Error ? error.message : 'Unknown error' });
    throw error;
  }
}

export async function isMaintenanceMode(): Promise<boolean> {
  return await getSetting<boolean>('maintenance_mode', false);
}

export async function getAnnouncement(): Promise<{ message: string; active: boolean }> {
  const message = await getSetting<string>('announcement_message', '');
  const active = await getSetting<boolean>('announcement_active', false);
  return { message, active };
}
