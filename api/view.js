import { db, ensureSchema } from './_lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    let body = req.body;
    if (typeof body === 'string') body = JSON.parse(body);
    const id = String(body && body.id || '').trim();
    if (!id) return res.status(400).json({ error: '動画IDが必要です。' });

    const sql = db();
    await ensureSchema(sql);
    const rows = await sql`
      UPDATE nowtube_videos
      SET view_count = view_count + 1
      WHERE id = ${id}
      RETURNING view_count AS "viewCount"
    `;
    if (!rows.length) return res.status(404).json({ error: '動画が見つかりません。' });
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    return res.status(200).json({ viewCount: Number(rows[0].viewCount) });
  } catch (error) {
    console.error('NowTube view count error', error);
    return res.status(500).json({ error: '再生回数を更新できませんでした。' });
  }
}
