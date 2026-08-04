import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Required for the Neon serverless WebSocket driver in Node.js environments
neonConfig.webSocketConstructor = ws;

let _prisma: PrismaClient | undefined;

function getPrisma(): PrismaClient {
  if (_prisma) return _prisma;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set. Check your .env file.');
  }

  // PrismaNeon passes config directly to new Pool(config).
  // The Neon serverless Pool (v1.x) requires a config object — not a bare string.
  const adapter = new PrismaNeon({ connectionString });

  _prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

  return _prisma;
}

// Proxy that forwards all property accesses to the lazily-created client.
// This ensures process.env.DATABASE_URL is read after dotenv has loaded.
const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return (getPrisma() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export default prisma;
