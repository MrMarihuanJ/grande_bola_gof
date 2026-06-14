import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const matches = await db.match.findMany({
      orderBy: [{ round: 'asc' }, { matchNum: 'asc' }],
    });
    return NextResponse.json(matches);
  } catch (error) {
    console.error('Fetch matches error:', error);
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
  }
}
