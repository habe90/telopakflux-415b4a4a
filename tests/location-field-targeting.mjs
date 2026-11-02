import fs from'node:fs';import assert from'node:assert/strict';
const loc=fs.readFileSync('src/LocationFields.jsx','utf8');

// Uzrok greške: lookup je pogađao koje je polje u pitanju poredeći novu vrijednost sa STAROM
// vrijednošću grada (q===form.city) — to skoro nikad ne odgovara, pa se unos u "Grad" u stvarnosti
// upisivao u "Poštanski broj" (kontrolisano polje "Grad" je time vraćalo stari/prazan tekst pri
// svakom tasteru, što izgleda kao da kursor i tekst "bježe"). Svako polje sada eksplicitno
// prosljeđuje svoj naziv, bez pogađanja.
assert(!loc.includes("q===form.city?'city':'postal_code'"),'Lookup ne smije pogađati polje poređenjem sa starom vrijednošću grada');
assert(loc.includes('const lookup=(field,q)=>{clearTimeout(timer.current);set(field,q);'),'Lookup mora primiti eksplicitno ime polja');
assert(loc.includes("onChange={q=>lookup('postal_code',q)}"),'Poštanski broj mora eksplicitno ažurirati postal_code');
assert(loc.includes("onChange={q=>lookup('city',q)}"),'Grad mora eksplicitno ažurirati city (ne postal_code)');

// Brisanje: prazno/kratko polje odmah čisti rezultate i poruku o nedostupnosti, bez zaostalog stanja
assert(loc.includes("if(q.trim().length<2){setResults([]);setSearchUnavailable(false);return}"),'Brisanje polja mora odmah očistiti prijedloge i staro upozorenje o nedostupnosti');

// Povezivanje polja: samo klik na prijedlog ili Enter pozivaju onSelect/choose — common entry point
assert(loc.includes("onClick={()=>{onSelect(x);setOpen(false)}}")&&loc.includes("onClick={()=>{onSelect(x);setOpen(false)}}"),'Prijedlog se primjenjuje samo na klik');
assert(loc.includes("e.key==='Enter'&&open&&queryResults[active]"),'Prijedlog se primjenjuje i na Enter, ne pri svakom tasteru');

console.log('Location field targeting tests passed');
