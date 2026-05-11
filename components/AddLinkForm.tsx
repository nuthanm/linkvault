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
      setUrl(''); setNote(''); setTags([]); setTagInput('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4 mb-6">
      <p className="text-xs text-muted mb-2">Paste a link to save it</p>
      <div className="flex gap-2 mb-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSubmit(); }}
          placeholder="https://youtube.com/watch?v=... or any article URL"
          className="flex-1 px-3 py-2 rounded-md border border-border bg-surface text-sm focus:outline-none focus:border-accent"
          disabled={submitting}
        />
        <button
          onClick={handleSubmit}
          disabled={submitting || !url.trim()}
          className="px-4 py-2 rounded-md bg-ink text-white text-sm hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? 'Saving…' : '+ Add'}
        </button>
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Optional note — why it matters, a summary, where to use it…"
        rows={2}
        className="w-full px-3 py-2 rounded-md border border-border bg-surface text-sm mb-2 focus:outline-none focus:border-accent resize-y"
        disabled={submitting}
      />
      <div className="flex items-center gap-2 flex-wrap">
        {tags.map((t) => (
          <span key={t} className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 flex items-center gap-1">
            {t}
            <button onClick={() => setTags(tags.filter((x) => x !== t))} className="hover:text-blue-900" aria-label={`Remove ${t}`}>×</button>
          </span>
        ))}
        <input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); } }}
          onBlur={addTag}
          placeholder="+ add tag"
          className="text-xs px-2 py-1 rounded-full border border-dashed border-border bg-transparent focus:outline-none focus:border-accent w-24"
        />
      </div>
    </div>
  );
}
