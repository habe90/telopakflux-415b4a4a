import fs from'node:fs';import assert from'node:assert/strict';const app=fs.readFileSync('src/App.jsx','utf8');
assert(app.includes("'Radnik na terenu':['Klijenti','Ponude','Računi','Materijal','Održavanje','Korisnici','AI pomoćnik','Izvještaji']"),'Radnik na terenu mora imati skrivene tražene module');
assert(app.includes('function hiddenPagesForRole(role){return hiddenPagesByRole[role]||[]}'),'Mora postojati funkcija za skrivene stranice po ulozi');
assert(app.includes('function navItemsForRole(role){const hidden=hiddenPagesForRole(role)'),'Meni mora koristiti opću listu skrivenih stranica');
assert(app.includes('hiddenPagesForRole(profile?.role).includes(page)'),'Direktan pokušaj otvaranja skrivene stranice mora preusmjeriti bilo koju ograničenu ulogu');
assert(app.includes("{profile?.role!=='Radnik na terenu'&&<button className={page==='Korisnici'?'active':''} onClick={()=>go('Korisnici')}>"),'Dugme Korisnici mora biti skriveno radniku na terenu');
assert(app.includes("role!=='Kancelarija'&&role!=='Radnik na terenu'&&<div className=\"nav-pop-foot\">"),'Centar obavijesti ne smije voditi radnika na terenu ka AI pomoćniku');
assert(app.includes("profile?.role!=='Radnik na terenu'&&<button className=\"text-button\" onClick={()=>setAllTasksOpen(true)}>"),'Dugme Prikaži sve obaveze mora biti skriveno radniku na terenu i otvoriti lokalni panel');
console.log('Field worker nav hidden tests passed');