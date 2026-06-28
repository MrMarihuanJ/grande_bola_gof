import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

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
    const { searchParams } = new URL(request.url);
    const password = searchParams.get('password');

    if (!password || password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 401 });
    }

    const matches = await db.match.findMany({
      orderBy: [{ round: 'asc' }, { matchNum: 'asc' }],
    });

    const players = await db.player.findMany({
      include: {
        bets: true,
      },
      orderBy: { name: 'asc' },
    });

    // Build CSV with timestamps
    const headers = [
      'Jogador',
      'Data Registro',
      'Ultima Atualizacao',
      ...matches.map(m => `${m.round}ª Rod - ${m.homeTeam} x ${m.awayTeam}`),
      ...matches.map(m => `Horario ${m.round}ª Rod - ${m.homeTeam} x ${m.awayTeam}`),
    ];

    const rows = players.map(p => {
      const betMap = new Map(p.bets.map(b => [b.matchId, b]));

      // Find last updated bet
      const filledBets = p.bets.filter(b => b.homeScore !== null || b.awayScore !== null);
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
          result += ` (Pên: ${penaltyTeam})`;
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
