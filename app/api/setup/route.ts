import { NextResponse } from 'next/server';

// This endpoint is no longer used — auth is now managed via /api/auth/*.
export async function GET() {
  return NextResponse.json({ error: 'gone' }, { status: 410 });
}

export async function POST() {
  return NextResponse.json({ error: 'gone' }, { status: 410 });
}
