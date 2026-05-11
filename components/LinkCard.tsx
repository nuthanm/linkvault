'use client';

import { useState } from 'react';
import type { LinkRow } from '@/lib/db';

export default function LinkCard({
  link, isAdmin, onCopy, onShare, onDelete, onSave,
}: {
  link: LinkRow;
  isAdmin: boolean;
  onCopy: () => void;
  onShare: () => void;
  onDelete: () => void;
  onSave: (note: string, tags: string[]) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState(link.note ?? '');
  const [tags, setTags] = useState<string[]>(link.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [imgFailed, setImgFailed] = useState(false);

  // Use stored thumbnail; fall back to Microlink screenshot embed for articles without one
  const thumbSrc =
    link.thumbnail_url ||
    `https://api.microlink.io?url=${encodeURIComponent(link.url)}&screenshot=true&embed=screenshot.url`;
  const showThumb = !imgFailed;
  const host = (() => { try { return new URL(link.url).hostname.replace(/^www\./, ''); } catch { return link.url; } })();

  async function save() {
    await onSave(note.trim(), tags);
    setEditing(false);
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput('');
  }

  return (
    <div className="rounded-lg border border-border bg-surface overflow-hidden flex flex-col">
      {/* Thumbnail / preview box */}
      <a href={link.url} target="_blank" rel="noopener noreferrer" className="block relative bg-stone-100" style={{ aspectRatio: '16 / 9' }}>
        {showThumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbSrc}
            alt={link.title ?? 'preview'}
            className="w-full h-full object-cover"
            onError={() => setImgFailed(true)}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-400 text-sm">
            No preview available
          </div>
        )}
        <span className="absolute top-2 left-2 text-[11px] px-2 py-0.5 rounded-full bg-black/65 text-white">
          {link.kind === 'video' ? '▶ Video' : '📄 Article'}
        </span>
      </a>

      {/* Body */}
      <div className="p-3 flex-1 flex flex-col">
        <p className="text-[11px] text-muted mb-1">{link.site_name ?? host}</p>
        <p className="font-medium text-sm leading-snug mb-1 line-clamp-2">
          {link.title ?? link.url}
        </p>

        {editing ? (
          <>
            <textarea
              value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="Your note…" rows={3}
              className="w-full text-xs px-2 py-1.5 rounded-md border border-border bg-surface focus:outline-none focus:border-accent resize-y mb-2"
            />
            <div className="flex items-center gap-1 flex-wrap mb-2">
              {tags.map((t) => (
                <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 flex items-center gap-1">
                  {t}
                  <button onClick={() => setTags(tags.filter((x) => x !== t))} className="hover:text-blue-900">×</button>
                </span>
              ))}
              <input
                value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); } }}
                onBlur={addTag} placeholder="+ tag"
                className="text-[11px] px-2 py-0.5 rounded-full border border-dashed border-border bg-transparent focus:outline-none focus:border-accent w-16"
              />
            </div>
          </>
        ) : (
          <>
            {link.note && <p className="text-xs text-muted mb-2 line-clamp-3 whitespace-pre-wrap">{link.note}</p>}
            {link.tags && link.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap mb-2">
                {link.tags.map((t) => (
                  <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{t}</span>
                ))}
              </div>
            )}
          </>
        )}

        {/* Actions */}
        <div className="mt-auto pt-2 border-t border-border flex gap-1.5 items-center">
          {editing ? (
            <>
              <button onClick={save} className="flex-1 px-2 py-1 text-xs rounded-md bg-ink text-white hover:opacity-90">Save</button>
              <button onClick={() => { setEditing(false); setNote(link.note ?? ''); setTags(link.tags ?? []); }} className="px-2 py-1 text-xs rounded-md border border-border hover:bg-stone-50">Cancel</button>
            </>
          ) : (
            <>
              <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex-1 px-2 py-1 text-xs rounded-md border border-border hover:bg-stone-50 text-center">Open ↗</a>
              <IconBtn label="Copy link" onClick={onCopy}>⧉</IconBtn>
              <IconBtn label="Share" onClick={onShare}>↗</IconBtn>
              {isAdmin && <IconBtn label="Edit note" onClick={() => setEditing(true)}>✎</IconBtn>}
              {isAdmin && <IconBtn label="Delete" onClick={onDelete} danger>🗑</IconBtn>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function IconBtn({ children, onClick, label, danger }: { children: React.ReactNode; onClick: () => void; label: string; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`w-7 h-7 flex items-center justify-center rounded-md border border-border hover:bg-stone-50 text-sm ${danger ? 'text-red-600 hover:bg-red-50 hover:border-red-200' : ''}`}
    >
      {children}
    </button>
  );
}
