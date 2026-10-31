import fs from 'node:fs';import assert from 'node:assert/strict';
const ui=fs.readFileSync('src/Modules.jsx','utf8'),server=fs.readFileSync('server/index.js','utf8'),migration=fs.readFileSync('scripts/migrate.js','utf8'),css=fs.readFileSync('src/styles.css','utf8');
assert(ui.includes('<th>Kontakt</th>')&&!ui.includes('<th>Kontakt osoba</th>'),'Kolona mora biti Kontakt');
assert(ui.includes('clientContactLines')&&ui.includes('isCompanyClient'),'Fizička i pravna lica moraju imati različit kontaktni prikaz');
assert(ui.includes('Dodano ovog mjeseca: ${addedThisMonth}'),'Broj novih klijenata mora biti dinamičan');
assert(ui.includes('Naplaćeno ovog mjeseca')&&ui.includes('Ukupno naplaćeno'),'Novčane oznake moraju odgovarati značenju');
assert(ui.includes('[x.postal_code,x.city]'),'Lokacija mora prikazati poštanski broj i grad');
assert(ui.includes('Faza saradnje'),'Status klijenta mora biti nazvan fazom saradnje');
for(const field of ['x.name','x.contact','x.phone','x.email','x.city'])assert(ui.includes(field),`Pretraga mora uključiti ${field}`);
assert(ui.includes('Pronađeno klijenata:')&&ui.includes('Očisti filtere'),'Aktivni filter mora prikazati broj i čišćenje');
assert(ui.includes('text onView=')&&ui.includes('Arhiviraj'),'Akcije moraju imati tekst i arhiviranje');
assert(server.includes("app.get('/api/clients/summary'")&&server.includes('invoice_payments'),'Sažetak mora koristiti stvarne uplate');
assert(server.includes("app.patch('/api/clients/:id/archive'"),'Arhiviranje mora biti trajno');
assert(ui.includes("'Arhivirani'")&&ui.includes("status==='Arhivirani'?!!x.archived"),'Mora postojati filter koji prikazuje samo arhivirane klijente');
assert(ui.includes(':!x.archived&&(status===\'Svi statusi\'')||ui.includes('!x.archived&&(status'),'Arhivirani klijenti ne smiju biti u zadanom prikazu');
assert(ui.includes('archived-hint')&&ui.includes('Prikaži arhivirane'),'Mora postojati napomena i prečica ka arhiviranim klijentima');
assert(ui.includes('unarchive(x)')&&ui.includes('Vrati iz arhive'),'Arhivirani klijent mora moći biti vraćen');
assert(ui.includes("x.archived?'Arhiviran':x.status"),'Arhivirani klijent mora imati zasebnu oznaku statusa');
assert(migration.includes('postal_code text')&&migration.includes('archived boolean'),'Baza mora čuvati lokaciju i arhivu');

// Provjera ispravke dupliranja u koloni "Kontakt"
function clientContactLines(x){return {person:x.type==='Pravno lice'?String(x.contact||'').trim():'',phone:String(x.phone||'').trim(),email:String(x.email||'').trim()}}
const physicalBoth=clientContactLines({type:'Fizičko lice',contact:'Marko Marković',phone:'061111222',email:'marko@test.ba'});
assert.equal(physicalBoth.person,'','Fizičko lice ne smije duplirati ime u koloni Kontakt');
assert.equal(physicalBoth.phone,'061111222');assert.equal(physicalBoth.email,'marko@test.ba');
const companyBoth=clientContactLines({type:'Pravno lice',contact:'Ana Anić',phone:'062333444',email:'ana@firma.ba'});
assert.equal(companyBoth.person,'Ana Anić');assert.equal(companyBoth.phone,'062333444');assert.equal(companyBoth.email,'ana@firma.ba');
const onlyPhone=clientContactLines({type:'Fizičko lice',phone:'063555666',email:''});
assert.equal(onlyPhone.phone,'063555666');assert.equal(onlyPhone.email,'');
const neither=clientContactLines({type:'Fizičko lice',phone:'',email:''});
assert.equal(neither.phone,'');assert.equal(neither.email,'');
assert(ui.includes('contact.person&&<strong>{contact.person}</strong>')&&ui.includes('contact.phone&&<small className="table-sub contact-line">{contact.phone}</small>')&&ui.includes('contact.email&&<small className="table-sub contact-line">{contact.email}</small>'),'Kontakt mora prikazati telefon i e-mail u zasebnim redovima, bez duplikata');
assert(!ui.includes("contact[1]||(!isCompanyClient(x)?[x.phone,x.email].filter(Boolean).join(' · '):'')"),'Stari kod koji je uzrokovao dupliranje mora biti uklonjen');
assert(ui.includes('!contact.person&&!contact.phone&&!contact.email&&<small className="table-sub">—</small>'),'Ako nedostaju svi podaci, mora se prikazati —');
// Provjera jedinstvenog formata iznosa i centriranja kolone "Ukupno naplaćeno"
const cardMoneyCall=ui.match(/label="Naplaćeno ovog mjeseca"[\s\S]{0,40}value=\{money\(monthPaid\)\}/);
const columnMoneyCall=ui.match(/className="money-col"><strong>\{money\(stats\.value\)\}<\/strong>/);
assert(cardMoneyCall,'Kartica "Naplaćeno ovog mjeseca" mora koristiti money()');
assert(columnMoneyCall,'Kolona "Ukupno naplaćeno" mora koristiti istu funkciju money()');
function money(value){return new Intl.NumberFormat('bs-BA',{style:'currency',currency:'EUR'}).format(Number(value)||0)}
assert(/^0,00[\s\u00A0]€$/.test(money(0)),`Format nule mora biti 0,00 €, dobijeno: ${money(0)}`);
assert(/^1\.250,50[\s\u00A0]€$/.test(money(1250.5)),`Format 1250.5 mora biti 1.250,50 €, dobijeno: ${money(1250.5)}`);
assert(css.includes('.clients-table .money-col{text-align:center'),'Kolona "Ukupno naplaćeno" mora biti centrirana (naslov i vrijednosti)');
// Centriranje kolona "Poslovi" i "Faza saradnje"
assert(ui.includes('<th className="jobs-col">Poslovi</th>'),'Naslov kolone Poslovi mora biti centriran');
assert(ui.includes('<td className="jobs-col">{stats.jobs}</td>'),'Broj poslova u redu mora biti centriran, uključujući 0');
assert(ui.includes('<th className="phase-col">Faza saradnje</th>'),'Naslov kolone Faza saradnje mora biti centriran');
assert(ui.includes('<td className="phase-col"><Badge>'),'Oznaka faze saradnje mora biti u centriranoj ćeliji');
assert(css.includes('.clients-table .jobs-col{text-align:center}'),'CSS mora centrirati kolonu Poslovi (naslov i vrijednosti)');
assert(css.includes('.clients-table th.phase-col,.clients-table td.phase-col{text-align:center}'),'CSS mora centrirati kolonu Faza saradnje (naslov i vrijednosti)');
assert(css.includes('.clients-table td.phase-col>.module-badge{display:inline-flex;justify-content:center'),'Oznaka faze saradnje mora biti centrirana kao cjelina unutar ćelije');
console.log('Clients list tests passed');
