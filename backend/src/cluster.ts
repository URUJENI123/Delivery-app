import 'dotenv/config';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const dotenv = require('dotenv'); dotenv.config();

import cluster from 'cluster';
import os from 'os';

/**
 * Cluster entry point — for multi-process / multi-core deployments.
 *
 *   node dist/cluster.js          → forks CLUSTER_WORKERS (default: # CPUs in prod, 1 in dev)
 *   CLUSTER_WORKERS=4 node dist/cluster.js
 *
 * Requires Redis (REDIS_URL) so rate-limit counters, caches and Socket.IO
 * broadcasts stay consistent across workers. Without Redis the workers run
 * independent in-memory state — fine for dev, not for scale.
 */

const WORKERS =
  parseInt(process.env.CLUSTER_WORKERS ?? '', 10) ||
  (process.env.NODE_ENV === 'production' ? os.cpus().length : 1);

async function startWorker(): Promise<void> {
  const { startServer } = await import('./server');
  await startServer();
}

if (cluster.isPrimary) {
  if (WORKERS <= 1) {
    console.log('[Cluster] single worker mode');
    startWorker().catch((err) => {
      console.error('[Cluster] worker failed to start:', err);
      process.exit(1);
    });
  } else {
    console.log(`[Cluster] primary ${process.pid} forking ${WORKERS} workers`);
    for (let i = 0; i < WORKERS; i++) cluster.fork();

    cluster.on('exit', (worker, code, signal) => {
      console.warn(
        `[Cluster] worker ${worker.process.pid} exited (${signal ?? code}) — restarting`,
      );
      cluster.fork();
    });
  }
} else {
  startWorker().catch((err) => {
    console.error(`[Cluster] worker ${process.pid} failed to start:`, err);
    process.exit(1);
  });
}
