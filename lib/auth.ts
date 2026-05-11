// Single-user "auth" — checks one shared secret password.
// The password is sent from the browser as a custom header, set after the user
// enters it once and stored in sessionStorage on the client.

import { NextRequest } from 'next/server';

export function isAdmin(req: NextRequest): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const got = req.headers.get('x-admin-password') ?? '';
  // constant-time-ish comparison
  if (got.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ got.charCodeAt(i);
  }
  return mismatch === 0;
}
