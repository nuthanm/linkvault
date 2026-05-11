import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { hashPin, createToken } from '@/lib/auth';

export const runtime = 'edge';

// POST /api/auth/login
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const mobile = typeof body.mobile === 'string' ? body.mobile.trim() : '';
  const pin = typeof body.pin === 'string' ? body.pin.trim() : '';

  if (!mobile || !pin) {
    return NextResponse.json({ error: 'Mobile and PIN are required' }, { status: 400 });
  }

  const pinHash = await hashPin(mobile, pin);

  const rows = await sql`
    SELECT id, name, mobile_number
    FROM users
    WHERE mobile_number = ${mobile} AND pin_hash = ${pinHash}
    LIMIT 1
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Incorrect mobile number or PIN' }, { status: 401 });
  }

  const user = rows[0] as { id: string; name: string; mobile_number: string };
  const token = createToken();

  await sql`
    INSERT INTO sessions (token, user_id)
    VALUES (${token}, ${user.id})
  `;

  return NextResponse.json({ token, user });
}
