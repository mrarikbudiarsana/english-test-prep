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

// Full migrations are best-effort in serverless deployments; auth only waits for
// the small schema guard below so a bundled migration-file issue cannot brick login.
runMigrations(false).catch((err) => {
  logger.error('Failed to run database migrations on startup', { error: err.message });
});

const authSchemaReady = ensureAuthSchema();

const allowedOrigins = env.corsOrigin
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Trust Vercel/proxy X-Forwarded-For headers for rate limiting
app.set('trust proxy', 1);

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

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS origin not allowed: ${origin}`));
  },
  credentials: true,
}));

// Rate limiting
app.use(generalLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1/auth', async (_req, _res, next) => {
  try {
    await authSchemaReady;
    next();
  } catch (error) {
    next(error);
  }
});

// Maintenance check
app.use(maintenanceMiddleware);

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

// Error handler
app.use(errorHandler);

async function ensureAuthSchema() {
  await query(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS preferred_exam_type VARCHAR(20)
        CHECK (preferred_exam_type IN ('ielts', 'toefl_ibt', 'toefl_itp', 'pte')),
      ADD COLUMN IF NOT EXISTS country VARCHAR(100),
      ADD COLUMN IF NOT EXISTS city VARCHAR(100)
  `);
}

export default app;
