import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';
import nodemailer from 'nodemailer';
import { pool } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

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

app.use('/api/clients', crud('clients', { type: 'Fizičko lice', status: 'Aktivan', address: '', note: '', jobs: 0, value: '0,00 €' }));
app.use('/api/jobs', crud('jobs', { priority: 'Standardno', status: 'Zakazano', city: '', amount: '—' }));
app.use('/api/offers', crud('offers', { status: 'Nacrt' }));
app.use('/api/invoices', crud('invoices', { status: 'Nacrt', paid: '0,00 €' }));
app.use('/api/stock', crud('stock', { unit: 'kom', buy: '0,00 €', sell: '0,00 €', category: 'Ostalo' }));
app.use('/api/maintenance', crud('maintenance', {}));

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

app.get('/api/pdf/invoice/:id', async (req, res) => {
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

app.get('/api/pdf/offer/:id', async (req, res) => {
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
app.post('/api/email/send', async (req, res) => {
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
