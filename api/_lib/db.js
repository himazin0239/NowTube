import { neon } from '@neondatabase/serverless';

let sqlClient;
export function db() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL が設定されていません。Neonデータベースを接続してください。');
  if (!sqlClient) sqlClient = neon(process.env.DATABASE_URL);
  return sqlClient;
}

export async function ensureSchema(sql) {
  await sql`CREATE TABLE IF NOT EXISTS nowtube_users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS nowtube_videos (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES nowtube_users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    pathname TEXT NOT NULL,
    content_type TEXT NOT NULL DEFAULT '',
    size BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
}
