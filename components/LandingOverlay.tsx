'use client';

import { useState, useEffect } from 'react';
import SignupFlow from './SignupFlow';

type LoginPhase = 'idle' | 'entering-pw' | 'checking' | 'error' | 'unlocking';

function BookmarkIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className={className}>
      <path d="M4 3h24v26l-12-7L4 29V3z" fill="white" />
    </svg>
  );
}

export default function LandingOverlay({
  hasPassword,
  onUnlock,
}: {
  hasPassword: boolean;
  onUnlock: (pw: string) => void;
}) {
  const [phase, setPhase] = useState<LoginPhase>('idle');
  const [pw, setPw] = useState('');
  const [mounted, setMounted] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);

  const isUnlocking = phase === 'unlocking';
  const showPwForm = phase === 'entering-pw' || phase === 'checking' || phase === 'error';

  async function tryUnlock() {
    if (!pw || phase === 'checking') return;
    setPhase('checking');
    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-admin-password': pw },
        body: JSON.stringify({}),
      });
      if (res.status === 401) {
        setShakeKey((k) => k + 1);
        setPhase('error');
        setTimeout(() => setPhase('entering-pw'), 1200);
        return;
      }
      setPhase('unlocking');
      setTimeout(() => onUnlock(pw), 550);
    } catch {
      setShakeKey((k) => k + 1);
      setPhase('error');
      setTimeout(() => setPhase('entering-pw'), 1200);
    }
  }

  function handleSignupComplete(password: string) {
    setPhase('unlocking');
    setTimeout(() => onUnlock(password), 550);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        backdropFilter: 'blur(14px) saturate(0.6)',
        background: 'rgba(250,250,249,0.82)',
        opacity: mounted && !isUnlocking ? 1 : 0,
        pointerEvents: isUnlocking ? 'none' : 'auto',
        transition: 'opacity 0.55s ease',
      }}
    >
      <div
        className="flex flex-col items-center gap-6 px-4"
        style={{
          transform: mounted ? 'translateY(0)' : 'translateY(20px)',
          transition: 'transform 0.5s ease',
        }}
      >
        {/* Logo — always shown */}
        <div className="animate-pulse-slow w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-200">
          <BookmarkIcon className="w-10 h-10" />
        </div>

        {!hasPassword ? (
          /* ── First-time setup ── */
          <SignupFlow onComplete={handleSignupComplete} />
        ) : (
          /* ── Sign-in form ── */
          <>
            <div className="text-center animate-fade-in">
              <h1 className="text-3xl font-bold text-stone-900 tracking-tight mb-1">LinkVault</h1>
              <p className="text-stone-500 text-sm">Your personal link library</p>
            </div>

            {!showPwForm && (
              <button
                onClick={() => setPhase('entering-pw')}
                className="relative overflow-hidden px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold text-base shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all duration-150 group animate-fade-in"
              >
                <span className="relative z-10">Sign in</span>
                <span
                  className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent"
                  style={{ transition: 'transform 0.65s ease' }}
                />
              </button>
            )}

            {showPwForm && (
              <div className="flex flex-col items-center gap-3 animate-slide-up">
                <input
                  key={shakeKey}
                  type="password"
                  value={pw}
                  onChange={(e) => { setPw(e.target.value); if (phase === 'error') setPhase('entering-pw'); }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') tryUnlock();
                    if (e.key === 'Escape') { setPhase('idle'); setPw(''); }
                  }}
                  placeholder="Enter passphrase"
                  autoFocus
                  className={`px-4 py-3 rounded-xl border-2 text-center text-base bg-white/90 focus:outline-none w-64 transition-colors ${
                    phase === 'error'
                      ? 'border-red-400 text-red-600 animate-shake'
                      : 'border-stone-200 focus:border-blue-500'
                  }`}
                />
                <div className="flex gap-2">
                  <button
                    onClick={tryUnlock}
                    disabled={!pw || phase === 'checking'}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 active:scale-95 transition-all text-sm"
                  >
                    {phase === 'checking' ? 'Checking…' : phase === 'error' ? 'Wrong passphrase' : 'Unlock'}
                  </button>
                  <button
                    onClick={() => { setPhase('idle'); setPw(''); }}
                    className="px-4 py-2.5 text-stone-500 rounded-lg hover:bg-stone-100 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
