import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';
import nodemailer from 'nodemailer';
import { pool } from './db.js';
import { randomToken, hashToken, generateCode, normalizeEmail, hashPassword, verifyPassword, passwordValid, publicUser, createSession, clearSessionCookie, requireAuth, sendSecurityEmail } from './auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false, message: { error: 'Previše pokušaja. Pokušajte ponovo za 15 minuta.' } });
const strictLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false, message: { error: 'Previše pokušaja. Pokušajte ponovo kasnije.' } });

// ---------- Generic CRUD factory za poslovne tabele ----------
function stripId(obj) {
  const copy = { ...obj };
  delete copy.id;
  delete copy.created_at;
  return copy;
}

function crud(table, defaults = {}) {
  const router = express.Router();

  router.get('/', async (req, res) => {
    try {
      const r = await pool.query(`SELECT * FROM ${table} ORDER BY id ASC`);
      res.json(r.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: `Ne mogu učitati podatke iz tabele ${table}.` });
    }
  });

  router.post('/', async (req, res) => {
    try {
      const data = { ...defaults, ...stripId(req.body) };
      const cols = Object.keys(data);
      const vals = Object.values(data);
      const placeholders = cols.map((_, i) => `$${i + 1}`).join(',');
      const r = await pool.query(
        `INSERT INTO ${table} (${cols.join(',')}) VALUES (${placeholders}) RETURNING *`,
        vals
      );
      res.status(201).json(r.rows[0]);
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
      const r = await pool.query(
        `UPDATE ${table} SET ${set} WHERE id=$${cols.length + 1} RETURNING *`,
        [...cols.map(c => data[c]), req.params.id]
      );
      if (!r.rows[0]) return res.status(404).json({ error: 'Zapis nije pronađen.' });
      res.json(r.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: `Ne mogu izmijeniti zapis u ${table}.` });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      await pool.query(`DELETE FROM ${table} WHERE id=$1`, [req.params.id]);
      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: `Ne mogu obrisati zapis iz ${table}.` });
    }
  });

  return router;
}

app.get('/api/health', (req, res) => res.json({ status: 'ok', name: 'TeloPak Flux API' }));

