import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Add it to .env.local or Vercel env vars.');
}

export const sql = neon(process.env.DATABASE_URL);

export type LinkRow = {
  id: string;
  url: string;
  title: string | null;
  description: string | null;
  thumbnail_url: string | null;
  site_name: string | null;
  kind: 'video' | 'article';
  note: string | null;
  tags: string[];
  created_at: string;
};
