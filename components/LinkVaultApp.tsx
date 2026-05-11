'use client';

import { useEffect, useMemo, useState } from 'react';
import type { LinkRow } from '@/lib/db';
import AddLinkForm from './AddLinkForm';
import LinkCard from './LinkCard';
import LandingOverlay from './LandingOverlay';
import AccountMenu from './AccountMenu';

type Filter = 'all' | 'video' | 'article';
type User = { id: string; name: string; mobile_number: string };

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function BookmarkIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className={className}>
      <path d="M4 3h24v26l-12-7L4 29V3z" fill="white" />
    </svg>
  );
}

export default function LinkVaultApp() {
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState<{ msg: string; error?: boolean } | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  // Restore session from sessionStorage on mount
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('linkvault.auth');
      if (raw) {
        const { token, user: u } = JSON.parse(raw) as { token: string; user: User };
        setSessionToken(token);
        setUser(u);
        fetchLinks(token);
      }
    } catch {
      sessionStorage.removeItem('linkvault.auth');
    }
  }, []);

  async function fetchLinks(token: string) {
    setLoading(true);
    try {
      const res = await fetch('/api/links', { headers: { 'x-session-token': token } });
      if (res.status === 401) { handleSignOut(); return; }
      const data = await res.json();
      setLinks(data.links ?? []);
    } catch {
      showToast('Could not load links', true);
    } finally {
      setLoading(false);
    }
  }

  function showToast(msg: string, error = false) {
    setToast({ msg, error });
    setTimeout(() => setToast(null), 2400);
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
    if (!sessionToken) return;
    const res = await fetch('/api/links', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-session-token': sessionToken },
      body: JSON.stringify({ url, note, tags }),
    });
    if (res.status === 401) { handleSignOut(); return; }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      showToast(err.error || 'Could not save link', true);
      return;
    }
    const { link } = await res.json();
    setLinks((cur) => [link, ...cur]);
    showToast('Link saved');
  }

  async function handleDelete(id: string) {
    if (!sessionToken) return;
    if (!confirm('Delete this link?')) return;
    const res = await fetch(`/api/links/${id}`, {
      method: 'DELETE',
      headers: { 'x-session-token': sessionToken },
    });
    if (!res.ok) { showToast('Could not delete', true); return; }
    setLinks((cur) => cur.filter((l) => l.id !== id));
    showToast('Deleted');
  }

  async function handleSaveEdit(id: string, note: string, tags: string[]) {
    if (!sessionToken) return;
    const res = await fetch(`/api/links/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', 'x-session-token': sessionToken },
      body: JSON.stringify({ note, tags }),
    });
    if (!res.ok) { showToast('Could not save changes', true); return; }
    const { link } = await res.json();
    setLinks((cur) => cur.map((l) => (l.id === id ? link : l)));
    showToast('Saved');
  }

  function handleLogin(token: string, loggedInUser: User) {
    sessionStorage.setItem('linkvault.auth', JSON.stringify({ token, user: loggedInUser }));
    setSessionToken(token);
    setUser(loggedInUser);
    fetchLinks(token);
  }

  function handleSignOut() {
    if (sessionToken) {
      fetch('/api/auth/logout', { method: 'POST', headers: { 'x-session-token': sessionToken } }).catch(() => null);
    }
    sessionStorage.removeItem('linkvault.auth');
    setSessionToken(null);
    setUser(null);
    setLinks([]);
  }

  function handleNameChange(newName: string) {
    if (!user) return;
    const updated = { ...user, name: newName };
    setUser(updated);
    if (sessionToken) {
      sessionStorage.setItem('linkvault.auth', JSON.stringify({ token: sessionToken, user: updated }));
    }
  }

  const isLocked = !sessionToken;

  return (
    <>
      {isLocked && <LandingOverlay onLogin={handleLogin} />}

      {/* Sticky header */}
      <header
        className="sticky top-0 z-30 bg-white/80 border-b border-border"
        style={{
          backdropFilter: 'blur(12px)',
          filter: isLocked ? 'blur(2px)' : 'none',
          transition: 'filter 0.5s ease',
        }}
      >
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm shadow-blue-200">
              <BookmarkIcon className="w-4 h-4" />
            </div>
            <span className="font-semibold text-base tracking-tight">LinkVault</span>
          </div>

          {sessionToken && user && (
            <AccountMenu
              user={user}
              sessionToken={sessionToken}
              onNameChange={handleNameChange}
              onSignOut={handleSignOut}
            />
          )}
        </div>
      </header>

      <main
        className="max-w-5xl mx-auto px-4 py-8"
        style={{
          filter: isLocked ? 'blur(3px) grayscale(0.7) brightness(0.92)' : 'none',
          pointerEvents: isLocked ? 'none' : 'auto',
          userSelect: isLocked ? 'none' : 'auto',
          transition: 'filter 0.5s ease',
        }}
      >
        {sessionToken && <AddLinkForm onAdd={handleAdd} />}

        {/* Filter + search */}
        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <div className="flex gap-1.5">
            <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
              All {counts.all > 0 && <span className="opacity-60 text-[11px]">{counts.all}</span>}
            </FilterChip>
            <FilterChip active={filter === 'video'} onClick={() => setFilter('video')}>
              Videos {counts.video > 0 && <span className="opacity-60 text-[11px]">{counts.video}</span>}
            </FilterChip>
            <FilterChip active={filter === 'article'} onClick={() => setFilter('article')}>
              Articles {counts.article > 0 && <span className="opacity-60 text-[11px]">{counts.article}</span>}
            </FilterChip>
          </div>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="pl-9 pr-3 py-1.5 rounded-lg border border-border bg-white text-sm w-44 focus:outline-none focus:border-accent focus:w-56 transition-all"
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24 text-muted text-sm gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Loading…
          </div>
        ) : visible.length === 0 ? (
          <EmptyState hasLinks={links.length > 0} isSignedIn={!!sessionToken} />
        ) : (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))' }}>
            {visible.map((l) => (
              <LinkCard
                key={l.id}
                link={l}
                isAdmin={!!sessionToken}
                onCopy={() => { navigator.clipboard.writeText(l.url); showToast('Copied to clipboard'); }}
                onShare={async () => {
                  if (navigator.share) {
                    try { await navigator.share({ title: l.title ?? l.url, url: l.url }); } catch { /* ignore */ }
                  } else {
                    navigator.clipboard.writeText(l.url);
                    showToast('Link copied');
                  }
                }}
                onDelete={() => handleDelete(l.id)}
                onSave={(note, tags) => handleSaveEdit(l.id, note, tags)}
              />
            ))}
          </div>
        )}
      </main>

      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg z-40 animate-slide-up whitespace-nowrap ${
          toast.error ? 'bg-red-600 text-white' : 'bg-ink text-white'
        }`}>
          {toast.msg}
        </div>
      )}
    </>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-all ${
        active
          ? 'bg-ink text-white border-ink shadow-sm'
          : 'bg-white border-border text-ink hover:border-stone-300 hover:bg-stone-50'
      }`}
    >
      {children}
    </button>
  );
}

function EmptyState({ hasLinks, isSignedIn }: { hasLinks: boolean; isSignedIn: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      </div>
      <p className="text-sm font-medium text-ink mb-1">
        {hasLinks ? 'Nothing matches your filter' : isSignedIn ? 'No links yet' : 'Your links will appear here'}
      </p>
      {!hasLinks && isSignedIn && (
        <p className="text-xs text-muted">Paste a URL above to save your first link.</p>
      )}
    </div>
  );
}
