'use client';

import { useState } from 'react';
import type { LinkRow } from '@/lib/db';

export default function LinkCard({
  link, isAdmin, deleting, onCopy, onDelete, onSave,
}: {
  link: LinkRow;
  isAdmin: boolean;
  deleting?: boolean;
  onCopy: () => void;
  onDelete: () => void;
  onSave: (note: string, tags: string[]) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [note, setNote] = useState(link.note ?? '');
  const [tags, setTags] = useState<string[]>(link.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [imgFailed, setImgFailed] = useState(false);

  const thumbSrc =
    link.thumbnail_url ||
    `https://api.microlink.io?url=${encodeURIComponent(link.url)}&screenshot=true&embed=screenshot.url`;
  const host = (() => { try { return new URL(link.url).hostname.replace(/^www\./, ''); } catch { return link.url; } })();
  const isVideo = link.kind === 'video';
  const initial = host.charAt(0).toUpperCase();

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
    <div className={`group relative rounded-2xl border bg-white overflow-hidden flex flex-col transition-all duration-200 shadow-[0_1px_4px_rgba(0,0,0,0.06),0_2px_12px_rgba(0,0,0,0.04)] ${
      deleting
        ? 'border-red-200 scale-[0.98] opacity-60 pointer-events-none'
        : 'border-stone-200 hover:-translate-y-1 hover:shadow-[0_6px_24px_rgba(0,0,0,0.09),0_14px_40px_rgba(0,0,0,0.07)] hover:border-stone-300'
    }`}>

      {/* Delete progress overlay */}
      {deleting && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-white/80 backdrop-blur-[2px]">
          <svg className="w-5 h-5 animate-spin text-red-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span className="text-xs font-medium text-red-400">Deleting…</span>
        </div>
      )}

      {/* Top accent bar */}
      <div className={`h-[3px] w-full ${isVideo ? 'bg-gradient-to-r from-red-400 to-rose-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`} />

      {/* Thumbnail */}
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block relative bg-stone-50 overflow-hidden"
        style={{ aspectRatio: '16 / 9' }}
      >
        {!imgFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbSrc}
            alt={link.title ?? 'preview'}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
            onError={() => setImgFailed(true)}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-stone-50 to-stone-100">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-sm ${isVideo ? 'bg-gradient-to-br from-red-400 to-rose-500' : 'bg-gradient-to-br from-blue-500 to-indigo-500'}`}>
              {initial}
            </div>
            <span className="text-[11px] text-stone-400 font-medium">{host}</span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Kind badge */}
        <span className={`absolute top-2.5 left-2.5 flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full tracking-wide shadow-sm ${
          isVideo
            ? 'bg-red-500 text-white'
            : 'bg-white/90 text-stone-600 border border-stone-200/60 backdrop-blur-sm'
        }`}>
          {isVideo ? (
            <>
              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Video
            </>
          ) : (
            <>
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Article
            </>
          )}
        </span>
      </a>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Site */}
        <div className="flex items-center gap-1.5 mb-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://www.google.com/s2/favicons?domain=${host}&sz=32`}
            alt=""
            className="w-4 h-4 rounded"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <span className="text-[10px] font-semibold text-stone-400 truncate uppercase tracking-widest">{link.site_name ?? host}</span>
        </div>

        {/* Title */}
        <p className="font-semibold text-[14px] leading-[1.4] mb-2.5 line-clamp-2 text-stone-900">
          {link.title ?? link.url}
        </p>

        {editing ? (
          <>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note…"
              rows={3}
              className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-y mb-2.5 transition-all placeholder:text-stone-400"
            />
            <div className="flex items-center gap-1 flex-wrap mb-2.5">
              {tags.map((t) => (
                <span key={t} className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium flex items-center gap-1 border border-blue-100">
                  {t}
                  <button onClick={() => setTags(tags.filter((x) => x !== t))} className="hover:text-blue-900 leading-none ml-0.5">×</button>
                </span>
              ))}
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); } }}
                onBlur={addTag}
                placeholder="+ tag"
                className="text-[11px] px-2.5 py-0.5 rounded-full border border-dashed border-stone-300 bg-transparent focus:outline-none focus:border-blue-400 w-16 placeholder:text-stone-400"
              />
            </div>
          </>
        ) : (
          <>
            {link.note && (
              <p className="text-xs text-stone-400 mb-2.5 line-clamp-2 whitespace-pre-wrap leading-relaxed">{link.note}</p>
            )}
            {link.tags && link.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap mb-2.5">
                {link.tags.map((t) => (
                  <span key={t} className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-500 border border-stone-200/70">{t}</span>
                ))}
              </div>
            )}
          </>
        )}

        {/* Actions */}
        <div className="mt-auto pt-3 border-t border-stone-100 flex gap-1.5 items-center">
          {editing ? (
            <>
              <button onClick={save} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-stone-900 text-white hover:bg-stone-700 active:scale-[0.97] transition-all">
                Save changes
              </button>
              <button
                onClick={() => { setEditing(false); setNote(link.note ?? ''); setTags(link.tags ?? []); }}
                className="px-3 py-2 text-xs rounded-xl border border-stone-200 text-stone-500 hover:bg-stone-50 hover:border-stone-300 transition-all"
              >
                Cancel
              </button>
            </>
          ) : confirmDelete ? (
            /* Inline delete confirmation — no native browser dialog */
            <div className="flex items-center gap-1.5 w-full animate-fade-in">
              <span className="text-xs text-stone-400 mr-auto">Delete this link?</span>
              <button
                onClick={() => { setConfirmDelete(false); onDelete(); }}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-red-500 text-white hover:bg-red-600 active:scale-[0.97] transition-all"
              >
                Delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-1.5 text-xs rounded-xl border border-stone-200 text-stone-500 hover:bg-stone-50 transition-all"
              >
                Cancel
              </button>
            </div>
          ) : (
            <>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-stone-900 text-white hover:bg-stone-700 active:scale-[0.97] transition-all"
              >
                Open
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              <IconBtn label="Copy link" onClick={onCopy}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </IconBtn>
              {isAdmin && (
                <IconBtn label="Edit" onClick={() => setEditing(true)}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </IconBtn>
              )}
              {isAdmin && (
                <IconBtn label="Delete" onClick={() => setConfirmDelete(true)} danger>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
      className={`w-8 h-8 flex items-center justify-center rounded-xl border transition-all active:scale-95 ${
        danger
          ? 'border-stone-200 text-stone-400 hover:bg-red-50 hover:border-red-200 hover:text-red-500'
          : 'border-stone-200 text-stone-400 hover:bg-stone-100 hover:border-stone-300 hover:text-stone-700'
      }`}
    >
      {children}
    </button>
  );
}
