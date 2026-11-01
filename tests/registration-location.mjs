import fs from 'node:fs';import assert from 'node:assert/strict';
const auth=fs.readFileSync('src/Auth.jsx','utf8'),server=fs.readFileSync('server/index.js','utf8'),location=fs.readFileSync('src/LocationFields.jsx','utf8');

// 1) Država sjedišta — obavezan izbor, iste tri opcije kao Postavke → Firma
assert(auth.includes('Država sjedišta')&&auth.includes('<option value="France">Francuska</option>')&&auth.includes('<option value="Luxembourg">Luksemburg</option>')&&auth.includes('<option value="Belgium">Belgija</option>'),'Registracija mora nuditi tačno tri države');
assert(auth.includes("errs.country='Država sjedišta je obavezna.'"),'Država mora biti obavezna na klijentu');
assert(server.includes("country = ['France', 'Luxembourg', 'Belgium'].includes(req.body?.country)")&&server.includes("error: 'Država sjedišta je obavezna.', field: 'country'"),'Backend mora zahtijevati državu');

// Reuse iste komponente kao Postavke → Firma
assert(auth.includes('<LocationFields form={f} set={set}'),'Registracija mora koristiti istu pretragu lokacije kao Postavke firme');
assert(auth.includes('<PhoneField form={f} set={set}/>'),'Registracija mora koristiti isto telefonsko polje kao Postavke firme');

// 1) Telefon — automatski pozivni broj po državi, ručna izmjena, bez dupliranja
assert(location.includes("France:'+33',Luxembourg:'+352',Belgium:'+32'"),'Pozivni brojevi moraju odgovarati tabeli');
assert(auth.includes("phone_prefix:hasIntl?x.phone_prefix:countryPrefix(v)"),'Promjena države ne smije prepisati već uneseni međunarodni broj');

// 3) Departman za Francusku — obavezan, suzi pretragu, popuni se iz odabira grada
assert(auth.includes("if(f.country==='France'&&!f.department_code)errs.department_code='Odaberite francuski departman.'"),'Departman mora biti obavezan samo za Francusku');
assert(location.includes("department:form.department_code||''"),'Pretraga mjesta mora se suziti na odabrani departman');
assert(location.includes('set(\'department_code\',x.department_code);set(\'department_name\',d?.name||\'\')'),'Odabir grada mora automatski popuniti departman');
assert(location.includes("country==='France'&&<label"),'Departman se prikazuje samo za Francusku');

// 2) Registracijski broj — po državi, SIRET/RCS/BCE validacija
assert(server.includes("function validateRegistrationNumber(country, raw)"),'Backend mora imati validaciju registracijskog broja po državi');
assert(server.includes("registration.slice(0, 9)"),'SIREN se mora izvoditi iz prvih 9 cifara SIRET-a');
assert(server.includes("/^B\\d{6,8}$/.test(registration)"),'Luksemburški RCS broj mora biti validiran');
assert(server.includes("/^0?\\d{9,10}$/.test(registration.replace(/[.-]/g, ''))"),'Belgijski broj preduzeća mora biti validiran');
assert(auth.includes("if(country==='Luxembourg')return/^B\\d{6,8}$/.test(v)"),'Klijentska validacija mora pratiti državu');

// 4) Promjena države i čuvanje — lokacijski izbori se brišu, department_code/postal_code idu kao tekst
assert(auth.includes("return{...x,country:v,city:'',postal_code:'',department_code:'',department_name:'',registration_number:'',location_verified:false"), 'Promjena države mora ukloniti prethodne lokacijske izbore');
assert(server.includes('department_code text NOT NULL')===false || fs.readFileSync('scripts/migrate.js','utf8').includes('department_code text NOT NULL'),'Šifra departmana mora biti tekstualna (zbog 2A/2B)');
assert(fs.readFileSync('scripts/migrate.js','utf8').includes('postal_code text'),'Poštanski broj mora biti tekstualan (zbog početnih nula)');

// Registracija šalje prikupljene podatke serveru i čuva ih u company_settings (vidljivo u Postavke → Firma)
assert(server.includes('registration_number,siren,phone_prefix,department_code,department_name,location_verified'),'Registracija mora sačuvati sve prikupljene lokacijske i poslovne podatke u company_settings');
assert(auth.includes('const payload={...f,company_phone:f.phone}'),'Registracija mora poslati sastavljeni telefon backend-u');

console.log('Registration location tests passed');
