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
// IMPORTANT: This will DELETE existing matches and their bets for the phase!
// To prevent accidental data loss, requires ?confirm=true when replacing a phase that has bets.
export async function POST(request: Request) {
  try {
    await ensureMigrated();

    const { searchParams } = new URL(request.url);
    const password = searchParams.get('password');
    const confirm = searchParams.get('confirm') === 'true';

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

    // Check if there are existing matches with bets for this phase
    const existingMatches = await db.match.findMany({
      where: { phase },
      select: { id: true, homeTeam: true, awayTeam: true },
    });

    if (existingMatches.length > 0) {
      const existingMatchIds = existingMatches.map(m => m.id);
      const existingBetCount = await db.bet.count({
        where: { matchId: { in: existingMatchIds } },
      });

      if (existingBetCount > 0 && !confirm) {
        // REFUSE to delete matches that have bets unless explicitly confirmed
        return NextResponse.json({
          error: `ESTA FASE TEM ${existingBetCount} APOSTAS! Reconfigurar vai APAGAR todas essas apostas permanentemente.`,
          existingMatches: existingMatches.map(m => `${m.homeTeam} x ${m.awayTeam}`),
          betCount: existingBetCount,
          warning: 'Se tem certeza, adicione &confirm=true na URL. Ex: /api/admin/phase-matches?password=SUA_SENHA&confirm=true',
          hint: 'Considere usar o endpoint /api/admin/export-json?password=SUA_SENHA para fazer backup antes.',
        }, { status: 409 });
      }
    }

    // Delete existing matches for this phase (cascade deletes bets too)
    const deletedMatches = await db.match.deleteMany({
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
      previousMatchesDeleted: deletedMatches.count,
      count: created.count,
    });
  } catch (error: any) {
    console.error('Configure phase matches error:', error);
    return NextResponse.json({ error: 'Failed to configure phase matches', detail: error.message }, { status: 500 });
  }
}
