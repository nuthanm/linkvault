'use client';

import { useState, useEffect } from 'react';

type User = { id: string; name: string; mobile_number: string };
type Phase = 'loading' | 'login' | 'register';

function BookmarkIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className={className}>
      <path d="M4 3h24v26l-12-7L4 29V3z" fill="white" />
    </svg>
  );
}

export default function LandingOverlay({ onLogin }: { onLogin: (token: string, user: User) => void }) {
  const [phase, setPhase] = useState<Phase>('loading');
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);

  // Login fields
  const [mobile, setMobile] = useState('');
  const [pin, setPin] = useState('');

  // Register fields
  const [regName, setRegName] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regPin, setRegPin] = useState('');
  const [regConfirmPin, setRegConfirmPin] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30);
    (async () => {
      try {
        const res = await fetch('/api/auth/status');
        const data = await res.json();
        setPhase(data.hasUsers ? 'login' : 'register');
      } catch {
        setPhase('login');
      }
    })();
    return () => clearTimeout(t);
  }, []);

  function shake() {
    setShakeKey((k) => k + 1);
  }

  async function handleLogin() {
    if (!mobile || !pin || loading) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ mobile, pin }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Incorrect mobile or PIN'); shake(); return; }
      onLogin(data.token, data.user);
    } catch {
      setError('Network error — try again');
      shake();
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    if (!regName.trim() || !regMobile || !regPin || !regConfirmPin || loading) return;
    if (regPin !== regConfirmPin) { setError('PINs do not match'); shake(); return; }
    if (!/^\d{4,6}$/.test(regPin)) { setError('PIN must be 4–6 digits'); shake(); return; }
    if (!/^\d{7,15}$/.test(regMobile)) { setError('Enter a valid mobile number'); shake(); return; }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: regName.trim(), mobile: regMobile, pin: regPin }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Registration failed'); shake(); return; }
      onLogin(data.token, data.user);
    } catch {
      setError('Network error — try again');
      shake();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{
        backdropFilter: 'blur(14px) saturate(0.6)',
        background: 'rgba(250,250,249,0.85)',
        opacity: mounted ? 1 : 0,
        transition: 'opacity 0.45s ease',
      }}
    >
      <div
        className="w-full max-w-sm flex flex-col items-center gap-5"
        style={{
          transform: mounted ? 'translateY(0)' : 'translateY(20px)',
          transition: 'transform 0.45s ease',
        }}
      >
        {/* Logo */}
        <div className="animate-pulse-slow w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-200">
          <BookmarkIcon className="w-8 h-8" />
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">LinkVault</h1>
          <p className="text-stone-500 text-sm mt-0.5">Your private link library</p>
        </div>

        {phase === 'loading' && (
          <div className="flex items-center gap-2 text-sm text-muted">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Loading…
          </div>
        )}

        {/* ── Login ── */}
        {phase === 'login' && (
          <div key={shakeKey} className="w-full flex flex-col gap-3 animate-fade-in">
            <input
              type="tel"
              inputMode="numeric"
              value={mobile}
              onChange={(e) => { setMobile(e.target.value.replace(/\D/g, '')); setError(null); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }}
              placeholder="Mobile number"
              autoFocus
              className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 bg-white/90 text-sm focus:outline-none focus:border-blue-500 transition-colors text-center tracking-widest"
            />
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => { setPin(e.target.value.replace(/\D/g, '')); setError(null); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }}
              placeholder="PIN"
              className={`w-full px-4 py-3 rounded-xl border-2 bg-white/90 text-sm focus:outline-none transition-colors text-center tracking-[0.5em] ${
                error ? 'border-red-400 animate-shake' : 'border-stone-200 focus:border-blue-500'
              }`}
            />
            {error && <p className="text-xs text-red-500 text-center -mt-1">{error}</p>}
            <button
              onClick={handleLogin}
              disabled={!mobile || !pin || loading}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-40 active:scale-95 transition-all shadow-md shadow-blue-100"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </div>
        )}

        {/* ── Register ── */}
        {phase === 'register' && (
          <div key={`r${shakeKey}`} className="w-full flex flex-col gap-3 animate-fade-in">
            <p className="text-xs text-center text-muted -mt-1">Set up your account to get started</p>
            <input
              type="text"
              value={regName}
              onChange={(e) => { setRegName(e.target.value); setError(null); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleRegister(); }}
              placeholder="Your name"
              autoFocus
              className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 bg-white/90 text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
            <input
              type="tel"
              inputMode="numeric"
              value={regMobile}
              onChange={(e) => { setRegMobile(e.target.value.replace(/\D/g, '')); setError(null); }}
              placeholder="Mobile number"
              className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 bg-white/90 text-sm focus:outline-none focus:border-blue-500 transition-colors text-center tracking-widest"
            />
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={regPin}
              onChange={(e) => { setRegPin(e.target.value.replace(/\D/g, '')); setError(null); }}
              placeholder="PIN (4–6 digits)"
              className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 bg-white/90 text-sm focus:outline-none focus:border-blue-500 transition-colors text-center tracking-[0.5em]"
            />
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={regConfirmPin}
              onChange={(e) => { setRegConfirmPin(e.target.value.replace(/\D/g, '')); setError(null); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleRegister(); }}
              placeholder="Confirm PIN"
              className={`w-full px-4 py-3 rounded-xl border-2 bg-white/90 text-sm focus:outline-none transition-colors text-center tracking-[0.5em] ${
                error ? 'border-red-400 animate-shake' : 'border-stone-200 focus:border-blue-500'
              }`}
            />
            {error && <p className="text-xs text-red-500 text-center -mt-1">{error}</p>}
            <button
              onClick={handleRegister}
              disabled={!regName.trim() || !regMobile || !regPin || !regConfirmPin || loading}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-40 active:scale-95 transition-all shadow-md shadow-blue-100"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
