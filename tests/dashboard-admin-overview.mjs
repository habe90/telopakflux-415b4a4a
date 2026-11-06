import fs from 'node:fs';import assert from 'node:assert/strict';
const app=fs.readFileSync('src/App.jsx','utf8'),css=fs.readFileSync('src/styles.css','utf8');

// 1) Podnaslov administratorske Početne mora biti tačno traženi tekst, bez obzira na stanje.
assert(app.includes('<p>Pregled poslovanja, današnjeg rasporeda i obaveza vaše firme.</p>'),'Podnaslov Početne mora biti tačan');

// 2) Administratorska Početna ima ugrađen demo prikaz (uključen/isključen zastavicom) i stvarni backend sažetak
// za kad je demo isključen.
assert(app.includes('const DASHBOARD_DEMO_MODE=true;')||app.includes('const DASHBOARD_DEMO_MODE=false;'),'DASHBOARD_DEMO_MODE mora biti eksplicitno postavljena zastavica');
assert(app.includes("fetch(`/api/dashboard/home?days=${period}`"),'Dashboard mora znati učitati stvarni backend sažetak kad demo nije uključen');

// 3) Broj računa i cijeli red u "Posljednji računi" moraju otvarati detalje TAČNO tog računa po stvarnom ID-u.
// (Traži se unutar funkcije Dashboard — LegacyDashboard ranije u fajlu ima istoimenu, ali neaktivnu karticu.)
const dashboardStartForInvoices=app.indexOf('function Dashboard({openNew,go,profile,refreshKey})');
const invoicesSectionStart=app.indexOf('CardHead title="Posljednji računi"',dashboardStartForInvoices);
const invoicesSection=app.slice(invoicesSectionStart,invoicesSectionStart+1600);
assert(invoicesSection.includes('className="clickable-row" tabIndex={0} role="button"'),'Red mora biti fokusibilan i semantički dugme');
assert(invoicesSection.includes("onClick={()=>!DASHBOARD_DEMO_MODE&&go('Računi',{id:r.id})}"),'Klik na red mora otvoriti račun po stvarnom ID-u kad demo nije uključen');
assert(invoicesSection.includes("onKeyDown={e=>{if(e.key==='Enter'||e.key===' ')"),'Red mora biti otvoriv tastaturom (Enter/Space)');
assert(invoicesSection.includes('className="invoice-no-link"'),'Broj računa mora biti zaseban klikabilan element');
assert(invoicesSection.includes("e.stopPropagation();!DASHBOARD_DEMO_MODE&&go('Računi',{id:r.id})"),'Klik na broj računa mora otvoriti tačno taj račun, bez dupliranja navigacije');
// Kad je uključen demo prikaz, klik na izmišljene ID-eve ne smije pokušati otvoriti nepostojeći zapis.
assert(invoicesSection.includes('!DASHBOARD_DEMO_MODE&&go'),'Klik na demo zapis mora biti zaštićen demo zastavicom');

// 4) Vizuelno isticanje na hover i kursor pokazivača (diskretno, ne upadljivo) + fokus stanje za tastaturu.
assert(css.includes('.clickable-row{cursor:pointer}'),'Klikabilni red mora imati kursor pokazivača');
assert(css.includes('tbody tr:hover{background:#fafcff}'),'Red mora imati diskretno isticanje pri prelasku mišem');
assert(css.includes('.clickable-row:focus-visible{outline:3px solid rgba(23,105,210,.22)'),'Red mora imati vidljivo fokus stanje za tastaturu');
assert(css.includes('.invoice-no-link{border:0;background:transparent'),'Broj računa mora biti vizuelno prepoznatljiv kao poveznica');

// 5) Ostala navigacija na istoj Početnoj (kartice, raspored, upozorenja) i dalje mora pozivati go(...) sa stvarnim ID-jevima.
// DASHBOARD_DEMO_MODE je sada false, pa čak i preostali "!DASHBOARD_DEMO_MODE&&go(...)" izrazi funkcionalno uvijek pozivaju go(...).
const dashboardFnStart=app.indexOf('function Dashboard({openNew,go,profile,refreshKey})'),dashboardFnEnd=app.indexOf('\nfunction OfficeDashboard',dashboardFnStart);
const dashboardFn=app.slice(dashboardFnStart,dashboardFnEnd);
assert(dashboardFn.includes("go('Raspored',{id:j.id,params:{view:'week'}})"),'Red današnjeg rasporeda mora otvarati stvarni posao po ID-u');
assert(dashboardFn.includes("go(a.page,{id:a.id})"),'Stavka Zahtijeva pažnju mora otvarati stvarni zapis po ID-u');

console.log('Dashboard admin overview tests passed');
