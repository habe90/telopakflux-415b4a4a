// Stvarna E2E provjera izolacije firmi preko servera za pregled klijenta.
// NE simulira rezultat — stvarno pokreće server, pravu autentifikaciju (login + email OTP
// preuzet iz lokalnog SMTP sandučića, bez slanja stvarnim osobama) i dvije stvarne HTTP rute.
//
// POKRETANJE (potrebna IZOLOVANA, praznu/testna Postgres baza — NIKAD produkcija):
//   DATABASE_URL="postgresql://user:pass@host:5432/telopak_test" node tests/e2e-tenant-isolation-live.mjs
//
// Skripta: pokreće migracije nad tom bazom, seeduje firme A/B + klijente + Kancelarija nalog,
// pokreće stvarni Express server iz server/index.js na slobodnom portu, loguje se kroz
// /api/auth/login + /api/auth/login/verify (OTP kod hvata lokalni SMTP catcher na 127.0.0.1),
// pa istom sesijom poziva GET /api/clients/:id/card za klijenta firme A i firme B.
// Na kraju briše seed podatke (CASCADE) i zatvara konekcije.

import { spawn } from 'node:child_process';
import net from 'node:net';
import crypto from 'node:crypto';

const results = [];
function record(name, expected, actual, pass) {
  results.push({ name, expected, actual, status: pass ? 'PROŠLO' : 'NIJE PROŠLO' });
  console.log(`[${pass ? 'PROŠLO' : 'NIJE PROŠLO'}] ${name} — očekivano: ${expected} | stvarno: ${actual}`);
}

function printTableAndExit(code) {
  console.log('\n| Provjera | Očekivani rezultat | Stvarni rezultat | Status |');
  console.log('|---|---|---|---|');
  for (const r of results) console.log(`| ${r.name} | ${r.expected} | ${r.actual} | ${r.status} |`);
  process.exit(code);
}

if (!process.env.DATABASE_URL) {
  console.error('NIJE TESTIRANO: DATABASE_URL nije postavljen. Ovaj test traži IZOLOVANU test Postgres bazu.');
  console.error('Primjer pokretanja: DATABASE_URL="postgresql://user:pass@host:5432/telopak_test" node tests/e2e-tenant-isolation-live.mjs');
  record('Priprema izolovane test baze', 'DATABASE_URL postavljen na praznu test bazu', 'DATABASE_URL nije postavljen u ovom okruženju', false);
  printTableAndExit(1);
}

async function freePort() {
  return await new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, '127.0.0.1', () => { const p = srv.address().port; srv.close(() => resolve(p)); });
    srv.on('error', reject);
  });
}

function run(cmd, args, env) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { env: { ...process.env, ...env }, stdio: 'pipe' });
    let out = '', err = '';
    p.stdout.on('data', d => out += d);
    p.stderr.on('data', d => err += d);
    p.on('close', code => code === 0 ? resolve(out) : reject(new Error(err || out || `exit ${code}`)));
  });
}

