import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'copa2026admin';

// Diagnostic endpoint — tests the database connection and queries step by step
// to identify exactly where the admin login fails
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const password = searchParams.get('password');

  if (!password || password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Acesso negado. Senha inválida.' }, { status: 401 });
  }

  const results: Record<string, any> = {};
  let client: PrismaClient | null = null;

  // Step 1: Check environment variables
  results.step1_env = {
    DATABASE_URL_set: !!process.env.DATABASE_URL,
    DATABASE_URL_prefix: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 40) + '...' : 'NOT SET',
    DIRECT_URL_set: !!process.env.DIRECT_URL,
    DIRECT_URL_prefix: process.env.DIRECT_URL ? process.env.DIRECT_URL.substring(0, 40) + '...' : 'NOT SET',
    ADMIN_PASSWORD_set: !!process.env.ADMIN_PASSWORD,
    NODE_ENV: process.env.NODE_ENV,
  };

  // Step 2: Test connection with DATABASE_URL (same as the main db client)
  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      results.step2_db_connection = 'SKIPPED - DATABASE_URL not set';
    } else {
      client = new PrismaClient({
        datasources: { db: { url: dbUrl } },
        log: ['query', 'error', 'warn'],
      });
      await client.$connect();
      results.step2_db_connection = 'OK';
    }
  } catch (error: any) {
    results.step2_db_connection = 'FAILED';
    results.step2_db_error = error.message;
    return NextResponse.json(results, { status: 500 });
  }

  // Step 3: Test simple query - match count
  try {
    const matchCount = await client!.match.count();
    results.step3_match_count = matchCount;
  } catch (error: any) {
    results.step3_match_count = 'FAILED';
    results.step3_error = error.message;
  }

  // Step 4: Test simple query - player count
  try {
    const playerCount = await client!.player.count();
    results.step4_player_count = playerCount;
  } catch (error: any) {
    results.step4_player_count = 'FAILED';
    results.step4_error = error.message;
  }

  // Step 5: Test simple query - bet count
  try {
    const betCount = await client!.bet.count();
    results.step5_bet_count = betCount;
  } catch (error: any) {
    results.step5_bet_count = 'FAILED';
    results.step5_error = error.message;
  }

  // Step 6: Test the EXACT same query as admin/bets (the one that fails)
  try {
    const players = await client!.player.findMany({
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
    results.step6_admin_query = 'OK';
    results.step6_player_count = players.length;
    if (players.length > 0) {
      results.step6_first_player_name = players[0].name;
      results.step6_first_player_bets = players[0].bets?.length || 0;
    }
  } catch (error: any) {
    results.step6_admin_query = 'FAILED';
    results.step6_error = error.message;
    results.step6_error_code = error.code;
    results.step6_error_meta = error.meta;
    results.step6_error_stack = error.stack?.substring(0, 500);
  }

  // Step 7: Test simpler version of admin query (without nested orderBy)
  if (results.step6_admin_query === 'FAILED') {
    try {
      const players = await client!.player.findMany({
        include: {
          bets: {
            include: {
              match: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });
      results.step7_simple_query = 'OK';
      results.step7_player_count = players.length;
    } catch (error: any) {
      results.step7_simple_query = 'FAILED';
      results.step7_error = error.message;
    }
  }

  // Step 8: Test even simpler query (no includes)
  if (results.step7_admin_query === 'FAILED' || results.step6_admin_query === 'FAILED') {
    try {
      const players = await client!.player.findMany();
      results.step8_basic_query = 'OK';
      results.step8_player_count = players.length;
    } catch (error: any) {
      results.step8_basic_query = 'FAILED';
      results.step8_error = error.message;
    }
  }

  // Step 9: Test PhaseWinner query
  try {
    const winners = await client!.phaseWinner.findMany();
    results.step9_phase_winner = 'OK';
    results.step9_winner_count = winners.length;
  } catch (error: any) {
    results.step9_phase_winner = 'FAILED';
    results.step9_error = error.message;
  }

  // Cleanup
  try {
    await client!.$disconnect();
  } catch (_) {}

  return NextResponse.json(results, { status: 200 });
}
