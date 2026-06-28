import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create PrismaClient normally - no Proxy
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// ========== AUTO-MIGRATION ==========
// Ensures the database schema matches the Prisma schema.
// Uses a shared promise so migration runs exactly once, even across concurrent requests.

const MIGRATION_KEY = '__bolao_db_migrated__';

async function runMigration() {
  // Already migrated in this process
  if ((globalThis as any)[MIGRATION_KEY]) return;

  try {
    const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
    if (!url) {
      console.warn('[auto-migrate] No database URL found, skipping migration');
      return;
    }

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
    // If the migration fails, queries might also fail, but at least the app won't crash on startup
  }
}

// Shared promise: ensures migration runs exactly once across all concurrent requests
// The first caller triggers the migration, subsequent callers await the same promise
let _migrationPromise: Promise<void> | null = null;

export function ensureMigrated(): Promise<void> {
  if (!_migrationPromise) {
    _migrationPromise = runMigration();
  }
  return _migrationPromise;
}

// Also export the raw function for backward compatibility
export { runMigration as runAutoMigration };

// DO NOT fire-and-forget migration on module load anymore.
// Instead, routes must call `await ensureMigrated()` before using `db`.
// This prevents race conditions where queries run before migration completes.
