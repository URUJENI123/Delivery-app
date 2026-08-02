// db.service.ts — re-exported PrismaService for backwards compatibility.
// All services now import PrismaService directly; this file is kept to avoid
// breaking any imports that still reference DbService during migration.
export { PrismaService as DbService } from './prisma.service';
