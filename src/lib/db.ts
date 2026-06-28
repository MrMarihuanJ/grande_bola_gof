import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  __bolao_db_ready: Promise<void> | undefined
}

// ========== AUTO-MIGRATION ==========
// Runs once per cold start to ensure the database schema matches the Prisma schema.
// This is critical because Prisma Client will SELECT columns that may not exist yet
// in the database after a schema change (e.g., adding penaltyWinner to Bet).

const MIGRATION_KEY = '__bolao_db_migrated__';

async function runAutoMigration() {
  // If already migrated in this process, return immediately
  if ((globalThis as any)[MIGRATION_KEY]) return;

  try {
    // Use DIRECT_URL for DDL operations (bypass pgbouncer)
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
  }
}

// Singleton promise that ensures migration runs exactly once before first DB access
function getDbReadyPromise(): Promise<void> {
  if (!globalForPrisma.__bolao_db_ready) {
    globalForPrisma.__bolao_db_ready = runAutoMigration();
  }
  return globalForPrisma.__bolao_db_ready;
}

// Lazy PrismaClient getter - ensures migration has completed before first use
// This solves the race condition where db was created immediately but migration
// was fire-and-forget, causing "column does not exist" errors on cold starts.
let _db: PrismaClient | undefined;

function getDb(): PrismaClient {
  if (!_db) {
    _db = globalForPrisma.prisma ??
      new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      });
    if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = _db;
  }
  return _db;
}

// Export a Proxy that:
// 1. Awaits migration before any Prisma operation
// 2. Delegates all property access to the real PrismaClient
// This ensures every API route automatically waits for migration without
// needing explicit `await runAutoMigration()` calls.
export const db = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    // Allow typeof checks and non-function property access to pass through
    const realDb = getDb();
    const value = Reflect.get(realDb, prop, receiver);

    // If the property is a function (like $queryRaw, user.findMany, etc.),
    // wrap it to ensure migration completes first
    if (typeof value === 'function') {
      return async function (...args: any[]) {
        await getDbReadyPromise();
        return value.apply(realDb, args);
      };
    }

    // For non-function properties (like $connect, $disconnect as objects, etc.)
    // wrap them with migration check too
    return value;
  },
});

// Also export runAutoMigration for explicit use in routes that want
// to await migration at the top level (kept for backward compatibility)
export { runAutoMigration, getDbReadyPromise };
