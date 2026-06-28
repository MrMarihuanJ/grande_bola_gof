import { NextResponse } from 'next/server';
import { db, ensureMigrated } from '@/lib/db';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'copa2026admin';

function formatDate(date: Date): string {
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  });
}

export async function GET(request: Request) {
  try {
    await ensureMigrated();

    const { searchParams } = new URL(request.url);
    const password = searchParams.get('password');

    if (!password || password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 401 });
    }

    // Fetch separately to avoid "Field match is required" error from orphaned bets
    const [matches, players, bets] = await Promise.all([
      db.match.findMany({
        orderBy: [{ phase: 'asc' }, { round: 'asc' }, { matchNum: 'asc' }],
      }),
      db.player.findMany({ orderBy: { name: 'asc' } }),
      db.bet.findMany(),
    ]);

    // Build bet lookup per player
    const betsByPlayer = new Map<string, typeof bets>();
    for (const bet of bets) {
      if (!betsByPlayer.has(bet.playerId)) betsByPlayer.set(bet.playerId, []);
      betsByPlayer.get(bet.playerId)!.push(bet);
    }

    // Build CSV with timestamps
    const headers = [
      'Jogador',
      'Data Registro',
      'Ultima Atualizacao',
      ...matches.map(m => `${m.round ?? '?'}ª Rod - ${m.homeTeam} x ${m.awayTeam}`),
      ...matches.map(m => `Horario ${m.round ?? '?'}ª Rod - ${m.homeTeam} x ${m.awayTeam}`),
    ];

    const rows = players.map(p => {
      const playerBets = betsByPlayer.get(p.id) || [];
      const betMap = new Map(playerBets.map(b => [b.matchId, b]));

      // Find last updated bet
      const filledBets = playerBets.filter(b => b.homeScore !== null || b.awayScore !== null);
      const lastUpdated = filledBets.length > 0
        ? formatDate(new Date(Math.max(...filledBets.map(b => new Date(b.updatedAt).getTime()))))
        : '-';

      const scores = matches.map(m => {
        const bet = betMap.get(m.id);
        if (!bet || (bet.homeScore === null && bet.awayScore === null)) return '-';
        let result = `${bet.homeScore ?? '-'}x${bet.awayScore ?? '-'}`;
        // Add penalty info for knockout draws
        if (bet.penaltyWinner && bet.homeScore === bet.awayScore && m.phase !== 'groups') {
          const penaltyTeam = bet.penaltyWinner === 'home' ? m.homeTeam : m.awayTeam;
          result += ` (Pen: ${penaltyTeam})`;
        }
        return result;
      });

      const timestamps = matches.map(m => {
        const bet = betMap.get(m.id);
        if (!bet || (bet.homeScore === null && bet.awayScore === null)) return '-';
        return formatDate(new Date(bet.updatedAt));
      });

      return [p.name, formatDate(new Date(p.createdAt)), lastUpdated, ...scores, ...timestamps];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename=palpites_copa2026.csv',
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Erro ao exportar dados' }, { status: 500 });
  }
}
