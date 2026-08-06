import 'dotenv/config';
// Ensure env is loaded synchronously before any module uses process.env
// (required because dotenvx v17 may not inject before module graph resolves)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const dotenv = require('dotenv'); dotenv.config();

import { startServer } from './server';

startServer().catch((err) => {
  console.error('[Server] failed to start:', err instanceof Error ? err.message : err);
  process.exit(1);
});
