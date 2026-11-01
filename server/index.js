import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';
import nodemailer from 'nodemailer';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { pool } from './db.js';
import { randomToken, hashToken, generateCode, normalizeEmail, hashPassword, verifyPassword, passwordValid, publicUser, createSession, clearSessionCookie, requireAuth, requirePlatformOwner, sendSecurityEmail } from './auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '6mb' }));
app.use(cookieParser());
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false, message: { error: 'Previše pokušaja. Pokušajte ponovo za 15 minuta.' } });
const strictLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false, message: { error: 'Previše pokušaja. Pokušajte ponovo kasnije.' } });

// ---------- Stvarne obavijesti ----------
const notificationPreference = { job: 'notify_new_job', job_status: 'notify_status_change', payment: 'notify_payment', stock: 'notify_low_stock', maintenance: 'notify_maintenance' };
async function createCompanyNotification(companyId, { type = 'info', title, message = '', targetPage = null, targetId = null, preference = null }) {
  const pref = preference || notificationPreference[type];
  const users = await pool.query(`SELECT u.id FROM app_users u LEFT JOIN company_settings s ON s.company_id=u.company_id WHERE u.company_id=$1 AND u.status='Aktivan' AND ($2::text IS NULL OR COALESCE(CASE $2 WHEN 'notify_new_job' THEN s.notify_new_job WHEN 'notify_status_change' THEN s.notify_status_change WHEN 'notify_payment' THEN s.notify_payment WHEN 'notify_low_stock' THEN s.notify_low_stock WHEN 'notify_maintenance' THEN s.notify_maintenance ELSE true END,true)=true)`, [companyId, pref || null]);
  for (const u of users.rows) await pool.query(`INSERT INTO notifications(company_id,user_id,type,title,message,target_page,target_id) VALUES($1,$2,$3,$4,$5,$6,$7)`, [companyId, u.id, type, title, message, targetPage, targetId == null ? null : String(targetId)]);
}
async function ensureDerivedNotifications(user) {
  const cid = user.company_id, uid = user.id;
  const [overdue, low, dueMaintenance] = await Promise.all([
    pool.query(`SELECT id,no,client,amount FROM invoices WHERE company_id=$1 AND status<>'Plaćen' AND to_date(nullif(regexp_replace(due,'[^0-9.]','','g'),''),'DD.MM.YYYY')<CURRENT_DATE`, [cid]),
    pool.query(`SELECT id,name,stock,min FROM stock WHERE company_id=$1 AND stock<=min`, [cid]),
    pool.query(`SELECT id,client,asset,next FROM maintenance WHERE company_id=$1 AND to_date(nullif(regexp_replace(next,'[^0-9.]','','g'),''),'DD.MM.YYYY') BETWEEN CURRENT_DATE AND CURRENT_DATE+INTERVAL '7 days'`, [cid])
  ]);
  const add = async (type, row, title, message, page) => { const exists = await pool.query(`SELECT 1 FROM notifications WHERE user_id=$1 AND type=$2 AND target_id=$3 LIMIT 1`, [uid, type, String(row.id)]); if (!exists.rows[0]) await pool.query(`INSERT INTO notifications(company_id,user_id,type,title,message,target_page,target_id) VALUES($1,$2,$3,$4,$5,$6,$7)`, [cid, uid, type, title, message, page, String(row.id)]); };
  for (const x of overdue.rows) await add('payment', x, `Račun ${x.no || ''} kasni`, `${x.client || 'Klijent'} · ${x.amount || 'Iznos nije unesen'}`, 'Računi');
  for (const x of low.rows) await add('stock', x, 'Niska zaliha materijala', `${x.name} · stanje ${x.stock}, minimum ${x.min}`, 'Materijal');
  for (const x of dueMaintenance.rows) await add('maintenance', x, 'Održavanje uskoro dospijeva', `${x.client} · ${x.asset || 'Oprema'} · ${x.next}`, 'Održavanje');
}
app.get('/api/notifications', requireAuth, async (req, res) => { try { await ensureDerivedNotifications(req.user); const r = await pool.query(`SELECT id,type,title,message AS text,target_page AS page,target_id,read_at,created_at,(read_at IS NOT NULL) AS read FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100`, [req.user.id]); res.json(r.rows); } catch (e) { console.error(e); res.status(500).json({ error: 'Obavijesti nije moguće učitati.' }); } });
app.patch('/api/notifications/:id/read', requireAuth, async (req, res) => { try { const r = await pool.query(`UPDATE notifications SET read_at=COALESCE(read_at,now()) WHERE id=$1 AND user_id=$2 RETURNING *`, [req.params.id, req.user.id]); if (!r.rows[0]) return res.status(404).json({ error: 'Obavijest nije pronađena.' }); res.json({ ok: true }); } catch (e) { res.status(500).json({ error: 'Obavijest nije moguće označiti pročitanom.' }); } });
app.post('/api/notifications/read-all', requireAuth, async (req, res) => { try { await pool.query(`UPDATE notifications SET read_at=COALESCE(read_at,now()) WHERE user_id=$1`, [req.user.id]); res.json({ ok: true }); } catch (e) { res.status(500).json({ error: 'Obavijesti nije moguće označiti pročitanim.' }); } });
app.delete('/api/notifications/:id', requireAuth, async (req, res) => { try { const r = await pool.query(`DELETE FROM notifications WHERE id=$1 AND user_id=$2 RETURNING id`, [req.params.id, req.user.id]); if (!r.rows[0]) return res.status(404).json({ error: 'Obavijest nije pronađena.' }); res.json({ ok: true }); } catch (e) { res.status(500).json({ error: 'Obavijest nije moguće ukloniti.' }); } });

// ---------- Generic CRUD factory za poslovne tabele ----------
function stripId(obj) {
  const copy = { ...obj };
  delete copy.id;
  delete copy.created_at;
  delete copy.company_id;
  return copy;
}

function crud(table, defaults = {}) {
  const router = express.Router();

  router.get('/', async (req, res) => {
    try {
      const r = await pool.query(`SELECT * FROM ${table} WHERE company_id=$1 ORDER BY id ASC`, [req.user.company_id]);
      res.json(r.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: `Ne mogu učitati podatke iz tabele ${table}.` });
    }
  });

  router.post('/', async (req, res) => {
    try {
      const data = { ...defaults, ...stripId(req.body), company_id: req.user.company_id };
      const cols = Object.keys(data);
      const vals = Object.values(data);
      const placeholders = cols.map((_, i) => `$${i + 1}`).join(',');
      const r = await pool.query(
        `INSERT INTO ${table} (${cols.join(',')}) VALUES (${placeholders}) RETURNING *`,
        vals
      );
      const saved = r.rows[0];
      if (table === 'jobs') await createCompanyNotification(req.user.company_id, { type: 'job', title: 'Novi posao je kreiran', message: `${saved.client || 'Klijent'} · ${saved.service || 'Bez opisa'} · ${saved.date || ''} ${saved.time || ''}`.trim(), targetPage: 'Poslovi', targetId: saved.id });
      if (table === 'stock' && Number(saved.stock) <= Number(saved.min)) await createCompanyNotification(req.user.company_id, { type: 'stock', title: 'Niska zaliha materijala', message: `${saved.name} · stanje ${saved.stock}, minimum ${saved.min}`, targetPage: 'Materijal', targetId: saved.id });
      if (table === 'maintenance') await createCompanyNotification(req.user.company_id, { type: 'maintenance', title: 'Novo održavanje je planirano', message: `${saved.client || ''} · ${saved.asset || ''} · ${saved.next || ''}`, targetPage: 'Održavanje', targetId: saved.id });
      res.status(201).json(saved);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: `Ne mogu sačuvati novi zapis u ${table}.` });
    }
  });

  router.put('/:id', async (req, res) => {
    try {
      const data = stripId(req.body);
      const cols = Object.keys(data);
      if (!cols.length) return res.status(400).json({ error: 'Nema polja za izmjenu.' });
      const set = cols.map((c, i) => `${c}=$${i + 1}`).join(',');
      const idPlaceholder = '$' + (cols.length + 1);
      const companyPlaceholder = '$' + (cols.length + 2);
      const r = await pool.query(
        `UPDATE ${table} SET ${set} WHERE id=${idPlaceholder} AND company_id=${companyPlaceholder} RETURNING *`,
        [...cols.map(c => data[c]), req.params.id, req.user.company_id]
      );
      if (!r.rows[0]) return res.status(404).json({ error: 'Zapis nije pronađen.' });
      const saved = r.rows[0];
      if (table === 'jobs' && data.status !== undefined) await createCompanyNotification(req.user.company_id, { type: 'job_status', title: 'Status posla je promijenjen', message: `${saved.no || ''} · ${saved.client || ''} · ${saved.status || ''}`, targetPage: 'Poslovi', targetId: saved.id });
      if (table === 'stock' && Number(saved.stock) <= Number(saved.min)) await createCompanyNotification(req.user.company_id, { type: 'stock', title: 'Niska zaliha materijala', message: `${saved.name} · stanje ${saved.stock}, minimum ${saved.min}`, targetPage: 'Materijal', targetId: saved.id });
      res.json(saved);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: `Ne mogu izmijeniti zapis u ${table}.` });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      await pool.query(`DELETE FROM ${table} WHERE id=$1 AND company_id=$2`, [req.params.id, req.user.company_id]);
      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: `Ne mogu obrisati zapis iz ${table}.` });
    }
  });

  return router;
}

app.get('/api/health', (req, res) => res.json({ status: 'ok', name: 'TeloPak Flux API' }));
app.get('/api/public/settings', async (req, res) => {
  try { const r = await pool.query(`SELECT app_name,tagline,support_email,primary_color,logo_data,favicon_data,locale,registrations_enabled,maintenance_mode FROM platform_settings WHERE id=1`); res.json(r.rows[0] || {}); }
  catch (e) { res.json({ app_name: 'TeloPak Flux', primary_color: '#1769d2', registrations_enabled: true, maintenance_mode: false }); }
});

app.get('/api/debug/smtp', async (req, res) => {
  const configured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
  if (!configured) return res.json({ configured: false, note: 'SMTP_HOST/SMTP_USER/SMTP_PASS nisu postavljeni u env-u ovog kontejnera.' });
  try {
    const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: Number(process.env.SMTP_PORT) === 465, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
    await transporter.verify();
    res.json({ configured: true, verified: true, host: process.env.SMTP_HOST, port: process.env.SMTP_PORT, user: process.env.SMTP_USER });
  } catch (err) {
    res.json({ configured: true, verified: false, host: process.env.SMTP_HOST, port: process.env.SMTP_PORT, user: process.env.SMTP_USER, error: err?.message || String(err) });
  }
});

