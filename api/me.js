import { getSession } from './_lib/auth.js';
export default async function handler(req, res) {
  if (req.method !== 'GET') { res.setHeader('Allow','GET'); return res.status(405).json({error:'Method not allowed'}); }
  const user = getSession(req); res.setHeader('Cache-Control','no-store'); return res.status(200).json({user});
}
