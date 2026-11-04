import fs from'node:fs';import assert from'node:assert/strict';
const ui=fs.readFileSync('src/Modules.jsx','utf8'),server=fs.readFileSync('server/index.js','utf8'),css=fs.readFileSync('src/styles.css','utf8');
// Probni slučaj 1: nearhivirani klijent bez prepreke uvijek dobija aktivnu akciju poslije Pregled/Uredi, na istom mjestu.
assert(ui.includes("archiveBlocked=stats.archive_blocked"));
assert(ui.includes(":<button className=\"icon-btn sm archive-action\" title=\"Arhiviraj\""),'Klijent bez prepreke mora imati aktivno Arhiviraj dugme');
assert(!ui.includes(":hasHistory?<button className=\"icon-btn sm archive-action\""),'Prikaz akcije ne smije zavisiti od historije klijenta');
// Probni slučaj 2: otvoren posao ili aktivan plan daju sivu, onemogućenu ikonu bez vidljivog teksta u koloni Akcije.
assert(server.includes("archive_blocked=openJob?{type:'job'"));
assert(server.includes('Arhiviranje nije moguće: otvoren posao ${openJob.no'));
assert(server.includes("activePlan?{type:'maintenance'"));
assert(!ui.includes('archive-blocked-reason'),'Razlog se ne smije prikazivati kao stalan tekst u koloni Akcije');
assert(ui.includes('className="icon-btn sm archive-action blocked" aria-disabled="true" tabIndex={-1}'),'Blokirana ikona mora biti onemogućena ali i dalje dio redovnog niza dugmadi (jednako poravnanje)');
assert(ui.includes('title={archiveBlocked.reason} aria-label={archiveBlocked.reason}'),'Razlog mora i dalje biti dostupan (title/aria-label) bez stalnog prikaza u koloni');
assert(ui.includes('onClick={e=>e.preventDefault()}'),'Klik na blokiranu ikonu ne smije pokrenuti nikakvu radnju');
assert(ui.includes('<Archive className="archive-icon-default"/><Ban className="archive-icon-hover"/>'),'Mora postojati siva ikona i crvena ikona (krug s kosom crtom) za hover');
assert(css.includes('.row-actions .archive-action.blocked{color:#8b96a4;background:#f1f3f5;border-color:#dfe3e7;cursor:not-allowed}'),'Zadano stanje mora biti sivo i not-allowed');
assert(css.includes('.row-actions .archive-action.blocked:hover,.row-actions .archive-action.blocked:focus-visible{color:#c23b3b;background:#fdecec;border-color:#f3c9c9;cursor:not-allowed}'),'Hover mora prikazati crvenu varijantu uz not-allowed kursor');
assert(css.includes('.row-actions .archive-action .archive-icon-hover{display:none}')&&css.includes(':hover .archive-icon-default,.row-actions .archive-action.blocked:focus-visible .archive-icon-default{display:none}')&&css.includes(':hover .archive-icon-hover,.row-actions .archive-action.blocked:focus-visible .archive-icon-hover{display:inline-block}'),'Hover mora zamijeniti sivu ikonu crvenom na istom mjestu');
// Server ponavlja provjeru u trenutku potvrde, tenant-scoped, završeni/otkazani ne blokiraju.
assert(server.includes("status NOT IN ('Završeno','Otkazano') ORDER BY id LIMIT 1"));
assert(server.includes("status NOT IN ('Neaktivan','Otkazan') ORDER BY id LIMIT 1"));
assert(server.includes("WHERE id=$1 AND company_id=$2"));
console.log('Client archive action tests passed');
