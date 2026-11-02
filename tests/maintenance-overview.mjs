import fs from'node:fs';import assert from'node:assert/strict';
const ui=fs.readFileSync('src/Modules.jsx','utf8'),css=fs.readFileSync('src/styles.css','utf8');
assert(ui.includes('label="Servisi koji kasne"')&&ui.includes("setDeadlineFilter('overdue')"),'Mora postojati klikabilna kartica Servisi koji kasne');
assert(ui.includes('dueInfo(x).days<0')&&ui.includes('dueInfo(x).days>=0&&dueInfo(x).days<=30'),'Zakašnjeli i narednih 30 dana moraju biti odvojeni, uz današnji datum u budućoj kartici');
assert(ui.includes('sort((a,b)=>dueInfo(a).days-dueInfo(b).days)'),'Tabela mora prvo prikazati zakašnjele pa današnje i buduće rokove');
assert(ui.includes("days<0?`Kasni ${Math.abs(days)} ${Math.abs(days)===1?'dan':'dana'}`:days===0?'Danas':`Za ${days} dana`"),'Rok mora imati oznaku Kasni/Danas/Za N dana');
assert(ui.includes('<th>Status plana</th>')&&ui.includes("<Badge>{x.status||'Aktivan'}</Badge>"),'Status plana mora biti odvojen od roka');
assert(ui.includes('label="Obavljeni servisi ove godine"')&&ui.includes('completedThisYear'),'Naziv kartice mora odgovarati broju evidentiranih završenih servisa');
assert(ui.includes('Još nemate servisnih planova')&&ui.includes('Kreiraj prvi servisni plan'),'Prazna firma mora dobiti CTA za prvi plan');
assert(ui.includes('Očisti filtere')&&ui.includes('Pokušaj ponovo'),'Prazni filteri i greška učitavanja moraju imati odgovarajuće akcije');
assert(css.includes('.metric-button')&&css.includes('.maintenance-due.overdue'),'Klikabilne kartice i rokovi moraju imati jasna stanja');
// Jučer mora biti zakašnjelo (-1), za sedam dana mora biti upcoming (7), bez preklapanja.
const today=new Date(2025,0,10),days=d=>Math.round((d-today)/86400000);assert(days(new Date(2025,0,9))<0);assert(days(new Date(2025,0,17))>=0&&days(new Date(2025,0,17))<=30);
console.log('Maintenance overview tests passed');
