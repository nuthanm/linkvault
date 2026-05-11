# LinkVault

A self-hosted link-saving app. Paste any URL and it automatically fetches the title, description, and thumbnail. Add a note and tags, then browse, search, copy, share, edit, or delete your saved links.

- **Stack:** Next.js 15 (App Router, Edge runtime), Tailwind CSS, TypeScript
- **Database:** Neon (serverless Postgres)
- **Auth:** mobile number + PIN — each user sees only their own links

---

## Screenshots

| Sign up | Sign in |
|---|---|
| ![Split-panel signup screen](public/screenshots/signup.png) | ![Split-panel sign-in screen](public/screenshots/sign-in.png) |

**Dashboard**
![Main dashboard showing saved links grid](public/screenshots/home.png)

**Link card**
![Individual link card with thumbnail and action buttons](public/screenshots/link-card.png)

---

## Requirements

- Node.js 18+
- A free [Neon](https://neon.tech) account (serverless Postgres)
- A [Vercel](https://vercel.com) account (or any Node.js host)

---

## Local setup

**1. Clone and install**

```bash
git clone <your-repo-url>
cd linkvault
npm install
```

**2. Create the database**

1. Go to [console.neon.tech](https://console.neon.tech) and create a project.
2. Open **Connection Details**, switch the dropdown to **Pooled connection**, and copy the connection string.

**3. Configure environment**

```bash
cp .env.example .env.local
```

Open `.env.local` and set `DATABASE_URL` to the connection string you copied.

> Tables are created automatically the first time you sign up — no manual migration needed.

**4. Run**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), create an account with your mobile number and a PIN, then start saving links.

---

## Deploy to Vercel

1. Push the repo to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo.
3. Before clicking **Deploy**, add one environment variable:
   - `DATABASE_URL` — the Neon pooled connection string
4. Click **Deploy**.

Your app is live. Anyone can visit the URL and create their own account; each person's links are private to them.

---

## How it works

- When you save a URL, the server fetches the page HTML and parses `og:title`, `og:description`, `og:image`, and `og:site_name`. YouTube thumbnails are fetched directly so they always work.
- Auth is mobile number + PIN. On sign-in, the server returns a session token stored in `sessionStorage`. Every request to the API includes that token in the `x-session-token` header.
- All database tables (`users`, `sessions`, `links`) are created automatically on first use via `ensureTables()` in `lib/auth.ts`.
- Links are scoped to the logged-in user via a `user_id` foreign key.

---

## Project structure

```
app/
  api/auth/
    register/route.ts     POST — create account
    login/route.ts        POST — sign in, returns session token
    logout/route.ts       POST — invalidate session
    account/route.ts      PATCH — update name or PIN
    status/route.ts       GET — check if any users exist
  api/links/
    route.ts              GET (list) + POST (save new link)
    [id]/route.ts         PATCH (edit note/tags) + DELETE
  layout.tsx
  page.tsx
  globals.css

components/
  LandingOverlay.tsx      Split-panel signup / sign-in page
  LinkVaultApp.tsx        Main app shell (session state, routing)
  AddLinkForm.tsx         URL + note + tags input
  LinkCard.tsx            Link card with thumbnail and actions
  AccountMenu.tsx         User menu (change name, change PIN, sign out)

lib/
  db.ts                   Neon SQL client + LinkRow type
  auth.ts                 Session lookup, PIN hashing, ensureTables()
  metadata.ts             OG-tag + YouTube thumbnail fetcher

scripts/
  screenshot.mjs          Captures screenshots using Playwright
```

---

## Customising

- **Add video hosts:** edit `VIDEO_HOSTS` in `lib/metadata.ts` to auto-detect more sites as videos.
- **Change colours:** edit the `colors` block in `tailwind.config.js`.
- **Change session length:** edit the `INTERVAL '30 days'` in `ensureTables()` inside `lib/auth.ts`.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| "DATABASE_URL is not set" on startup | Add `DATABASE_URL` to `.env.local` (local) or Vercel environment variables (prod) |
| Vercel build fails after adding env var | Env var changes require a fresh deploy — trigger one from the Vercel dashboard |
| Thumbnail missing | The site doesn't expose an `og:image`. The card still works; it shows a placeholder |
| "Incorrect mobile or PIN" | Double-check the number and PIN. PIN is case-sensitive to digit order only |
| Sign up says "mobile already registered" | That number has an account — click **Sign in** instead |

---

## Refresh screenshots

```bash
# Auth screens only (no credentials needed)
node scripts/screenshot.mjs

# Include dashboard and link cards
MOBILE=<your-number> PIN=<your-pin> node scripts/screenshot.mjs
```

Requires the dev server to be running (`npm run dev`).
