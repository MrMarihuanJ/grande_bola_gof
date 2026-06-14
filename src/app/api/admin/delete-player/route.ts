import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'copa2026admin';

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const password = searchParams.get('password');
    const playerId = searchParams.get('playerId');

    if (!password || password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Acesso negado. Senha inválida.' }, { status: 401 });
    }

    if (!playerId) {
      return NextResponse.json({ error: 'playerId é obrigatório' }, { status: 400 });
    }

    // Verify player exists
    const player = await db.player.findUnique({
      where: { id: playerId },
      include: { bets: true },
    });

    if (!player) {
      return NextResponse.json({ error: 'Participante não encontrado' }, { status: 404 });
    }

    // Delete all bets first (cascade should handle this, but explicit for safety)
    await db.bet.deleteMany({
      where: { playerId },
    });

    // Delete the player
    await db.player.delete({
      where: { id: playerId },
    });

    return NextResponse.json({
      success: true,
      message: `Participante "${player.name}" e seus ${player.bets.length} palpites foram removidos.`,
      deletedBets: player.bets.length,
    });
  } catch (error) {
    console.error('Delete player error:', error);
    return NextResponse.json({ error: 'Erro ao deletar participante' }, { status: 500 });
  }
}
