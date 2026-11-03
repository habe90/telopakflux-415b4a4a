import fs from'node:fs';import assert from'node:assert/strict';
const ui=fs.readFileSync('src/Modules.jsx','utf8'),css=fs.readFileSync('src/styles.css','utf8');

// Uzrok greške pri čuvanju iz sedmičnog prikaza: ScheduleModule je direktno zvao optimistički
// setJobs (fire-and-forget), bez await i bez hvatanja greške servera, pa je termin mogao
// "nestati" nakon F5 iako je korisnik vidio poruku o uspjehu. Ispravka koristi iste potvrđene
// createJob/updateJob pozive kao modul Poslovi.
assert(ui.includes('const {jobs,setJobs,createJob,updateJob,clients,workers}=useData();'),'Raspored mora koristiti iste potvrđene createJob/updateJob pozive kao Poslovi');
assert(ui.includes('const saveJob=async f=>{'),'Čuvanje termina mora biti asinhrono i čekati odgovor servera');
assert(ui.includes("saved=f.id?await updateJob(f.id,f):await createJob(f);"),'Novi termin mora ići kroz stvarni server poziv, ne kroz izmišljeni id');
assert(!ui.includes('id:Date.now(),no:`P-${1054+a.length}`'),'Ne smije se izmišljati id/broj termina na klijentu umjesto da ga vrati server');
assert(ui.includes("if(!saved?.id){const msg='Server nije potvrdio čuvanje termina.';flash(msg,true);throw new Error(msg);}"),'Ako server ne potvrdi upis, mora se prijaviti greška, ne lažni uspjeh');
assert(ui.includes('const deleteJob=async job=>{try{await setJobs')&&ui.includes('const reassignWorker=async(job,worker)=>{')&&ui.includes('const setJobStatus=async(job,status)=>{try{')&&ui.includes('const handleDrop=async(e,day)=>{'),'Brisanje, dodjela radnika, promjena statusa i prevlačenje termina moraju čekati i hvatati grešku servera');

// Mjesečni prikaz: za svaki dan odmah prikazati vrijeme, klijenta i uslugu, ne samo broj termina
assert(ui.includes('className="m-jobs"')&&ui.includes('className={`m-job-line'),'Mjesečna ćelija mora prikazati listu termina sa vremenom, klijentom i uslugom');
assert(ui.includes('<span className="m-job-time">{j.time}</span>')&&ui.includes('<span className="m-job-text">{j.client} · {j.service}</span>'),'Svaki red u mjesečnom prikazu mora sadržavati vrijeme, klijenta i uslugu');
assert(!ui.includes('{dayJobs.length} termin{dayJobs.length===1?\'\':\'a\'}'),'Generička oznaka broja termina bez detalja mora biti uklonjena iz mjesečnog prikaza');
assert(css.includes('.m-job-line{display:flex')&&css.includes('.m-job-time{')&&css.includes('.m-job-text{'),'Mora postojati stil za redove termina u mjesečnom prikazu');
assert(css.includes('.m-job-line.marko .m-dot{background:#2379d5}'),'Tačka boje radnika mora ostati kao oznaka radnika uz detalje termina');

console.log('Schedule save and month view tests passed');
