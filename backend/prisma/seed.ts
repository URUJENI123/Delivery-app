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

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });

  if (existing) {
    if (existing.role !== 'ADMIN') {
      await prisma.user.update({ where: { email: ADMIN_EMAIL }, data: { role: 'ADMIN' } });
      console.log(`✔ Promoted existing user ${ADMIN_EMAIL} to ADMIN`);
    } else {
      console.log(`✔ Admin user ${ADMIN_EMAIL} already exists — skipping`);
    }
    return;
  }

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
  console.log(`\n  Change the password after first sign-in!`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