// ---------- Sigurna autentifikacija ----------
app.post('/api/auth/register', strictLimiter, async (req, res) => {
  try {
    const { company, industry, workers, address, postal_code, city, siret, tva_number, company_phone, name, password } = req.body || {};
    const email = normalizeEmail(req.body?.email);
    const cleanSiret=String(siret||'').replace(/\s/g,'');
    if (!company || !address || !postal_code || !city || !cleanSiret || !name || !email || !passwordValid(password)) return res.status(400).json({ error: 'Popunite sva obavezna polja. Lozinka mora imati najmanje 12 znakova, veliko i malo slovo, broj i specijalni znak.' });
    if(!/^\d{14}$/.test(cleanSiret))return res.status(400).json({error:'SIRET mora sadržavati tačno 14 cifara.'});
    const exists = await pool.query('SELECT id FROM app_users WHERE email=$1', [email]);
    if (exists.rows[0]) return res.status(409).json({ error: 'Nalog sa ovom email adresom već postoji.' });
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const teamSize=Math.max(1,Number(workers)||1);
      const c = await client.query(`INSERT INTO companies(name,industry,field_workers,address,postal_code,city,country,siret,tva_number,company_phone) VALUES($1,$2,$3,$4,$5,$6,'France',$7,$8,$9) RETURNING id`, [String(company).trim(), String(industry||'').trim(), teamSize, String(address).trim(), String(postal_code).trim(), String(city).trim(), cleanSiret, String(tva_number||'').trim(), String(company_phone||'').trim()]);
      await client.query(`INSERT INTO company_settings(company_id,company_name,address,postal_code,city,country,siret,tva_number,tax_id,phone,email) VALUES($1,$2,$3,$4,$5,'France',$6,$7,$7,$8,$9) ON CONFLICT(company_id) DO UPDATE SET company_name=EXCLUDED.company_name,address=EXCLUDED.address,postal_code=EXCLUDED.postal_code,city=EXCLUDED.city,country=EXCLUDED.country,siret=EXCLUDED.siret,tva_number=EXCLUDED.tva_number,tax_id=EXCLUDED.tax_id,phone=EXCLUDED.phone,email=EXCLUDED.email`, [c.rows[0].id,String(company).trim(),String(address).trim(),String(postal_code).trim(),String(city).trim(),cleanSiret,String(tva_number||'').trim(),String(company_phone||'').trim(),email]);
      const passwordHash = await hashPassword(password);
      const u = await client.query(`INSERT INTO app_users(company_id,name,email,password_hash,role,status,email_verified) VALUES($1,$2,$3,$4,'Administrator','Aktivan',false) RETURNING *`, [c.rows[0].id, name, email, passwordHash]);
      const code = generateCode();
      await client.query(`INSERT INTO auth_tokens(user_id,purpose,token_hash,expires_at) VALUES($1,'verify_email',$2,now()+interval '15 minutes')`, [u.rows[0].id, hashToken(code)]);
      await client.query('COMMIT');
      const mail = await sendSecurityEmail({ to: email, subject: 'Potvrdite TeloPak Flux nalog', message: `Vaš sigurnosni kod je: ${code}\nKod važi 15 minuta. Ako niste vi pokrenuli registraciju, zanemarite poruku.` });
      res.status(201).json({ ok: true, email, delivered: mail.delivered, deliveryNote: mail.delivered ? null : mail.reason });
    } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
  } catch (e) { console.error(e); res.status(500).json({ error: 'Registracija trenutno nije dostupna.' }); }
});
app.post('/api/auth/verify-email', strictLimiter, async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email), code = String(req.body?.code || '');
    const u = await pool.query('SELECT * FROM app_users WHERE email=$1', [email]);
    if (!u.rows[0]) return res.status(400).json({ error: 'Kod nije ispravan ili je istekao.' });
    const t = await pool.query(`SELECT * FROM auth_tokens WHERE user_id=$1 AND purpose='verify_email' AND token_hash=$2 AND used_at IS NULL AND expires_at>now() AND attempts<5 ORDER BY id DESC LIMIT 1`, [u.rows[0].id, hashToken(code)]);
    if (!t.rows[0]) return res.status(400).json({ error: 'Kod nije ispravan ili je istekao.' });
    await pool.query('UPDATE auth_tokens SET used_at=now() WHERE id=$1', [t.rows[0].id]);
    await pool.query('UPDATE app_users SET email_verified=true WHERE id=$1', [u.rows[0].id]);
    await createSession(u.rows[0].id, req, res, false);
    res.json({ user: publicUser({ ...u.rows[0], email_verified: true }) });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Potvrda nije uspjela.' }); }
});
app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email), password = String(req.body?.password || '');
    const r = await pool.query('SELECT * FROM app_users WHERE email=$1', [email]);
    const user = r.rows[0];
    if (!user) { await verifyPassword(password, '$2a$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW'); return res.status(401).json({ error: 'Email ili lozinka nisu ispravni.' }); }
    if (user.locked_until && new Date(user.locked_until) > new Date()) return res.status(423).json({ error: 'Nalog je privremeno zaključan. Pokušajte kasnije.' });
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      const attempts = (user.failed_attempts || 0) + 1;
      await pool.query(`UPDATE app_users SET failed_attempts=$1, locked_until=CASE WHEN $1>=5 THEN now()+interval '15 minutes' ELSE NULL END WHERE id=$2`, [attempts, user.id]);
      return res.status(401).json({ error: 'Email ili lozinka nisu ispravni.' });
    }
    if (user.status !== 'Aktivan') return res.status(403).json({ error: 'Nalog je deaktiviran.' });
    if (!user.email_verified) return res.status(403).json({ error: 'Email adresa nije potvrđena.' });
    await pool.query('UPDATE app_users SET failed_attempts=0,locked_until=NULL WHERE id=$1', [user.id]);
    if (user.two_factor_enabled && user.two_factor_secret) { return res.json({ requiresOtp: true, otpMethod: 'totp', email: user.email, delivered: true }); }
    const code = generateCode();
    await pool.query(`UPDATE auth_tokens SET used_at=now() WHERE user_id=$1 AND purpose='login_otp' AND used_at IS NULL`, [user.id]);
    await pool.query(`INSERT INTO auth_tokens(user_id,purpose,token_hash,expires_at) VALUES($1,'login_otp',$2,now()+interval '10 minutes')`, [user.id, hashToken(code)]);
    const mail = await sendSecurityEmail({ to: user.email, subject: 'TeloPak Flux sigurnosni kod', message: `Vaš kod za prijavu je: ${code}\nKod važi 10 minuta. Nikome ga ne prosljeđujte.` });
    res.json({ requiresOtp: true, otpMethod: 'email', email: user.email, delivered: mail.delivered, deliveryNote: mail.delivered ? null : mail.reason });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Prijava trenutno nije dostupna.' }); }
});
app.post('/api/auth/login/verify', strictLimiter, async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email), code = String(req.body?.code || '');
    const u = await pool.query('SELECT * FROM app_users WHERE email=$1 AND status=$2', [email, 'Aktivan']);
    if (!u.rows[0]) return res.status(401).json({ error: 'Kod nije ispravan ili je istekao.' });
    let verified = false;
    if (u.rows[0].two_factor_enabled && u.rows[0].two_factor_secret) {
      verified = authenticator.check(code, u.rows[0].two_factor_secret);
      if (!verified) { const hashes = Array.isArray(u.rows[0].two_factor_backup_hashes) ? u.rows[0].two_factor_backup_hashes : []; const idx = hashes.indexOf(hashToken(code.toUpperCase())); if (idx >= 0) { hashes.splice(idx, 1); await pool.query('UPDATE app_users SET two_factor_backup_hashes=$1 WHERE id=$2', [JSON.stringify(hashes), u.rows[0].id]); verified = true; } }
    } else {
      const t = await pool.query(`SELECT * FROM auth_tokens WHERE user_id=$1 AND purpose='login_otp' AND token_hash=$2 AND used_at IS NULL AND expires_at>now() AND attempts<5 ORDER BY id DESC LIMIT 1`, [u.rows[0].id, hashToken(code)]);
      if (t.rows[0]) { await pool.query('UPDATE auth_tokens SET used_at=now() WHERE id=$1', [t.rows[0].id]); verified = true; }
    }
    if (!verified) return res.status(401).json({ error: 'Kod nije ispravan ili je istekao.' });
    await createSession(u.rows[0].id, req, res, !!req.body?.remember);
    res.json({ user: publicUser(u.rows[0]) });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Potvrda prijave nije uspjela.' }); }
});
app.post('/api/auth/forgot-password', strictLimiter, async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const u = await pool.query('SELECT * FROM app_users WHERE email=$1', [email]);
    if (u.rows[0]) {
      const code = generateCode();
      await pool.query(`UPDATE auth_tokens SET used_at=now() WHERE user_id=$1 AND purpose='password_reset' AND used_at IS NULL`, [u.rows[0].id]);
      await pool.query(`INSERT INTO auth_tokens(user_id,purpose,token_hash,expires_at) VALUES($1,'password_reset',$2,now()+interval '15 minutes')`, [u.rows[0].id, hashToken(code)]);
      await sendSecurityEmail({ to: email, subject: 'Resetovanje TeloPak Flux lozinke', message: `Kod za resetovanje lozinke je: ${code}\nKod važi 15 minuta.` });
    }
    res.json({ ok: true });
  } catch (e) { console.error(e); res.json({ ok: true }); }
});
app.post('/api/auth/reset-password', strictLimiter, async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email), code = String(req.body?.code || ''), password = String(req.body?.password || '');
    if (!passwordValid(password)) return res.status(400).json({ error: 'Lozinka mora imati 12 znakova, veliko i malo slovo, broj i specijalni znak.' });
    const u = await pool.query('SELECT * FROM app_users WHERE email=$1', [email]);
    if (!u.rows[0]) return res.status(400).json({ error: 'Kod nije ispravan ili je istekao.' });
    const t = await pool.query(`SELECT * FROM auth_tokens WHERE user_id=$1 AND purpose='password_reset' AND token_hash=$2 AND used_at IS NULL AND expires_at>now() ORDER BY id DESC LIMIT 1`, [u.rows[0].id, hashToken(code)]);
    if (!t.rows[0]) return res.status(400).json({ error: 'Kod nije ispravan ili je istekao.' });
    await pool.query('BEGIN');
    try {
      await pool.query('UPDATE app_users SET password_hash=$1,updated_at=now() WHERE id=$2', [await hashPassword(password), u.rows[0].id]);
      await pool.query('UPDATE auth_tokens SET used_at=now() WHERE id=$1', [t.rows[0].id]);
      await pool.query('UPDATE auth_sessions SET revoked_at=now() WHERE user_id=$1 AND revoked_at IS NULL', [u.rows[0].id]);
      await pool.query('COMMIT');
    } catch (e) { await pool.query('ROLLBACK'); throw e; }
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Resetovanje nije uspjelo.' }); }
});
app.get('/api/auth/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));
app.post('/api/auth/logout', requireAuth, async (req, res) => { await pool.query('UPDATE auth_sessions SET revoked_at=now() WHERE id=$1', [req.sessionId]); clearSessionCookie(res); res.json({ ok: true }); });
app.get('/api/auth/sessions', requireAuth, async (req, res) => { const r = await pool.query('SELECT id,user_agent,ip_address,created_at,expires_at FROM auth_sessions WHERE user_id=$1 AND revoked_at IS NULL AND expires_at>now() ORDER BY created_at DESC', [req.user.id]); res.json(r.rows.map(s => ({ ...s, current: s.id === req.sessionId }))); });
app.delete('/api/auth/sessions/:id', requireAuth, async (req, res) => { await pool.query('UPDATE auth_sessions SET revoked_at=now() WHERE id=$1 AND user_id=$2 AND id<>$3', [req.params.id, req.user.id, req.sessionId]); res.json({ ok: true }); });
app.post('/api/auth/sessions/revoke-others', requireAuth, async (req, res) => { await pool.query('UPDATE auth_sessions SET revoked_at=now() WHERE user_id=$1 AND id<>$2 AND revoked_at IS NULL', [req.user.id, req.sessionId]); res.json({ ok: true }); });

app.put('/api/auth/profile', requireAuth, async (req, res) => {
  try {
    const sets = [], vals = []; let i = 1;
    if (req.body.name !== undefined) {
      if (!String(req.body.name).trim()) return res.status(400).json({ error: 'Ime i prezime su obavezni.' });
      sets.push('name=$' + (i++)); vals.push(String(req.body.name).trim().slice(0, 120));
    }
    if (req.body.phone !== undefined) { sets.push('phone=$' + (i++)); vals.push(String(req.body.phone || '').slice(0, 40)); }
    if (req.body.avatar_data !== undefined) {
      const v = req.body.avatar_data;
      const validAvatar = v == null || v === '' || (/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=\r\n]+$/.test(v) && v.length < 2000000);
      if (!validAvatar) return res.status(400).json({ error: 'Slika nije validna ili je prevelika (maksimalno 1 MB).' });
      sets.push('avatar_data=$' + (i++)); vals.push(v || null);
    }
    if (!sets.length) return res.status(400).json({ error: 'Nema izmjena za sačuvati.' });
    sets.push('updated_at=now()');
    vals.push(req.user.id);
    const r = await pool.query(`UPDATE app_users SET ${sets.join(',')} WHERE id=$${i} RETURNING *`, vals);
    res.json({ user: publicUser(r.rows[0]) });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Ažuriranje profila nije uspjelo.' }); }
});
app.put('/api/auth/password', requireAuth, strictLimiter, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Popunite sva polja.' });
    if (!passwordValid(newPassword)) return res.status(400).json({ error: 'Nova lozinka mora imati najmanje 12 znakova, veliko i malo slovo, broj i specijalni znak.' });
    const u = await pool.query('SELECT * FROM app_users WHERE id=$1', [req.user.id]);
    const valid = await verifyPassword(currentPassword, u.rows[0].password_hash);
    if (!valid) return res.status(401).json({ error: 'Trenutna lozinka nije ispravna.' });
    await pool.query('UPDATE app_users SET password_hash=$1,updated_at=now() WHERE id=$2', [await hashPassword(newPassword), req.user.id]);
    await pool.query('UPDATE auth_sessions SET revoked_at=now() WHERE user_id=$1 AND revoked_at IS NULL AND id<>$2', [req.user.id, req.sessionId]);
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Promjena lozinke nije uspjela.' }); }
});

