import { NextResponse } from 'next/server';
import { db, ensureMigrated } from '@/lib/db';
import crypto from 'crypto';

// POST - Registrar ou logar pelo nome
export async function POST(request: Request) {
  try {
    await ensureMigrated();
    const { name } = await request.json();

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Nome é obrigatório e deve ter pelo menos 2 caracteres' },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();

    // Verificar se já existe jogador com esse nome
    const existingPlayer = await db.player.findUnique({
      where: { name: trimmedName },
    });

    if (existingPlayer) {
      // Login: jogador já existe, retornar dados existentes
      return NextResponse.json({
        id: existingPlayer.id,
        name: existingPlayer.name,
        token: existingPlayer.token,
        isNew: false,
      });
    }

    // Registro: criar novo jogador
    const token = crypto.randomBytes(16).toString('hex');

    const player = await db.player.create({
      data: {
        name: trimmedName,
        token,
      },
    });

    return NextResponse.json({
      id: player.id,
      name: player.name,
      token: player.token,
      isNew: true,
    });
  } catch (error: any) {
    console.error('Create player error:', error);
    // Se der erro de constraint unique, pode ser que o nome já existe (race condition)
    if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
      return NextResponse.json(
        { error: 'Já existe um participante com esse nome. Tente fazer login.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Falha ao criar participante' }, { status: 500 });
  }
}

// GET - Buscar jogador por token ou por nome
export async function GET(request: Request) {
  try {
    await ensureMigrated();
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const name = searchParams.get('name');

    if (token) {
      const player = await db.player.findUnique({
        where: { token },
      });
      if (!player) {
        return NextResponse.json({ error: 'Player not found' }, { status: 404 });
      }
      return NextResponse.json({
        id: player.id,
        name: player.name,
        token: player.token,
      });
    }

    if (name) {
      const player = await db.player.findUnique({
        where: { name },
      });
      if (!player) {
        return NextResponse.json({ error: 'Player not found' }, { status: 404 });
      }
      return NextResponse.json({
        id: player.id,
        name: player.name,
        token: player.token,
      });
    }

    return NextResponse.json({ error: 'Token or name is required' }, { status: 400 });
  } catch (error) {
    console.error('Get player error:', error);
    return NextResponse.json({ error: 'Failed to get player' }, { status: 500 });
  }
}
