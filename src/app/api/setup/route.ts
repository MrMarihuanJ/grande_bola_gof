import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'copa2026admin';

// PrismaClient usando DIRECT_URL (sem pgbouncer) para operações DDL
function createDirectClient() {
  const directUrl = process.env.DIRECT_URL;
  if (!directUrl) {
    throw new Error('DIRECT_URL não está configurada. Defina nas variáveis de ambiente da Vercel.');
  }
  return new PrismaClient({
    datasources: {
      db: { url: directUrl },
    },
    log: ['error'],
  });
}

// Função compartilhada que faz todo o setup
async function runSetup(password: string) {
  let directClient: PrismaClient | null = null;

  try {
    if (!password || password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Acesso negado. Forneça a senha admin via ?password=xxx' },
        { status: 401 }
      );
    }

    const results: string[] = [];

    // Usar DIRECT_URL para DDL (bypass pgbouncer)
    directClient = createDirectClient();
    await directClient.$connect();
    results.push('Conexão direta estabelecida (DIRECT_URL)');

    // 1. Criar tabela Match
    await directClient.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Match" (
        "id" TEXT NOT NULL,
        "round" INTEGER NOT NULL,
        "matchNum" INTEGER NOT NULL,
        "homeTeam" TEXT NOT NULL,
        "awayTeam" TEXT NOT NULL,
        "homeName" TEXT NOT NULL,
        "awayName" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
      );
    `);
    results.push('Tabela Match criada/verificada');

    // 2. Criar índices da tabela Match
    await directClient.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Match_round_idx" ON "Match"("round");`);
    await directClient.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Match_round_matchNum_idx" ON "Match"("round", "matchNum");`);
    results.push('Indices da tabela Match criados/verificados');

    // 3. Criar tabela Player
    await directClient.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Player" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "token" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
      );
    `);
    results.push('Tabela Player criada/verificada');

    // 4. Criar índices e unique da tabela Player
    await directClient.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Player_token_key" ON "Player"("token");`);
    await directClient.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Player_token_idx" ON "Player"("token");`);
    await directClient.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Player_name_key" ON "Player"("name");`);
    await directClient.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Player_name_idx" ON "Player"("name");`);
    results.push('Indices da tabela Player criados/verificados');

    // 5. Criar tabela Bet
    await directClient.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Bet" (
        "id" TEXT NOT NULL,
        "playerId" TEXT NOT NULL,
        "matchId" TEXT NOT NULL,
        "homeScore" INTEGER,
        "awayScore" INTEGER,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Bet_pkey" PRIMARY KEY ("id")
      );
    `);
    results.push('Tabela Bet criada/verificada');

    // 6. Criar índices e unique da tabela Bet
    await directClient.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Bet_playerId_matchId_key" ON "Bet"("playerId", "matchId");`);
    await directClient.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Bet_playerId_idx" ON "Bet"("playerId");`);
    await directClient.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Bet_matchId_idx" ON "Bet"("matchId");`);
    results.push('Indices da tabela Bet criados/verificados');

    // 7. Criar foreign keys
    try {
      await directClient.$executeRawUnsafe(`
        ALTER TABLE "Bet" DROP CONSTRAINT IF EXISTS "Bet_playerId_fkey";
        ALTER TABLE "Bet" ADD CONSTRAINT "Bet_playerId_fkey"
        FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `);
      results.push('Foreign key Bet_playerId_fkey criada');
    } catch (e: any) {
      results.push('Foreign key Bet_playerId_fkey: ' + (e.message?.includes('already exists') ? 'ja existe' : e.message));
    }
    try {
      await directClient.$executeRawUnsafe(`
        ALTER TABLE "Bet" DROP CONSTRAINT IF EXISTS "Bet_matchId_fkey";
        ALTER TABLE "Bet" ADD CONSTRAINT "Bet_matchId_fkey"
        FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `);
      results.push('Foreign key Bet_matchId_fkey criada');
    } catch (e: any) {
      results.push('Foreign key Bet_matchId_fkey: ' + (e.message?.includes('already exists') ? 'ja existe' : e.message));
    }

    // 8. Popular tabela Match se vazia
    const matchCount = await directClient.match.count();
    if (matchCount === 0) {
      const { MATCHES } = await import('@/lib/seed-data');
      await directClient.match.createMany({ data: MATCHES });
      results.push(`${MATCHES.length} jogos da Copa do Mundo 2026 inseridos`);
    } else {
      results.push(`Jogos ja existem (${matchCount} registros)`);
    }

    // 9. Verificação final
    const finalMatchCount = await directClient.match.count();
    const finalPlayerCount = await directClient.player.count();
    const finalBetCount = await directClient.bet.count();

    results.push(`Verificacao final: ${finalMatchCount} jogos, ${finalPlayerCount} jogadores, ${finalBetCount} apostas`);

    await directClient.$disconnect();

    return NextResponse.json({
      success: true,
      message: 'Banco de dados configurado com sucesso! O aplicativo esta pronto para uso.',
      details: results,
      counts: {
        matches: finalMatchCount,
        players: finalPlayerCount,
        bets: finalBetCount,
      },
    });

  } catch (error: any) {
    console.error('Setup error:', error);
    if (directClient) {
      try { await directClient.$disconnect(); } catch (_) {}
    }
    return NextResponse.json({
      error: 'Falha ao configurar o banco de dados',
      detail: error.message,
      hint: error.message?.includes('DIRECT_URL')
        ? 'Defina DIRECT_URL nas variaveis de ambiente da Vercel'
        : 'Verifique se DATABASE_URL e DIRECT_URL estao corretas. Acesse /api/health para diagnostico.',
    }, { status: 500 });
  }
}

// GET - funciona direto no navegador!
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const password = searchParams.get('password');

  if (!password) {
    return NextResponse.json({
      message: 'Bem-vindo ao setup do banco de dados!',
      instructions: 'Para criar as tabelas, acesse esta URL com sua senha admin:',
      example: '/api/setup?password=copa2026admin',
      note: 'Funciona tanto GET quanto POST - basta acessar no navegador!',
    });
  }

  return runSetup(password);
}

// POST - mesma lógica
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const password = searchParams.get('password');
  return runSetup(password || '');
}
