import { NextRequest, NextResponse } from 'next/server';
import { sql, LinkRow } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export const runtime = 'edge';

type RouteCtx = { params: Promise<{ id: string }> };

// PATCH /api/links/[id] — update note and tags (session required)
export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { id } = await ctx.params;

  let body: { note?: string; tags?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const note = body.note !== undefined ? (body.note.trim() || null) : undefined;
  const tags = Array.isArray(body.tags)
    ? body.tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean).slice(0, 10)
    : undefined;

  if (note !== undefined) {
    await sql`UPDATE links SET note = ${note} WHERE id = ${id}`;
  }
  if (tags !== undefined) {
    await sql`UPDATE links SET tags = ${tags} WHERE id = ${id}`;
  }

  const [row] = (await sql`
    SELECT id, url, title, description, thumbnail_url, site_name, kind, note, tags, created_at
    FROM links WHERE id = ${id}
  `) as LinkRow[];

  if (!row) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ link: row });
}

// DELETE /api/links/[id] (session required)
export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { id } = await ctx.params;
  await sql`DELETE FROM links WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
