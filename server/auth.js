import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { pool } from './db.js';

const SESSION_COOKIE = 'telopak_session';
const SESSION_DAYS = 7;

export function randomToken(bytes = 32) { return crypto.randomBytes(bytes).toString('base64url'); }
export function hashToken(token) { return crypto.createHash('sha256').update(token).digest('hex'); }
export function generateCode() { return String(crypto.randomInt(100000, 1000000)); }
export function normalizeEmail(email = '') { return String(email).trim().toLowerCase(); }
export async function hashPassword(password) { return bcrypt.hash(password, 12); }
export async function verifyPassword(password, hash) { return bcrypt.compare(password, hash); }
export function passwordValid(password = '') {
  return password.length >= 12 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password);
}
export function publicUser(row) {
  return { id: row.id, name: row.name, email: row.email, phone: row.phone || '', role: row.role, isPlatformOwner: row.role === 'Platform Owner', companyId: row.company_id, emailVerified: !!row.email_verified, twoFactorEnabled: !!row.two_factor_enabled };
}
export function setSessionCookie(res, token, remember = false) {
  res.cookie(SESSION_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: remember ? 30 * 86400000 : SESSION_DAYS * 86400000 });
}
export function clearSessionCookie(res) { res.clearCookie(SESSION_COOKIE, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/' }); }
export async function createSession(userId, req, res, remember = false) {
  const token = randomToken();
  const expires = new Date(Date.now() + (remember ? 30 : SESSION_DAYS) * 86400000);
  await pool.query('INSERT INTO auth_sessions (user_id,token_hash,user_agent,ip_address,expires_at) VALUES ($1,$2,$3,$4,$5)', [userId, hashToken(token), req.get('user-agent') || '', req.ip, expires]);
  setSessionCookie(res, token, remember);
}
export function requirePlatformOwner(req, res, next) {
  if (req.user?.role !== 'Platform Owner') return res.status(403).json({ error: 'Pristup je dozvoljen samo vlasniku platforme.' });
  next();
}
export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.[SESSION_COOKIE];
    if (!token) return res.status(401).json({ error: 'Prijava je obavezna.' });
    const r = await pool.query(`SELECT s.id session_id,s.expires_at,u.* FROM auth_sessions s JOIN app_users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.revoked_at IS NULL AND s.expires_at>now() AND u.status='Aktivan'`, [hashToken(token)]);
    if (!r.rows[0]) { clearSessionCookie(res); return res.status(401).json({ error: 'Sesija je istekla.' }); }
    req.user = r.rows[0]; req.sessionId = r.rows[0].session_id; next();
  } catch (e) { next(e); }
}
export async function sendSecurityEmail({ to, subject, message }) {
  const hasSmtp = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
  if (!hasSmtp) { console.log('[SECURITY EMAIL — SMTP NIJE PODEŠEN, SIMULACIJA]', { to, subject, message }); return { delivered: false, reason: 'SMTP nije podešen u env varijablama servera.' }; }
  try {
    const nodemailer = (await import('nodemailer')).default;
    const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: Number(process.env.SMTP_PORT) === 465, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
    const info = await transporter.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to, subject, text: message });
    console.log('[SECURITY EMAIL — POSLANO]', { to, subject, messageId: info?.messageId, response: info?.response });
    return { delivered: true };
  } catch (err) {
    console.error('[SECURITY EMAIL — GREŠKA PRI SLANJU]', err?.message || err);
    return { delivered: false, reason: err?.message || 'Nepoznata SMTP greška.' };
  }
}
