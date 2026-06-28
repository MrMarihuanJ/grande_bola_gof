import { NextResponse } from 'next/server';
import { db, ensureMigrated } from '@/lib/db';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'copa2026admin';

// GET - Return matches for a specific phase
export async function GET(request: Request) {
  try {
    await ensureMigrated();

    const { searchParams } = new URL(request.url);
    const phase = searchParams.get('phase');

    if (!phase) {
      return NextResponse.json({ error: 'phase parameter is required' }, { status: 400 });
    }

    const matches = await db.match.findMany({
      where: { phase },
      orderBy: [{ matchNum: 'asc' }],
    });

    return NextResponse.json(matches);
  } catch (error) {
    console.error('Fetch phase matches error:', error);
    return NextResponse.json({ error: 'Failed to fetch phase matches' }, { status: 500 });
  }
}

// POST - Configure matches for a knockout phase (admin only)
export async function POST(request: Request) {
  try {
    await ensureMigrated();

    const { searchParams } = new URL(request.url);
    const password = searchParams.get('password');

    if (!password || password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Acesso negado. Senha inválida.' }, { status: 401 });
    }

    const body = await request.json();
    const { phase, matches } = body;

    if (!phase || !matches || !Array.isArray(matches)) {
      return NextResponse.json({ error: 'phase and matches array are required' }, { status: 400 });
    }

    if (phase === 'groups') {
      return NextResponse.json({ error: 'Cannot configure groups phase via this endpoint. Use setup instead.' }, { status: 400 });
    }

    // Validate matches
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      if (!match.homeTeam || !match.awayTeam || !match.homeName || !match.awayName) {
        return NextResponse.json(
          { error: `Match ${i + 1} is incomplete. Both home and away teams must be selected.` },
          { status: 400 }
        );
      }
      if (match.homeTeam === match.awayTeam) {
        return NextResponse.json(
          { error: `Match ${i + 1}: Home and away teams cannot be the same (${match.homeTeam}).` },
          { status: 400 }
        );
      }
    }

    // Delete existing matches for this phase (cascade deletes bets too)
    await db.match.deleteMany({
      where: { phase },
    });

    // Create new matches
    const created = await db.match.createMany({
      data: matches.map((match: any, index: number) => ({
        round: null,
        matchNum: match.matchNum || (index + 1),
        phase,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        homeName: match.homeName,
        awayName: match.awayName,
      })),
    });

    return NextResponse.json({
      success: true,
      message: `${created.count} jogos configurados para a fase "${phase}"`,
      count: created.count,
    });
  } catch (error: any) {
    console.error('Configure phase matches error:', error);
    return NextResponse.json({ error: 'Failed to configure phase matches', detail: error.message }, { status: 500 });
  }
}
