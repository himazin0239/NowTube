import { db, ensureSchema } from './_lib/db.js';
import { getSession } from './_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method not allowed' }); }
  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'チャンネル登録にはログインしてください。', loginRequired: true });
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const username = String(body.username || '').trim();
    if (!username) return res.status(400).json({ error: 'チャンネル名が指定されていません。' });
    const sql = db(); await ensureSchema(sql);
    const channels = await sql`SELECT id, username FROM nowtube_users WHERE username = ${username} LIMIT 1`;
    if (!channels.length) return res.status(404).json({ error: 'チャンネルが見つかりません。' });
    const channel = channels[0];
    if (channel.id === session.id) return res.status(400).json({ error: '自分のチャンネルは登録できません。' });
    const existing = await sql`SELECT 1 FROM nowtube_subscriptions WHERE subscriber_id = ${session.id} AND channel_id = ${channel.id} LIMIT 1`;
    let subscribed;
    if (existing.length) {
      await sql`DELETE FROM nowtube_subscriptions WHERE subscriber_id = ${session.id} AND channel_id = ${channel.id}`;
      subscribed = false;
    } else {
      await sql`INSERT INTO nowtube_subscriptions (subscriber_id, channel_id) VALUES (${session.id}, ${channel.id}) ON CONFLICT DO NOTHING`;
      subscribed = true;
    }
    const count = await sql`SELECT COUNT(*) AS count FROM nowtube_subscriptions WHERE channel_id = ${channel.id}`;
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ ok: true, isSubscribed: subscribed, subscriberCount: Number(count[0]?.count || 0) });
  } catch (e) {
    console.error('NowTube subscribe error', e);
    return res.status(500).json({ error: 'チャンネル登録を更新できませんでした。' });
  }
}
