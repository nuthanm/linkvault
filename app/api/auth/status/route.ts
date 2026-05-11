import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { ensureTables } from '@/lib/auth';

export const runtime = 'edge';

// Public — tells the client whether any user accounts exist yet.
export async function GET() {
  try {
    await ensureTables();
    const rows = await sql`SELECT 1 FROM users LIMIT 1`;
    return NextResponse.json({ hasUsers: rows.length > 0 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
