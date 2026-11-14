import express from 'express';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { logger } from './utils/logger';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimiter';
import { maintenanceMiddleware } from './middleware/maintenance';
import routes from './routes';
import webhookRoutes from './routes/webhook.routes';
import { runMigrations } from './migrate';
import { query } from './config/database';

const app = express();

// Initialize Sentry only if DSN is provided
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [
      nodeProfilingIntegration(),
    ],
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
  });
  // Sentry RequestHandler must be the first middleware on the app
  Sentry.setupExpressErrorHandler(app);
}

// Migrations are handled by the migrationsReady promise and the /api/v1 gate below.
// Disabled full runner on startup in production (Vercel) to prevent parallel cold starts from locking the database and causing 504 Gateway Timeouts.
const migrationsReady = env.nodeEnv === 'development'
  ? runMigrations(false).catch((err) => {
      logger.error('Failed to run database migrations on startup', { error: err.message });
    })
  : Promise.resolve();

// Ensure critical test_credits column and constraints exist immediately (idempotent, ~2ms, no locks)
query(`
  ALTER TABLE users ADD COLUMN IF NOT EXISTS test_credits INTEGER NOT NULL DEFAULT 0;
  ALTER TABLE users ALTER COLUMN firebase_uid DROP NOT NULL;
  CREATE TABLE IF NOT EXISTS lynk_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    email VARCHAR(255) NOT NULL,
    transaction_id VARCHAR(255) UNIQUE NOT NULL,
    amount DECIMAL(12,2),
    credits_added INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'paid',
    checkout_url VARCHAR(255),
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_lynk_transactions_email ON lynk_transactions(email);
  CREATE INDEX IF NOT EXISTS idx_lynk_transactions_tx_id ON lynk_transactions(transaction_id);
  CREATE TABLE IF NOT EXISTS test_credit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    change_amount INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    reason VARCHAR(100) NOT NULL,
    reference_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_test_credit_logs_user ON test_credit_logs(user_id);
  CREATE INDEX IF NOT EXISTS idx_test_credit_logs_email ON test_credit_logs(email);
`).catch((err) => {
  logger.warn('Schema credit column auto-check skipped:', { error: err.message });
});

const allowedOrigins = env.corsOrigin
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Trust Vercel/proxy X-Forwarded-For headers for rate limiting
app.set('trust proxy', 1);

// Disable caching for API responses to prevent CORS issues with 304 Not Modified
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Security middleware
app.use(helmet({
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server, curl, and same-origin requests without Origin header.
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin) || origin.endsWith('.englishwitharik.com') || origin === 'https://englishwitharik.com') {
      callback(null, true);
      return;
    }

    const error = new Error(`CORS origin not allowed: ${origin}`);
    (error as any).statusCode = 403; // Forbidden
    callback(error);
  },
  credentials: true,
}));

// Rate limiting
app.use(generalLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1', async (_req, _res, next) => {
  try {
    await migrationsReady;
    next();
  } catch (error) {
    next(error);
  }
});

// Maintenance check
app.use(maintenanceMiddleware);

// Webhook routes (Direct mount for /api/webhooks/lynk)
app.use('/api/webhooks', webhookRoutes);

// API routes
app.use('/api/v1', routes);

// Welcome route
app.get('/', (_req, res) => {
  res.json({ message: 'Welcome to English Test Prep API' });
});

// Health check
app.get('/health', async (_req, res) => {
  try {
    await query('SELECT 1');
    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Health check database error', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// System Status (Public)
app.get('/api/v1/system/status', async (_req, res) => {
  try {
    const maintenanceMode = await query('SELECT value FROM system_settings WHERE key = $1', ['maintenance_mode']);
    res.json({
      maintenanceMode: maintenanceMode.rows[0]?.value === true
    });
  } catch (error) {
    res.json({ maintenanceMode: false });
  }
});

// Run Migrations (Manual trigger for production Vercel)
app.all('/api/v1/system/migrate', async (req, res) => {
  try {
    const secret = req.headers['x-migration-secret'] || req.query.secret || req.body?.secret;
    const expectedSecret = process.env.MIGRATION_SECRET || 'dev_secret_override_123';
    
    if (secret !== expectedSecret) {
      return res.status(401).json({ error: 'Unauthorized: Invalid migration secret.' });
    }
    
    await runMigrations(false);
    res.json({ success: true, message: 'Migrations completed successfully' });
  } catch (error: any) {
    logger.error('Manual migration error', { error: error.message });
    res.status(500).json({ error: error.message || 'Migration failed' });
  }
});

// Seed Mock Test 5 (Manual trigger for production Vercel)
app.all('/api/v1/system/seed-mock-5', async (req, res) => {
  try {
    const secret = req.headers['x-migration-secret'] || req.query.secret || req.body?.secret;
    const expectedSecret = process.env.MIGRATION_SECRET || 'dev_secret_override_123';
    
    if (secret !== expectedSecret) {
      return res.status(401).json({ error: 'Unauthorized: Invalid migration secret.' });
    }
    
    const { seedMockTest5 } = await import('./seeds/mock_test_5_seeder');
    const result = await seedMockTest5();
    res.json(result);
  } catch (error: any) {
    logger.error('Mock Test 5 seeding error', { error: error.message });
    res.status(500).json({ error: error.message || 'Seeding failed' });
  }
});

// Seed Mock Test 6 (Manual trigger for production Vercel)
app.all('/api/v1/system/seed-mock-6', async (req, res) => {
  try {
    const secret = req.headers['x-migration-secret'] || req.query.secret || req.body?.secret;
    const expectedSecret = process.env.MIGRATION_SECRET || 'dev_secret_override_123';

    if (secret !== expectedSecret) {
      return res.status(401).json({ error: 'Unauthorized: Invalid migration secret.' });
    }

    const { seedMockTest6 } = await import('./seeds/mock_test_6_seeder');
    const result = await seedMockTest6();
    res.json(result);
  } catch (error: any) {
    logger.error('Mock Test 6 seeding error', { error: error.message });
    res.status(500).json({ error: error.message || 'Seeding failed' });
  }
});

// Error handler
app.use(errorHandler);

// Schema initialization is now handled by migrations and the migrationsReady gate.

export default app;