async function main() {
  // 1) Migracije nad izolovanom test bazom (bez demo seed podataka).
  try {
    await run('node', ['scripts/migrate.js'], { SEED_DEMO_DATA: 'false' });
  } catch (e) {
    record('Migracije nad izolovanom test bazom', 'Migracije uspješno završene', `Greška: ${e.message.slice(0, 300)}`, false);
    printTableAndExit(1);
  }

  const pg = await import('pg');
  const seedPool = new pg.default.Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_URL.includes('sslmode=require') ? { rejectUnauthorized: false } : false });
  const { hashPassword } = await import('../server/auth.js');

  const stamp = Date.now();
  const emailA = `kancelarija.a.${stamp}@test.local`;
  const password = `Tes!tPass${stamp}Ab`;
  let companyAId, companyBId, clientAId, clientBId, officeUserId;

  try {
    const cA = await seedPool.query(`INSERT INTO companies(name,industry,address,postal_code,city,country) VALUES($1,'Testna djelatnost','Ulica A 1','75000','Paris','France') RETURNING id`, [`Firma A Test ${stamp}`]);
    const cB = await seedPool.query(`INSERT INTO companies(name,industry,address,postal_code,city,country) VALUES($1,'Testna djelatnost','Ulica B 1','75000','Paris','France') RETURNING id`, [`Firma B Test ${stamp}`]);
    companyAId = cA.rows[0].id; companyBId = cB.rows[0].id;

    const clA = await seedPool.query(`INSERT INTO clients(company_id,name,type,status,address,postal_code,city,country) VALUES($1,$2,'Fizičko lice','Aktivan','Probna adresa A','75000','Paris','France') RETURNING id,name`, [companyAId, `Probni klijent A ${stamp}`]);
    const clB = await seedPool.query(`INSERT INTO clients(company_id,name,type,status,address,postal_code,city,country) VALUES($1,$2,'Fizičko lice','Aktivan','Probna adresa B','75000','Paris','France') RETURNING id,name`, [companyBId, `Probni klijent B ${stamp}`]);
    clientAId = clA.rows[0].id; clientBId = clB.rows[0].id;

    const pwHash = await hashPassword(password);
    const u = await seedPool.query(`INSERT INTO app_users(company_id,name,email,password_hash,role,status,email_verified) VALUES($1,'Test Kancelarija',$2,$3,'Kancelarija','Aktivan',true) RETURNING id`, [companyAId, emailA, pwHash]);
    officeUserId = u.rows[0].id;
    record('Priprema firmi A/B, probnih klijenata i Kancelarija naloga', 'Firme, klijenti i nalog kreirani u test bazi', `company_a=${companyAId} company_b=${companyBId} client_a=${clientAId} client_b=${clientBId} office_user=${officeUserId}`, true);
  } catch (e) {
    record('Priprema testnih podataka', 'Uspješan seed', `Greška: ${e.message}`, false);
    await seedPool.end(); printTableAndExit(1);
  }

  // 2) Lokalni SMTP sandučić — hvata OTP kod, NE šalje stvarnim osobama.
  const { SMTPServer } = await import('smtp-server');
  const inbox = new Map(); // email -> zadnja poruka (tekst)
  const smtpPort = await freePort();
  const smtp = new SMTPServer({
    disabledCommands: ['AUTH'],
    onData(stream, session, cb) {
      let body = '';
      stream.on('data', d => body += d);
      stream.on('end', () => { for (const rcpt of session.envelope.rcptTo) inbox.set(rcpt.address.toLowerCase(), body); cb(); });
    }
  });
  await new Promise((resolve, reject) => smtp.listen(smtpPort, '127.0.0.1', resolve).on?.('error', reject));
  function extractCode(email) {
    const msg = inbox.get(email.toLowerCase()) || '';
    const m = msg.match(/\b(\d{6})\b/);
    return m ? m[1] : null;
  }

  // 3) Pravi Express server (iz server/index.js) na slobodnom portu, ista baza, lokalni SMTP.
  const appPort = await freePort();
  process.env.PORT = String(appPort);
  process.env.SMTP_HOST = '127.0.0.1';
  process.env.SMTP_PORT = String(smtpPort);
  process.env.SMTP_USER = 'test';
  process.env.SMTP_PASS = 'test';
  process.env.SMTP_FROM = 'noreply@test.local';
  await import('../server/index.js');

  const base = `http://127.0.0.1:${appPort}`;
  async function waitReady() {
    for (let i = 0; i < 40; i++) {
      try { const r = await fetch(`${base}/api/health`); if (r.ok) return true; } catch {}
      await new Promise(r => setTimeout(r, 250));
    }
    return false;
  }
  const ready = await waitReady();
  record('Pokretanje stvarnog servera za test', 'Server odgovara na /api/health', ready ? 'Server je spreman' : 'Server nije odgovorio na vrijeme', ready);
  if (!ready) { await seedPool.end(); printTableAndExit(1); }

  let sessionCookie = null;
  try {
    // Korak 1: login — server šalje OTP kod e-mailom (lokalni sandučić, ne stvarnoj osobi).
    const loginRes = await fetch(`${base}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: emailA, password }) });
    const loginBody = await loginRes.json();
    const otpOk = loginRes.status === 200 && loginBody.requiresOtp === true;
    record('Prijava Kancelarija naloga kroz pravu autentifikaciju (korak 1 — lozinka)', 'HTTP 200, traži OTP kod e-mailom', `HTTP ${loginRes.status}, requiresOtp=${loginBody.requiresOtp}`, otpOk);
    if (!otpOk) throw new Error('Login (korak 1) nije uspio.');

    await new Promise(r => setTimeout(r, 150)); // kratko čekanje da SMTP catcher primi poruku
    const code = extractCode(emailA);
    record('Preuzimanje OTP koda iz lokalnog testnog sandučića', 'Šestocifreni kod pronađen u lokalnoj poruci', code ? `Kod pronađen: ${code}` : 'Kod nije pronađen u lokalnom sandučiću', !!code);
    if (!code) throw new Error('OTP kod nije preuzet iz lokalnog sandučića.');

    // Korak 2: potvrda koda — server postavlja sesijski kolačić.
    const verifyRes = await fetch(`${base}/api/auth/login/verify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: emailA, code }) });
    const setCookie = verifyRes.headers.get('set-cookie') || '';
    sessionCookie = setCookie.split(';')[0] || null;
    const verifyOk = verifyRes.status === 200 && !!sessionCookie;
    record('Potvrda OTP koda (korak 2 — sesija)', 'HTTP 200, sesijski kolačić postavljen', `HTTP ${verifyRes.status}, kolačić ${sessionCookie ? 'postavljen' : 'nije postavljen'}`, verifyOk);
    if (!verifyOk) throw new Error('Login (korak 2) nije uspio.');
  } catch (e) {
    console.error('Prijava nije uspjela:', e.message);
  }

  if (sessionCookie) {
    // 4) Ista sesija: pregled klijenta firme A (očekuje se 200 i ispravan klijent).
    const resA = await fetch(`${base}/api/clients/${clientAId}/card`, { headers: { Cookie: sessionCookie } });
    const bodyA = await resA.json().catch(() => ({}));
    const okA = resA.status === 200 && bodyA?.client?.id === clientAId && bodyA?.client?.name?.startsWith('Probni klijent A');
    record('Pregled klijenta firme A (ista sesija, ista firma)', 'HTTP 200 i ispravan probni klijent A', `HTTP ${resA.status}, client.name=${bodyA?.client?.name ?? '—'}`, okA);

    // 5) Ista sesija: pokušaj pregleda klijenta firme B (očekuje se 403/404, bez podataka).
    const resB = await fetch(`${base}/api/clients/${clientBId}/card`, { headers: { Cookie: sessionCookie } });
    const bodyB = await resB.json().catch(() => ({}));
    const statusBlocked = resB.status === 403 || resB.status === 404;
    const noLeak = !bodyB?.client && !bodyB?.contact && !bodyB?.name;
    const okB = statusBlocked && noLeak;
    record('Pokušaj pregleda klijenta firme B (ista sesija firme A)', 'HTTP 403 ili 404, bez imena/kontakta klijenta B', `HTTP ${resB.status}, tijelo=${JSON.stringify(bodyB).slice(0, 200)}`, okB);
  } else {
    record('Pregled klijenta firme A (ista sesija, ista firma)', 'HTTP 200 i ispravan probni klijent A', 'Nije izvršeno — prijava nije uspjela', false);
    record('Pokušaj pregleda klijenta firme B (ista sesija firme A)', 'HTTP 403 ili 404, bez imena/kontakta klijenta B', 'Nije izvršeno — prijava nije uspjela', false);
  }

  // 6) Čišćenje seed podataka (CASCADE briše korisnika, klijente itd.).
  try {
    await seedPool.query('DELETE FROM companies WHERE id=ANY($1::int[])', [[companyAId, companyBId]]);
    record('Čišćenje testnih podataka nakon provjere', 'Seed firme A/B i sve zavisne zapise obrisane', 'Testne firme i zavisni zapisi obrisani (CASCADE)', true);
  } catch (e) {
    record('Čišćenje testnih podataka nakon provjere', 'Seed firme A/B i sve zavisne zapise obrisane', `Greška pri čišćenju: ${e.message}`, false);
  }

  await seedPool.end();
  try { smtp.close(); } catch {}
  const allPass = results.every(r => r.status === 'PROŠLO');
  printTableAndExit(allPass ? 0 : 1);
}

main().catch(e => { console.error('Neočekivana greška u E2E testu:', e); record('Izvršavanje E2E testa', 'Test završen bez neuhvaćene greške', `Neuhvaćena greška: ${e.message}`, false); printTableAndExit(1); });
