import fs from'node:fs';import assert from'node:assert/strict';const app=fs.readFileSync('src/App.jsx','utf8');
assert(app.includes("'Kancelarija':['AI pomoćnik','Izvještaji'],"),'Mora postojati lista skrivenih modula za Kancelariju');
assert(app.includes('function navItemsForRole(role){const hidden=hiddenPagesForRole(role)'),'Filtriranje menija mora koristiti opću listu skrivenih stranica');
assert(app.includes("(isOwner?ownerNavItems:navItemsForRole(profile?.role)).map(([name,Icon])=>"),'Lijevi meni mora koristiti filtriranu listu');
assert(app.includes("hiddenPagesForRole(profile?.role).includes(page)"),'Direktan pokušaj otvaranja skrivene stranice mora preusmjeriti Kancelariju');
assert(app.includes("navItemsForRole(role).slice(0,8)"),'Globalna pretraga ne smije predlagati skrivene module Kancelariji');
assert(app.includes("role!=='Kancelarija'&&role!=='Radnik na terenu'&&<div className=\"nav-pop-foot\">"),'Centar obavijesti ne smije voditi Kancelariju na AI pomoćnik');
console.log('Office nav hidden tests passed');