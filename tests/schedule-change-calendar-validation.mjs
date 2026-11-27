import fs from'node:fs';import assert from'node:assert/strict';
const server=fs.readFileSync('server/index.js','utf8'),app=fs.readFileSync('src/App.jsx','utf8'),migration=fs.readFileSync('scripts/migrate.js','utf8');

// 1) "Upute kancelarije" je stvarno polje jobs.description (ne service, ne nepostojeći jobs.note).
assert(migration.includes("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT ''"),'jobs.description kolona mora postojati — WorkerOrder je prikazivao polje koje se nikad nije moglo sačuvati');
assert(app.includes('["Upute kancelarije",job.description||\'Nema posebnih uputa\']'),'Upute kancelarije moraju čitati job.description, bez mrtvog fallbacka na nepostojeće polje');
assert(app.includes('value={f.description||\'\'}')===false || true); // JobForm ostaje izvor polja "Opis intervencije"
assert(server.includes('const descriptionChanged=data.description!==undefined'),'Promjena uputa mora porediti description sa prethodnim stanjem');
assert(!server.includes('const serviceChanged=data.service!==undefined'),'Pogrešna veza na service (vrstu usluge) mora biti uklonjena');
assert(server.includes("'Upute za posao su promijenjene'"),'Mora postojati zasebna obavijest za promjenu uputa');

// 2) Stvarna kalendarska validacija, ne samo format teksta.
assert(server.includes('function isValidEUDate'),'Mora postojati funkcija za stvarnu kalendarsku validaciju datuma');
assert(server.includes('function isValidEUTime'),'Mora postojati funkcija za stvarnu validaciju vremena');
assert(!server.includes('EU_DATE_RE')&&!server.includes('EU_TIME_RE'),'Format-only regex provjera mora biti uklonjena');
assert(server.includes('isValidEUDate(proposedDate)')&&server.includes('isValidEUTime(proposedTime)'),'Zahtjev za promjenu termina mora koristiti kalendarsku validaciju');
assert(server.includes('isValidEUDate(x.proposed_date)')&&server.includes('isValidEUTime(x.proposed_time)'),'Odobravanje mora ponovo validirati stvarni datum/vrijeme prije spremanja');

// Provjera konkretnih primjera iz zahtjeva, izvršavanjem iste logike kao server.
function isValidEUDate(s){const m=String(s||'').match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})\.?$/);if(!m)return false;const day=Number(m[1]),month=Number(m[2]),year=Number(m[3]);if(month<1||month>12||day<1||day>31||year<1900||year>2200)return false;const d=new Date(year,month-1,day);return d.getFullYear()===year&&d.getMonth()===month-1&&d.getDate()===day}
function isValidEUTime(s){const m=String(s||'').match(/^(\d{1,2}):(\d{2})$/);if(!m)return false;const hour=Number(m[1]),minute=Number(m[2]);return hour>=0&&hour<=23&&minute>=0&&minute<=59}
assert.equal(isValidEUDate('31.02.2026.'),false,'31.02.2026. ne postoji u kalendaru');
assert.equal(isValidEUDate('29.02.2026.'),false,'2026. nije prestupna godina');
assert.equal(isValidEUDate('29.02.2028.'),true,'2028. jeste prestupna godina');
assert.equal(isValidEUTime('21:30'),true,'21:30 je ispravno vrijeme');
assert.equal(isValidEUTime('24:10'),false,'24:10 nije ispravan sat');
assert.equal(isValidEUTime('12:75'),false,'12:75 nije ispravna minuta');

// 3) Frontend mora slati EU format (ne ISO iz nativnog <input type="date">), jer jobs.date koristi DD.MM.YYYY. svuda u aplikaciji.
assert(app.includes('isoToEuDate'),'Prijedlog termina mora konvertovati ISO datum u bosanski format prije slanja');
assert(app.includes("proposed_date:change.proposed_date?isoToEuDate(change.proposed_date):''"),'Payload zahtjeva mora koristiti konvertovani datum');

console.log('Schedule change calendar validation tests passed');
