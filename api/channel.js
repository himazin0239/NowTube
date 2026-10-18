import { db, ensureSchema } from './_lib/db.js';
import { getSession } from './_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'Method not allowed' }); }
  try {
    const username = String(req.query.username || '').trim();
    if (!username) return res.status(400).json({ error: 'ユーザー名を指定してください。' });
    const sql = db(); await ensureSchema(sql);
    const users = await sql`SELECT id, username, channel_description AS "description", created_at AS "createdAt" FROM nowtube_users WHERE username = ${username} LIMIT 1`;
    if (!users.length) return res.status(404).json({ error: 'チャンネルが見つかりません。' });
    const channel = users[0];
    const counts = await sql`
      SELECT
        (SELECT COUNT(*) FROM nowtube_subscriptions WHERE channel_id = ${channel.id}) AS "subscriberCount",
        (SELECT COUNT(*) FROM nowtube_videos WHERE user_id = ${channel.id}) AS "videoCount"
    `;
    const videos = await sql`SELECT id, title, description, url, thumbnail_url AS "thumbnailUrl", duration, view_count AS "viewCount", created_at AS "createdAt" FROM nowtube_videos WHERE user_id = ${channel.id} ORDER BY created_at DESC LIMIT 100`;
    const session = getSession(req);
    let isSubscribed = false;
    if (session && session.id !== channel.id) {
      const found = await sql`SELECT 1 FROM nowtube_subscriptions WHERE subscriber_id = ${session.id} AND channel_id = ${channel.id} LIMIT 1`;
      isSubscribed = found.length > 0;
    }
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({
      channel: { id: channel.id, username: channel.username, description: channel.description || '', createdAt: channel.createdAt },
      subscriberCount: Number(counts[0]?.subscriberCount || 0),
      videoCount: Number(counts[0]?.videoCount || 0),
      isOwner: !!session && session.id === channel.id,
      isLoggedIn: !!session,
      isSubscribed,
      videos: videos.map(v => ({ ...v, viewCount: Number(v.viewCount || 0), duration: v.duration == null ? null : Number(v.duration), createdAt: new Date(v.createdAt).toISOString() }))
    });
  } catch (e) {
    console.error('NowTube channel error', e);
    return res.status(500).json({ error: 'チャンネルを読み込めませんでした。データベース設定を確認してください。' });
  }
}
