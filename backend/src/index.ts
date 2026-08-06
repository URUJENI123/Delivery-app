import 'dotenv/config';
// Ensure env is loaded synchronously before any module uses process.env
// (required because dotenvx v17 may not inject before module graph resolves)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const dotenv = require('dotenv'); dotenv.config();
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import { errorHandler } from './middleware/errorHandler';
import { DeliveryGateway } from './lib/socket';
import { setGateway as setDeliveriesGateway } from './services/deliveries';
import { setGateway as setChatGateway } from './services/chat';
import { setGateway as setAdminGateway } from './services/admin';
import { setGateway as setCouriersGateway } from './services/couriers';
import { setGateway as setWalletGateway } from './services/wallet';
import { setGateway as setRefundsGateway } from './services/refunds';
import prisma from './lib/prisma';

import authRoutes     from './routes/auth';
import deliveryRoutes from './routes/deliveries';
import courierRoutes  from './routes/couriers';
import adminRoutes    from './routes/admin';
import walletRoutes   from './routes/wallet';
import senderRoutes   from './routes/sender';
import storageRoutes  from './routes/storage';
import trackingRoutes from './routes/tracking';
import userRoutes     from './routes/users';
import chatRoutes     from './routes/chat';
import geocodingRoutes from './routes/geocoding';

const app        = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin:      process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  path: '/ws',
});

const gateway = new DeliveryGateway(io);
setDeliveriesGateway(gateway);
setChatGateway(gateway);
setAdminGateway(gateway);
setCouriersGateway(gateway);
setWalletGateway(gateway);
setRefundsGateway(gateway);

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(
  cors({
    origin:      process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use(
  rateLimit({
    windowMs:       60_000,
    max:            100,
    standardHeaders: true,
    legacyHeaders:  false,
  }),
);

// ─── Routes ───────────────────────────────────────────────────────────────────
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

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ─── Error handler (must be last) ─────────────────────────────────────────────
app.use(errorHandler);

// ─── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, async () => {
  console.log(`[Server] Delivery API running on port ${PORT}`);

  // Pre-warm the Neon compute — it suspends after inactivity and the first
  // query after a cold start can be slow. A single cheap ping wakes it up
  // before real traffic arrives.
  const MAX_ATTEMPTS = 5;
  const DELAY_MS     = 2_000;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('[DB] Neon compute is active');
      break;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (attempt < MAX_ATTEMPTS) {
        console.warn(`[DB] Neon not ready (attempt ${attempt}/${MAX_ATTEMPTS}): ${msg} — retrying in ${DELAY_MS}ms`);
        await new Promise(r => setTimeout(r, DELAY_MS));
      } else {
        console.error(`[DB] Could not reach Neon after ${MAX_ATTEMPTS} attempts: ${msg}`);
        console.error('[DB] Check DATABASE_URL in .env and verify Neon project status');
      }
    }
  }
});
