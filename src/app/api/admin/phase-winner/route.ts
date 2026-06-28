import { NextResponse } from 'next/server';
import { db, ensureMigrated } from '@/lib/db';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'copa2026admin';

// GET - Return all phase winners
export async function GET(request: Request) {
  try {
    await ensureMigrated();

    const { searchParams } = new URL(request.url);
    const password = searchParams.get('password');

    if (!password || password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Acesso negado. Senha inválida.' }, { status: 401 });
    }

    const winners = await db.phaseWinner.findMany({
      orderBy: { phase: 'asc' },
    });

    return NextResponse.json(winners);
  } catch (error) {
    console.error('Fetch phase winners error:', error);
    return NextResponse.json({ error: 'Failed to fetch phase winners' }, { status: 500 });
  }
}

// POST - Set winner for a phase (upsert)
export async function POST(request: Request) {
  try {
    await ensureMigrated();

    const { searchParams } = new URL(request.url);
    const password = searchParams.get('password');

    if (!password || password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Acesso negado. Senha inválida.' }, { status: 401 });
    }

    const body = await request.json();
    const { phase, winnerName } = body;

    if (!phase || !winnerName) {
      return NextResponse.json({ error: 'phase and winnerName are required' }, { status: 400 });
    }

    const winner = await db.phaseWinner.upsert({
      where: { phase },
      update: { winnerName },
      create: { phase, winnerName },
    });

    return NextResponse.json({
      success: true,
      message: `Ganhador da fase "${phase}" definido: ${winnerName}`,
      winner,
    });
  } catch (error: any) {
    console.error('Set phase winner error:', error);
    return NextResponse.json({ error: 'Failed to set phase winner', detail: error.message }, { status: 500 });
  }
}

// DELETE - Remove winner for a phase
export async function DELETE(request: Request) {
  try {
    await ensureMigrated();

    const { searchParams } = new URL(request.url);
    const password = searchParams.get('password');

    if (!password || password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Acesso negado. Senha inválida.' }, { status: 401 });
    }

    const phase = searchParams.get('phase');

    if (!phase) {
      return NextResponse.json({ error: 'phase parameter is required' }, { status: 400 });
    }

    const deleted = await db.phaseWinner.deleteMany({
      where: { phase },
    });

    return NextResponse.json({
      success: true,
      message: deleted.count > 0 ? `Ganhador da fase "${phase}" removido.` : `Nenhum ganhador encontrado para a fase "${phase}".`,
      deleted: deleted.count,
    });
  } catch (error: any) {
    console.error('Delete phase winner error:', error);
    return NextResponse.json({ error: 'Failed to delete phase winner', detail: error.message }, { status: 500 });
  }
}
