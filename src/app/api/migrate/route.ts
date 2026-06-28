import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Auto-migration endpoint — adds missing columns to the database
// This runs automatically from the frontend on initial load
// Uses DIRECT_URL for DDL operations (bypass pgbouncer)

function createDirectClient() {
  const directUrl = process.env.DIRECT_URL;
  if (!directUrl) {
    throw new Error('DIRECT_URL not configured');
  }
  return new PrismaClient({
    datasources: {
      db: { url: directUrl },
    },
    log: ['error'],
  });
}

export async function GET() {
  const results: string[] = [];
  let directClient: PrismaClient | null = null;

  try {
    directClient = createDirectClient();
    await directClient.$connect();
    results.push('Connected to database via DIRECT_URL');

    // 1. Add penaltyWinner column to Bet if missing
    try {
      await directClient.$executeRawUnsafe(
        `ALTER TABLE "Bet" ADD COLUMN IF NOT EXISTS "penaltyWinner" TEXT;`
      );
      results.push('Column penaltyWinner added/verified in Bet table');
    } catch (e: any) {
      if (e.message?.includes('already exists') || e.message?.includes('duplicate')) {
        results.push('Column penaltyWinner already exists in Bet table');
      } else {
        results.push('Column penaltyWinner: ' + e.message);
      }
    }

    // 2. Add phase column to Match if missing
    try {
      await directClient.$executeRawUnsafe(
        `ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "phase" TEXT NOT NULL DEFAULT 'groups';`
      );
      results.push('Column phase added/verified in Match table');
    } catch (e: any) {
      if (e.message?.includes('already exists') || e.message?.includes('duplicate')) {
        results.push('Column phase already exists in Match table');
      } else {
        results.push('Column phase: ' + e.message);
      }
    }

    // 3. Make round nullable if needed
    try {
      await directClient.$executeRawUnsafe(
        `ALTER TABLE "Match" ALTER COLUMN "round" DROP NOT NULL;`
      );
      results.push('Column round altered to nullable');
    } catch (e: any) {
      results.push('Column round nullable: ' + (e.message?.includes('already') || e.message?.includes('cannot') ? 'already ok' : e.message));
    }

    // 4. Create PhaseWinner table if missing
    try {
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
      results.push('PhaseWinner table created/verified');
    } catch (e: any) {
      results.push('PhaseWinner table: ' + e.message);
    }

    // 5. Create indexes if missing
    try {
      await directClient.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Match_phase_idx" ON "Match"("phase");`);
      await directClient.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Match_phase_matchNum_idx" ON "Match"("phase", "matchNum");`);
      results.push('Indexes verified');
    } catch (e: any) {
      results.push('Indexes: ' + e.message);
    }

    await directClient.$disconnect();

    return NextResponse.json({
      success: true,
      message: 'Auto-migration completed',
      details: results,
    });
  } catch (error: any) {
    if (directClient) {
      try { await directClient.$disconnect(); } catch (_) {}
    }
    return NextResponse.json({
      success: false,
      message: 'Auto-migration failed',
      error: error.message,
      hint: 'Make sure DIRECT_URL is configured in Vercel environment variables.',
    }, { status: 500 });
  }
}
