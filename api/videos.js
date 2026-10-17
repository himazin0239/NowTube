import { db, ensureSchema } from './_lib/db.js';
import { list } from '@vercel/blob';
export default async function handler(req, res) {
    if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'Method not allowed' }); }
    try {
        const sql = db(); await ensureSchema(sql);

        const rows = await sql`
    SELECT
      nowtube_videos.id AS id,
      nowtube_videos.title AS title,
      nowtube_videos.description AS description,
      nowtube_videos.url AS url,
      nowtube_videos.thumbnail_url AS "thumbnailUrl",
      nowtube_videos.pathname AS pathname,
      nowtube_videos.content_type AS "contentType",
      nowtube_videos.size AS size,
      nowtube_videos.created_at AS "createdAt",
      nowtube_users.username AS uploader,
      nowtube_videos.user_id AS "userId"
    FROM nowtube_videos
    JOIN nowtube_users
      ON nowtube_videos.user_id = nowtube_users.id
    ORDER BY nowtube_videos.created_at DESC
    LIMIT 500
  `;

        const videos = rows.map(v => ({ ...v, createdAt: new Date(v.createdAt).toISOString(), size: v.size == null ? null : Number(v.size) }));
        // Keep videos posted before the database migration visible.
        try {
            const old = await list({ prefix: 'metadata/', limit: 1000 });
            const legacy = await Promise.all(old.blobs.map(async b => { try { const r = await fetch(b.url, { cache: 'no-store' }); if (!r.ok) return null; return await r.json(); } catch { return null; } }));
            const known = new Set(videos.map(v => v.id));
            for (const v of legacy) { if (v && v.id && v.url && v.title && !known.has(v.id)) { videos.push({ ...v, thumbnailUrl: v.thumbnailUrl || null }); known.add(v.id); } }
        } catch (e) { console.warn('Legacy NowTube metadata could not be loaded', e); }
        videos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.setHeader('Cache-Control', 'no-store, max-age=0'); return res.status(200).json({ videos });
    } catch (e) { console.error('NowTube list error', e); return res.status(500).json({ error: e.message || '動画一覧を読み込めません。DATABASE_URLの設定を確認してください。' }); }
}
