import { NextResponse } from 'next/server';
import { db, ensureMigrated } from '@/lib/db';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'copa2026admin';

// Esta rota atualiza a ordem (round e matchNum) das partidas EXISTENTES
// sem apagar os palpites. Ela usa (homeTeam, awayTeam) como chave para
// identificar cada partida e só atualiza round/matchNum.
//
// IMPORTANTE: funciona SOMENTE se a combinacao de times de cada partida
// nao mudou - ou seja, voce so reordenou/reagrupou as partidas existentes,
// nao adicionou/removeu partidas novas.

export async function GET(request: Request) {
  return NextResponse.json({
    message: 'Use POST para reordenar as partidas sem perder palpites',
    endpoint: 'POST /api/admin/reorder-matches?password=SUA_SENHA_ADMIN',
    description: 'Atualiza os campos round e matchNum de cada partida existente, preservando palpites e IDs.',
  });
}

export async function POST(request: Request) {
  try {
    await ensureMigrated();
    const { searchParams } = new URL(request.url);
    const password = searchParams.get('password');

    if (!password || password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Acesso negado. Senha admin invalida.' },
        { status: 401 }
      );
    }

    // Carregar nova ordem a partir do seed-data.ts (versão atualizada apos o deploy)
    const { MATCHES } = await import('@/lib/seed-data');

    // Buscar todas as partidas existentes no banco
    const existingMatches = await db.match.findMany();
    console.log(`Encontradas ${existingMatches.length} partidas no banco`);

    // Construir lista de atualizacoes
    // Caso especial: mesma combinacao de times em mais de uma partida (ex.: Brasil x Argentina nas 3 rodadas)
    // Por isso, fazemos matching progressivo: quando achamos um match, removemos ele da lista de candidatas
    const available = [...existingMatches];
    const updates: {
      id: string;
      round: number;
      matchNum: number;
      homeTeam: string;
      awayTeam: string;
      oldRound: number;
      oldMatchNum: number;
    }[] = [];
    const notFound: { homeTeam: string; awayTeam: string; round: number; matchNum: number }[] = [];

    for (const newMatch of MATCHES) {
      // Procurar partida existente pela combinacao de times (direta ou invertida)
      const idx = available.findIndex(
        m =>
          (m.homeTeam === newMatch.homeTeam && m.awayTeam === newMatch.awayTeam) ||
          (m.homeTeam === newMatch.awayTeam && m.awayTeam === newMatch.homeTeam)
      );

      if (idx === -1) {
        notFound.push(newMatch);
        continue;
      }

      const matched = available[idx];
      // Remove da lista de candidatas para nao ser matched novamente (trata duplicatas)
      available.splice(idx, 1);

      // Se round e matchNum ja estao iguais, nao precisa atualizar
      if (matched.round === newMatch.round && matched.matchNum === newMatch.matchNum) {
        continue;
      }

      updates.push({
        id: matched.id,
        round: newMatch.round,
        matchNum: newMatch.matchNum,
        homeTeam: matched.homeTeam, // manter original (nao inverter)
        awayTeam: matched.awayTeam,
        oldRound: matched.round,
        oldMatchNum: matched.matchNum,
      });
    }

    // Aplicar atualizacoes em lote (apenas round e matchNum - ID e times continuam iguais)
    let updatedCount = 0;
    for (const u of updates) {
      await db.match.update({
        where: { id: u.id },
        data: {
          round: u.round,
          matchNum: u.matchNum,
        },
      });
      updatedCount++;
    }

    // Verificacao final
    const finalCount = await db.match.count();
    const betCount = await db.bet.count();

    return NextResponse.json({
      success: true,
      message: 'Reordenacao concluida. Os palpites foram preservados.',
      summary: {
        partidas_no_banco: finalCount,
        partidas_no_seed: MATCHES.length,
        partidas_atualizadas: updatedCount,
        partidas_ja_estavam_corretas: MATCHES.length - notFound.length - updatedCount,
        partidas_nao_encontradas: notFound.length,
        palpites_preservados: betCount,
      },
      notFound: notFound,
      sobrando_no_banco: available.map(m => `${m.homeTeam} x ${m.awayTeam} (round ${m.round} / matchNum ${m.matchNum})`),
      changes: updates.map(u => ({
        teams: `${u.homeTeam} x ${u.awayTeam}`,
        old: `round ${u.oldRound} / matchNum ${u.oldMatchNum}`,
        new: `round ${u.round} / matchNum ${u.matchNum}`,
      })),
      note: notFound.length > 0
        ? 'Algumas partidas do seed-data nao foram encontradas no banco. Isso pode acontecer se voce adicionou partidas novas ou trocou times. Essas partidas precisam ser criadas manualmente via SQL no console do Neon.'
        : undefined,
    });

  } catch (error: any) {
    console.error('Reorder matches error:', error);
    return NextResponse.json({
      error: 'Falha ao reordenar partidas',
      detail: error.message,
    }, { status: 500 });
  }
}
