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

  const thumbSrc =
    link.thumbnail_url ||
    `https://api.microlink.io?url=${encodeURIComponent(link.url)}&screenshot=true&embed=screenshot.url`;
  const host = (() => { try { return new URL(link.url).hostname.replace(/^www\./, ''); } catch { return link.url; } })();
  const isVideo = link.kind === 'video';

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
    <div className="group rounded-xl border border-border bg-white overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Thumbnail */}
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block relative bg-stone-100 overflow-hidden"
        style={{ aspectRatio: '16 / 9' }}
      >
        {!imgFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbSrc}
            alt={link.title ?? 'preview'}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgFailed(true)}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-300">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        <span className={`absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
          isVideo ? 'bg-red-500/90 text-white' : 'bg-black/60 text-white'
        }`}>
          {isVideo ? '▶ Video' : '📄 Article'}
        </span>
      </a>

      {/* Body */}
      <div className="p-3.5 flex-1 flex flex-col">
        {/* Site */}
        <div className="flex items-center gap-1.5 mb-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://www.google.com/s2/favicons?domain=${host}&sz=16`}
            alt=""
            className="w-3.5 h-3.5 rounded-sm opacity-60"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <span className="text-[11px] text-muted truncate">{link.site_name ?? host}</span>
        </div>

        {/* Title */}
        <p className="font-semibold text-sm leading-snug mb-2 line-clamp-2 text-ink">
          {link.title ?? link.url}
        </p>

        {editing ? (
          <>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Your note…"
              rows={3}
              className="w-full text-xs px-2.5 py-2 rounded-lg border border-border bg-stone-50 focus:outline-none focus:border-accent resize-y mb-2 transition-colors"
            />
            <div className="flex items-center gap-1 flex-wrap mb-2">
              {tags.map((t) => (
                <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium flex items-center gap-1">
                  {t}
                  <button onClick={() => setTags(tags.filter((x) => x !== t))} className="hover:text-blue-900 leading-none">×</button>
                </span>
              ))}
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); } }}
                onBlur={addTag}
                placeholder="+ tag"
                className="text-[11px] px-2 py-0.5 rounded-full border border-dashed border-stone-300 bg-transparent focus:outline-none focus:border-accent w-16"
              />
            </div>
          </>
        ) : (
          <>
            {link.note && (
              <p className="text-xs text-muted mb-2 line-clamp-2 whitespace-pre-wrap leading-relaxed">{link.note}</p>
            )}
            {link.tags && link.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap mb-2">
                {link.tags.map((t) => (
                  <span key={t} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">{t}</span>
                ))}
              </div>
            )}
          </>
        )}

        {/* Actions */}
        <div className="mt-auto pt-2.5 border-t border-border flex gap-1.5 items-center">
          {editing ? (
            <>
              <button onClick={save} className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-ink text-white hover:opacity-90 font-medium transition-opacity">
                Save
              </button>
              <button
                onClick={() => { setEditing(false); setNote(link.note ?? ''); setTags(link.tags ?? []); }}
                className="px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-border hover:bg-stone-50 text-center font-medium transition-colors"
              >
                Open ↗
              </a>
              <IconBtn label="Copy link" onClick={onCopy}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </IconBtn>
              {isAdmin && (
                <IconBtn label="Edit" onClick={() => setEditing(true)}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </IconBtn>
              )}
              {isAdmin && (
                <IconBtn label="Delete" onClick={onDelete} danger>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </IconBtn>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function IconBtn({ children, onClick, label, danger }: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`w-7 h-7 flex items-center justify-center rounded-lg border transition-colors ${
        danger
          ? 'border-border text-stone-400 hover:bg-red-50 hover:border-red-200 hover:text-red-600'
          : 'border-border text-muted hover:bg-stone-50 hover:text-ink'
      }`}
    >
      {children}
    </button>
  );
}
