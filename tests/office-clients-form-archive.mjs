import fs from'node:fs';import assert from'node:assert/strict';
const ui=fs.readFileSync('src/Modules.jsx','utf8'),server=fs.readFileSync('server/index.js','utf8');

// 1) Obrazac klijenta prilagođen vrsti lica
assert(ui.includes("const isCompany=f.type==='Pravno lice'"),'Obrazac mora razlikovati fizičko/pravno lice');
assert(ui.includes('<Field label="Naziv firme">'),'Pravno lice mora imati Naziv firme');
assert(ui.includes('<Field label="Ime i prezime" full hint={errors.name}>'),'Fizičko lice mora imati Ime i prezime umjesto Naziv/Kontakt osoba');
assert(ui.includes("if(!isCompany)payload.contact=''"),'Fizičko lice ne smije ponovo tražiti isto ime kao kontakt osobu');
assert(ui.includes('PHONE_EXAMPLE_BY_COUNTRY'),'Primjer telefona mora zavisiti od odabrane države');
assert(ui.includes('ali može se unijeti i drugi važeći međunarodni broj'),'Mora dozvoliti drugi validan međunarodni broj');

// 2) Nazivi iznosa i PDF format
assert(ui.includes('"Ukupno naplaćeno"'.replace(/"/g,''))||ui.includes('Ukupno naplaćeno'),'Mora koristiti naziv Ukupno naplaćeno');
assert(ui.includes('Ukupno fakturisano'),'Ako se prikazuje fakturisana vrijednost, mora biti posebno označena');
assert(!ui.includes("['Ukupna vrijednost',money(selected.value)]"),'Stari mislabelovan naziv Ukupna vrijednost mora biti uklonjen iz PDF-a klijenta');
assert(!ui.includes('["Ukupna vrijednost",money(selected.value)]'),'Stari mislabelovan naziv Ukupna vrijednost mora biti uklonjen iz prikaza');
assert(ui.includes("genDate=`${String(now.getDate()).padStart(2,'0')}.${String(now.getMonth()+1).padStart(2,'0')}.${now.getFullYear()}`"),'PDF datum mora biti u formatu DD.MM.YYYY');
assert(ui.includes("function money(value){const n=Number(value)||0"),'Money format mora ostati 1.427,40 €');

// 3) Preostali dug vidljiv
assert(ui.includes('Preostalo za naplatu'),'Preostali dug mora ostati vidljiv na kartici klijenta');

// 4) Arhiviranje blokirano kad ima otvoren posao/aktivan plan, s linkom
assert(server.includes("status NOT IN ('Završeno','Otkazano') ORDER BY id LIMIT 1`,[req.user.company_id,name])"),'Server mora provjeriti otvoren posao prije arhiviranja');
assert(server.includes("FROM maintenance WHERE company_id=$1 AND lower(client)=lower($2) AND status NOT IN ('Neaktivan','Otkazan')"),'Server mora provjeriti aktivan servisni plan prije arhiviranja');
assert(server.includes('blocked_by:{type:'+"'job'"),'Blokada mora vratiti tip i id posla');
assert(server.includes('blocked_by:{type:'+"'maintenance'"),'Blokada mora vratiti tip i id servisnog plana');
assert(ui.includes("setModal({type:'archive-blocked',data:x,blocked:d.blocked_by,reason:d.error})"),'Frontend mora prikazati razlog blokade');
assert(ui.includes("navigateApp(modal.blocked.type==='job'?'Poslovi':'Održavanje',{id:modal.blocked.id})"),'Blokada mora nuditi link na taj posao ili plan');
assert(ui.includes("status==='Arhivirani'?!!x.archived"),'Arhivirani klijenti moraju ostati dostupni kroz filter Arhivirani');

console.log('Office clients form/archive tests passed');
