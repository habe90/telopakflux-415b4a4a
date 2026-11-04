import fs from'node:fs';import assert from'node:assert/strict';
const app=fs.readFileSync('src/App.jsx','utf8'),ui=fs.readFileSync('src/Modules.jsx','utf8');

// Isti obrazac "Novi posao" iz modula Poslovi mora biti ponovo iskorišten (export + import), ne duplirana forma.
assert(ui.includes('export function JobForm({data,close,save,workers:providedWorkers}){'),'JobForm mora biti izvezen iz Modules.jsx da bi ga App.jsx mogao ponovo koristiti');
assert(app.includes("import { ClientsModule, JobsModule, ScheduleModule, OffersModule, InvoicesModule, StockModule, MaintenanceModule, ReportsModule, SettingsModule, exportToPDF, JobForm } from './Modules';"),'App.jsx mora uvesti isti JobForm umjesto posebne forme');

// Stari zasebni obrazac s fiksnim datumom 25.03.2025 i izmišljenim radnicima (Marko Ilić/Ivan Kovač/Petar Jurić) mora biti uklonjen iz aktivnog toka.
assert(!app.includes('function Modal({close,onCreate,clients})'),'Zastarjeli zasebni obrazac za Novi posao mora biti uklonjen');
assert(!app.includes('new Date(2025,2,25)'),'Fiksni datum 25.03.2025 ne smije ostati kao podrazumijevani datum');

// Globalno dugme "Novi posao" (Početna/Brzo dodaj) mora koristiti JobForm, današnji datum prema firmi i bez unaprijed odabranog radnika.
assert(app.includes("const companyTodayEU=()=>{"),'Mora postojati pomoćna funkcija za današnji datum prema vremenskoj zoni firme');
assert(app.includes("fetch('/api/settings/workspace',{credentials:'include'}).then(r=>r.json()).then(d=>setCompanyTimezone(d.timezone||'Europe/Paris'))"),'Vremenska zona firme mora doći sa servera, ne biti fiksna');
assert(app.includes('{modal&&<JobForm data={{status:\'Novi\',priority:\'Standardno\',date:companyTodayEU(),time:\'08:00\',worker:\'\'}}'),'Globalni "Novi posao" mora otvoriti JobForm s današnjim datumom i bez radnika');
assert(app.includes('save={async f=>{const saved=await createJob(f);setModal(false);'),'Čuvanje iz globalnog dugmeta mora ići kroz pravi createJob poziv, ne lokalni mock');

// Iz kartice klijenta: isti JobForm, unaprijed odabran klijent, izbor ako ima više servisnih adresa.
assert(app.includes("filter:'create-client',data"),'Klik na "Novi posao" iz kartice klijenta mora otvoriti isti obrazac s podacima klijenta');
assert(ui.includes("openIntent.filter==='create-client'"),'Poslovi moraju prepoznati namjeru dolaska iz kartice klijenta');
assert(ui.includes('f.client_locations.length>1?<Select')&&ui.includes('Odaberite servisnu lokaciju'),'Više servisnih adresa mora ponuditi izbor u istom obrascu');

// Iz rasporeda: isti JobForm s prenesenim datumom/vremenom termina, radnik samo ako je filter aktivan.
assert(ui.includes("setModal({type:'form',data:{status:'Zakazano',priority:'Standardno',date,time,worker:workerFilter!=='Svi radnici'?workerFilter:''}});"),'Klik na slobodan termin mora prenijeti datum/vrijeme i poštovati filter radnika');
assert(ui.includes('{modal?.type===\'form\'&&<JobForm data={modal.data} workers={workers} close={()=>setModal(null)} save={saveJob}/>}'),'Raspored mora koristiti isti JobForm za čuvanje termina');

console.log('Same job form everywhere tests passed');
