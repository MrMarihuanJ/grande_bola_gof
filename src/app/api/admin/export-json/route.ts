import { NextResponse } from 'next/server';
import { db, ensureMigrated } from '@/lib/db';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'copa2026admin';

// Export ALL raw data as JSON — useful for debugging and backup
export async function GET(request: Request) {
  try {
    await ensureMigrated();

    const { searchParams } = new URL(request.url);
    const password = searchParams.get('password');

    if (!password || password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 401 });
    }

    const [players, matches, bets, phaseWinners] = await Promise.all([
      db.player.findMany({ orderBy: { name: 'asc' } }),
      db.match.findMany({ orderBy: [{ phase: 'asc' }, { round: 'asc' }, { matchNum: 'asc' }] }),
      db.bet.findMany({ orderBy: { createdAt: 'asc' } }),
      db.phaseWinner.findMany({ orderBy: { phase: 'asc' } }),
    ]);

    // Group bets by phase for easy analysis
    const matchMap = new Map(matches.map(m => [m.id, m]));
    const betsByPhase: Record<string, number> = {};
    const betsByRound: Record<string, number> = {};
    const orphanedBets: typeof bets = [];

    for (const bet of bets) {
      const match = matchMap.get(bet.matchId);
      if (!match) {
        orphanedBets.push(bet);
      } else {
        const phase = match.phase || 'unknown';
        const round = match.round ?? 0;
        betsByPhase[phase] = (betsByPhase[phase] || 0) + 1;
        betsByRound[`${phase}-rod${round}`] = (betsByRound[`${phase}-rod${round}`] || 0) + 1;
      }
    }

    return NextResponse.json({
      summary: {
        totalPlayers: players.length,
        totalMatches: matches.length,
        totalBets: bets.length,
        orphanedBets: orphanedBets.length,
        phaseWinners: phaseWinners.length,
        betsByPhase,
        betsByRound,
      },
      players,
      matches,
      bets,
      phaseWinners,
      orphanedBets: orphanedBets.length > 0 ? orphanedBets : undefined,
    }, { status: 200 });
  } catch (error: any) {
    console.error('Export JSON error:', error);
    return NextResponse.json({
      error: 'Erro ao exportar dados',
      detail: error.message,
    }, { status: 500 });
  }
}
