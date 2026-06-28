import { NextResponse } from 'next/server';
import { db, runAutoMigration } from '@/lib/db';

// GET - Public endpoint to return all phase winners (no auth needed)
export async function GET() {
  try {
    // Ensure DB schema is up-to-date (PhaseWinner table might not exist yet)
    await runAutoMigration();

    const winners = await db.phaseWinner.findMany({
      orderBy: { phase: 'asc' },
    });

    return NextResponse.json(winners);
  } catch (error) {
    console.error('Fetch phase winners error:', error);
    return NextResponse.json({ error: 'Failed to fetch phase winners' }, { status: 500 });
  }
}
