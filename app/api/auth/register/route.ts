import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { ensureTables, hashPin, createToken } from '@/lib/auth';

export const runtime = 'edge';

// POST /api/auth/register — create the first (and only) user account.
// Returns 403 if an account already exists.
export async function POST(req: NextRequest) {
  await ensureTables();

  const existing = await sql`SELECT 1 FROM users LIMIT 1`;
  if (existing.length > 0) {
    return NextResponse.json({ error: 'An account already exists' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const mobile = typeof body.mobile === 'string' ? body.mobile.trim() : '';
  const pin = typeof body.pin === 'string' ? body.pin.trim() : '';

  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  if (!/^\d{7,15}$/.test(mobile)) return NextResponse.json({ error: 'Enter a valid mobile number' }, { status: 400 });
  if (!/^\d{4,6}$/.test(pin)) return NextResponse.json({ error: 'PIN must be 4–6 digits' }, { status: 400 });

  const pinHash = await hashPin(mobile, pin);
  const token = createToken();

  const [user] = await sql`
    INSERT INTO users (name, mobile_number, pin_hash)
    VALUES (${name}, ${mobile}, ${pinHash})
    RETURNING id, name, mobile_number
  `;

  await sql`
    INSERT INTO sessions (token, user_id)
    VALUES (${token}, ${(user as { id: string }).id})
  `;

  return NextResponse.json({ token, user }, { status: 201 });
}
