import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is not set');

const adapter = new PrismaNeon({ connectionString });
const prisma  = new PrismaClient({ adapter });

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    ?? 'admin@delivery.app';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'Admin1234!';
const ADMIN_NAME     = process.env.ADMIN_NAME     ?? 'Super Admin';

// Platform wallet user — accumulates 100 RWF service fee from every delivery
const PLATFORM_EMAIL = 'platform@delivery.app';
const PLATFORM_NAME  = 'Platform Revenue';

async function main() {
  // ── 1. Admin user ────────────────────────────────────────────────────────────
  const existingAdmin = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });

  if (existingAdmin) {
    if (existingAdmin.role !== 'ADMIN') {
      await prisma.user.update({ where: { email: ADMIN_EMAIL }, data: { role: 'ADMIN' } });
      console.log(`✔ Promoted existing user ${ADMIN_EMAIL} to ADMIN`);
    } else {
      console.log(`✔ Admin user ${ADMIN_EMAIL} already exists — skipping`);
    }
  } else {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await prisma.user.create({
      data: {
        email:         ADMIN_EMAIL,
        passwordHash,
        fullName:      ADMIN_NAME,
        role:          'ADMIN',
        emailVerified: true,
      },
    });
    console.log(`✔ Admin user created:`);
    console.log(`  Email:    ${ADMIN_EMAIL}`);
    console.log(`  Password: ${ADMIN_PASSWORD}`);
    console.log(`\n  ⚠  Change the password after first sign-in!`);
  }

  // ── 2. Platform wallet user ───────────────────────────────────────────────────
  // This is an internal-only user. Its wallet accumulates the 100 RWF service fee
  // from every completed delivery. It has no password and cannot sign in.
  let platformUser = await prisma.user.findUnique({ where: { email: PLATFORM_EMAIL } });

  if (!platformUser) {
    platformUser = await prisma.user.create({
      data: {
        email:         PLATFORM_EMAIL,
        fullName:      PLATFORM_NAME,
        role:          'ADMIN',     // Admin role so it never triggers courier/sender checks
        emailVerified: true,
        isActive:      true,
      },
    });
    console.log(`✔ Platform wallet user created (id: ${platformUser.id})`);
  } else {
    console.log(`✔ Platform wallet user already exists (id: ${platformUser.id})`);
  }

  // Ensure the platform wallet row exists
  await prisma.wallet.upsert({
    where:  { userId: platformUser.id },
    create: { userId: platformUser.id, balance: 0 },
    update: {},
  });

  // ── 3. Print instructions ─────────────────────────────────────────────────────
  const envLine = `PLATFORM_WALLET_USER_ID=${platformUser.id}`;
  const currentEnvId = process.env.PLATFORM_WALLET_USER_ID;

  if (!currentEnvId) {
    console.log(`\n──────────────────────────────────────────────────────`);
    console.log(`  ACTION REQUIRED — add this line to backend/.env:`);
    console.log(`\n  ${envLine}\n`);
    console.log(`  Without it the 100 RWF service fee won't be tracked.`);
    console.log(`──────────────────────────────────────────────────────\n`);
  } else if (currentEnvId !== platformUser.id) {
    console.log(`\n⚠  PLATFORM_WALLET_USER_ID in .env doesn't match the DB.`);
    console.log(`  Update it to: ${platformUser.id}\n`);
  } else {
    console.log(`✔ PLATFORM_WALLET_USER_ID is correctly set in .env`);
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
