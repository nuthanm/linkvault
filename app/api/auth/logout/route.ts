import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const runtime = 'edge';

// POST /api/auth/logout — invalidates the session token.
export async function POST(req: NextRequest) {
  const token = req.headers.get('x-session-token');
  if (token) {
    await sql`DELETE FROM sessions WHERE token = ${token}`.catch(() => null);
  }
  return NextResponse.json({ ok: true });
}