// Dijagnostika SMTP konekcije — ne otkriva lozinku, samo status konekcije. Korisno za
// provjeru da li su env varijable stvarno stigle do kontejnera i da li Zoho prihvata auth.
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
    const { company, industry, workers, name, password } = req.body || {};
    const email = normalizeEmail(req.body?.email);
    if (!company || !name || !email || !passwordValid(password)) return res.status(400).json({ error: 'Popunite sva polja. Lozinka mora imati najmanje 12 znakova, veliko i malo slovo, broj i specijalni znak.' });
    const exists = await pool.query('SELECT id FROM app_users WHERE email=$1', [email]);
    if (exists.rows[0]) return res.status(409).json({ error: 'Nalog sa ovom email adresom već postoji.' });
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const c = await client.query('INSERT INTO companies(name,industry,field_workers) VALUES($1,$2,$3) RETURNING id', [company, industry || '', Math.max(1, Number(workers) || 1)]);
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
    const code = generateCode();
    await pool.query(`UPDATE auth_tokens SET used_at=now() WHERE user_id=$1 AND purpose='login_otp' AND used_at IS NULL`, [user.id]);
    await pool.query(`INSERT INTO auth_tokens(user_id,purpose,token_hash,expires_at) VALUES($1,'login_otp',$2,now()+interval '10 minutes')`, [user.id, hashToken(code)]);
    const mail = await sendSecurityEmail({ to: user.email, subject: 'TeloPak Flux sigurnosni kod', message: `Vaš kod za prijavu je: ${code}\nKod važi 10 minuta. Nikome ga ne prosljeđujte.` });
    res.json({ requiresOtp: true, challenge: hashToken(`${user.id}:${Date.now()}`).slice(0,24), email: user.email, delivered: mail.delivered, deliveryNote: mail.delivered ? null : mail.reason });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Prijava trenutno nije dostupna.' }); }
});
app.post('/api/auth/login/verify', strictLimiter, async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email), code = String(req.body?.code || '');
    const u = await pool.query('SELECT * FROM app_users WHERE email=$1 AND status=$2', [email, 'Aktivan']);
    if (!u.rows[0]) return res.status(401).json({ error: 'Kod nije ispravan ili je istekao.' });
    const t = await pool.query(`SELECT * FROM auth_tokens WHERE user_id=$1 AND purpose='login_otp' AND token_hash=$2 AND used_at IS NULL AND expires_at>now() AND attempts<5 ORDER BY id DESC LIMIT 1`, [u.rows[0].id, hashToken(code)]);
    if (!t.rows[0]) return res.status(401).json({ error: 'Kod nije ispravan ili je istekao.' });
    await pool.query('UPDATE auth_tokens SET used_at=now() WHERE id=$1', [t.rows[0].id]);
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
    } catch(e) { await pool.query('ROLLBACK'); throw e; }
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Resetovanje nije uspjelo.' }); }
});
app.get('/api/auth/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));
app.post('/api/auth/logout', requireAuth, async (req, res) => { await pool.query('UPDATE auth_sessions SET revoked_at=now() WHERE id=$1', [req.sessionId]); clearSessionCookie(res); res.json({ ok: true }); });
app.get('/api/auth/sessions', requireAuth, async (req, res) => { const r=await pool.query('SELECT id,user_agent,ip_address,created_at,expires_at FROM auth_sessions WHERE user_id=$1 AND revoked_at IS NULL AND expires_at>now() ORDER BY created_at DESC',[req.user.id]);res.json(r.rows); });
app.delete('/api/auth/sessions/:id', requireAuth, async (req,res)=>{await pool.query('UPDATE auth_sessions SET revoked_at=now() WHERE id=$1 AND user_id=$2',[req.params.id,req.user.id]);res.json({ok:true});});

app.use('/api/clients', requireAuth, crud('clients', { type: 'Fizičko lice', status: 'Aktivan', address: '', note: '', jobs: 0, value: '0,00 €' }));
app.use('/api/jobs', requireAuth, crud('jobs', { priority: 'Standardno', status: 'Zakazano', city: '', amount: '—' }));
app.use('/api/offers', requireAuth, crud('offers', { status: 'Nacrt' }));
app.use('/api/invoices', requireAuth, crud('invoices', { status: 'Nacrt', paid: '0,00 €' }));
app.use('/api/stock', requireAuth, crud('stock', { unit: 'kom', buy: '0,00 €', sell: '0,00 €', category: 'Ostalo' }));
app.use('/api/maintenance', requireAuth, crud('maintenance', {}));

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
    const r = await pool.query('SELECT * FROM invoices WHERE id=$1', [req.params.id]);
    const inv = r.rows[0];
    if (!inv) return res.status(404).json({ error: 'Račun nije pronađen.' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="racun-${inv.no || inv.id}.pdf"`);
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);
    brandHeader(doc, `Račun ${inv.no || ''}`);
    kv(doc, 'Klijent:', inv.client);
    kv(doc, 'Datum izdavanja:', inv.issued);
    kv(doc, 'Rok plaćanja:', inv.due);
    kv(doc, 'Status:', inv.status);
    doc.moveDown(0.6);
    doc.fontSize(13).fillColor('#111a3f').font('Helvetica-Bold').text(`Ukupan iznos: ${inv.amount || '—'}`);
    doc.fontSize(11).fillColor('#1c2b3d').font('Helvetica').text(`Uplaćeno: ${inv.paid || '0,00 €'}`);
    doc.moveDown(2);
    doc.fontSize(9).fillColor('#8896a6').text('Hvala na ukazanom povjerenju. Molimo izvršite uplatu do naznačenog roka.');
    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Generisanje PDF-a nije uspjelo.' });
  }
});

app.get('/api/pdf/offer/:id', requireAuth, async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM offers WHERE id=$1', [req.params.id]);
    const off = r.rows[0];
    if (!off) return res.status(404).json({ error: 'Ponuda nije pronađena.' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="ponuda-${off.no || off.id}.pdf"`);
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);
    brandHeader(doc, `Ponuda ${off.no || ''}`);
    kv(doc, 'Klijent:', off.client);
    kv(doc, 'Datum ponude:', off.date);
    kv(doc, 'Važi do:', off.valid);
    kv(doc, 'Status:', off.status);
    doc.moveDown(0.6);
    doc.fontSize(13).fillColor('#111a3f').font('Helvetica-Bold').text(`Ukupan iznos: ${off.amount || '—'}`);
    doc.moveDown(2);
    doc.fontSize(9).fillColor('#8896a6').text('Ponuda vrijedi do naznačenog datuma. Za sva pitanja slobodno nas kontaktirajte.');
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
