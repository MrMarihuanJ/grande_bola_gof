import { NextResponse } from 'next/server';
import { db, ensureMigrated } from '@/lib/db';

export async function GET(request: Request) {
  try {
    await ensureMigrated();
    const { searchParams } = new URL(request.url);
    const phase = searchParams.get('phase');
    const all = searchParams.get('all');

    if (all === 'true') {
      // Return all matches across all phases
      const matches = await db.match.findMany({
        orderBy: [{ phase: 'asc' }, { round: 'asc' }, { matchNum: 'asc' }],
      });
      return NextResponse.json(matches);
    }

    if (phase) {
      // Return matches for a specific phase
      const matches = await db.match.findMany({
        where: { phase },
        orderBy: [{ matchNum: 'asc' }],
      });
      return NextResponse.json(matches);
    }

    // Default: return group stage matches only
    const matches = await db.match.findMany({
      where: { phase: 'groups' },
      orderBy: [{ round: 'asc' }, { matchNum: 'asc' }],
    });
    return NextResponse.json(matches);
  } catch (error) {
    console.error('Fetch matches error:', error);
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
  }
}
