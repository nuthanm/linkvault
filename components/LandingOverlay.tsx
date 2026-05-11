'use client';

import { useState } from 'react';

type User = { id: string; name: string; mobile_number: string };
type FormType = 'signup' | 'signin';

function BookmarkIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className={className}>
      <path d="M4 3h24v26l-12-7L4 29V3z" fill="white" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function LandingOverlay({ onLogin }: { onLogin: (token: string, user: User) => void }) {
  const [form, setForm] = useState<FormType>('signup');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Signin fields
  const [mobile, setMobile] = useState('');
  const [pin, setPin] = useState('');

  // Signup fields
  const [regName, setRegName] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regPin, setRegPin] = useState('');
  const [regConfirmPin, setRegConfirmPin] = useState('');

  function switchForm(to: FormType) {
    setForm(to);
    setError(null);
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
      if (!res.ok) { setError(data.error || 'Incorrect mobile or PIN'); return; }
      onLogin(data.token, data.user);
    } catch {
      setError('Network error — try again');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    if (!regName.trim() || !regMobile || !regPin || !regConfirmPin || loading) return;
    if (regPin !== regConfirmPin) { setError('PINs do not match'); return; }
    if (!/^\d{4,6}$/.test(regPin)) { setError('PIN must be 4–6 digits'); return; }
    if (!/^\d{7,15}$/.test(regMobile)) { setError('Enter a valid mobile number'); return; }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: regName.trim(), mobile: regMobile, pin: regPin }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Registration failed'); return; }
      onLogin(data.token, data.user);
    } catch {
      setError('Network error — try again');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* ── Left panel — branding ── */}
      <div className="hidden lg:flex w-[45%] flex-col items-center justify-center p-12 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 50%, #1e3a8a 100%)' }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute top-1/3 -right-8 w-32 h-32 rounded-full bg-white/5" />

        <div className="relative max-w-xs w-full">
          {/* Logo */}
          <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-8 shadow-xl ring-1 ring-white/20">
            <BookmarkIcon className="w-7 h-7" />
          </div>

          <h1 className="text-4xl font-bold tracking-tight mb-3 leading-tight">LinkVault</h1>
          <p className="text-blue-200 text-base leading-relaxed mb-10">
            Your private link library. Save, organize, and access all your important links in one secure place.
          </p>

          <div className="flex flex-col gap-4">
            {[
              'Save any link with one click',
              'Organize with tags and search',
              'Access from anywhere, anytime',
            ].map((text) => (
              <div key={text} className="flex items-center gap-3 text-blue-100 text-sm">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <CheckIcon />
                </div>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel — auth forms ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-white overflow-y-auto">
        <div className="w-full max-w-sm">
          {/* Mobile logo — only visible on small screens */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-200">
              <BookmarkIcon className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold text-stone-900">LinkVault</span>
          </div>

          <div className="mb-7">
            <h2 className="text-2xl font-bold text-stone-900 mb-1">
              {form === 'signup' ? 'Create your account' : 'Welcome back'}
            </h2>
            <p className="text-stone-500 text-sm">
              {form === 'signup'
                ? 'Set up your personal link vault in seconds'
                : 'Enter your credentials to access your vault'}
            </p>
          </div>

          {/* ── Signup form ── */}
          {form === 'signup' && (
            <div className="flex flex-col gap-3 animate-fade-in">
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">Your name</label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => { setRegName(e.target.value); setError(null); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleRegister(); }}
                  placeholder="e.g. Nuthan"
                  autoFocus
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-stone-200 bg-stone-50 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">Mobile number</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={regMobile}
                  onChange={(e) => { setRegMobile(e.target.value.replace(/\D/g, '')); setError(null); }}
                  placeholder="10–15 digit number"
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-stone-200 bg-stone-50 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all tracking-widest"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={regPin}
                  onChange={(e) => { setRegPin(e.target.value.replace(/\D/g, '')); setError(null); }}
                  placeholder="4–6 digit PIN"
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-stone-200 bg-stone-50 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all tracking-[0.5em]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">Confirm PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={regConfirmPin}
                  onChange={(e) => { setRegConfirmPin(e.target.value.replace(/\D/g, '')); setError(null); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleRegister(); }}
                  placeholder="Re-enter PIN"
                  className={`w-full px-4 py-2.5 rounded-xl border-2 bg-stone-50 text-sm focus:outline-none transition-all tracking-[0.5em] ${
                    error ? 'border-red-400 bg-red-50' : 'border-stone-200 focus:border-blue-500 focus:bg-white'
                  }`}
                />
              </div>

              {error && (
                <p className="text-xs text-red-500 -mt-1 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </p>
              )}

              <button
                onClick={handleRegister}
                disabled={!regName.trim() || !regMobile || !regPin || !regConfirmPin || loading}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-40 active:scale-[0.98] transition-all shadow-md shadow-blue-100 mt-1"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Creating account…
                  </span>
                ) : 'Create account'}
              </button>

              <p className="text-center text-sm text-stone-500 mt-2">
                Already have an account?{' '}
                <button
                  onClick={() => switchForm('signin')}
                  className="text-blue-600 font-semibold hover:underline underline-offset-2"
                >
                  Sign in
                </button>
              </p>
            </div>
          )}

          {/* ── Signin form ── */}
          {form === 'signin' && (
            <div className="flex flex-col gap-3 animate-fade-in">
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">Mobile number</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={mobile}
                  onChange={(e) => { setMobile(e.target.value.replace(/\D/g, '')); setError(null); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }}
                  placeholder="Your registered mobile"
                  autoFocus
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-stone-200 bg-stone-50 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all tracking-widest"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => { setPin(e.target.value.replace(/\D/g, '')); setError(null); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }}
                  placeholder="Your PIN"
                  className={`w-full px-4 py-2.5 rounded-xl border-2 bg-stone-50 text-sm focus:outline-none transition-all tracking-[0.5em] ${
                    error ? 'border-red-400 bg-red-50' : 'border-stone-200 focus:border-blue-500 focus:bg-white'
                  }`}
                />
              </div>

              {error && (
                <p className="text-xs text-red-500 -mt-1 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </p>
              )}

              <button
                onClick={handleLogin}
                disabled={!mobile || !pin || loading}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-40 active:scale-[0.98] transition-all shadow-md shadow-blue-100 mt-1"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Signing in…
                  </span>
                ) : 'Sign in'}
              </button>

              <p className="text-center text-sm text-stone-500 mt-2">
                Don&apos;t have an account?{' '}
                <button
                  onClick={() => switchForm('signup')}
                  className="text-blue-600 font-semibold hover:underline underline-offset-2"
                >
                  Sign up
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
