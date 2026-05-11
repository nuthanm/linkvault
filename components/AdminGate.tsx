'use client';

import { useState } from 'react';

export default function AdminGate({ onUnlock }: { onUnlock: (pw: string) => void }) {
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  async function tryUnlock() {
    setErr(null);
    setChecking(true);
    try {
      // Verify the password by attempting an authorised no-op:
      // POST with no url returns 400, but with a wrong password returns 401.
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-admin-password': pw },
        body: JSON.stringify({}),
      });
      if (res.status === 401) {
        setErr('Wrong password');
        return;
      }
      onUnlock(pw);
      setOpen(false);
      setPw('');
    } finally {
      setChecking(false);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-sm px-3 py-1.5 rounded-md border border-border hover:bg-stone-50">
        Sign in
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="password"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') tryUnlock(); }}
        placeholder="Admin password"
        autoFocus
        className="px-3 py-1.5 rounded-md border border-border bg-surface text-sm focus:outline-none focus:border-accent"
      />
      <button onClick={tryUnlock} disabled={checking || !pw} className="px-3 py-1.5 rounded-md bg-ink text-white text-sm hover:opacity-90 disabled:opacity-50">
        {checking ? '…' : 'Unlock'}
      </button>
      <button onClick={() => { setOpen(false); setPw(''); setErr(null); }} className="text-sm text-muted hover:text-ink">Cancel</button>
      {err && <span className="text-xs text-red-600">{err}</span>}
    </div>
  );
}
