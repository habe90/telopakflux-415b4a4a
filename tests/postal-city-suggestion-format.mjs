import fs from'node:fs';import assert from'node:assert/strict';
const loc=fs.readFileSync('src/LocationFields.jsx','utf8');

// Prijedlog u listi "Poštanski broj"/"Grad" prikazuje samo poštanski broj i naziv mjesta
assert(loc.includes('<span>{x.postal_code} {x.city}</span>'),'Prijedlog mora biti u formatu "57100 Thionville", bez departmana');
assert(!/<span>\{x\.postal_code\}[^<]*department/.test(loc),'Prijedlog ne smije prikazivati departman');
assert(!loc.includes('<small>{x.department_code?`Departman'),'Red departmana ispod prijedloga mora biti uklonjen');

// Svaka kombinacija poštanski broj + mjesto je zaseban izbor (backend već vraća po jedan red po mjestu)
assert(loc.includes('key={`${x.city}-${x.postal_code}-${i}`}'),'Svako mjesto mora biti zaseban red u listi (jedinstven ključ po gradu i poštanskom broju)');

// Odabir popunjava Poštanski broj i Grad, a departman se automatski popunjava i prikazuje SAMO u polju Departman
assert(loc.includes("const choose=x=>{set('city',x.city);set('postal_code',x.postal_code);"),'Odabir mora upisati poštanski broj u "Poštanski broj" i mjesto u "Grad"');
assert(loc.includes("if(country==='France'&&x.department_code){")&&loc.includes("set('department_code',x.department_code);set('department_name',d?.name||'')"),'Departman se mora automatski popuniti, ali odvojeno od polja Poštanski broj/Grad');

console.log('Postal/city suggestion format tests passed');
