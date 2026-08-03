import 'dotenv/config';
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

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ─── Error handler (must be last) ─────────────────────────────────────────────
app.use(errorHandler);

// ─── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`[Server] Delivery API running on port ${PORT}`);
});
