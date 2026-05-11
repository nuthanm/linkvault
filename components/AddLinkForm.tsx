'use client';

import { useState } from 'react';

export default function AddLinkForm({
  onAdd,
}: {
  onAdd: (url: string, note: string, tags: string[]) => Promise<void>;
}) {
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput('');
  }

  async function handleSubmit() {
    if (!url.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onAdd(url.trim(), note.trim(), tags);
      setUrl(''); setNote(''); setTags([]); setTagInput(''); setExpanded(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-white shadow-sm p-4 mb-6">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none"
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <input
            type="url"
            value={url}
            onChange={(e) => { setUrl(e.target.value); if (e.target.value) setExpanded(true); }}
            onFocus={() => setExpanded(true)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSubmit(); }}
            placeholder="Paste a URL to save…"
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-stone-50 text-sm focus:outline-none focus:border-accent focus:bg-white transition-colors"
            disabled={submitting}
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={submitting || !url.trim()}
          className="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors shadow-sm shadow-blue-100 active:scale-95"
        >
          {submitting ? 'Saving…' : 'Save'}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 animate-slide-up">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note (optional)…"
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-border bg-stone-50 text-sm mb-2.5 focus:outline-none focus:border-accent focus:bg-white transition-colors resize-y"
            disabled={submitting}
          />
          <div className="flex items-center gap-1.5 flex-wrap">
            {tags.map((t) => (
              <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 font-medium flex items-center gap-1">
                {t}
                <button onClick={() => setTags(tags.filter((x) => x !== t))} className="hover:text-blue-900 leading-none" aria-label={`Remove ${t}`}>×</button>
              </span>
            ))}
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); } }}
              onBlur={addTag}
              placeholder="+ tag"
              className="text-xs px-2.5 py-1 rounded-full border border-dashed border-stone-300 bg-transparent focus:outline-none focus:border-accent"
            />
          </div>
        </div>
      )}
    </div>
  );
}
