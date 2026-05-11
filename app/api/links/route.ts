import { NextRequest, NextResponse } from 'next/server';
import { sql, LinkRow } from '@/lib/db';
import { fetchMetadata } from '@/lib/metadata';
import { getSessionUser } from '@/lib/auth';

export const runtime = 'edge';

// GET /api/links — private, requires a valid session
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const rows = (await sql`
    SELECT id, url, title, description, thumbnail_url, site_name, kind, note, tags, created_at
    FROM links
    WHERE user_id = ${user.id}
    ORDER BY created_at DESC
  `) as LinkRow[];
  return NextResponse.json({ links: rows });
}

// POST /api/links — add a new link (session required)
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let body: { url?: string; note?: string; tags?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const url = (body.url ?? '').trim();
  if (!url) return NextResponse.json({ error: 'url is required' }, { status: 400 });

  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: 'invalid url' }, { status: 400 });
  }

  const note = (body.note ?? '').trim() || null;
  const tags = Array.isArray(body.tags)
    ? body.tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean).slice(0, 10)
    : [];

  const meta = await fetchMetadata(url);

  const [inserted] = (await sql`
    INSERT INTO links (user_id, url, title, description, thumbnail_url, site_name, kind, note, tags)
    VALUES (${user.id}, ${url}, ${meta.title}, ${meta.description}, ${meta.thumbnail_url},
            ${meta.site_name}, ${meta.kind}, ${note}, ${tags})
    RETURNING id, url, title, description, thumbnail_url, site_name, kind, note, tags, created_at
  `) as LinkRow[];

  return NextResponse.json({ link: inserted }, { status: 201 });
}
