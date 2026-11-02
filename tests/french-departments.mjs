import assert from 'node:assert/strict';
import { FRENCH_DEPARTMENTS } from '../src/frenchDepartments.js';
import fs from 'node:fs';

// Tačno 101 jedinstvena šifra: 96 u evropskom dijelu (uključujući 2A/2B) + 5 prekomorskih
assert.equal(FRENCH_DEPARTMENTS.length, 101, 'Lista mora sadržavati tačno 101 departman');
const codes = FRENCH_DEPARTMENTS.map(d => d.code);
assert.equal(new Set(codes).size, 101, 'Sve šifre moraju biti jedinstvene');
for (const overseas of ['971', '972', '973', '974', '976']) {
  assert(codes.includes(overseas), `Nedostaje prekomorski departman ${overseas}`);
}
assert(codes.includes('2A') && codes.includes('2B'), 'Korzika mora biti 2A i 2B, ne 20');
assert(typeof FRENCH_DEPARTMENTS[0].code === 'string' && typeof codes.find(c=>c==='2A') === 'string', 'Šifre moraju biti tekstualne (zbog 2A/2B i početnih nula)');
assert(codes.includes('01') && codes.includes('09'), 'Šifre 01–09 moraju čuvati početnu nulu');
const metropolitan = FRENCH_DEPARTMENTS.filter(d => !['971','972','973','974','976'].includes(d.code));
assert.equal(metropolitan.length, 96, 'Evropski dio mora imati tačno 96 departmana');
const moselle = FRENCH_DEPARTMENTS.find(d => d.code === '57');
assert.equal(moselle.name, 'Moselle', 'Šifra 57 mora biti Moselle');

// Lista je ugrađena u aplikaciju (bez backend poziva) i dostupna i prije prijave
const loc = fs.readFileSync('src/LocationFields.jsx', 'utf8');
assert(loc.includes("import{FRENCH_DEPARTMENTS}from'./frenchDepartments'"), 'LocationFields mora koristiti ugrađenu listu');
assert(!loc.includes("fetch('/api/locations/departments'"), 'Departman ne smije pozivati backend');
assert(loc.includes('const departments=FRENCH_DEPARTMENTS;'), 'Departman mora koristiti statičku listu direktno');

// Prikaz cijele liste pri otvaranju (bez ograničenja na manji broj rezultata)
assert(!loc.includes('.slice(0,30)'), 'Lista departmana ne smije biti odsječena na manji broj rezultata');
assert(loc.includes('const q=depQuery.trim();if(!q)return departments;'), 'Prazna pretraga mora vratiti cijelu listu');

// Pretraga po šifri i nazivu, puna oznaka i nakon odabira
assert(loc.includes("norm(`${d.code} ${d.name}`).includes(norm(q))"), 'Pretraga mora raditi i po šifri i po nazivu');
assert(loc.includes('<span>{d.code} – {d.name}</span>'), 'Prijedlog mora prikazati punu oznaku "šifra – naziv"');
assert(loc.includes("set('department_code',d.code);set('department_name',d.name)"), 'Odabir mora sačuvati i šifru i naziv (puna oznaka i nakon odabira)');

// Departman se prikazuje samo za Francusku
assert(loc.includes("country==='France'&&<label className=\"location-combo department-combo\""), 'Departman mora biti sakriven za Belgiju i Luksemburg');

console.log('French departments list tests passed');