// ---------- Postavke radnog prostora ----------
const workspaceDefaults = { company_name: '', tax_id: '', siret:'', tva_number:'', address: '', postal_code:'', city: '', country:'France', timezone:'Europe/Paris', phone: '', email: '', website: '', logo_data: null, currency: 'EUR', tax_rate: 17, invoice_prefix: 'R-', offer_prefix: 'PN-', payment_days: 7, document_note: '', notify_new_job: true, notify_status_change: true, notify_payment: true, notify_low_stock: true, notify_maintenance: true, email_notifications: true, session_timeout_minutes: 10080 };
async function ensureWorkspaceSettings(companyId) {
  const company = await pool.query('SELECT name FROM companies WHERE id=$1', [companyId]);
  await pool.query(`INSERT INTO company_settings(company_id,company_name) VALUES($1,$2) ON CONFLICT(company_id) DO NOTHING`, [companyId, company.rows[0]?.name || '']);
}
async function workspaceAudit(req, action, metadata = {}) { await pool.query(`INSERT INTO company_audit_log(company_id,actor_user_id,action,metadata,ip_address) VALUES($1,$2,$3,$4,$5)`, [req.user.company_id, req.user.id, action, JSON.stringify(metadata), req.ip]); }
app.get('/api/settings/workspace', requireAuth, async (req, res) => { try { await ensureWorkspaceSettings(req.user.company_id); const r = await pool.query('SELECT * FROM company_settings WHERE company_id=$1', [req.user.company_id]); res.json({ ...workspaceDefaults, ...r.rows[0] }); } catch (e) { console.error(e); res.status(500).json({ error: 'Postavke nije moguće učitati.' }); } });
app.get('/api/assistant/context',requireAuth,async(req,res)=>{try{await ensureWorkspaceSettings(req.user.company_id);const r=await pool.query('SELECT timezone FROM company_settings WHERE company_id=$1',[req.user.company_id]);res.json({timezone:r.rows[0]?.timezone||'Europe/Paris',can_send_reminders:canSendReminder(req.user)})}catch(e){res.status(500).json({error:'Postavke pomoćnika nije moguće učitati.'})}});
app.put('/api/settings/company', requireAuth, async (req, res) => { try {
  await ensureWorkspaceSettings(req.user.company_id); const b = req.body || {}; const logo = b.logo_data;
  if (logo !== undefined && logo !== null && logo !== '' && (!/^data:image\/(png|jpeg|webp);base64,/.test(logo) || logo.length > 2800000)) return res.status(400).json({ error: 'Logo nije validan ili je veći od 2 MB.' });
  const siret=String(b.siret||'').replace(/\s/g,'');if(siret&&!/^\d{14}$/.test(siret))return res.status(400).json({error:'SIRET mora sadržavati tačno 14 cifara.'});
  const r = await pool.query(`UPDATE company_settings SET company_name=$1,tax_id=$2,siret=$3,tva_number=$4,address=$5,postal_code=$6,city=$7,country='France',phone=$8,email=$9,website=$10,logo_data=$11,updated_at=now() WHERE company_id=$12 RETURNING *`, [String(b.company_name || '').trim(), String(b.tva_number||b.tax_id||'').trim(),siret,String(b.tva_number||'').trim(), String(b.address || '').trim(),String(b.postal_code||'').trim(), String(b.city || '').trim(), String(b.phone || '').trim(), normalizeEmail(b.email), String(b.website || '').trim(), logo || null, req.user.company_id]);
  if (r.rows[0].company_name) await pool.query(`UPDATE companies SET name=$1,address=$2,postal_code=$3,city=$4,country='France',siret=$5,tva_number=$6,company_phone=$7 WHERE id=$8`, [r.rows[0].company_name,r.rows[0].address,r.rows[0].postal_code,r.rows[0].city,r.rows[0].siret,r.rows[0].tva_number,r.rows[0].phone,req.user.company_id]); await workspaceAudit(req, 'company.settings.update', { fields: ['company_name','siret','tva_number','address','postal_code','city','country','phone','email','website','logo_data'] }); res.json(r.rows[0]);
} catch (e) { console.error(e); res.status(500).json({ error: 'Podaci firme nisu sačuvani.' }); } });
app.put('/api/settings/documents', requireAuth, async (req, res) => { try { await ensureWorkspaceSettings(req.user.company_id); const b = req.body || {}; const r = await pool.query(`UPDATE company_settings SET currency=$1,tax_rate=$2,invoice_prefix=$3,offer_prefix=$4,payment_days=$5,document_note=$6,updated_at=now() WHERE company_id=$7 RETURNING *`, [String(b.currency || 'EUR').slice(0, 5), Math.max(0, Number(b.tax_rate) || 0), String(b.invoice_prefix || 'R-').slice(0, 15), String(b.offer_prefix || 'PN-').slice(0, 15), Math.max(0, Number(b.payment_days) || 0), String(b.document_note || '').slice(0, 1000), req.user.company_id]); await workspaceAudit(req, 'document.settings.update', b); res.json(r.rows[0]); } catch (e) { console.error(e); res.status(500).json({ error: 'Postavke dokumenata nisu sačuvane.' }); } });
app.put('/api/settings/notifications', requireAuth, async (req, res) => { try { await ensureWorkspaceSettings(req.user.company_id); const b = req.body || {}; const keys = ['notify_new_job', 'notify_status_change', 'notify_payment', 'notify_low_stock', 'notify_maintenance', 'email_notifications']; const vals = keys.map(k => b[k] !== false); const r = await pool.query(`UPDATE company_settings SET notify_new_job=$1,notify_status_change=$2,notify_payment=$3,notify_low_stock=$4,notify_maintenance=$5,email_notifications=$6,updated_at=now() WHERE company_id=$7 RETURNING *`, [...vals, req.user.company_id]); await workspaceAudit(req, 'notification.settings.update', b); res.json(r.rows[0]); } catch (e) { console.error(e); res.status(500).json({ error: 'Postavke obavijesti nisu sačuvane.' }); } });
app.post('/api/settings/notifications/test', requireAuth, strictLimiter, async (req, res) => { const result = await sendSecurityEmail({ to: req.user.email, subject: 'Testna TeloPak Flux obavijest', message: 'Ovo je testna obavijest iz postavki vašeg radnog prostora.' }); await workspaceAudit(req, 'notification.test', { delivered: result.delivered }); res.status(result.delivered ? 200 : 503).json(result.delivered ? { ok: true } : { error: result.reason || 'Testni email nije poslan.' }); });
app.put('/api/settings/security', requireAuth, async (req, res) => { try { await ensureWorkspaceSettings(req.user.company_id); const minutes = Math.min(43200, Math.max(15, Number(req.body?.session_timeout_minutes) || 10080)); const r = await pool.query('UPDATE company_settings SET session_timeout_minutes=$1,updated_at=now() WHERE company_id=$2 RETURNING *', [minutes, req.user.company_id]); await workspaceAudit(req, 'security.settings.update', { session_timeout_minutes: minutes }); res.json(r.rows[0]); } catch (e) { res.status(500).json({ error: 'Sigurnosne postavke nisu sačuvane.' }); } });
app.get('/api/dashboard/home',requireAuth,async(req,res)=>{try{await ensureWorkspaceSettings(req.user.company_id);const cid=req.user.company_id,days=Math.min(30,Math.max(7,Number(req.query.days)||7));const tz=(await pool.query('SELECT timezone FROM company_settings WHERE company_id=$1',[cid])).rows[0]?.timezone||'Europe/Paris';const [payments,previousPayments,jobs,offers,invoices,todayJobs,maintenance]=await Promise.all([
 pool.query(`SELECT p.id,p.invoice_id,p.amount,p.paid_at FROM invoice_payments p WHERE p.company_id=$1 AND p.paid_at >= date_trunc('month',now() AT TIME ZONE $2) AT TIME ZONE $2 ORDER BY p.paid_at`,[cid,tz]),
 pool.query(`SELECT COALESCE(SUM(amount),0)::numeric total FROM invoice_payments WHERE company_id=$1 AND paid_at >= (date_trunc('month',now() AT TIME ZONE $2)-interval '1 month') AT TIME ZONE $2 AND paid_at < date_trunc('month',now() AT TIME ZONE $2) AT TIME ZONE $2`,[cid,tz]),
 pool.query(`SELECT * FROM jobs WHERE company_id=$1 ORDER BY id DESC`,[cid]),pool.query(`SELECT * FROM offers WHERE company_id=$1 ORDER BY id DESC`,[cid]),pool.query(`SELECT * FROM invoices WHERE company_id=$1 ORDER BY id DESC`,[cid]),
 pool.query(`SELECT * FROM jobs WHERE company_id=$1 AND to_date(nullif(regexp_replace(date,'[^0-9.]','','g'),''),'DD.MM.YYYY')=(now() AT TIME ZONE $2)::date ORDER BY nullif(time,'')::time NULLS LAST,id`,[cid,tz]),
 pool.query(`SELECT * FROM maintenance WHERE company_id=$1 ORDER BY id DESC`,[cid])]);
 const money=v=>{const raw=String(v||'').replace(/[^0-9,.-]/g,'');const n=Number(raw.includes(',')?raw.replace(/\./g,'').replace(',','.'):raw);return Number.isFinite(n)?n:0};const dateOnly=s=>{const m=String(s||'').match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);return m?new Date(Date.UTC(+m[3],+m[2]-1,+m[1])):null};const todayKey=new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());const today=new Date(`${todayKey}T00:00:00Z`);
 const activeJobs=jobs.rows.filter(j=>j.status!=='Završeno'),waitingOffers=offers.rows.filter(o=>o.status==='Poslata');const enriched=invoices.rows.map(i=>{const total=money(i.total||i.amount),legacyPaid=money(i.paid),ledgerPaid=payments.rows.filter(p=>String(p.invoice_id)===String(i.id)).reduce((s,p)=>s+Number(p.amount),0),paid=Math.max(legacyPaid,ledgerPaid),remaining=Math.max(0,total-paid),due=dateOnly(i.due),overdue=remaining>0&&!['Nacrt','Plaćen'].includes(i.status)&&due&&due<today;return {...i,total_value:total,paid_value:paid,remaining,overdue}});const issued=enriched.filter(i=>i.status!=='Nacrt');const outstanding=issued.reduce((s,i)=>s+i.remaining,0),overdueAmount=issued.filter(i=>i.overdue).reduce((s,i)=>s+i.remaining,0);
 const chart=[];for(let i=days-1;i>=0;i--){const d=new Date(today);d.setUTCDate(d.getUTCDate()-i);const key=d.toISOString().slice(0,10);chart.push({date:key,amount:payments.rows.filter(p=>new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(p.paid_at))===key).reduce((s,p)=>s+Number(p.amount),0)})}const chartTotal=chart.reduce((s,x)=>s+x.amount,0),monthPaid=payments.rows.reduce((s,x)=>s+Number(x.amount),0),prevPaid=Number(previousPayments.rows[0].total||0);
 const alerts=[];for(const i of enriched.filter(x=>x.overdue))alerts.push({type:'invoice',id:i.id,title:`Račun ${i.no||''} kasni`,sub:`${i.client} · ${i.remaining.toFixed(2)} €`,page:'Računi'});for(const o of waitingOffers){const valid=dateOnly(o.valid);if(valid&&valid<=new Date(today.getTime()+7*86400000))alerts.push({type:'offer',id:o.id,title:'Ponuda uskoro ističe',sub:`${o.client} · ${o.no||''}`,page:'Ponude'})}for(const m of maintenance.rows){const next=dateOnly(m.next);if(next&&next>=today&&next<=new Date(today.getTime()+7*86400000))alerts.push({type:'maintenance',id:m.id,title:'Održavanje uskoro dospijeva',sub:`${m.client} · ${m.asset||''}`,page:'Održavanje'})}
 res.json({timezone:tz,period_days:days,payment_tracking_available:true,cards:{month_paid:monthPaid,previous_month_paid:prevPaid,active_jobs:activeJobs.length,waiting_offers:waitingOffers.length,open_offers:offers.rows.filter(o=>!['Prihvaćena','Odbijena','Istekla'].includes(o.status)).length,outstanding,overdue_amount:overdueAmount},chart,chart_total:chartTotal,today_jobs:todayJobs.rows,alerts,latest_invoices:issued.slice(0,5)})
}catch(e){console.error(e);res.status(500).json({error:'Početni pregled trenutno nije moguće učitati.'})}});
app.get('/api/invoices/:id/payments',requireAuth,async(req,res)=>{try{const r=await pool.query(`SELECT p.* FROM invoice_payments p JOIN invoices i ON i.id=p.invoice_id WHERE p.invoice_id=$1 AND p.company_id=$2 AND i.company_id=$2 ORDER BY paid_at DESC`,[req.params.id,req.user.company_id]);res.json(r.rows)}catch(e){res.status(500).json({error:'Uplate nije moguće učitati.'})}});
app.post('/api/invoices/:id/payments',requireAuth,async(req,res)=>{try{const amount=Number(req.body?.amount),paidAt=req.body?.paid_at?new Date(req.body.paid_at):new Date();if(!(amount>0)||isNaN(paidAt))return res.status(400).json({error:'Unesite ispravan iznos i datum uplate.'});const inv=await pool.query('SELECT id FROM invoices WHERE id=$1 AND company_id=$2',[req.params.id,req.user.company_id]);if(!inv.rows[0])return res.status(404).json({error:'Račun nije pronađen.'});const r=await pool.query(`INSERT INTO invoice_payments(company_id,invoice_id,amount,paid_at,note,created_by) VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,[req.user.company_id,req.params.id,amount,paidAt,String(req.body?.note||''),req.user.id]);res.status(201).json(r.rows[0])}catch(e){console.error(e);res.status(500).json({error:'Uplata nije evidentirana.'})}});

app.get('/api/dashboard', requireAuth, async (req, res) => { try {
  const cid = req.user.company_id;
  const [clients, jobs, offers, invoices, stock, maintenance] = await Promise.all([
    pool.query('SELECT COUNT(*)::int count FROM clients WHERE company_id=$1', [cid]),
    pool.query(`SELECT COUNT(*)::int total,COUNT(*) FILTER(WHERE status='Završeno')::int completed,COUNT(*) FILTER(WHERE status<>'Završeno')::int active FROM jobs WHERE company_id=$1`, [cid]),
    pool.query(`SELECT COUNT(*)::int total,COUNT(*) FILTER(WHERE status='Prihvaćena')::int accepted FROM offers WHERE company_id=$1`, [cid]),
    pool.query('SELECT paid FROM invoices WHERE company_id=$1', [cid]),
    pool.query(`SELECT COUNT(*)::int total,COUNT(*) FILTER(WHERE stock<=min)::int low FROM stock WHERE company_id=$1`, [cid]),
    pool.query('SELECT COUNT(*)::int total FROM maintenance WHERE company_id=$1', [cid])
  ]);
  const paid = invoices.rows.reduce((sum, row) => { const raw = String(row.paid || '').replace(/[^0-9,.-]/g, ''); const n = Number(raw.includes(',') ? raw.replace(/\./g, '').replace(',', '.') : raw); return sum + (Number.isFinite(n) ? n : 0); }, 0);
  res.json({ clients: clients.rows[0], jobs: jobs.rows[0], offers: offers.rows[0], invoices: { total: invoices.rowCount, paid }, stock: stock.rows[0], maintenance: maintenance.rows[0] });
} catch (e) { console.error(e); res.status(500).json({ error: 'Pregled nije moguće učitati.' }); } });
app.get('/api/settings/audit', requireAuth, async (req, res) => { try { const r = await pool.query(`SELECT a.id,a.action,a.metadata,a.ip_address,a.created_at,u.name actor FROM company_audit_log a LEFT JOIN app_users u ON u.id=a.actor_user_id WHERE a.company_id=$1 ORDER BY a.created_at DESC LIMIT 50`, [req.user.company_id]); res.json(r.rows); } catch (e) { res.status(500).json({ error: 'Dnevnik aktivnosti nije moguće učitati.' }); } });
app.post('/api/auth/2fa/setup', requireAuth, strictLimiter, async (req, res) => { try { const secret = authenticator.generateSecret(); const issuer = 'TeloPak Flux'; const uri = authenticator.keyuri(req.user.email, issuer, secret); const qr = await QRCode.toDataURL(uri); await pool.query(`DELETE FROM auth_tokens WHERE user_id=$1 AND purpose='2fa_setup'`, [req.user.id]); await pool.query(`INSERT INTO auth_tokens(user_id,purpose,token_hash,expires_at) VALUES($1,'2fa_setup',$2,now()+interval '10 minutes')`, [req.user.id, secret]); res.json({ secret, qr }); } catch (e) { console.error(e); res.status(500).json({ error: '2FA postavljanje nije uspjelo.' }); } });
app.post('/api/auth/2fa/enable', requireAuth, strictLimiter, async (req, res) => { try { const code = String(req.body?.code || '').replace(/\s/g, ''); const t = await pool.query(`SELECT * FROM auth_tokens WHERE user_id=$1 AND purpose='2fa_setup' AND used_at IS NULL AND expires_at>now() ORDER BY id DESC LIMIT 1`, [req.user.id]); if (!t.rows[0] || !authenticator.check(code, t.rows[0].token_hash)) return res.status(400).json({ error: 'Kod iz autentikator aplikacije nije ispravan.' }); const backup = Array.from({ length: 8 }, () => crypto.randomBytes(4).toString('hex').toUpperCase()); const hashes = backup.map(hashToken); await pool.query(`UPDATE app_users SET two_factor_enabled=true,two_factor_secret=$1,two_factor_backup_hashes=$2,updated_at=now() WHERE id=$3`, [t.rows[0].token_hash, JSON.stringify(hashes), req.user.id]); await pool.query('UPDATE auth_tokens SET used_at=now() WHERE id=$1', [t.rows[0].id]); await workspaceAudit(req, 'security.2fa.enabled'); res.json({ ok: true, backupCodes: backup }); } catch (e) { console.error(e); res.status(500).json({ error: '2FA nije aktivirana.' }); } });
app.post('/api/auth/2fa/disable', requireAuth, strictLimiter, async (req, res) => { try { const password = String(req.body?.password || ''); const u = await pool.query('SELECT password_hash FROM app_users WHERE id=$1', [req.user.id]); if (!await verifyPassword(password, u.rows[0].password_hash)) return res.status(401).json({ error: 'Lozinka nije ispravna.' }); await pool.query(`UPDATE app_users SET two_factor_enabled=false,two_factor_secret=NULL,two_factor_backup_hashes='[]'::jsonb,updated_at=now() WHERE id=$1`, [req.user.id]); await workspaceAudit(req, 'security.2fa.disabled'); res.json({ ok: true }); } catch (e) { res.status(500).json({ error: '2FA nije isključena.' }); } });

// ---------- Korisnici firme (stvarni PostgreSQL podaci) ----------
function requireCompanyAdmin(req, res, next) {
  if (!['Administrator', 'Platform Owner'].includes(req.user?.role)) return res.status(403).json({ error: 'Samo administrator firme može upravljati korisnicima.' });
  next();
}
const teamUserSelect = `id,name,email,phone,role,status,email_verified,created_at,updated_at`;
app.get('/api/team', requireAuth, async (req, res) => { try { const r = await pool.query(`SELECT ${teamUserSelect} FROM app_users WHERE company_id=$1 AND role<>'Platform Owner' ORDER BY created_at DESC`, [req.user.company_id]); res.json(r.rows); } catch (e) { console.error(e); res.status(500).json({ error: 'Korisnike firme nije moguće učitati.' }); } });
app.post('/api/team', requireAuth, requireCompanyAdmin, strictLimiter, async (req, res) => { try {
  const b = req.body || {}, name = String(b.name || '').trim(), email = normalizeEmail(b.email), role = ['Administrator', 'Kancelarija', 'Radnik na terenu'].includes(b.role) ? b.role : 'Radnik na terenu';
  if (!name) return res.status(400).json({ error: 'Ime i prezime su obavezni.' }); if (!email || !email.includes('@')) return res.status(400).json({ error: 'Unesite ispravnu email adresu.' });
  if ((await pool.query('SELECT 1 FROM app_users WHERE email=$1', [email])).rows[0]) return res.status(409).json({ error: 'Korisnik sa ovom email adresom već postoji.' });
  const temporaryPassword = `Tp!${crypto.randomBytes(9).toString('base64url')}7a`;
  const r = await pool.query(`INSERT INTO app_users(company_id,name,email,phone,password_hash,role,status,email_verified) VALUES($1,$2,$3,$4,$5,$6,'Aktivan',true) RETURNING ${teamUserSelect}`, [req.user.company_id, name, email, String(b.phone || '').slice(0, 40), await hashPassword(temporaryPassword), role]);
  await workspaceAudit(req, 'team.user.create', { user_id: r.rows[0].id, email, role });
  const mail = await sendSecurityEmail({ to: email, subject: 'Vaš TeloPak Flux korisnički nalog', message: `Administrator firme kreirao vam je nalog.\n\nEmail: ${email}\nPrivremena lozinka: ${temporaryPassword}\n\nNakon prijave odmah promijenite lozinku u svom profilu.` });
  res.status(201).json({ ...r.rows[0], emailDelivered: !!mail.delivered });
} catch (e) { if (e?.code === '23505') return res.status(409).json({ error: 'Email adresa je već u upotrebi.' }); console.error(e); res.status(500).json({ error: 'Korisnik nije kreiran.' }); } });
app.put('/api/team/:id', requireAuth, requireCompanyAdmin, async (req, res) => { try {
  const current = await pool.query(`SELECT * FROM app_users WHERE id=$1 AND company_id=$2 AND role<>'Platform Owner'`, [req.params.id, req.user.company_id]); if (!current.rows[0]) return res.status(404).json({ error: 'Korisnik nije pronađen.' });
  const b = req.body || {}, name = String(b.name ?? current.rows[0].name).trim(), email = normalizeEmail(b.email ?? current.rows[0].email), role = ['Administrator', 'Kancelarija', 'Radnik na terenu'].includes(b.role) ? b.role : current.rows[0].role, status = ['Aktivan', 'Neaktivan'].includes(b.status) ? b.status : current.rows[0].status;
  if (!name || !email.includes('@')) return res.status(400).json({ error: 'Ime i ispravan email su obavezni.' });
  if (String(req.user.id) === String(req.params.id) && status !== 'Aktivan') return res.status(400).json({ error: 'Ne možete deaktivirati vlastiti nalog.' });
  const r = await pool.query(`UPDATE app_users SET name=$1,email=$2,phone=$3,role=$4,status=$5,updated_at=now() WHERE id=$6 AND company_id=$7 RETURNING ${teamUserSelect}`, [name, email, String((b.phone ?? current.rows[0].phone) || '').slice(0, 40), role, status, req.params.id, req.user.company_id]);
  if (status === 'Neaktivan') await pool.query('UPDATE auth_sessions SET revoked_at=now() WHERE user_id=$1 AND revoked_at IS NULL', [req.params.id]); await workspaceAudit(req, 'team.user.update', { user_id: req.params.id, role, status }); res.json(r.rows[0]);
} catch (e) { if (e?.code === '23505') return res.status(409).json({ error: 'Email adresa je već u upotrebi.' }); console.error(e); res.status(500).json({ error: 'Korisnik nije ažuriran.' }); } });
app.post('/api/team/:id/resend', requireAuth, requireCompanyAdmin, strictLimiter, async (req, res) => { try { const u = await pool.query(`SELECT id,name,email FROM app_users WHERE id=$1 AND company_id=$2 AND role<>'Platform Owner'`, [req.params.id, req.user.company_id]); if (!u.rows[0]) return res.status(404).json({ error: 'Korisnik nije pronađen.' }); const password = `Tp!${crypto.randomBytes(9).toString('base64url')}7a`; await pool.query('UPDATE app_users SET password_hash=$1,failed_attempts=0,locked_until=NULL,updated_at=now() WHERE id=$2', [await hashPassword(password), u.rows[0].id]); await pool.query('UPDATE auth_sessions SET revoked_at=now() WHERE user_id=$1 AND revoked_at IS NULL', [u.rows[0].id]); const mail = await sendSecurityEmail({ to: u.rows[0].email, subject: 'Novi TeloPak Flux pristupni podaci', message: `Vaša nova privremena lozinka je: ${password}\nNakon prijave je odmah promijenite.` }); await workspaceAudit(req, 'team.user.credentials.reset', { user_id: u.rows[0].id }); if (!mail.delivered) return res.status(503).json({ error: mail.reason || 'Email nije poslan.' }); res.json({ ok: true }); } catch (e) { console.error(e); res.status(500).json({ error: 'Novi pristupni podaci nisu poslani.' }); } });
app.delete('/api/team/:id', requireAuth, requireCompanyAdmin, async (req, res) => { try { if (String(req.user.id) === String(req.params.id)) return res.status(400).json({ error: 'Ne možete obrisati vlastiti nalog.' }); const r = await pool.query(`DELETE FROM app_users WHERE id=$1 AND company_id=$2 AND role<>'Platform Owner' RETURNING id`, [req.params.id, req.user.company_id]); if (!r.rows[0]) return res.status(404).json({ error: 'Korisnik nije pronađen.' }); await workspaceAudit(req, 'team.user.delete', { user_id: req.params.id }); res.json({ ok: true }); } catch (e) { console.error(e); res.status(500).json({ error: 'Korisnik nije obrisan.' }); } });

// ---------- Platform Owner konzola ----------
app.get('/api/owner/overview', requireAuth, requirePlatformOwner, async (req, res) => {
  try {
    const [companies, users, sessions] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int total, COUNT(*) FILTER (WHERE status='Aktivna')::int active, COUNT(*) FILTER (WHERE plan='Trial')::int trials, COALESCE(SUM(monthly_price) FILTER (WHERE status='Aktivna'),0)::numeric mrr FROM companies`),
      pool.query(`SELECT COUNT(*)::int total, COUNT(*) FILTER (WHERE status='Aktivan')::int active FROM app_users WHERE role<>'Platform Owner'`),
      pool.query(`SELECT COUNT(*)::int active FROM auth_sessions WHERE revoked_at IS NULL AND expires_at>now()`)
    ]);
    let emailStatus = 'Not configured'; if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) { try { const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: Number(process.env.SMTP_PORT) === 465, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } }); await transporter.verify(); emailStatus = 'Operational'; } catch { emailStatus = 'Degraded'; } }
    res.json({ companies: companies.rows[0], users: users.rows[0], activeSessions: sessions.rows[0].active, system: { api: 'Operational', database: 'Operational', email: emailStatus } });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Nije moguće učitati pregled platforme.' }); }
});
app.get('/api/owner/companies', requireAuth, requirePlatformOwner, async (req, res) => {
  try { const r = await pool.query(`SELECT c.*, COUNT(DISTINCT u.id)::int users, COUNT(DISTINCT j.id)::int jobs FROM companies c LEFT JOIN app_users u ON u.company_id=c.id AND u.role<>'Platform Owner' LEFT JOIN jobs j ON j.company_id=c.id GROUP BY c.id ORDER BY c.created_at DESC`); res.json(r.rows); } catch (e) { console.error(e); res.status(500).json({ error: 'Nije moguće učitati firme.' }); }
});
app.put('/api/owner/companies/:id', requireAuth, requirePlatformOwner, async (req, res) => {
  try { const { name, industry, status, plan, monthly_price, trial_ends_at } = req.body || {}; const r = await pool.query(`UPDATE companies SET name=COALESCE($1,name),industry=COALESCE($2,industry),status=COALESCE($3,status),plan=COALESCE($4,plan),monthly_price=COALESCE($5,monthly_price),trial_ends_at=COALESCE($6,trial_ends_at) WHERE id=$7 RETURNING *`, [name || null, industry === undefined ? null : industry, status || null, plan || null, monthly_price === undefined ? null : Number(monthly_price), trial_ends_at || null, req.params.id]); await pool.query(`INSERT INTO platform_audit_log(actor_user_id,action,target_type,target_id,metadata,ip_address) VALUES($1,'company.update','company',$2,$3,$4)`, [req.user.id, String(req.params.id), JSON.stringify({ name, industry, status, plan, monthly_price, trial_ends_at }), req.ip]); res.json(r.rows[0]); } catch (e) { console.error(e); res.status(500).json({ error: 'Izmjena firme nije uspjela.' }); }
});
app.post('/api/owner/companies', requireAuth, requirePlatformOwner, async (req, res) => {
  try {
    const { name, industry, plan, monthly_price, status } = req.body || {};
    if (!name || !String(name).trim()) return res.status(400).json({ error: 'Naziv firme je obavezan.' });
    const r = await pool.query(`INSERT INTO companies(name,industry,plan,monthly_price,status) VALUES($1,$2,$3,$4,$5) RETURNING *`, [String(name).trim(), industry || '', plan || 'Trial', Number(monthly_price) || 0, status || 'Aktivna']);
    await pool.query(`INSERT INTO platform_audit_log(actor_user_id,action,target_type,target_id,metadata,ip_address) VALUES($1,'company.create','company',$2,$3,$4)`, [req.user.id, String(r.rows[0].id), JSON.stringify({ name }), req.ip]);
    res.status(201).json(r.rows[0]);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Kreiranje firme nije uspjelo.' }); }
});
app.get('/api/owner/companies/:id', requireAuth, requirePlatformOwner, async (req, res) => {
  try {
    const company = await pool.query('SELECT * FROM companies WHERE id=$1', [req.params.id]);
    if (!company.rows[0]) return res.status(404).json({ error: 'Firma nije pronađena.' });
    const [users, jobs, invoices, clients, offers] = await Promise.all([
      pool.query(`SELECT id,name,email,role,status,email_verified,created_at FROM app_users WHERE company_id=$1 ORDER BY created_at DESC`, [req.params.id]),
      pool.query(`SELECT COUNT(*)::int c FROM jobs WHERE company_id=$1`, [req.params.id]),
      pool.query(`SELECT COUNT(*)::int c FROM invoices WHERE company_id=$1`, [req.params.id]),
      pool.query(`SELECT COUNT(*)::int c FROM clients WHERE company_id=$1`, [req.params.id]),
      pool.query(`SELECT COUNT(*)::int c FROM offers WHERE company_id=$1`, [req.params.id])
    ]);
    res.json({ company: company.rows[0], users: users.rows, stats: { jobs: jobs.rows[0].c, invoices: invoices.rows[0].c, clients: clients.rows[0].c, offers: offers.rows[0].c } });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Nije moguće učitati detalje firme.' }); }
});
app.delete('/api/owner/companies/:id', requireAuth, requirePlatformOwner, async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM companies WHERE id=$1 RETURNING id', [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Firma nije pronađena.' });
    await pool.query(`INSERT INTO platform_audit_log(actor_user_id,action,target_type,target_id,metadata,ip_address) VALUES($1,'company.delete','company',$2,'{}',$3)`, [req.user.id, String(req.params.id), req.ip]);
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Brisanje firme nije uspjelo.' }); }
});
app.get('/api/owner/users', requireAuth, requirePlatformOwner, async (req, res) => { try { const r = await pool.query(`SELECT u.id,u.company_id,u.name,u.email,u.phone,u.role,u.status,u.email_verified,u.created_at,c.name company FROM app_users u LEFT JOIN companies c ON c.id=u.company_id ORDER BY u.created_at DESC LIMIT 250`); res.json(r.rows); } catch (e) { res.status(500).json({ error: 'Nije moguće učitati korisnike.' }); } });
app.post('/api/owner/users', requireAuth, requirePlatformOwner, strictLimiter, async (req, res) => {
  try {
    const b = req.body || {}, email = normalizeEmail(b.email), name = String(b.name || '').trim(), password = String(b.password || ''), companyId = Number(b.company_id);
    const allowedRoles = ['Administrator', 'Menadžer', 'Radnik'];
    if (!name) return res.status(400).json({ error: 'Ime i prezime su obavezni.' });
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'Unesite ispravnu email adresu.' });
    if (!Number.isInteger(companyId) || companyId < 1) return res.status(400).json({ error: 'Odaberite firmu korisnika.' });
    if (!passwordValid(password)) return res.status(400).json({ error: 'Privremena lozinka mora imati najmanje 12 znakova, veliko i malo slovo, broj i specijalni znak.' });
    const role = allowedRoles.includes(b.role) ? b.role : 'Radnik', status = b.status === 'Neaktivan' ? 'Neaktivan' : 'Aktivan';
    const company = await pool.query('SELECT id,name FROM companies WHERE id=$1', [companyId]);
    if (!company.rows[0]) return res.status(404).json({ error: 'Odabrana firma ne postoji.' });
    const exists = await pool.query('SELECT id FROM app_users WHERE email=$1', [email]);
    if (exists.rows[0]) return res.status(409).json({ error: 'Korisnik sa ovom email adresom već postoji.' });
    const passwordHash = await hashPassword(password);
    const r = await pool.query(`INSERT INTO app_users(company_id,name,email,phone,password_hash,role,status,email_verified) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id,company_id,name,email,phone,role,status,email_verified,created_at`, [companyId, name, email, String(b.phone || '').slice(0, 40), passwordHash, role, status, b.email_verified !== false]);
    await pool.query(`INSERT INTO platform_audit_log(actor_user_id,action,target_type,target_id,metadata,ip_address) VALUES($1,'user.create','user',$2,$3,$4)`, [req.user.id, String(r.rows[0].id), JSON.stringify({ email, company_id: companyId, role, status }), req.ip]);
    let emailDelivered = false;
    if (b.send_email !== false) { const mail = await sendSecurityEmail({ to: email, subject: 'Vaš TeloPak Flux korisnički nalog', message: `Kreiran vam je nalog za firmu ${company.rows[0].name}.\n\nEmail: ${email}\nPrivremena lozinka: ${password}\n\nNakon prve prijave preporučujemo da odmah promijenite lozinku.` }); emailDelivered = !!mail.delivered; }
    res.status(201).json({ ...r.rows[0], company: company.rows[0].name, emailDelivered });
  } catch (e) { if (e?.code === '23505') return res.status(409).json({ error: 'Email adresa je već u upotrebi.' }); console.error(e); res.status(500).json({ error: 'Kreiranje korisnika nije uspjelo.' }); }
});
app.put('/api/owner/users/:id', requireAuth, requirePlatformOwner, async (req, res) => {
  try {
    const b = req.body || {};
    const sets = [], vals = []; let i = 1;
    if (b.name !== undefined) {
      if (!String(b.name).trim()) return res.status(400).json({ error: 'Ime je obavezno.' });
      sets.push('name=$' + (i++)); vals.push(String(b.name).trim().slice(0, 120));
    }
    if (b.email !== undefined) {
      const email = normalizeEmail(b.email);
      if (!email || !email.includes('@')) return res.status(400).json({ error: 'Email adresa nije validna.' });
      sets.push('email=$' + (i++)); vals.push(email);
    }
    if (b.phone !== undefined) { sets.push('phone=$' + (i++)); vals.push(String(b.phone || '').slice(0, 40)); }
    if (b.role !== undefined) { sets.push('role=$' + (i++)); vals.push(b.role); }
    if (b.status !== undefined) { sets.push('status=$' + (i++)); vals.push(b.status); }
    if (b.email_verified !== undefined) { sets.push('email_verified=$' + (i++)); vals.push(!!b.email_verified); }
    if (!sets.length) return res.status(400).json({ error: 'Nema izmjena za sačuvati.' });
    sets.push('updated_at=now()');
    const idPlaceholder = '$' + i;
    vals.push(req.params.id);
    const r = await pool.query(`UPDATE app_users SET ${sets.join(',')} WHERE id=${idPlaceholder} RETURNING id,name,email,phone,role,status,email_verified,created_at,company_id`, vals);
    if (!r.rows[0]) return res.status(404).json({ error: 'Korisnik nije pronađen.' });
    await pool.query(`INSERT INTO platform_audit_log(actor_user_id,action,target_type,target_id,metadata,ip_address) VALUES($1,'user.update','user',$2,$3,$4)`, [req.user.id, String(req.params.id), JSON.stringify(b), req.ip]);
    res.json(r.rows[0]);
  } catch (e) {
    if (e && e.code === '23505') return res.status(409).json({ error: 'Email adresa je već u upotrebi.' });
    console.error(e); res.status(500).json({ error: 'Izmjena korisnika nije uspjela.' });
  }
});
app.delete('/api/owner/users/:id', requireAuth, requirePlatformOwner, async (req, res) => {
  try {
    if (String(req.user.id) === String(req.params.id)) return res.status(400).json({ error: 'Ne možete obrisati sopstveni nalog.' });
    const r = await pool.query('DELETE FROM app_users WHERE id=$1 RETURNING id', [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Korisnik nije pronađen.' });
    await pool.query(`INSERT INTO platform_audit_log(actor_user_id,action,target_type,target_id,metadata,ip_address) VALUES($1,'user.delete','user',$2,'{}',$3)`, [req.user.id, String(req.params.id), req.ip]);
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Brisanje korisnika nije uspjelo.' }); }
});
app.get('/api/owner/audit', requireAuth, requirePlatformOwner, async (req, res) => { try { const r = await pool.query(`SELECT a.*,u.email actor FROM platform_audit_log a LEFT JOIN app_users u ON u.id=a.actor_user_id ORDER BY a.created_at DESC LIMIT 100`); res.json(r.rows); } catch (e) { res.status(500).json({ error: 'Nije moguće učitati audit zapis.' }); } });
app.get('/api/owner/settings', requireAuth, requirePlatformOwner, async (req, res) => { try { const r = await pool.query('SELECT * FROM platform_settings WHERE id=1'); res.json(r.rows[0]); } catch (e) { res.status(500).json({ error: 'Nije moguće učitati postavke platforme.' }); } });
app.put('/api/owner/settings', requireAuth, requirePlatformOwner, async (req, res) => {
  try {
    const { app_name, tagline, support_email, primary_color, logo_data, favicon_data, locale, registrations_enabled, maintenance_mode } = req.body || {};
    const validImage = v => v == null || v === '' || (/^data:image\/(png|jpeg|webp|svg\+xml|x-icon|vnd\.microsoft\.icon);base64,/.test(v) && v.length < 1400000);
    if (!validImage(logo_data) || !validImage(favicon_data)) return res.status(400).json({ error: 'Logo ili favicon nisu validni ili su preveliki (maksimalno 1 MB).' });
    const color = /^#[0-9a-fA-F]{6}$/.test(primary_color || '') ? primary_color : '#1769d2';
    const r = await pool.query(`UPDATE platform_settings SET app_name=$1,tagline=$2,support_email=$3,primary_color=$4,logo_data=$5,favicon_data=$6,locale=$7,registrations_enabled=$8,maintenance_mode=$9,updated_at=now() WHERE id=1 RETURNING *`, [String(app_name || 'TeloPak Flux').slice(0, 80), String(tagline || '').slice(0, 160), String(support_email || '').slice(0, 160), color, logo_data || null, favicon_data || null, locale || 'bs-BA', registrations_enabled !== false, !!maintenance_mode]);
    await pool.query(`INSERT INTO platform_audit_log(actor_user_id,action,target_type,target_id,metadata,ip_address) VALUES($1,'platform.settings.update','platform','1',$2,$3)`, [req.user.id, JSON.stringify({ app_name, primary_color, locale, registrations_enabled, maintenance_mode }), req.ip]);
    res.json(r.rows[0]);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Čuvanje postavki nije uspjelo.' }); }
});

app.get('/api/clients/summary',requireAuth,async(req,res)=>{try{const cid=req.user.company_id;const [clients,jobs,invoices,payments]=await Promise.all([pool.query('SELECT * FROM clients WHERE company_id=$1 ORDER BY id ASC',[cid]),pool.query('SELECT id,client,status FROM jobs WHERE company_id=$1',[cid]),pool.query('SELECT id,client,status,paid,total,amount FROM invoices WHERE company_id=$1',[cid]),pool.query(`SELECT i.client,COALESCE(SUM(p.amount),0)::numeric paid_total,COALESCE(SUM(p.amount) FILTER(WHERE date_trunc('month',p.paid_at)=date_trunc('month',now())),0)::numeric paid_month FROM invoice_payments p JOIN invoices i ON i.id=p.invoice_id AND i.company_id=p.company_id WHERE p.company_id=$1 GROUP BY i.client`,[cid])]);const byPayment=new Map(payments.rows.map(x=>[String(x.client||'').toLowerCase(),x])),money=v=>{const raw=String(v||'').replace(/[^0-9,.-]/g,'');const n=Number(raw.includes(',')?raw.replace(/\./g,'').replace(',','.'):raw);return Number.isFinite(n)?n:0};const rows=clients.rows.map(c=>{const key=String(c.name||'').toLowerCase(),relatedJobs=jobs.rows.filter(j=>String(j.client||'').toLowerCase()===key),relatedInvoices=invoices.rows.filter(i=>String(i.client||'').toLowerCase()===key),ledger=byPayment.get(key),legacyPaid=relatedInvoices.reduce((s,i)=>s+money(i.paid),0),totalPaid=ledger?Number(ledger.paid_total):legacyPaid;return{...c,jobs_count:relatedJobs.length,invoices_count:relatedInvoices.length,total_paid:totalPaid,paid_this_month:ledger?Number(ledger.paid_month):0,has_history:relatedJobs.length>0||relatedInvoices.length>0}});res.json(rows)}catch(e){console.error(e);res.status(500).json({error:'Sažetak klijenata nije moguće učitati.'})}});
app.patch('/api/clients/:id/archive',requireAuth,async(req,res)=>{try{const r=await pool.query('UPDATE clients SET archived=$1,status=CASE WHEN $1 THEN \'Neaktivan\' ELSE status END WHERE id=$2 AND company_id=$3 RETURNING *',[req.body?.archived!==false,req.params.id,req.user.company_id]);if(!r.rows[0])return res.status(404).json({error:'Klijent nije pronađen.'});res.json(r.rows[0])}catch(e){res.status(500).json({error:'Arhiviranje klijenta nije uspjelo.'})}});
app.use('/api/clients', requireAuth, crud('clients', { type: 'Fizičko lice', status: 'Aktivan', address: '', postal_code:'', archived:false, note: '', jobs: 0, value: '0,00 €' }));
app.post('/api/jobs',requireAuth,async(req,res)=>{try{const data={priority:'Standardno',status:'Zakazano',city:'',amount:'—',...stripId(req.body),company_id:req.user.company_id};if(!String(data.client||'').trim()||!String(data.service||'').trim()||!String(data.worker||'').trim())return res.status(400).json({error:'Klijent, vrsta usluge i radnik su obavezni.'});const seq=await pool.query('SELECT COALESCE(MAX(id),0)+1 n FROM jobs WHERE company_id=$1',[req.user.company_id]);if(!data.no)data.no=`P-${String(seq.rows[0].n).padStart(4,'0')}`;const cols=Object.keys(data);const vals=Object.values(data);const placeholders=cols.map(function(_,i){return '$'+(i+1)}).join(',');const r=await pool.query(`INSERT INTO jobs (${cols.join(',')}) VALUES (${placeholders}) RETURNING *`,vals);const saved=r.rows[0];await createCompanyNotification(req.user.company_id,{type:'job',title:'Novi posao je kreiran',message:`${saved.client} · ${saved.service} · ${saved.date||''} ${saved.time||''}`.trim(),targetPage:'Poslovi',targetId:saved.id});res.status(201).json(saved)}catch(e){console.error(e);res.status(500).json({error:'Posao nije sačuvan. Provjerite podatke i pokušajte ponovo.'})}});
app.use('/api/jobs', requireAuth, crud('jobs', { priority: 'Standardno', status: 'Zakazano', city: '', amount: '—' }));

function documentCrud(table, type) {
  const router = express.Router();
  const isOffer = type === 'offer';
  const allowed = isOffer ? ['client', 'date', 'valid', 'status', 'amount', 'items', 'note', 'subtotal', 'tax_rate', 'tax_amount', 'total', 'currency'] : ['client', 'issued', 'due', 'status', 'amount', 'paid', 'items', 'note', 'subtotal', 'tax_rate', 'tax_amount', 'total', 'currency'];
  const clean = body => { const out = {}; for (const k of allowed) if (body[k] !== undefined) out[k] = body[k]; if (out.items !== undefined) out.items = JSON.stringify(Array.isArray(out.items) ? out.items : []); for (const k of ['subtotal', 'tax_rate', 'tax_amount', 'total']) if (out[k] !== undefined) out[k] = Number(out[k]) || 0; return out; };
  router.get('/', async (req, res) => { try { const r = await pool.query(`SELECT * FROM ${table} WHERE company_id=$1 ORDER BY id DESC`, [req.user.company_id]); res.json(r.rows); } catch (e) { console.error(e); res.status(500).json({ error: `${isOffer ? 'Ponude' : 'Račune'} nije moguće učitati.` }); } });
  router.post('/', async (req, res) => {
    const client = await pool.connect();
    try {
      const data = clean(req.body || {});
      if (!String(data.client || '').trim()) return res.status(400).json({ error: 'Klijent je obavezan.' });
      if (!Array.isArray(req.body?.items) || !req.body.items.length) return res.status(400).json({ error: 'Dokument mora imati najmanje jednu stavku.' });
      await client.query('BEGIN');
      const settings = await client.query('SELECT invoice_prefix,offer_prefix FROM company_settings WHERE company_id=$1', [req.user.company_id]);
      const prefix = isOffer ? (settings.rows[0]?.offer_prefix || 'PN-') : (settings.rows[0]?.invoice_prefix || 'R-');
      const seq = await client.query(`SELECT COALESCE(MAX(id),0)+1 AS n FROM ${table} WHERE company_id=$1`, [req.user.company_id]);
      data.no = `${prefix}${String(seq.rows[0].n).padStart(4, '0')}`;
      if (!data.status) data.status = 'Nacrt';
      if (isOffer && data.status==='Poslata') data.sent_at=new Date();
      if (!isOffer && !data.paid) data.paid = '0,00 €';
      const payload = { ...data, company_id: req.user.company_id };
      const cols = Object.keys(payload), vals = Object.values(payload);
      const placeholders = cols.map((_, i) => `$${i + 1}`).join(',');
      const r = await client.query(`INSERT INTO ${table} (${cols.join(',')}) VALUES (${placeholders}) RETURNING *`, vals);
      await client.query('COMMIT');
      const saved = r.rows[0];
      await createCompanyNotification(req.user.company_id, { type: isOffer ? 'offer' : 'payment', title: isOffer ? 'Nova ponuda je kreirana' : 'Novi račun je kreiran', message: `${saved.no} · ${saved.client} · ${saved.amount || ''}`, targetPage: isOffer ? 'Ponude' : 'Računi', targetId: saved.id, preference: isOffer ? 'notify_status_change' : 'notify_payment' });
      res.status(201).json(saved);
    } catch (e) { await client.query('ROLLBACK'); console.error(e); res.status(500).json({ error: `${isOffer ? 'Ponuda' : 'Račun'} nije sačuvan. Provjerite podatke i pokušajte ponovo.` }); } finally { client.release(); }
  });
  router.put('/:id', async (req, res) => {
    try {
      const data = clean(req.body || {});
      if(isOffer&&data.status==='Poslata'){const current=await pool.query('SELECT sent_at FROM offers WHERE id=$1 AND company_id=$2',[req.params.id,req.user.company_id]);if(!current.rows[0]?.sent_at)data.sent_at=new Date()}
      if (!Object.keys(data).length) return res.status(400).json({ error: 'Nema izmjena za sačuvati.' });
      if (data.client !== undefined && !String(data.client).trim()) return res.status(400).json({ error: 'Klijent je obavezan.' });
      const cols = Object.keys(data), vals = Object.values(data);
      const setSql = cols.map((k, i) => `${k}=$${i + 1}`).join(',');
      const idParam = `$${cols.length + 1}`, companyParam = `$${cols.length + 2}`;
      const r = await pool.query(`UPDATE ${table} SET ${setSql} WHERE id=${idParam} AND company_id=${companyParam} RETURNING *`, [...vals, req.params.id, req.user.company_id]);
      if (!r.rows[0]) return res.status(404).json({ error: 'Dokument nije pronađen.' });
      res.json(r.rows[0]);
    } catch (e) { console.error(e); res.status(500).json({ error: `Izmjena ${isOffer ? 'ponude' : 'računa'} nije uspjela.` }); }
  });
  router.delete('/:id', async (req, res) => { try { const r = await pool.query(`DELETE FROM ${table} WHERE id=$1 AND company_id=$2 RETURNING id`, [req.params.id, req.user.company_id]); if (!r.rows[0]) return res.status(404).json({ error: 'Dokument nije pronađen.' }); res.json({ ok: true }); } catch (e) { console.error(e); res.status(500).json({ error: `Brisanje ${isOffer ? 'ponude' : 'računa'} nije uspjelo.` }); } });
  return router;
}
app.use('/api/offers', requireAuth, documentCrud('offers', 'offer'));
app.use('/api/invoices', requireAuth, documentCrud('invoices', 'invoice'));
app.use('/api/stock', requireAuth, crud('stock', { unit: 'kom', buy: '0,00 €', sell: '0,00 €', category: 'Ostalo' }));
app.use('/api/maintenance', requireAuth, crud('maintenance', {}));

// ---------- Podsjetnici za račune i ponude ----------
const canSendReminder=user=>['Administrator','Kancelarija','Menadžer','Platform Owner'].includes(user?.role);
const parseMoneyValue=v=>{const raw=String(v||'').replace(/[^0-9,.-]/g,'');const n=Number(raw.includes(',')?raw.replace(/\./g,'').replace(',','.'):raw);return Number.isFinite(n)?n:0};
async function reminderContext(companyId,type,id){
 const table=type==='invoice'?'invoices':type==='offer'?'offers':null;if(!table)return null;
 const r=await pool.query(`SELECT d.*,c.contact client_contact,c.email client_email,cs.company_name,cs.email company_email FROM ${table} d LEFT JOIN clients c ON c.company_id=d.company_id AND lower(c.name)=lower(d.client) LEFT JOIN company_settings cs ON cs.company_id=d.company_id WHERE d.id=$1 AND d.company_id=$2`,[id,companyId]);
 const row=r.rows[0];if(!row)return null;
 if(type==='invoice'){row.remaining=Math.max(0,parseMoneyValue(row.total||row.amount)-parseMoneyValue(row.paid));row.signature=row.company_name||row.company_email||'Vaš poslovni partner'}
 else row.signature=row.company_name||row.company_email||'Vaš poslovni partner';return row;
}
app.get('/api/reminders/prepare/:type/:id',requireAuth,async(req,res)=>{try{if(!canSendReminder(req.user))return res.status(403).json({error:'Nemate pravo slanja podsjetnika.'});const ctx=await reminderContext(req.user.company_id,req.params.type,req.params.id);if(!ctx)return res.status(404).json({error:'Zapis nije pronađen.'});const type=req.params.type;if(type==='invoice'&&(ctx.status==='Plaćen'||ctx.remaining<=0))return res.status(409).json({error:'Račun više nema preostali dug.'});if(type==='offer'&&ctx.status!=='Poslata')return res.status(409).json({error:'Ponuda više ne čeka odgovor.'});const subject=type==='invoice'?`Podsjetnik za račun ${ctx.no}`:`Podsjetnik za ponudu ${ctx.no}`;const message=type==='invoice'?`Poštovani ${ctx.client_contact||ctx.client},\n\nljubazno vas podsjećamo na račun ${ctx.no}, s rokom dospijeća ${ctx.due}. Preostali iznos za uplatu je ${ctx.remaining.toFixed(2)} EUR.\n\nMolimo vas da provjerite status uplate.\n\nSrdačan pozdrav,\n${ctx.signature}`:`Poštovani ${ctx.client_contact||ctx.client},\n\nželimo provjeriti jeste li imali priliku pregledati ponudu ${ctx.no}, poslanu ${ctx.sent_at?new Date(ctx.sent_at).toLocaleDateString('bs-BA'):'—'}.\n\nStojimo vam na raspolaganju za pitanja ili dodatna pojašnjenja.\n\nSrdačan pozdrav,\n${ctx.signature}`;const savedDraft=await pool.query(`SELECT recipient_name,recipient_email,subject,message,updated_at FROM reminder_drafts WHERE company_id=$1 AND record_type=$2 AND record_id=$3 AND status='draft' ORDER BY updated_at DESC LIMIT 1`,[req.user.company_id,type,ctx.id]);const previous=savedDraft.rows[0];res.json({record_type:type,record_id:ctx.id,record_no:ctx.no,record_status:ctx.status,recipient_name:previous?.recipient_name||ctx.client_contact||ctx.client,recipient_email:previous?.recipient_email||ctx.client_email||'',subject:previous?.subject||subject,message:previous?.message||message,draft_updated_at:previous?.updated_at||null,snapshot:type==='invoice'?{remaining:ctx.remaining,due:ctx.due,status:ctx.status}:{sent_at:ctx.sent_at,status:ctx.status},smtp_configured:!!(process.env.SMTP_HOST&&process.env.SMTP_USER&&process.env.SMTP_PASS)})}catch(e){console.error(e);res.status(500).json({error:'Podsjetnik nije moguće pripremiti.'})}});
app.post('/api/reminders/draft',requireAuth,async(req,res)=>{try{if(!canSendReminder(req.user))return res.status(403).json({error:'Nemate pravo pripreme podsjetnika.'});const b=req.body||{};const ctx=await reminderContext(req.user.company_id,b.record_type,b.record_id);if(!ctx)return res.status(404).json({error:'Zapis nije pronađen.'});const r=await pool.query(`INSERT INTO reminder_drafts(company_id,created_by,record_type,record_id,recipient_name,recipient_email,subject,message,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,'draft') RETURNING *`,[req.user.company_id,req.user.id,b.record_type,b.record_id,String(b.recipient_name||''),normalizeEmail(b.recipient_email),String(b.subject||''),String(b.message||'')]);await workspaceAudit(req,'reminder.draft.saved',{record_type:b.record_type,record_id:b.record_id,recipient_email:b.recipient_email});res.status(201).json(r.rows[0])}catch(e){console.error(e);res.status(500).json({error:'Nacrt nije sačuvan.'})}});
app.post('/api/reminders/send',requireAuth,async(req,res)=>{try{if(!canSendReminder(req.user))return res.status(403).json({error:'Nemate pravo slanja podsjetnika.'});const b=req.body||{},email=normalizeEmail(b.recipient_email);if(!email||!email.includes('@'))return res.status(400).json({error:'Unesite ispravnu email adresu primaoca.'});if(!String(b.subject||'').trim()||!String(b.message||'').trim())return res.status(400).json({error:'Predmet i sadržaj poruke su obavezni.'});const ctx=await reminderContext(req.user.company_id,b.record_type,b.record_id);if(!ctx)return res.status(404).json({error:'Zapis nije pronađen.'});if(b.record_type==='invoice'){if(ctx.status==='Plaćen'||ctx.remaining<=0)return res.status(409).json({error:'Račun je u međuvremenu plaćen.',changed:true,current:{remaining:ctx.remaining,status:ctx.status}});if(Number(b.snapshot?.remaining)!==Number(ctx.remaining)||b.snapshot?.status!==ctx.status)return res.status(409).json({error:'Status ili preostali dug računa se promijenio. Pregledajte poruku ponovo.',changed:true,current:{remaining:ctx.remaining,status:ctx.status,due:ctx.due}})}else if(ctx.status!=='Poslata'||b.snapshot?.status!==ctx.status)return res.status(409).json({error:'Status ponude se promijenio. Pregledajte poruku ponovo.',changed:true,current:{status:ctx.status,sent_at:ctx.sent_at}});const key=String(b.idempotency_key||'');if(!key)return res.status(400).json({error:'Nedostaje identifikator zahtjeva.'});const existing=await pool.query('SELECT * FROM reminder_drafts WHERE idempotency_key=$1',[key]);if(existing.rows[0])return res.status(existing.rows[0].status==='sent'?200:409).json(existing.rows[0].status==='sent'?{sent:true,duplicate:true}:{error:'Ovaj zahtjev se već obrađuje.'});const log=await pool.query(`INSERT INTO reminder_drafts(company_id,created_by,record_type,record_id,recipient_name,recipient_email,subject,message,status,idempotency_key) VALUES($1,$2,$3,$4,$5,$6,$7,$8,'sending',$9) RETURNING id`,[req.user.company_id,req.user.id,b.record_type,b.record_id,String(b.recipient_name||''),email,String(b.subject),String(b.message),key]);const mail=await sendSecurityEmail({to:email,subject:String(b.subject),message:String(b.message)});await pool.query(`UPDATE reminder_drafts SET status=$1,sent_at=CASE WHEN $1='sent' THEN now() ELSE NULL END,outcome=$2,provider_message=$3,updated_at=now() WHERE id=$4`,[mail.delivered?'sent':'failed',mail.delivered?'Uspješno poslano':'Slanje nije uspjelo',mail.reason||'',log.rows[0].id]);await workspaceAudit(req,'reminder.send',{record_type:b.record_type,record_id:b.record_id,recipient_email:email,delivered:mail.delivered});if(!mail.delivered)return res.status(503).json({error:mail.reason||'Email servis nije podešen.',draft_saved:true,smtp_configured:false});res.json({sent:true,sent_at:new Date().toISOString()})}catch(e){console.error(e);res.status(500).json({error:'Slanje podsjetnika nije uspjelo. Tekst poruke je sačuvan.'})}});

// ---------- PDF generisanje (pravi PDF fajlovi, ne print-preview) ----------
function brandHeader(doc, title) {
  doc.fillColor('#111a3f').fontSize(20).font('Helvetica-Bold').text('TeloPak', { continued: true }).fillColor('#ef1470').text('Flux');
  doc.fillColor('#6b7a8d').fontSize(9).font('Helvetica').text('Cijeli posao. Na jednom mjestu.');
  doc.moveDown(1.3);
  doc.fillColor('#111a3f').fontSize(16).font('Helvetica-Bold').text(title);
  doc.moveDown(0.8);
  doc.fillColor('#000').font('Helvetica');
}
function kv(doc, label, value) {
  doc.fontSize(10).fillColor('#6b7a8d').text(label, { continued: true }).fillColor('#1c2b3d').text(`  ${value ?? '—'}`);
  doc.moveDown(0.35);
}

app.get('/api/pdf/invoice/:id', requireAuth, async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM invoices WHERE id=$1 AND company_id=$2', [req.params.id, req.user.company_id]);
    const inv = r.rows[0];
    if (!inv) return res.status(404).json({ error: 'Račun nije pronađen.' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="racun-${inv.no || inv.id}.pdf"`);
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);
    brandHeader(doc, `Račun ${inv.no || ''}`);
    const companySettings = await pool.query('SELECT * FROM company_settings WHERE company_id=$1', [req.user.company_id]);
    const cfg = companySettings.rows[0] || {};
    if (cfg.company_name) kv(doc, 'Izdavalac:', cfg.company_name);
    if (cfg.tax_id) kv(doc, 'PDV broj:', cfg.tax_id);
    kv(doc, 'Klijent:', inv.client);
    kv(doc, 'Datum izdavanja:', inv.issued);
    kv(doc, 'Rok plaćanja:', inv.due);
    kv(doc, 'Status:', inv.status);
    doc.moveDown(0.6);
    doc.fontSize(13).fillColor('#111a3f').font('Helvetica-Bold').text(`Ukupan iznos: ${inv.amount || '—'}`);
    doc.fontSize(11).fillColor('#1c2b3d').font('Helvetica').text(`Uplaćeno: ${inv.paid || '0,00 €'}`);
    doc.moveDown(2);
    doc.fontSize(9).fillColor('#8896a6').text(cfg.document_note || 'Hvala na ukazanom povjerenju. Molimo izvršite uplatu do naznačenog roka.');
    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Generisanje PDF-a nije uspjelo.' });
  }
});

app.get('/api/pdf/offer/:id', requireAuth, async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM offers WHERE id=$1 AND company_id=$2', [req.params.id, req.user.company_id]);
    const off = r.rows[0];
    if (!off) return res.status(404).json({ error: 'Ponuda nije pronađena.' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="ponuda-${off.no || off.id}.pdf"`);
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);
    brandHeader(doc, `Ponuda ${off.no || ''}`);
    const companySettings = await pool.query('SELECT * FROM company_settings WHERE company_id=$1', [req.user.company_id]);
    const cfg = companySettings.rows[0] || {};
    if (cfg.company_name) kv(doc, 'Izdavalac:', cfg.company_name);
    if (cfg.tax_id) kv(doc, 'PDV broj:', cfg.tax_id);
    kv(doc, 'Klijent:', off.client);
    kv(doc, 'Datum ponude:', off.date);
    kv(doc, 'Važi do:', off.valid);
    kv(doc, 'Status:', off.status);
    doc.moveDown(0.6);
    doc.fontSize(13).fillColor('#111a3f').font('Helvetica-Bold').text(`Ukupan iznos: ${off.amount || '—'}`);
    doc.moveDown(2);
    doc.fontSize(9).fillColor('#8896a6').text(cfg.document_note || 'Ponuda vrijedi do naznačenog datuma. Za sva pitanja slobodno nas kontaktirajte.');
    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Generisanje PDF-a nije uspjelo.' });
  }
});

// ---------- Email slanje (radi sa pravim SMTP-om ako je podešen, inače simulira) ----------
app.post('/api/email/send', requireAuth, async (req, res) => {
  const { to, subject, message } = req.body || {};
  if (!to || !subject) return res.status(400).json({ error: 'Polja "to" i "subject" su obavezna.' });

  const hasSmtp = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
  if (!hasSmtp) {
    console.log('[EMAIL SIMULACIJA — SMTP nije podešen]', { to, subject, message });
    return res.json({ sent: false, simulated: true, note: 'SMTP nije podešen u OctaCloud postavkama, pa je email zabilježen u serverskim logovima umjesto stvarno poslan.' });
  }
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to, subject, text: message || ''
    });
    res.json({ sent: true, simulated: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Slanje emaila nije uspjelo.' });
  }
});

// ---------- Serviranje frontenda (SPA) ----------
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Ruta nije pronađena.' });
  res.sendFile(path.join(distPath, 'index.html'));
});

const port = parseInt(process.env.PORT, 10) || 3000;
app.listen(port, '0.0.0.0', () => {
  console.log(`TeloPak Flux server sluša na portu ${port}`);
});
