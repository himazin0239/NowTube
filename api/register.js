import { randomUUID } from 'node:crypto';
import { db, ensureSchema } from './_lib/db.js';
import { hashPassword } from './_lib/password.js';
import { setSession } from './_lib/auth.js';
export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow','POST'); return res.status(405).json({error:'Method not allowed'}); }
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const username = String(body.username || '').trim();
    const password = String(body.password || '');
    if (!/^[A-Za-z0-9_\-\u3040-\u30ff\u3400-\u9fff]{3,24}$/.test(username)) return res.status(400).json({error:'ユーザー名は3〜24文字で、英数字・_・-・日本語が使えます。'});
    if (password.length < 10 || password.length > 128) return res.status(400).json({error:'パスワードは10〜128文字にしてください。'});
    const sql = db(); await ensureSchema(sql);
    const id = randomUUID(); const passwordHash = await hashPassword(password);
    const rows = await sql`INSERT INTO nowtube_users (id, username, password_hash) VALUES (${id}, ${username}, ${passwordHash}) ON CONFLICT (username) DO NOTHING RETURNING id, username`;
    if (!rows.length) return res.status(409).json({error:'そのユーザー名は既に使われています。'});
    setSession(res, rows[0]); return res.status(201).json({user:{id:rows[0].id,username:rows[0].username}});
  } catch (e) { console.error('NowTube register error',e); return res.status(500).json({error:e.message || '登録に失敗しました。'}); }
}
