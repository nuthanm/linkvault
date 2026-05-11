import { sql, LinkRow } from '@/lib/db';
import LinkVaultApp from '@/components/LinkVaultApp';

// Always render fresh on each visit (no static caching) — small personal site,
// new links should appear immediately.
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let links: LinkRow[] = [];
  let dbError: string | null = null;

  try {
    links = (await sql`
      SELECT id, url, title, description, thumbnail_url, site_name, kind, note, tags, created_at
      FROM links
      ORDER BY created_at DESC
    `) as LinkRow[];
  } catch (e: any) {
    dbError = e?.message ?? 'database error';
  }

  return <LinkVaultApp initialLinks={links} dbError={dbError} hasPassword={!!process.env.ADMIN_PASSWORD} />;
}
