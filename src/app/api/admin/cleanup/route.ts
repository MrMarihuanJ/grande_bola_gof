import { NextResponse } from 'next/server';
import { db, ensureMigrated } from '@/lib/db';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'copa2026admin';

// Cleanup endpoint — removes orphaned Bets (bets whose matchId doesn't exist in Match table)
// This is the ROOT CAUSE of the admin login error: "Field match is required to return data, got null instead"
export async function POST(request: Request) {
  try {
    await ensureMigrated();

    const { searchParams } = new URL(request.url);
    const password = searchParams.get('password');

    if (!password || password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Acesso negado. Senha inválida.' }, { status: 401 });
    }

    const results: string[] = [];

    // Find all matchIds that exist in the Match table
    const validMatches = await db.match.findMany({ select: { id: true } });
    const validMatchIds = new Set(validMatches.map(m => m.id));
    results.push(`Matches validos no banco: ${validMatchIds.size}`);

    // Find all bets
    const allBets = await db.bet.findMany({ select: { id: true, matchId: true, playerId: true } });
    results.push(`Total de apostas: ${allBets.length}`);

    // Find orphaned bets (matchId doesn't exist in Match table)
    const orphanedBets = allBets.filter(b => !validMatchIds.has(b.matchId));
    results.push(`Apostas orfas (matchId invalido): ${orphanedBets.length}`);

    if (orphanedBets.length > 0) {
      // Show details of orphaned bets
      const orphanDetails = orphanedBets.map(b => ({
        betId: b.id,
        matchId: b.matchId,
        playerId: b.playerId,
      }));
      results.push(`Detalhes das orfas: ${JSON.stringify(orphanDetails.slice(0, 20))}`);

      // Delete orphaned bets
      const orphanIds = orphanedBets.map(b => b.id);
      const deleteResult = await db.bet.deleteMany({
        where: { id: { in: orphanIds } },
      });
      results.push(`Apostas orfas removidas: ${deleteResult.count}`);
    }

    // Verify cleanup
    const remainingBets = await db.bet.count();
    results.push(`Apostas restantes apos limpeza: ${remainingBets}`);

    return NextResponse.json({
      success: true,
      message: orphanedBets.length > 0
        ? `${orphanedBets.length} apostas orfas foram removidas. O admin deve funcionar agora.`
        : 'Nenhuma aposta orfa encontrada. O problema pode ser outro.',
      details: results,
      orphanedCount: orphanedBets.length,
    });
  } catch (error: any) {
    console.error('Cleanup error:', error);
    return NextResponse.json({
      error: 'Erro ao limpar apostas orfas',
      detail: error.message,
    }, { status: 500 });
  }
}

// GET — preview what would be cleaned up without actually deleting
export async function GET(request: Request) {
  try {
    await ensureMigrated();

    const { searchParams } = new URL(request.url);
    const password = searchParams.get('password');

    if (!password || password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Acesso negado. Senha inválida.' }, { status: 401 });
    }

    const validMatches = await db.match.findMany({ select: { id: true } });
    const validMatchIds = new Set(validMatches.map(m => m.id));

    const allBets = await db.bet.findMany({ select: { id: true, matchId: true, playerId: true } });
    const orphanedBets = allBets.filter(b => !validMatchIds.has(b.matchId));

    return NextResponse.json({
      totalBets: allBets.length,
      validMatches: validMatchIds.size,
      orphanedBets: orphanedBets.length,
      orphanDetails: orphanedBets.map(b => ({
        betId: b.id,
        matchId: b.matchId,
        playerId: b.playerId,
      })),
      action: orphanedBets.length > 0
        ? 'Use POST /api/admin/cleanup?password=SUA_SENHA para remover as apostas orfas'
        : 'Nenhuma limpeza necessaria',
    });
  } catch (error: any) {
    console.error('Cleanup preview error:', error);
    return NextResponse.json({
      error: 'Erro ao verificar apostas orfas',
      detail: error.message,
    }, { status: 500 });
  }
}
