import fs from'node:fs';import assert from'node:assert/strict';const app=fs.readFileSync('src/App.jsx','utf8');
assert(app.includes("const officeHiddenPages=['AI pomoćnik','Izvještaji'];"),'Mora postojati lista skrivenih modula za Kancelariju');
assert(app.includes("function navItemsForRole(role){return role==='Kancelarija'?navItems.filter(([name])=>!officeHiddenPages.includes(name)):navItems}"),'Filtriranje menija mora izostaviti AI pomoćnik i Izvještaje za Kancelariju');
assert(app.includes("(isOwner?ownerNavItems:navItemsForRole(profile?.role)).map(([name,Icon])=>"),'Lijevi meni mora koristiti filtriranu listu');
assert(app.includes("profile?.role==='Kancelarija'&&officeHiddenPages.includes(page)"),'Direktan pokušaj otvaranja skrivene stranice mora preusmjeriti Kancelariju');
assert(app.includes("navItemsForRole(role).slice(0,8)"),'Globalna pretraga ne smije predlagati skrivene module Kancelariji');
assert(app.includes("{role!=='Kancelarija'&&<div className=\"nav-pop-foot\">"),'Centar obavijesti ne smije voditi Kancelariju na AI pomoćnik');
console.log('Office nav hidden tests passed');