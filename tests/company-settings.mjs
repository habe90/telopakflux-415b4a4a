import fs from'node:fs';import assert from'node:assert/strict';const ui=fs.readFileSync('src/CompanySettings.jsx','utf8'),server=fs.readFileSync('server/index.js','utf8'),migration=fs.readFileSync('scripts/migrate.js','utf8');
for(const x of ['Francuska','Luksemburg','Belgija','Pravna forma','Trgovački naziv','Puni registrovani naziv','Osnovni kapital (€)','Ime i prezime preduzetnika','Djelatnost','Veličina tima','Uključujući vas','Pregled zaglavlja'])assert(ui.includes(x),`Nedostaje ${x}`);
assert(ui.includes("['SIRET *','14 cifara")&&ui.includes('RCS Luxembourg *')&&ui.includes('Broj preduzeća (BCE/KBO) *'),'Registracijska polja moraju pratiti državu');
assert(server.includes("country=['France','Luxembourg','Belgium']")&&server.includes("registration.slice(0,9)"),'Backend mora validirati državu i izvesti SIREN');
assert(server.includes("String(b.tva_number||'').trim()"),'TVA mora ostati opcionalan bez automatskog oslobođenja');
for(const col of ['legal_form','trade_name','registered_name','share_capital','owner_name','registration_number','siren','industry','team_size'])assert(migration.includes(`company_settings ADD COLUMN IF NOT EXISTS ${col}`),`Nedostaje migracija ${col}`);
assert(ui.includes("setError(e.message)")&&ui.includes("setSaving(false)"),'Forma mora zadržati podatke nakon greške');
console.log('Company settings tests passed');
