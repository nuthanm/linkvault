// Run with: node scripts/init-db.mjs
// Requires DATABASE_URL in the environment (load .env.local first if needed).

import { neon } from '@neondatabase/serverless';
import { readFileSync, existsSync } from 'node:fs';

// Tiny .env.local loader (no extra dep)
if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/i);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
}

if (!process.env.DATABASE_URL) {
  console.error('Set DATABASE_URL (in .env.local or the shell) before running.');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;

await sql`
  CREATE TABLE IF NOT EXISTS links (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url           TEXT NOT NULL,
    title         TEXT,
    description   TEXT,
    thumbnail_url TEXT,
    site_name     TEXT,
    kind          TEXT NOT NULL DEFAULT 'article' CHECK (kind IN ('video','article')),
    note          TEXT,
    tags          TEXT[] NOT NULL DEFAULT '{}',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

await sql`CREATE INDEX IF NOT EXISTS links_created_at_idx ON links (created_at DESC)`;

console.log('✓ Database initialised. The "links" table is ready.');
