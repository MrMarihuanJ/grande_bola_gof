import { NextResponse } from 'next/server';
import { db, runAutoMigration } from '@/lib/db';

export async function GET(request: Request) {
  try {
    // Ensure DB schema is up-to-date before querying
    await runAutoMigration();

    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('playerId');

    if (!playerId) {
      return NextResponse.json({ error: 'playerId is required' }, { status: 400 });
    }

    const bets = await db.bet.findMany({
      where: { playerId },
      include: { match: true },
      orderBy: [{ match: { round: 'asc' } }, { match: { matchNum: 'asc' } }],
    });

    return NextResponse.json(bets);
  } catch (error) {
    console.error('Get bets error:', error);
    return NextResponse.json({ error: 'Failed to fetch bets' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Ensure DB schema is up-to-date before writing
    await runAutoMigration();

    const { playerId, bets } = await request.json();

    if (!playerId || !bets || !Array.isArray(bets)) {
      return NextResponse.json({ error: 'playerId and bets array are required' }, { status: 400 });
    }

    // Verify player exists
    const player = await db.player.findUnique({ where: { id: playerId } });
    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // Validate each bet
    for (const bet of bets) {
      if (!bet.matchId) {
        return NextResponse.json({ error: 'matchId is required for each bet' }, { status: 400 });
      }
      if (bet.homeScore !== null && bet.homeScore !== undefined) {
        const hs = Number(bet.homeScore);
        if (isNaN(hs) || hs < 0 || hs > 30 || !Number.isInteger(hs)) {
          return NextResponse.json(
            { error: `Placar inválido para mandante no jogo ${bet.matchId}. Use números inteiros de 0 a 30.` },
            { status: 400 }
          );
        }
      }
      if (bet.awayScore !== null && bet.awayScore !== undefined) {
        const as_ = Number(bet.awayScore);
        if (isNaN(as_) || as_ < 0 || as_ > 30 || !Number.isInteger(as_)) {
          return NextResponse.json(
            { error: `Placar inválido para visitante no jogo ${bet.matchId}. Use números inteiros de 0 a 30.` },
            { status: 400 }
          );
        }
      }
      // Validate penaltyWinner — must be "home" or "away" (or null/undefined)
      if (bet.penaltyWinner !== null && bet.penaltyWinner !== undefined) {
        if (bet.penaltyWinner !== 'home' && bet.penaltyWinner !== 'away') {
          return NextResponse.json(
            { error: `penaltyWinner inválido para o jogo ${bet.matchId}. Use "home" ou "away".` },
            { status: 400 }
          );
        }
      }
    }

    // Upsert bets
    const results = [];
    for (const bet of bets) {
      const homeScore = bet.homeScore !== null && bet.homeScore !== undefined ? Number(bet.homeScore) : null;
      const awayScore = bet.awayScore !== null && bet.awayScore !== undefined ? Number(bet.awayScore) : null;
      const penaltyWinner = bet.penaltyWinner || null;

      const result = await db.bet.upsert({
        where: {
          playerId_matchId: {
            playerId,
            matchId: bet.matchId,
          },
        },
        update: {
          homeScore,
          awayScore,
          penaltyWinner,
        },
        create: {
          playerId,
          matchId: bet.matchId,
          homeScore,
          awayScore,
          penaltyWinner,
        },
      });
      results.push(result);
    }

    return NextResponse.json({ saved: results.length, message: 'Palpites salvos com sucesso!' });
  } catch (error) {
    console.error('Save bets error:', error);
    return NextResponse.json({ error: 'Failed to save bets' }, { status: 500 });
  }
}
