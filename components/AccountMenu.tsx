'use client';

import { useEffect, useRef, useState } from 'react';

type User = { id: string; name: string; mobile_number: string };
type Mode = 'view' | 'editName' | 'changePin';

export default function AccountMenu({
  user,
  sessionToken,
  onNameChange,
  onSignOut,
}: {
  user: User;
  sessionToken: string;
  onNameChange: (name: string) => void;
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('view');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit name
  const [name, setName] = useState(user.name);

  // Change PIN
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinSuccess, setPinSuccess] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    }
    if (open) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  function closeMenu() {
    setOpen(false);
    setMode('view');
    setError(null);
    setPinSuccess(false);
  }

  function goBack() {
    setMode('view');
    setError(null);
    setPinSuccess(false);
    setCurrentPin(''); setNewPin(''); setConfirmPin('');
  }

  async function saveName() {
    if (!name.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/account', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', 'x-session-token': sessionToken },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Could not save'); return; }
      onNameChange(name.trim());
      goBack();
    } finally {
      setSaving(false);
    }
  }

  async function changePin() {
    if (!currentPin || !newPin || !confirmPin || saving) return;
    if (newPin !== confirmPin) { setError('New PINs do not match'); return; }
    if (!/^\d{4,6}$/.test(newPin)) { setError('PIN must be 4–6 digits'); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/account', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', 'x-session-token': sessionToken },
        body: JSON.stringify({ currentPin, newPin }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error || 'Could not change PIN'); return; }
      setPinSuccess(true);
      setCurrentPin(''); setNewPin(''); setConfirmPin('');
      setTimeout(() => goBack(), 1200);
    } finally {
      setSaving(false);
    }
  }

  const initials = user.name
    ? user.name.trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => { setOpen(!open); if (!open) { setMode('view'); setName(user.name); setError(null); } }}
        className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center hover:bg-blue-200 transition-colors ring-2 ring-transparent hover:ring-blue-200"
        title="Account"
      >
        {initials}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-72 bg-white rounded-xl border border-border shadow-2xl z-50 overflow-hidden animate-slide-up">

          {/* ── View mode ── */}
          {mode === 'view' && (
            <div className="p-4">
              {/* Header row */}
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{user.name || '—'}</p>
                  <p className="text-xs text-muted font-mono">{user.mobile_number}</p>
                </div>
              </div>

              {/* Fields */}
              <div className="flex flex-col gap-3 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-0.5">Name</p>
                    <p className="text-sm text-ink">{user.name || '—'}</p>
                  </div>
                  <button
                    onClick={() => { setName(user.name); setMode('editName'); setError(null); }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Edit
                  </button>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-0.5">Mobile</p>
                  <p className="text-sm text-ink font-mono">{user.mobile_number}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-border pt-3 flex flex-col gap-1">
                <button
                  onClick={() => { setMode('changePin'); setError(null); setPinSuccess(false); }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-ink hover:bg-stone-50 transition-colors font-medium flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  Change PIN
                </button>
                <button
                  onClick={onSignOut}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors font-medium flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign out
                </button>
              </div>
            </div>
          )}

          {/* ── Edit name ── */}
          {mode === 'editName' && (
            <div className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <button onClick={goBack} className="text-muted hover:text-ink transition-colors p-1 rounded-lg hover:bg-stone-50">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <p className="text-sm font-semibold text-ink">Edit Name</p>
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(null); }}
                onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') goBack(); }}
                placeholder="Your name"
                autoFocus
                className="w-full px-3 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:border-accent transition-colors"
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button
                onClick={saveName}
                disabled={saving || !name.trim()}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 active:scale-95 transition-all"
              >
                {saving ? 'Saving…' : 'Save name'}
              </button>
            </div>
          )}

          {/* ── Change PIN ── */}
          {mode === 'changePin' && (
            <div className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <button onClick={goBack} className="text-muted hover:text-ink transition-colors p-1 rounded-lg hover:bg-stone-50">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <p className="text-sm font-semibold text-ink">Change PIN</p>
              </div>

              {pinSuccess ? (
                <div className="py-4 text-center text-green-600 font-medium text-sm">PIN updated ✓</div>
              ) : (
                <>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={currentPin}
                    onChange={(e) => { setCurrentPin(e.target.value.replace(/\D/g, '')); setError(null); }}
                    placeholder="Current PIN"
                    autoFocus
                    className="w-full px-3 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:border-accent text-center tracking-[0.4em] transition-colors"
                  />
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={newPin}
                    onChange={(e) => { setNewPin(e.target.value.replace(/\D/g, '')); setError(null); }}
                    placeholder="New PIN (4–6 digits)"
                    className="w-full px-3 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:border-accent text-center tracking-[0.4em] transition-colors"
                  />
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={confirmPin}
                    onChange={(e) => { setConfirmPin(e.target.value.replace(/\D/g, '')); setError(null); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') changePin(); }}
                    placeholder="Confirm new PIN"
                    className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none text-center tracking-[0.4em] transition-colors ${
                      error ? 'border-red-400' : 'border-border focus:border-accent'
                    }`}
                  />
                  {error && <p className="text-xs text-red-500">{error}</p>}
                  <button
                    onClick={changePin}
                    disabled={saving || !currentPin || !newPin || !confirmPin}
                    className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 active:scale-95 transition-all"
                  >
                    {saving ? 'Updating…' : 'Update PIN'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
