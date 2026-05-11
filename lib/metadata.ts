// Fetches Open Graph / oEmbed metadata from any URL.
// Handles YouTube and Vimeo specially so thumbnails always work, and falls back
// to parsing <meta og:*> tags from the page HTML for everything else.

export type LinkMetadata = {
  title: string | null;
  description: string | null;
  thumbnail_url: string | null;
  site_name: string | null;
  kind: 'video' | 'article';
};

const VIDEO_HOSTS = [
  'youtube.com', 'youtu.be', 'vimeo.com', 'twitch.tv',
  'tiktok.com', 'dailymotion.com', 'loom.com',
];

function hostOf(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch { return ''; }
}

function isVideoHost(url: string): boolean {
  const host = hostOf(url);
  return VIDEO_HOSTS.some((h) => host === h || host.endsWith('.' + h));
}

function youtubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1) || null;
    if (u.hostname.includes('youtube.com')) {
      if (u.pathname === '/watch') return u.searchParams.get('v');
      const m = u.pathname.match(/^\/(?:embed|shorts|v)\/([^/?]+)/);
      if (m) return m[1];
    }
  } catch {}
  return null;
}

function pickMeta(html: string, name: string): string | null {
  // Match both <meta property="og:title" content="..."> and <meta name="..." content="...">
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${name}["']`, 'i'),
    new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`, 'i'),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m) return decodeEntities(m[1]);
  }
  return null;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function pickTitle(html: string): string | null {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m ? decodeEntities(m[1]).trim() : null;
}

export async function fetchMetadata(url: string): Promise<LinkMetadata> {
  const isVideo = isVideoHost(url);
  const host = hostOf(url);

  // YouTube: build thumbnail directly from video ID — no oEmbed needed.
  const ytId = youtubeId(url);
  if (ytId) {
    // Still try to fetch the page for title, but we have a guaranteed thumbnail.
    const thumbnail = `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`;
    let title: string | null = null;
    let description: string | null = null;
    try {
      const html = await fetchHtml(url);
      title = pickMeta(html, 'og:title') || pickTitle(html);
      description = pickMeta(html, 'og:description');
    } catch {}
    return {
      title: title || 'YouTube video',
      description,
      thumbnail_url: thumbnail,
      site_name: 'YouTube',
      kind: 'video',
    };
  }

  // Primary: Microlink API — headless browser, handles JS-heavy sites, returns og:image or screenshot.
  try {
    const ml = await fetchViaMicrolink(url);
    if (ml.title || ml.thumbnail_url) {
      return { ...ml, site_name: ml.site_name || host, kind: isVideo ? 'video' : 'article' };
    }
  } catch { /* fall through */ }

  // Fallback: parse og:* tags from raw HTML
  try {
    const html = await fetchHtml(url);
    const rawImage = pickMeta(html, 'og:image') || pickMeta(html, 'twitter:image') || pickMeta(html, 'twitter:image:src');
    return {
      title: pickMeta(html, 'og:title') || pickTitle(html),
      description: pickMeta(html, 'og:description') || pickMeta(html, 'description'),
      thumbnail_url: resolveImageUrl(rawImage, url),
      site_name: pickMeta(html, 'og:site_name') || host,
      kind: isVideo ? 'video' : 'article',
    };
  } catch {
    return { title: host, description: null, thumbnail_url: null, site_name: host, kind: isVideo ? 'video' : 'article' };
  }
}

function resolveImageUrl(rawUrl: string | null, pageUrl: string): string | null {
  if (!rawUrl) return null;
  try {
    return new URL(rawUrl, pageUrl).href;
  } catch {
    return null;
  }
}

async function fetchViaMicrolink(url: string): Promise<{
  title: string | null;
  description: string | null;
  thumbnail_url: string | null;
  site_name: string | null;
}> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(
      `https://api.microlink.io?url=${encodeURIComponent(url)}&screenshot=true`,
      { signal: controller.signal, headers: { Accept: 'application/json' } },
    );
    if (!res.ok) throw new Error(`${res.status}`);
    const json = await res.json();
    if (json.status !== 'success') throw new Error('failed');
    const d = json.data;
    return {
      title: d.title ?? null,
      description: d.description ?? null,
      thumbnail_url: d.image?.url ?? d.screenshot?.url ?? null,
      site_name: d.publisher ?? null,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        // Some sites (e.g. Twitter) return different HTML for crawlers
        'User-Agent': 'Mozilla/5.0 (compatible; LinkVaultBot/1.0; +https://example.com)',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });
    if (!res.ok) throw new Error(`status ${res.status}`);
    // Only read the first ~150KB — meta tags are always in <head>
    const text = await res.text();
    return text.slice(0, 150_000);
  } finally {
    clearTimeout(timeout);
  }
}
