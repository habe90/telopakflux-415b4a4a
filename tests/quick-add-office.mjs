import fs from'node:fs';import assert from'node:assert/strict';const app=fs.readFileSync('src/App.jsx','utf8'),modules=fs.readFileSync('src/Modules.jsx','utf8'),server=fs.readFileSync('server/index.js','utf8');
for(const label of ['Novi posao','Novi klijent','Nova ponuda','Novi račun','Novi termin','Zatraži nabavku'])assert(app.includes(`'${label}'`),`Nedostaje prečica ${label}`);
assert(app.includes("role==='Kancelarija'?[...common,['request','Zatraži nabavku'"),'Kancelarija mora dobiti zahtjev umjesto novog materijala');
assert(app.includes("['material','Novi materijal'"),'Administrator mora zadržati Novi materijal');
assert(app.includes("else if(type==='term'){go('Raspored',{params:{quick:'term'}})"),'Novi termin prvo mora otvoriti Raspored');
assert(app.includes("else if(type==='request'){go('Materijal',{params:{quick:'request'}})"),'Zahtjev mora otvoriti postojeći Materijal obrazac');
assert(modules.includes("routeParams().get('quick')==='request'"),'Materijal mora otvoriti postojeći request modal');
assert(server.includes("if(table==='stock'&&req.user.role!=='Administrator')return res.status(403)"),'Server mora zabraniti Kancelariji kreiranje artikla');
assert(app.includes('<ProfileMenu close=')&&!app.includes('<strong>Postavke firme</strong><span>Dokumenti i sigurnost</span>'),'Avatar meni mora ostati odvojen');console.log('Quick add office tests passed');