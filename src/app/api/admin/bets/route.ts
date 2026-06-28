import { NextResponse } from 'next/server';
import { db, runAutoMigration } from '@/lib/db';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Copa2026admin';

export async function GET(request: Request) {
  try {
    // Ensure DB schema is up-to-date before querying
    await runAutoMigration();

    const { searchParams } = new URL(request.url);
    const password = searchParams.get('password');

    if (!password || password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Acesso negado. Senha inválida.' }, { status: 401 });
    }

    const players = await db.player.findMany({
      include: {
        bets: {
          include: {
            match: true,
          },
          orderBy: [{ match: { round: 'asc' } }, { match: { matchNum: 'asc' } }],
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(players);
  } catch (error: any) {
    console.error('Admin get bets error:', error);
    return NextResponse.json({
      error: 'Failed to fetch admin data',
      detail: error?.message || 'Unknown error',
      hint: error?.message?.includes('penaltyWinner')
        ? 'Run /api/migrate to add the missing column, then try again.'
        : undefined,
    }, { status: 500 });
  }
}
