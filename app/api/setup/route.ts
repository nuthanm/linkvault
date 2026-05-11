import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Prefer .env.local (Next.js local dev convention); fall back to .env
function resolveEnvPath(): string {
  const local = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(local)) return local;
  return path.join(process.cwd(), '.env');
}

function readEnvFile(): string {
  try {
    return fs.readFileSync(resolveEnvPath(), 'utf-8');
  } catch {
    return '';
  }
}

function upsertEnvVar(content: string, key: string, value: string): string {
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*`, 'm');
  if (re.test(content)) return content.replace(re, line);
  const trimmed = content.trimEnd();
  return trimmed ? `${trimmed}\n${line}\n` : `${line}\n`;
}

function constantEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

export async function GET() {
  return NextResponse.json({ hasPassword: !!process.env.ADMIN_PASSWORD });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const password = typeof body.password === 'string' ? body.password.trim() : '';
  if (!password) return NextResponse.json({ error: 'Password required' }, { status: 400 });

  // If a password already exists, the caller must prove they know the current one
  if (process.env.ADMIN_PASSWORD) {
    const provided = req.headers.get('x-admin-password') ?? '';
    if (!constantEqual(process.env.ADMIN_PASSWORD, provided)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const updated = upsertEnvVar(readEnvFile(), 'ADMIN_PASSWORD', password);
    fs.writeFileSync(resolveEnvPath(), updated, 'utf-8');
    process.env.ADMIN_PASSWORD = password; // update in-process immediately
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to save';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
