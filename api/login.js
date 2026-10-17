import { db, ensureSchema } from './_lib/db.js';
import { verifyPassword } from './_lib/password.js';
import { setSession } from './_lib/auth.js';
export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow','POST'); return res.status(405).json({error:'Method not allowed'}); }
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const username = String(body.username || '').trim(); const password = String(body.password || '');
    if (!username || !password) return res.status(400).json({error:'ユーザー名とパスワードを入力してください。'});
    const sql = db(); await ensureSchema(sql);
    const rows = await sql`SELECT id, username, password_hash FROM nowtube_users WHERE username = ${username} LIMIT 1`;
    if (!rows.length || !(await verifyPassword(password, rows[0].password_hash))) return res.status(401).json({error:'ユーザー名またはパスワードが違います。'});
    setSession(res, rows[0]); return res.status(200).json({user:{id:rows[0].id,username:rows[0].username}});
  } catch (e) { console.error('NowTube login error',e); return res.status(500).json({error:e.message || 'ログインに失敗しました。'}); }
}
