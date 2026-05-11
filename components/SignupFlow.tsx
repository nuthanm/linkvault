'use client';

import { useState } from 'react';

function webRandomInt(max: number): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] % max;
}

function makePassphrase(words: string[]): string {
  return Array.from({ length: 6 }, () => words[webRandomInt(words.length)]).join('-');
}

type Step = 'words' | 'passphrase';

export default function SignupFlow({
  onComplete,
  currentPassword,
  onCancel,
}: {
  onComplete: (pw: string) => void;
  currentPassword?: string | null;
  onCancel?: () => void;
}) {
  const [step, setStep] = useState<Step>('words');
  const [words, setWords] = useState(['', '', '']);
  const [passphrase, setPassphrase] = useState('');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const cleaned = words.map((w) => w.trim().toLowerCase().replace(/\s+/g, ''));
  const wordErrors = cleaned.map((w) => {
    if (!w) return 'Required';
    if (w.length < 3) return 'Min 3 characters';
    return null;
  });
  const hasDupes = new Set(cleaned.filter(Boolean)).size < cleaned.filter(Boolean).length;
  const canProceed = wordErrors.every((e) => !e) && !hasDupes;

  function buildPassphrase() {
    setPassphrase(makePassphrase(cleaned));
    setCopied(false);
    setSaveError(null);
  }

  function goGenerate() {
    buildPassphrase();
    setStep('passphrase');
  }

  async function copy() {
    try { await navigator.clipboard.writeText(passphrase); } catch { /* ignore */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      const headers: Record<string, string> = { 'content-type': 'application/json' };
      if (currentPassword) headers['x-admin-password'] = currentPassword;
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers,
        body: JSON.stringify({ password: passphrase }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSaveError(data.error ?? 'Could not save password');
        return;
      }
      onComplete(passphrase);
    } finally {
      setSaving(false);
    }
  }

  if (step === 'words') {
    return (
      <div className="flex flex-col gap-5 w-72 animate-fade-in">
        <div className="text-center">
          <h2 className="text-lg font-bold text-stone-900">
            {currentPassword ? 'Change password' : 'Set up your password'}
          </h2>
          <p className="text-stone-500 text-sm mt-1">
            Pick 3 personal words — they&apos;ll be shuffled into your passphrase
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {words.map((w, i) => (
            <div key={i}>
              <input
                type="text"
                value={w}
                autoFocus={i === 0}
                onChange={(e) => {
                  const next = [...words];
                  next[i] = e.target.value;
                  setWords(next);
                }}
                onKeyDown={(e) => { if (e.key === 'Enter' && canProceed) goGenerate(); }}
                placeholder={`Word ${i + 1}  e.g. ${['ocean', 'sunset', 'guitar'][i]}`}
                className={`w-full px-4 py-2.5 rounded-xl border-2 bg-white/90 focus:outline-none text-sm transition-colors ${
                  w && wordErrors[i] ? 'border-red-300' : 'border-stone-200 focus:border-blue-500'
                }`}
              />
              {w && wordErrors[i] && (
                <p className="text-xs text-red-500 mt-1 ml-1">{wordErrors[i]}</p>
              )}
            </div>
          ))}
          {hasDupes && (
            <p className="text-xs text-amber-600 text-center">All 3 words must be different</p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={goGenerate}
            disabled={!canProceed}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 disabled:opacity-40 active:scale-95 transition-all"
          >
            Generate passphrase →
          </button>
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2.5 text-stone-500 rounded-xl hover:bg-stone-100 transition-colors text-sm"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-80 animate-slide-up">
      <div className="text-center">
        <h2 className="text-lg font-bold text-stone-900">Your passphrase</h2>
        <p className="text-stone-500 text-xs mt-1">
          Copy and store this somewhere safe — you&apos;ll need it to sign in
        </p>
      </div>

      <div className="rounded-xl border-2 border-stone-200 bg-stone-50 px-5 py-4 text-center">
        <code className="text-sm font-mono font-semibold text-stone-900 break-all leading-loose tracking-wide select-all">
          {passphrase}
        </code>
      </div>

      <div className="flex justify-center gap-2 flex-wrap">
        <button
          onClick={copy}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-95 ${
            copied ? 'bg-green-600 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
          }`}
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
        <button
          onClick={buildPassphrase}
          className="px-4 py-2 rounded-lg text-sm text-stone-500 hover:bg-stone-100 transition-colors"
        >
          Regenerate
        </button>
        <button
          onClick={() => setStep('words')}
          className="px-4 py-2 rounded-lg text-sm text-stone-500 hover:bg-stone-100 transition-colors"
        >
          Edit words
        </button>
      </div>

      {saveError && <p className="text-sm text-red-600 text-center">{saveError}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 active:scale-95 transition-all text-sm"
      >
        {saving ? 'Saving…' : "I've saved it — continue →"}
      </button>

      {onCancel && (
        <button
          onClick={onCancel}
          className="text-sm text-stone-400 hover:text-stone-600 transition-colors text-center"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
