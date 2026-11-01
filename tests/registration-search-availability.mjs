import fs from'node:fs';import assert from'node:assert/strict';
const server=fs.readFileSync('server/index.js','utf8'),location=fs.readFileSync('src/LocationFields.jsx','utf8'),auth=fs.readFileSync('src/Auth.jsx','utf8'),settings=fs.readFileSync('src/CompanySettings.jsx','utf8');

// 1) Pretraga mora biti javno dostupna PRIJE kreiranja naloga (odjavljen korisnik nema sesiju)
assert(!/app\.get\('\/api\/locations\/departments',\s*requireAuth/.test(server),'Lista departmana ne smije zahtijevati prijavu');
assert(!/app\.get\('\/api\/locations\/search',\s*requireAuth/.test(server),'Pretraga mjesta ne smije zahtijevati prijavu');
assert(server.includes("app.get('/api/locations/departments',locationsLimiter"),'Lista departmana mora biti javna ruta (sa ograničenjem brzine)');
assert(server.includes("app.get('/api/locations/search',locationsLimiter"),'Pretraga mjesta mora biti javna ruta (sa ograničenjem brzine)');

// 2) Jedna objedinjena poruka na bosanskom umjesto dvije crvene + žuto upozorenje
assert(location.includes("LOCATION_UNAVAILABLE_MESSAGE='Pretraga mjesta trenutno nije dostupna. Adresu možete unijeti ručno.'"),'Mora postojati jedinstvena poruka na bosanskom');
assert(location.includes('{unavailable?<div className="location-search-note"><AlertTriangle/> {LOCATION_UNAVAILABLE_MESSAGE}</div>:'),'Mora se prikazati samo JEDNA poruka kad izvor nije dostupan, ne i obično upozorenje');
assert(location.includes('error=""'),'Combo instance za poštanski broj/grad ne smiju duplirati crvenu poruku pojedinačno');

// Ručni unos ostaje moguć: poštanski broj i grad se ažuriraju odmah pri unosu, bez obzira na rezultat pretrage
assert(location.includes("set(q===form.city?'city':'postal_code',q)"),'Upisani poštanski broj/grad mora ostati sačuvan bez obzira na status pretrage');
// Ručni unos departmana kad servis nije dostupan
assert(location.includes('manual-department-fields')&&location.includes('Šifra departmana *')&&location.includes('Naziv departmana *'),'Departman mora imati ručni unos kad servis nije dostupan');

// Prelazak na sljedeći korak nije blokiran kad je pretraga nedostupna, ako su polja ispravno popunjena
assert(auth.includes('&&!f.location_search_unavailable)errs.city='),'Registracija ne smije blokirati nastavak kad pretraga nije dostupna');
assert(settings.includes('&&!form.location_search_unavailable){setFieldError(\'city\')'),'Postavke firme ne smiju blokirati čuvanje kad pretraga nije dostupna');

console.log('Registration search availability tests passed');
