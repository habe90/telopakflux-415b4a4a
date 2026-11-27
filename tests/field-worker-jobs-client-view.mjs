import fs from'node:fs';import assert from'node:assert/strict';
const app=fs.readFileSync('src/App.jsx','utf8'),modules=fs.readFileSync('src/Modules.jsx','utf8'),server=fs.readFileSync('server/index.js','utf8');

// 1) Uzrok "ModalShell is not defined": komponente moraju biti izvezene iz Modules.jsx i uvezene u App.jsx.
assert(modules.includes('export function ModalShell('),'ModalShell mora biti izvezena zajednička komponenta');
assert(modules.includes('export function Field('),'Field mora biti izvezena zajednička komponenta');
assert(modules.includes('export function InfoGrid('),'InfoGrid mora biti izvezena zajednička komponenta');
assert(app.includes("import { ClientsModule, JobsModule, ScheduleModule, OffersModule, InvoicesModule, StockModule, MaintenanceModule, ReportsModule, SettingsModule, exportToPDF, JobForm, ModalShell, Field, InfoGrid } from './Modules';"),'App.jsx mora uvoziti ModalShell/Field/InfoGrid umjesto da ih ostavi nedefinisanim');

// 2) FieldWorkerJobs: klik na karticu/broj otvara posao, klik na ime klijenta otvara ograničen pregled, bez dva prikaza odjednom.
const fwStart=app.indexOf('function FieldWorkerJobs({openIntent,onIntentHandled})');
assert(fwStart!==-1,'FieldWorkerJobs mora prihvatiti openIntent da se posao može otvoriti iz obavijesti/pretrage');
const fwEnd=app.indexOf('\nfunction WorkerOrder',fwStart);
const fw=app.slice(fwStart,fwEnd);
assert(fw.includes('className="worker-job-card" role="button" tabIndex={0} onClick={()=>open(j)}'),'Klik na karticu (uključujući broj naloga) mora otvoriti posao');
assert(fw.includes('className="worker-job-client-link" onClick={e=>openClient(e,j)}'),'Klik na ime klijenta mora otvoriti ograničen pregled klijenta');
assert(fw.includes('const openClient=async(e,j)=>{e.stopPropagation()'),'Klik na ime klijenta ne smije dodatno otvoriti i posao (jedan klik, jedan prikaz)');
assert(fw.includes("fetchJob(openIntent.id)"),'Otvaranje iz obavijesti/kalendara mora koristiti isti siguran endpoint kao ručni klik');

// 3) Ograničen pregled klijenta smije prikazati samo ime, kontakt i adresu intervencije — bez uređivanja i bez finansija.
assert(fw.includes('["Ime klijenta",clientView.client],["Kontakt",clientView.client_phone],["Adresa intervencije",clientView.intervention_address]'),'Ograničen pregled mora sadržavati tačno ime, kontakt i adresu intervencije');
assert(!fw.includes('onEdit')&&!fw.includes('amount')&&!fw.includes('invoice'),'Ograničen pregled ne smije nuditi uređivanje ni finansijske podatke');

// 4) Server mora provjeriti firmu i dodjelu posla prijavljenom radniku; izmjena ID-a ne smije otkriti tuđ posao.
assert(server.includes("const workerOwnsJob=`j.company_id=$2 AND (j.worker_id=$3 OR (j.worker_id IS NULL")&&server.includes("same_name.id<>$3"),'Server mora provjeriti firmu, worker_id i nejasne naslijeđene dodjele po imenu');
assert(server.includes("if(!r.rows[0])return res.status(403).json({error:'Ovaj radni nalog nije dodijeljen vama.'})"),'Tuđ ili nepostojeći posao mora vratiti 403, ne podatke drugog klijenta');

// 5) Otvaranje iz obavijesti mora nositi ID zapisa, ne samo stranicu.
assert(app.includes("if(n.page)go(n.page,{id:n.target_id})"),'Klik na obavijest mora otvoriti tačno taj zapis, ne samo stranicu');

console.log('Field worker jobs client view tests passed');
