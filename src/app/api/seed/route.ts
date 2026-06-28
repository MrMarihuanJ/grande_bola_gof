import { NextResponse } from 'next/server';
import { db, ensureMigrated } from '@/lib/db';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'copa2026admin';

export async function POST(request: Request) {
  try {
    await ensureMigrated();
    // Require admin password for seeding
    const { searchParams } = new URL(request.url);
    const password = searchParams.get('password');

    if (!password || password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Acesso negado. Forneça a senha admin via ?password=xxx' }, { status: 401 });
    }

    const existing = await db.match.count().catch(() => -1);

    if (existing === -1) {
      return NextResponse.json({
        error: 'As tabelas do banco ainda não foram criadas.',
        hint: 'Execute o comando abaixo localmente com as URLs do seu banco:',
        commands: [
          'npm install',
          'DATABASE_URL="sua_url" DIRECT_URL="sua_url" npx prisma db push',
          'DATABASE_URL="sua_url" DIRECT_URL="sua_url" npx tsx prisma/seed.ts',
        ],
      }, { status: 500 });
    }

    if (existing > 0) {
      return NextResponse.json({ message: `Database already has ${existing} matches`, count: existing });
    }

    const { MATCHES } = await import('@/lib/seed-data');
    await db.match.createMany({ data: MATCHES });

    return NextResponse.json({ message: 'Matches seeded successfully', count: MATCHES.length });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json({
      error: 'Failed to seed matches',
      detail: error.message,
      hint: 'Verifique se as tabelas foram criadas. Acesse /api/health para diagnóstico.',
    }, { status: 500 });
  }
}
