import { NextResponse } from 'next/server';
import { db, ensureMigrated } from '@/lib/db';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'copa2026admin';

export async function GET(request: Request) {
  try {
    await ensureMigrated();

    const { searchParams } = new URL(request.url);
    const password = searchParams.get('password');

    if (!password || password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Acesso negado. Senha inválida.' }, { status: 401 });
    }

    // Fetch data in separate queries to avoid the "Field match is required to return data, got null instead" error.
    // That error happens when using `include: { bets: { include: { match: true } } }` and there are
    // orphaned bets (bets whose matchId references a Match that no longer exists).
    // By fetching separately, we can safely handle orphaned bets.

    const [players, bets, matches] = await Promise.all([
      db.player.findMany({ orderBy: { createdAt: 'asc' } }),
      db.bet.findMany(),
      db.match.findMany({ orderBy: [{ phase: 'asc' }, { round: 'asc' }, { matchNum: 'asc' }] }),
    ]);

    // Build a lookup map for matches
    const matchMap = new Map(matches.map(m => [m.id, m]));

    // Combine the data manually — filter out bets whose match doesn't exist (orphaned)
    const result = players.map(player => {
      const playerBets = bets
        .filter(b => b.playerId === player.id)
        .map(bet => {
          const match = matchMap.get(bet.matchId);
          if (!match) return null; // Orphaned bet — skip
          return {
            ...bet,
            match,
          };
        })
        .filter(Boolean) as Array<typeof bets[0] & { match: typeof matches[0] }>;

      // Sort bets by match order
      playerBets.sort((a, b) => {
        if (a.match.phase !== b.match.phase) return a.match.phase.localeCompare(b.match.phase);
        const roundA = a.match.round ?? 999;
        const roundB = b.match.round ?? 999;
        if (roundA !== roundB) return roundA - roundB;
        return a.match.matchNum - b.match.matchNum;
      });

      return {
        ...player,
        bets: playerBets,
      };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Admin get bets error:', error);
    const message = error?.message || 'Unknown error';

    return NextResponse.json({
      error: 'Erro ao carregar dados do administrador',
      detail: message,
      hint: message.includes('does not exist')
        ? 'O banco de dados precisa de atualização. Acesse /api/setup?password=SUA_SENHA para atualizar o esquema.'
        : message.includes('null instead')
        ? 'Existem apostas órfãs no banco. Acesse /api/admin/cleanup?password=SUA_SENHA para limpar.'
        : 'Verifique as variáveis de ambiente DATABASE_URL e DIRECT_URL na Vercel.',
    }, { status: 500 });
  }
}
