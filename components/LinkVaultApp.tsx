'use client';

import { useEffect, useMemo, useState } from 'react';
import type { LinkRow } from '@/lib/db';
import AddLinkForm from './AddLinkForm';
import LinkCard from './LinkCard';
import LandingOverlay from './LandingOverlay';
import SignupFlow from './SignupFlow';

type Filter = 'all' | 'video' | 'article';

function BookmarkIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className={className}>
      <path d="M4 3h24v26l-12-7L4 29V3z" fill="white" />
    </svg>
  );
}

export default function LinkVaultApp({
  initialLinks,
  dbError,
  hasPassword,
}: {
  initialLinks: LinkRow[];
  dbError: string | null;
  hasPassword: boolean;
}) {
  const [links, setLinks] = useState<LinkRow[]>(initialLinks);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [adminPassword, setAdminPassword] = useState<string | null>(null);
  const [showChangePw, setShowChangePw] = useState(false);

  // Restore admin password from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem('linkvault.admin');
    if (stored) setAdminPassword(stored);
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  const counts = useMemo(() => ({
    all: links.length,
    video: links.filter((l) => l.kind === 'video').length,
    article: links.filter((l) => l.kind === 'article').length,
  }), [links]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return links.filter((l) => {
      if (filter !== 'all' && l.kind !== filter) return false;
      if (!q) return true;
      const hay = [l.title, l.description, l.note, l.url, l.site_name, l.tags?.join(' ')]
        .filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [links, filter, query]);

  async function handleAdd(url: string, note: string, tags: string[]) {
    if (!adminPassword) return;
    const res = await fetch('/api/links', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-admin-password': adminPassword },
      body: JSON.stringify({ url, note, tags }),
    });
    if (res.status === 401) {
      sessionStorage.removeItem('linkvault.admin');
      setAdminPassword(null);
      showToast('Password rejected, please sign in again');
      return;
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      showToast(err.error || 'Could not save link');
      return;
    }
    const { link } = await res.json();
    setLinks((cur) => [link, ...cur]);
    showToast('Link saved');
  }

  async function handleDelete(id: string) {
    if (!adminPassword) return;
    if (!confirm('Delete this link?')) return;
    const res = await fetch(`/api/links/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-password': adminPassword },
    });
    if (!res.ok) { showToast('Could not delete'); return; }
    setLinks((cur) => cur.filter((l) => l.id !== id));
    showToast('Deleted');
  }

  async function handleSaveEdit(id: string, note: string, tags: string[]) {
    if (!adminPassword) return;
    const res = await fetch(`/api/links/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', 'x-admin-password': adminPassword },
      body: JSON.stringify({ note, tags }),
    });
    if (!res.ok) { showToast('Could not save changes'); return; }
    const { link } = await res.json();
    setLinks((cur) => cur.map((l) => (l.id === id ? link : l)));
    showToast('Saved');
  }

  function handleAdminUnlock(pw: string) {
    sessionStorage.setItem('linkvault.admin', pw);
    setAdminPassword(pw);
  }

  function handleSignOut() {
    sessionStorage.removeItem('linkvault.admin');
    setAdminPassword(null);
  }

  function handlePasswordChanged(newPw: string) {
    sessionStorage.setItem('linkvault.admin', newPw);
    setAdminPassword(newPw);
    setShowChangePw(false);
    showToast('Password updated');
  }

  const isLocked = !adminPassword;

  return (
    <>
      {/* Landing / sign-in overlay */}
      {isLocked && (
        <LandingOverlay hasPassword={hasPassword} onUnlock={handleAdminUnlock} />
      )}

      {/* Change-password modal */}
      {showChangePw && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.45)' }}
        >
          <div className="bg-white rounded-2xl px-8 py-7 shadow-2xl mx-4 animate-slide-up">
            <SignupFlow
              currentPassword={adminPassword}
              onComplete={handlePasswordChanged}
              onCancel={() => setShowChangePw(false)}
            />
          </div>
        </div>
      )}

      {/* Main content — blurred & greyed behind overlay when locked */}
      <main
        className="max-w-5xl mx-auto px-4 py-8"
        style={{
          filter: isLocked ? 'blur(3px) grayscale(0.7) brightness(0.92)' : 'none',
          pointerEvents: isLocked ? 'none' : 'auto',
          userSelect: isLocked ? 'none' : 'auto',
          transition: 'filter 0.5s ease',
        }}
      >
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
              <BookmarkIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-medium leading-tight">LinkVault</h1>
              <p className="text-xs text-muted">Save videos and articles with previews</p>
            </div>
          </div>

          {adminPassword && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowChangePw(true)}
                className="text-sm text-muted hover:text-ink transition-colors"
              >
                Change password
              </button>
              <span className="text-stone-200">|</span>
              <button
                onClick={handleSignOut}
                className="text-sm text-muted hover:text-ink transition-colors"
              >
                Sign out
              </button>
            </div>
          )}
        </header>

        {dbError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 text-red-800 px-4 py-3 text-sm">
            Database error: {dbError}. Did you run <code>npm run db:init</code> and set <code>DATABASE_URL</code>?
          </div>
        )}

        {/* Add form — only when signed in */}
        {adminPassword && <AddLinkForm onAdd={handleAdd} />}

        {/* Filter + search */}
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex gap-2">
            <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>All · {counts.all}</FilterChip>
            <FilterChip active={filter === 'video'} onClick={() => setFilter('video')}>Videos · {counts.video}</FilterChip>
            <FilterChip active={filter === 'article'} onClick={() => setFilter('article')}>Articles · {counts.article}</FilterChip>
          </div>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, note, tag…"
            className="px-3 py-1.5 rounded-md border border-border bg-surface text-sm w-56 focus:outline-none focus:border-accent"
          />
        </div>

        {/* Cards grid */}
        {visible.length === 0 ? (
          <div className="text-center text-muted py-16 text-sm">
            {links.length === 0
              ? adminPassword ? 'No links yet — paste one above to get started.' : 'No links yet.'
              : 'Nothing matches your filter.'}
          </div>
        ) : (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {visible.map((l) => (
              <LinkCard
                key={l.id}
                link={l}
                isAdmin={!!adminPassword}
                onCopy={() => { navigator.clipboard.writeText(l.url); showToast('Link copied'); }}
                onShare={async () => {
                  if (navigator.share) {
                    try { await navigator.share({ title: l.title ?? l.url, url: l.url }); }
                    catch { /* ignore */ }
                  } else {
                    navigator.clipboard.writeText(l.url);
                    showToast('Link copied (share not supported here)');
                  }
                }}
                onDelete={() => handleDelete(l.id)}
                onSave={(note, tags) => handleSaveEdit(l.id, note, tags)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-ink text-white px-4 py-2 rounded-md text-sm shadow-lg z-40">
          {toast}
        </div>
      )}
    </>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
        active ? 'bg-ink text-white border-ink' : 'bg-surface border-border text-ink hover:border-muted'
      }`}
    >
      {children}
    </button>
  );
}
