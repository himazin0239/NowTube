import { db, ensureSchema } from './_lib/db.js';
import { getSession } from './_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method not allowed' }); }
  const user = getSession(req);
  if (!user) return res.status(401).json({ error: 'チャンネル説明を編集するにはログインしてください。' });
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const description = String(body.description || '').trim().slice(0, 1000);
    const sql = db(); await ensureSchema(sql);
    await sql`UPDATE nowtube_users SET channel_description = ${description} WHERE id = ${user.id}`;
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ ok: true, description });
  } catch (e) {
    console.error('NowTube channel update error', e);
    return res.status(500).json({ error: 'チャンネル情報を保存できませんでした。' });
  }
}
