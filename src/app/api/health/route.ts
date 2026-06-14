import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function GET() {
  const results: Record<string, any> = {};

  // 1. Verificar variáveis de ambiente
  results.env = {
    DATABASE_URL_set: !!process.env.DATABASE_URL,
    DATABASE_URL_prefix: process.env.DATABASE_URL
      ? process.env.DATABASE_URL.substring(0, 30) + '...'
      : 'NÃO DEFINIDA',
    DIRECT_URL_set: !!process.env.DIRECT_URL,
    DIRECT_URL_prefix: process.env.DIRECT_URL
      ? process.env.DIRECT_URL.substring(0, 30) + '...'
      : 'NÃO DEFINIDA',
    ADMIN_PASSWORD_set: !!process.env.ADMIN_PASSWORD,
    NODE_ENV: process.env.NODE_ENV,
  };

  // 2. Testar conexão com o banco
  try {
    const prisma = new PrismaClient();
    await prisma.$connect();
    results.db_connection = 'OK - Conexão bem-sucedida';

    // 3. Verificar se as tabelas existem
    try {
      const matchCount = await prisma.match.count();
      const playerCount = await prisma.player.count();
      const betCount = await prisma.bet.count();
      results.tables = {
        matches: matchCount,
        players: playerCount,
        bets: betCount,
        status: matchCount > 0 ? 'OK - Tabelas existem e têm dados' : 'AVISO - Tabelas existem mas estão vazias. Execute /api/seed?password=SUA_SENHA',
      };
    } catch (tableError: any) {
      results.tables = {
        status: 'ERRO - Tabelas não existem',
        error: tableError.message,
        hint: 'Chame POST /api/setup?password=SUA_SENHA_ADMIN para criar as tabelas automaticamente',
        setup_url: '/api/setup?password=SUA_SENHA_ADMIN',
      };
    }

    await prisma.$disconnect();
  } catch (dbError: any) {
    results.db_connection = 'FALHOU';
    results.db_error = dbError.message;
    results.hint = 'Verifique se DATABASE_URL e DIRECT_URL estão corretas na Vercel (Settings → Environment Variables)';
  }

  // Determinar status geral
  const isHealthy = results.db_connection === 'OK - Conexão bem-sucedida' &&
    results.tables?.status?.startsWith('OK');

  return NextResponse.json(results, { status: isHealthy ? 200 : 500 });
}
