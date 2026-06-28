import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'copa2026admin';

export async function GET(request: Request) {
  try {
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
    const message = error?.message || 'Unknown error';
    const isMissingColumn = message.includes('does not exist') || message.includes('penaltyWinner');

    return NextResponse.json({
      error: 'Erro ao carregar dados do administrador',
      detail: message,
      hint: isMissingColumn
        ? 'O banco de dados precisa de atualização. Acesse /api/setup?password=SUA_SENHA para atualizar o esquema.'
        : 'Verifique as variáveis de ambiente DATABASE_URL e DIRECT_URL na Vercel.',
    }, { status: 500 });
  }
}
