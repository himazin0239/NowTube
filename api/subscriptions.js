import { db, ensureSchema } from './_lib/db.js';
import { getSession } from './_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'Method not allowed' }); }
  const session = getSession(req);
  if (!session) return res.status(401).json({ error: '登録チャンネルを見るにはログインしてください。' });
  try {
    const sql = db(); await ensureSchema(sql);
    const rows = await sql`
      SELECT u.username, u.channel_description AS description, s.created_at AS "subscribedAt",
        (SELECT COUNT(*) FROM nowtube_subscriptions s2 WHERE s2.channel_id = u.id) AS "subscriberCount"
      FROM nowtube_subscriptions s
      JOIN nowtube_users u ON u.id = s.channel_id
      WHERE s.subscriber_id = ${session.id}
      ORDER BY s.created_at DESC
    `;
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ subscriptions: rows.map(r => ({ ...r, subscriberCount: Number(r.subscriberCount || 0) })) });
  } catch (e) {
    console.error('NowTube subscriptions error', e);
    return res.status(500).json({ error: '登録チャンネルを読み込めませんでした。' });
  }
}
