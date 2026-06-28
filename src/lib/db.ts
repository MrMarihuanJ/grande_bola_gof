import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// In serverless environments (Vercel), each function invocation
// creates a new instance. To avoid exhausting database connections,
// we reuse the client in global scope during development.
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// ========== AUTO-MIGRATION ==========
// Runs once per cold start to ensure the database schema matches the Prisma schema.
// This is critical because Prisma Client will SELECT columns that may not exist yet
// in the database after a schema change (e.g., adding penaltyWinner to Bet).

const MIGRATION_KEY = '__bolao_db_migrated__';

async function runAutoMigration() {
  if ((globalThis as any)[MIGRATION_KEY]) return; // Already migrated in this process

  try {
    // Use DIRECT_URL for DDL operations (bypass pgbouncer)
    const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
    if (!url) return; // Can't migrate without a database URL

    const directClient = new PrismaClient({
      datasources: { db: { url } },
      log: ['error'],
    });

    await directClient.$connect();

    // Add penaltyWinner column to Bet if missing
    await directClient.$executeRawUnsafe(
      `ALTER TABLE "Bet" ADD COLUMN IF NOT EXISTS "penaltyWinner" TEXT;`
    );

    // Add phase column to Match if missing
    await directClient.$executeRawUnsafe(
      `ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "phase" TEXT NOT NULL DEFAULT 'groups';`
    );

    // Make round nullable
    try {
      await directClient.$executeRawUnsafe(
        `ALTER TABLE "Match" ALTER COLUMN "round" DROP NOT NULL;`
      );
    } catch (_) { /* already nullable */ }

    // Create PhaseWinner table if missing
    await directClient.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "PhaseWinner" (
        "id" TEXT NOT NULL,
        "phase" TEXT NOT NULL,
        "winnerName" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PhaseWinner_pkey" PRIMARY KEY ("id")
      );
    `);
    await directClient.$executeRawUnsafe(
      `CREATE UNIQUE INDEX IF NOT EXISTS "PhaseWinner_phase_key" ON "PhaseWinner"("phase");`
    );

    // Create indexes if missing
    await directClient.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Match_phase_idx" ON "Match"("phase");`);
    await directClient.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Match_phase_matchNum_idx" ON "Match"("phase", "matchNum");`);

    await directClient.$disconnect();

    (globalThis as any)[MIGRATION_KEY] = true;
    console.log('[auto-migrate] Database schema synchronized successfully');
  } catch (error) {
    console.error('[auto-migrate] Migration failed:', error);
    // Don't throw — the app should still try to work
  }
}

// Run migration eagerly on module load
runAutoMigration();

export { runAutoMigration };
