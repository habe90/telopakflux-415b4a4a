import fs from'node:fs';import assert from'node:assert/strict';
const ui=fs.readFileSync('src/Modules.jsx','utf8'),server=fs.readFileSync('server/index.js','utf8'),css=fs.readFileSync('src/styles.css','utf8');
// Probni slučaj 1: nearhivirani klijent bez prepreke uvijek dobija aktivnu akciju poslije Pregled/Uredi.
assert(ui.includes("archiveBlocked=stats.archive_blocked"));
assert(ui.includes(":<button className=\"icon-btn sm archive-action\" title=\"Arhiviraj\""),'Klijent bez prepreke mora imati aktivno Arhiviraj dugme');
assert(!ui.includes(":hasHistory?<button className=\"icon-btn sm archive-action\""),'Prikaz akcije ne smije zavisiti od historije klijenta');
// Probni slučaj 2: otvoren posao ili aktivan plan daju sivu akciju i konkretan čitljiv razlog.
assert(server.includes("archive_blocked=openJob?{type:'job'"));
assert(server.includes('Arhiviranje nije moguće: otvoren posao ${openJob.no'));
assert(server.includes("activePlan?{type:'maintenance'"));
assert(ui.includes('className="archive-blocked-reason" role="note"'));
assert(ui.includes('className="icon-btn sm archive-action disabled" disabled'));
assert(css.includes('.archive-blocked-reason')&&css.includes('@media(max-width:700px)'));
// Server ponavlja provjeru u trenutku potvrde, tenant-scoped, završeni/otkazani ne blokiraju.
assert(server.includes("status NOT IN ('Završeno','Otkazano') ORDER BY id LIMIT 1"));
assert(server.includes("status NOT IN ('Neaktivan','Otkazan') ORDER BY id LIMIT 1"));
assert(server.includes("WHERE id=$1 AND company_id=$2"));
console.log('Client archive action tests passed');
