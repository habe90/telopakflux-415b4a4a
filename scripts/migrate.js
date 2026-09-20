import { pool } from '../server/db.js';

const seedClients = [
  { name: 'Novak Stan', type: 'Fizičko lice', contact: 'Novak Hadžić', email: 'novak@email.com', phone: '+387 61 123 456', city: 'Sarajevo', address: 'Titova 12', jobs: 8, value: '2.450,00 €', status: 'Aktivan', note: 'Redovni klijent. Godišnji servis klime.' },
  { name: 'Porodić d.o.o.', type: 'Pravno lice', contact: 'Emir Porodić', email: 'info@porodic.ba', phone: '+387 61 222 333', city: 'Banja Luka', address: 'Kralja Petra I 44', jobs: 14, value: '7.820,00 €', status: 'Aktivan', note: 'Ugovoreno kvartalno održavanje.' },
  { name: 'Kovač d.o.o.', type: 'Pravno lice', contact: 'Milan Kovač', email: 'info@kovac.ba', phone: '+387 63 111 222', city: 'Mostar', address: 'Kneza Branimira 8', jobs: 5, value: '3.180,00 €', status: 'Novi upit', note: 'Traži ponudu za tri poslovnice.' },
  { name: 'Ivanović', type: 'Fizičko lice', contact: 'Maja Ivanović', email: 'maja@email.com', phone: '+387 62 987 654', city: 'Tuzla', address: 'Slatina 16', jobs: 11, value: '4.600,00 €', status: 'Aktivan', note: '' }
];
const seedJobs = [
  { no: 'P-1054', client: 'Porodić d.o.o.', service: 'Servis bojlera', date: '25.03.2025.', time: '08:00', worker: 'Marko Ilić', city: 'Sarajevo', priority: 'Standardno', status: 'U toku', amount: '180,00 €' },
  { no: 'P-1055', client: 'Novak Stan', service: 'Popravka instalacije', date: '25.03.2025.', time: '10:30', worker: 'Ivan Kovač', city: 'Ilidža', priority: 'Standardno', status: 'Zakazano', amount: '120,00 €' },
  { no: 'P-1056', client: 'Kovač d.o.o.', service: 'Montaža klime', date: '25.03.2025.', time: '13:00', worker: 'Petar Jurić', city: 'Vogošća', priority: 'Visoko', status: 'Zakazano', amount: '640,00 €' },
  { no: 'P-1057', client: 'Marić Stan', service: 'Curenje vode', date: '25.03.2025.', time: '15:30', worker: 'Marko Ilić', city: 'Centar', priority: 'Hitno', status: 'Novi', amount: '—' }
];
const seedOffers = [
  { no: 'PN-028', client: 'Kovač d.o.o.', date: '24.03.2025.', valid: '31.03.2025.', amount: '1.850,00 €', status: 'Poslata' },
  { no: 'PN-027', client: 'Novak Stan', date: '22.03.2025.', valid: '29.03.2025.', amount: '750,00 €', status: 'Prihvaćena' },
  { no: 'PN-026', client: 'Marić Stan', date: '20.03.2025.', valid: '27.03.2025.', amount: '350,00 €', status: 'Nacrt' },
  { no: 'PN-025', client: 'Porodić d.o.o.', date: '18.03.2025.', valid: '25.03.2025.', amount: '980,00 €', status: 'Istekla' }
];
const seedInvoices = [
  { no: 'R-041', client: 'Novak Stan', issued: '24.03.2025.', due: '31.03.2025.', amount: '750,00 €', paid: '750,00 €', status: 'Plaćen' },
  { no: 'R-042', client: 'Kovač d.o.o.', issued: '23.03.2025.', due: '30.03.2025.', amount: '1.200,00 €', paid: '0,00 €', status: 'Poslat' },
  { no: 'R-043', client: 'Marić Stan', issued: '14.03.2025.', due: '21.03.2025.', amount: '350,00 €', paid: '0,00 €', status: 'Kasni' },
  { no: 'R-044', client: 'Porodić d.o.o.', issued: '20.03.2025.', due: '27.03.2025.', amount: '450,00 €', paid: '450,00 €', status: 'Plaćen' }
];
const seedStock = [
  { code: 'MAT-001', name: 'Klima uređaj 12K BTU', category: 'Klima oprema', unit: 'kom', stock: 8, min: 3, buy: '480,00 €', sell: '600,00 €', status: 'Dostupno' },
  { code: 'MAT-002', name: 'Bakarna cijev 1/4', category: 'Instalacije', unit: 'm', stock: 42, min: 20, buy: '4,20 €', sell: '7,50 €', status: 'Dostupno' },
  { code: 'MAT-003', name: 'Termostat digitalni', category: 'Grijanje', unit: 'kom', stock: 2, min: 5, buy: '35,00 €', sell: '55,00 €', status: 'Niska zaliha' },
  { code: 'MAT-004', name: 'Ventil kuglasti 1/2', category: 'Vodoinstalacije', unit: 'kom', stock: 0, min: 10, buy: '6,50 €', sell: '12,00 €', status: 'Nema na stanju' }
];
const seedMaintenance = [
  { client: 'Novak Stan', asset: 'Klima uređaj Daikin', service: 'Godišnji servis', next: '15.05.2025.', cycle: '12 mjeseci', worker: 'Ivan Kovač', status: 'Za 50 dana' },
  { client: 'Porodić d.o.o.', asset: 'Bojler Bosch 80L', service: 'Preventivni pregled', next: '20.06.2025.', cycle: '6 mjeseci', worker: 'Marko Ilić', status: 'Za 86 dana' },
  { client: 'Kovač d.o.o.', asset: 'Sistem grijanja', service: 'Servis grijanja', next: '10.09.2025.', cycle: '12 mjeseci', worker: 'Petar Jurić', status: 'Za 168 dana' }
];

