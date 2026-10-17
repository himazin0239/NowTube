import { createHmac, timingSafeEqual } from 'node:crypto';

const COOKIE = 'nowtube_session';
const MAX_AGE = 60 * 60 * 24 * 14;
function secret() {
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
    throw new Error('SESSION_SECRET に32文字以上のランダムな値を設定してください。');
  }
  return process.env.SESSION_SECRET;
}
function b64(value) { return Buffer.from(value).toString('base64url'); }
function sign(value) { return createHmac('sha256', secret()).update(value).digest('base64url'); }
export function createSession(user) {
  const payload = b64(JSON.stringify({ id: user.id, username: user.username, exp: Math.floor(Date.now()/1000)+MAX_AGE }));
  return payload + '.' + sign(payload);
}
export function getSession(req) {
  try {
    const raw = String(req.headers.cookie || '').split(';').map(v => v.trim()).find(v => v.startsWith(COOKIE + '='));
    if (!raw) return null;
    const token = decodeURIComponent(raw.slice(COOKIE.length + 1));
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const expected = Buffer.from(sign(parts[0]));
    const actual = Buffer.from(parts[1]);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
    const user = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    if (!user.id || !user.username || user.exp < Math.floor(Date.now()/1000)) return null;
    return { id: user.id, username: user.username };
  } catch { return null; }
}
export function setSession(res, user) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE}=${encodeURIComponent(createSession(user))}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE}${secure}`);
}
export function clearSession(res) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`);
}
export function jsonError(res, status, message) { return res.status(status).json({ error: message }); }
