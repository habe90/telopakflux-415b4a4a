import fs from 'node:fs';import assert from 'node:assert/strict';
const modules=fs.readFileSync('src/Modules.jsx','utf8'),store=fs.readFileSync('src/store.jsx','utf8');
for(const name of ['Marko Ilić','Ivan Kovač','Petar Jurić'])assert(!modules.includes(name),`Mock radnik ${name} mora biti uklonjen`);
assert(!modules.includes('WORKER_NAMES'),'Raspored ne smije koristiti statičku listu radnika');
assert(!modules.includes('ABSENCES'),'Raspored ne smije prikazivati mock odsustva');
assert(store.includes("request('team')"),'Data provider mora učitati stvarne korisnike firme');
assert(store.includes("u.status==='Aktivan'"),'Samo aktivni korisnici smiju biti ponuđeni za dodjelu');
assert(modules.includes('workers.map(w=>'),'Forme i raspored moraju koristiti stvarne korisnike');
console.log('Real workers tests passed');
