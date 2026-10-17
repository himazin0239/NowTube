import { list } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const result = await list({ prefix: 'metadata/', limit: 1000 });
    const videos = await Promise.all(result.blobs.map(async (blob) => {
      try {
        const response = await fetch(blob.url, { cache: 'no-store' });
        if (!response.ok) return null;
        return await response.json();
      } catch { return null; }
    }));
    const clean = videos.filter((v) => v && v.id && v.url && v.title)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    return res.status(200).json({ videos: clean });
  } catch (error) {
    console.error('NowTube list error:', error);
    return res.status(500).json({ error: '動画一覧を読み込めません。Blobストレージの設定を確認してください。' });
  }
}