async function run() {
  console.log('Pokrećem migracije...');

  await pool.query(`CREATE TABLE IF NOT EXISTS clients (
    id serial PRIMARY KEY, name text, type text, contact text, email text, phone text,
    city text, address text, jobs int DEFAULT 0, value text, status text, note text,
    created_at timestamptz DEFAULT now()
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS jobs (
    id serial PRIMARY KEY, no text, client text, service text, date text, time text,
    worker text, city text, priority text, status text, amount text,
    created_at timestamptz DEFAULT now()
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS offers (
    id serial PRIMARY KEY, no text, client text, date text, valid text, amount text, status text,
    created_at timestamptz DEFAULT now()
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS invoices (
    id serial PRIMARY KEY, no text, client text, issued text, due text, amount text, paid text, status text,
    created_at timestamptz DEFAULT now()
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS stock (
    id serial PRIMARY KEY, code text, name text, category text, unit text, stock int, min int,
    buy text, sell text, status text, created_at timestamptz DEFAULT now()
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS maintenance (
    id serial PRIMARY KEY, client text, asset text, service text, next text, cycle text, worker text, status text,
    created_at timestamptz DEFAULT now()
  )`);

  await pool.query(`CREATE TABLE IF NOT EXISTS companies (
    id serial PRIMARY KEY, name text NOT NULL, industry text, field_workers int DEFAULT 1,
    created_at timestamptz DEFAULT now()
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS app_users (
    id serial PRIMARY KEY, company_id int REFERENCES companies(id) ON DELETE CASCADE,
    name text NOT NULL, email text UNIQUE NOT NULL, phone text DEFAULT '', password_hash text NOT NULL,
    role text NOT NULL DEFAULT 'Administrator', status text NOT NULL DEFAULT 'Aktivan',
    email_verified boolean DEFAULT false, failed_attempts int DEFAULT 0, locked_until timestamptz,
    two_factor_enabled boolean DEFAULT false, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS auth_sessions (
    id bigserial PRIMARY KEY, user_id int REFERENCES app_users(id) ON DELETE CASCADE,
    token_hash text UNIQUE NOT NULL, user_agent text, ip_address text,
    expires_at timestamptz NOT NULL, revoked_at timestamptz, created_at timestamptz DEFAULT now()
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS auth_tokens (
    id bigserial PRIMARY KEY, user_id int REFERENCES app_users(id) ON DELETE CASCADE,
    purpose text NOT NULL, token_hash text NOT NULL, attempts int DEFAULT 0,
    expires_at timestamptz NOT NULL, used_at timestamptz, created_at timestamptz DEFAULT now()
  )`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_auth_sessions_token ON auth_sessions(token_hash)`);
  await pool.query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'Aktivna'`);
  await pool.query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'Trial'`);
  await pool.query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz DEFAULT (now()+interval '14 days')`);
  await pool.query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS monthly_price numeric(10,2) NOT NULL DEFAULT 0`);
  await pool.query(`ALTER TABLE clients ADD COLUMN IF NOT EXISTS company_id int REFERENCES companies(id) ON DELETE CASCADE`);
  await pool.query(`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS company_id int REFERENCES companies(id) ON DELETE CASCADE`);
  await pool.query(`ALTER TABLE offers ADD COLUMN IF NOT EXISTS company_id int REFERENCES companies(id) ON DELETE CASCADE`);
  await pool.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS company_id int REFERENCES companies(id) ON DELETE CASCADE`);
  await pool.query(`ALTER TABLE stock ADD COLUMN IF NOT EXISTS company_id int REFERENCES companies(id) ON DELETE CASCADE`);
  await pool.query(`ALTER TABLE maintenance ADD COLUMN IF NOT EXISTS company_id int REFERENCES companies(id) ON DELETE CASCADE`);
  await pool.query(`CREATE TABLE IF NOT EXISTS platform_audit_log (
    id bigserial PRIMARY KEY, actor_user_id int REFERENCES app_users(id) ON DELETE SET NULL,
    action text NOT NULL, target_type text, target_id text, metadata jsonb DEFAULT '{}'::jsonb,
    ip_address text, created_at timestamptz DEFAULT now()
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS platform_settings (
    id int PRIMARY KEY DEFAULT 1 CHECK (id=1),
    app_name text NOT NULL DEFAULT 'TeloPak Flux',
    tagline text NOT NULL DEFAULT 'Cijeli posao. Na jednom mjestu.',
    support_email text NOT NULL DEFAULT 'podrska@telopak.fr',
    primary_color text NOT NULL DEFAULT '#1769d2',
    logo_data text,
    favicon_data text,
    locale text NOT NULL DEFAULT 'bs-BA',
    registrations_enabled boolean NOT NULL DEFAULT true,
    maintenance_mode boolean NOT NULL DEFAULT false,
    updated_at timestamptz DEFAULT now()
  )`);
  await pool.query(`INSERT INTO platform_settings(id) VALUES(1) ON CONFLICT(id) DO NOTHING`);
  await pool.query(`ALTER TABLE app_users ADD COLUMN IF NOT EXISTS avatar_data text`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_auth_sessions_token ON auth_sessions(token_hash)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_auth_tokens_lookup ON auth_tokens(user_id,purpose,token_hash)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_clients_company ON clients(company_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_offers_company ON offers(company_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_invoices_company ON invoices(company_id)`);
  if (process.env.PLATFORM_OWNER_EMAIL) {
    await pool.query(`UPDATE app_users SET role='Platform Owner' WHERE lower(email)=lower($1)`, [process.env.PLATFORM_OWNER_EMAIL]);
    console.log('Platform Owner uloga je sinhronizovana.');
  }
  console.log('Tabele su spremne.');

  const { rows } = await pool.query('SELECT COUNT(*)::int AS c FROM clients');
  if (rows[0].c === 0) {
    console.log('Baza je prazna — ubacujem početne demo podatke...');
    for (const c of seedClients) {
      await pool.query(
        `INSERT INTO clients (name,type,contact,email,phone,city,address,jobs,value,status,note) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [c.name, c.type, c.contact, c.email, c.phone, c.city, c.address, c.jobs, c.value, c.status, c.note]
      );
    }
    for (const j of seedJobs) {
      await pool.query(
        `INSERT INTO jobs (no,client,service,date,time,worker,city,priority,status,amount) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [j.no, j.client, j.service, j.date, j.time, j.worker, j.city, j.priority, j.status, j.amount]
      );
    }
    for (const o of seedOffers) {
      await pool.query(
        `INSERT INTO offers (no,client,date,valid,amount,status) VALUES ($1,$2,$3,$4,$5,$6)`,
        [o.no, o.client, o.date, o.valid, o.amount, o.status]
      );
    }
    for (const i of seedInvoices) {
      await pool.query(
        `INSERT INTO invoices (no,client,issued,due,amount,paid,status) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [i.no, i.client, i.issued, i.due, i.amount, i.paid, i.status]
      );
    }
    for (const s of seedStock) {
      await pool.query(
        `INSERT INTO stock (code,name,category,unit,stock,min,buy,sell,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [s.code, s.name, s.category, s.unit, s.stock, s.min, s.buy, s.sell, s.status]
      );
    }
    for (const m of seedMaintenance) {
      await pool.query(
        `INSERT INTO maintenance (client,asset,service,next,cycle,worker,status) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [m.client, m.asset, m.service, m.next, m.cycle, m.worker, m.status]
      );
    }
    console.log('Demo podaci su ubačeni.');
  } else {
    console.log('Baza već sadrži podatke — preskačem seed.');
  }

  console.log('Migracije završene.');
  await pool.end();
}

run().catch(err => {
  console.error('Greška prilikom migracije:', err);
  process.exit(1);
});
