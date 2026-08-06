import 'dotenv/config';
// Ensure env is loaded synchronously before any module uses process.env
// (required because dotenvx v17 may not inject before module graph resolves)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const dotenv = require('dotenv'); dotenv.config();

import express from 'express';
import { createServer, Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import { errorHandler } from './middleware/errorHandler';
import { DeliveryGateway } from './lib/socket';
import { createLimiter } from './lib/rateLimit';
import { getRedis, isRedisEnabled } from './lib/redis';
import { setGateway as setDeliveriesGateway } from './services/deliveries';
import { setGateway as setChatGateway } from './services/chat';
import { setGateway as setAdminGateway } from './services/admin';
import { setGateway as setCouriersGateway } from './services/couriers';
import { setGateway as setWalletGateway } from './services/wallet';
import { setGateway as setRefundsGateway } from './services/refunds';
import prisma from './lib/prisma';

import authRoutes      from './routes/auth';
import deliveryRoutes  from './routes/deliveries';
import courierRoutes   from './routes/couriers';
import adminRoutes     from './routes/admin';
import walletRoutes    from './routes/wallet';
import senderRoutes    from './routes/sender';
import storageRoutes   from './routes/storage';
import trackingRoutes  from './routes/tracking';
import userRoutes      from './routes/users';
import chatRoutes      from './routes/chat';
import geocodingRoutes from './routes/geocoding';

/**
 * Builds the Express app + HTTP server + Socket.IO gateway.
 * Safe to call once per process (single entry or a cluster worker).
 */
export async function createAppServer(): Promise<{ app: express.Express; httpServer: HttpServer; io: Server }> {
  const app        = express();
  const httpServer = createServer(app);

  // Behind nginx/load balancers req.ip must be the real client address —
  // required for correct per-IP rate limiting.
  const trustProxy = process.env.TRUST_PROXY ?? (process.env.NODE_ENV === 'production' ? '1' : '0');
  if (trustProxy !== '0' && trustProxy !== 'false') {
    app.set('trust proxy', /^\d+$/.test(trustProxy) ? parseInt(trustProxy, 10) : trustProxy);
  }

  const io = new Server(httpServer, {
    cors: {
      origin:      process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    },
    path: '/ws',
  });

  // Socket.IO Redis adapter — lets events broadcast across all backend
  // instances (required in cluster / multi-replica mode). Falls back to
  // in-process rooms when Redis is not configured.
  if (isRedisEnabled()) {
    const { createAdapter } = await import('@socket.io/redis-adapter');
    const pub = getRedis()!;
    const sub = pub.duplicate();
    io.adapter(createAdapter(pub, sub));
    console.log('[Socket] Redis adapter enabled — broadcasts shared across instances');
  }

  const gateway = new DeliveryGateway(io);
  setDeliveriesGateway(gateway);
  setChatGateway(gateway);
  setAdminGateway(gateway);
  setCouriersGateway(gateway);
  setWalletGateway(gateway);
  setRefundsGateway(gateway);

  // ─── Middleware ───────────────────────────────────────────────────────────
  app.use(
    cors({
      origin:      process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(cookieParser());

  // Global catch-all rate limit (200 req/min/IP by default, shared across instances)
  const globalMax = parseInt(process.env.RATE_LIMIT_GLOBAL_MAX ?? '200', 10);
  app.use(createLimiter('global', { max: globalMax }));

  // ─── Routes ───────────────────────────────────────────────────────────────
  const v1 = '/api/v1';
  app.use(`${v1}/auth`,        authRoutes);
  app.use(`${v1}/deliveries`,  deliveryRoutes);
  app.use(`${v1}/couriers`,    courierRoutes);
  app.use(`${v1}/admin`,       adminRoutes);
  app.use(`${v1}/wallet`,      walletRoutes);
  app.use(`${v1}/sender`,      senderRoutes);
  app.use(`${v1}/storage`,     storageRoutes);
  app.use(`${v1}/track`,       trackingRoutes);
  app.use(`${v1}/users`,       userRoutes);
  app.use(`${v1}/chat`,        chatRoutes);
  app.use(`${v1}/geocode`,     geocodingRoutes);

  // ─── Health check ─────────────────────────────────────────────────────────
  app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

  // ─── Error handler (must be last) ─────────────────────────────────────────
  app.use(errorHandler);

  return { app, httpServer, io };
}

/** Wakes the Neon compute so the first real query after a cold start is fast. */
async function warmNeon(): Promise<void> {
  const MAX_ATTEMPTS = 5;
  const DELAY_MS     = 2_000;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('[DB] Neon compute is active');
      return;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (attempt < MAX_ATTEMPTS) {
        console.warn(`[DB] Neon not ready (attempt ${attempt}/${MAX_ATTEMPTS}): ${msg} — retrying in ${DELAY_MS}ms`);
        await new Promise(r => setTimeout(r, DELAY_MS));
      } else {
        console.error(`[DB] Could not reach Neon after ${MAX_ATTEMPTS} attempts: ${msg}`);
      }
    }
  }
}

/**
 * Starts the API server on the given port (defaults to PORT env / 3001).
 * Returns the underlying HTTP server.
 */
export async function startServer(port?: number): Promise<HttpServer> {
  const { httpServer } = await createAppServer();
  const PORT = port ?? parseInt(process.env.PORT ?? '3001', 10);

  httpServer.listen(PORT, () => {
    console.log(`[Server] Delivery API running on port ${PORT} (pid ${process.pid})`);
    warmNeon();
  });

  return httpServer;
}
