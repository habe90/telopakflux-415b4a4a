import fs from'node:fs';import assert from'node:assert/strict';
const app=fs.readFileSync('src/App.jsx','utf8'),server=fs.readFileSync('server/index.js','utf8');

// Frontend: Ime i prezime mora biti zaključano za Kancelariju, kao kod radnika na terenu.
assert(app.includes("const nameLocked=workerOnly||profile.role==='Kancelarija'"),'Kancelarija mora dijeliti isto zaključavanje imena kao radnik na terenu');
assert(app.includes('disabled={nameLocked} readOnly={nameLocked}'),'Polje Ime i prezime mora biti readOnly/disabled kad je nameLocked');
assert(app.includes("const payload=nameLocked?{phone}:{name,phone}"),'Payload ne smije slati name kad je ime zaključano');
assert(!app.includes('disabled={workerOnly} readOnly={workerOnly}'),'Staro ograničenje samo za radnika mora biti zamijenjeno generalizovanim nameLocked');

// Broj telefona mora i dalje raditi za Kancelariju (avatar ostaje uređiv, samo ime zaključano).
assert(app.includes("{!workerOnly&&<><button type=\"button\" onClick={pickPhoto}"),'Kancelarija i dalje mora moći uređivati profilnu sliku');

// Server: direktan zahtjev sa name poljem mora biti odbijen za Kancelariju, bez obzira na UI.
assert(server.includes("const officeRole=req.user.role==='Kancelarija'"),'Server mora prepoznati ulogu Kancelarija');
assert(server.includes("if(officeRole&&req.body?.name!==undefined)return res.status(403)"),'Server mora odbiti promjenu imena za Kancelariju čak i direktnim zahtjevom');
assert(server.includes("keys.some(k=>k!=='phone')"),'Radnik na terenu i dalje mora moći mijenjati samo telefon');

console.log('Office profile name-lock tests passed');
