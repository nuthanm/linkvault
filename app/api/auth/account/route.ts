import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSessionUser, hashPin } from '@/lib/auth';

export const runtime = 'edge';

// PATCH /api/auth/account — update name OR change PIN.
export async function PATCH(req: NextRequest) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;

  // Update name
  if (typeof body.name === 'string') {
    const name = body.name.trim();
    if (!name) return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
    await sql`UPDATE users SET name = ${name} WHERE id = ${sessionUser.id}`;
    return NextResponse.json({ ok: true, name });
  }

  // Change PIN
  if (typeof body.currentPin === 'string' && typeof body.newPin === 'string') {
    const currentPin = body.currentPin.trim();
    const newPin = body.newPin.trim();

    if (!/^\d{4,6}$/.test(newPin)) {
      return NextResponse.json({ error: 'New PIN must be 4–6 digits' }, { status: 400 });
    }

    const currentHash = await hashPin(sessionUser.mobile_number, currentPin);
    const rows = await sql`
      SELECT 1 FROM users WHERE id = ${sessionUser.id} AND pin_hash = ${currentHash}
    `;
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Current PIN is incorrect' }, { status: 401 });
    }

    const newHash = await hashPin(sessionUser.mobile_number, newPin);
    await sql`UPDATE users SET pin_hash = ${newHash} WHERE id = ${sessionUser.id}`;

    // Invalidate all other sessions so old PIN can't be reused elsewhere
    const token = req.headers.get('x-session-token')!;
    await sql`DELETE FROM sessions WHERE user_id = ${sessionUser.id} AND token != ${token}`;

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
}
