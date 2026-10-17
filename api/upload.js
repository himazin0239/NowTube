import { handleUpload } from '@vercel/blob/client';
import { put } from '@vercel/blob';
import { randomUUID } from 'node:crypto';

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') body = JSON.parse(body);
    if (!body || typeof body !== 'object') body = {};

    // IMPORTANT: pass the original Vercel request to handleUpload.
    // Rebuilding a Request with only content-type/origin drops headers
    // needed to verify Blob's upload-completed callback.
    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        let details = {};
        try { details = JSON.parse(clientPayload || '{}'); } catch {}

        const title = String(details.title || '').trim().slice(0, 100);
        if (!process.env.NOWTUBE_UPLOAD_PASSWORD) {
          throw new Error('Vercelの環境変数 NOWTUBE_UPLOAD_PASSWORD が未設定です。');
        }
        if (!details.password || details.password !== process.env.NOWTUBE_UPLOAD_PASSWORD) {
          throw new Error('投稿用パスワードが正しくありません。');
        }
        if (!title) throw new Error('動画タイトルを入力してください。');

        return {
          allowedContentTypes: ALLOWED_TYPES,
          maximumSizeInBytes: MAX_FILE_SIZE,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({
            title,
            description: String(details.description || '').trim().slice(0, 1000)
          })
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        let details = {};
        try { details = JSON.parse(tokenPayload || '{}'); } catch {}

        const record = {
          id: randomUUID(),
          title: String(details.title || '名称未設定').slice(0, 100),
          description: String(details.description || '').slice(0, 1000),
          url: blob.url,
          pathname: blob.pathname,
          contentType: blob.contentType || '',
          size: blob.size || null,
          createdAt: new Date().toISOString(),
          uploader: 'himazin0239'
        };

        await put(`metadata/${record.id}.json`, JSON.stringify(record), {
          access: 'public',
          contentType: 'application/json',
          addRandomSuffix: false
        });
      }
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('NowTube upload error:', error);
    return res.status(400).json({ error: error?.message || 'アップロードに失敗しました。' });
  }
}
