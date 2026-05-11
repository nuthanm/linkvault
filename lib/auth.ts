import { NextRequest } from 'next/server';
import { sql } from './db';

export type SessionUser = {
  id: string;
  name: string;
  mobile_number: string;
};

export async function getSessionUser(req: NextRequest): Promise<SessionUser | null> {
  const token = req.headers.get('x-session-token');
  if (!token) return null;
  try {
    const rows = await sql`
      SELECT u.id, u.name, u.mobile_number
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token = ${token} AND s.expires_at > NOW()
      LIMIT 1
    `;
    return (rows[0] as SessionUser) ?? null;
  } catch {
    return null;
  }
}

export async function hashPin(mobile: string, pin: string): Promise<string> {
  const data = new TextEncoder().encode(`linkvault:${mobile}:${pin}`);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function createToken(): string {
  return crypto.randomUUID();
}

export async function ensureTables(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL DEFAULT '',
      mobile_number TEXT NOT NULL UNIQUE,
      pin_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days')
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS links (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      title TEXT,
      description TEXT,
      thumbnail_url TEXT,
      site_name TEXT,
      kind TEXT NOT NULL DEFAULT 'article',
      note TEXT,
      tags TEXT[] NOT NULL DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  // Migration: add user_id column to existing links tables created before this change
  await sql`ALTER TABLE links ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE`;
  // Migration: assign orphaned links (no owner) to the first registered user
  await sql`
    UPDATE links
    SET user_id = (SELECT id FROM users ORDER BY created_at LIMIT 1)
    WHERE user_id IS NULL AND EXISTS (SELECT 1 FROM users)
  `;
}
