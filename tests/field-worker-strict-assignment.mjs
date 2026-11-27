import fs from'node:fs';import assert from'node:assert/strict';
const server=fs.readFileSync('server/index.js','utf8');
assert(server.includes("const workerOwnsJob=`j.company_id=$2 AND j.worker_id=$3`"),'Direktne radničke rute moraju koristiti firmu i worker_id');
assert(server.includes('SELECT * FROM jobs WHERE company_id=$1 AND worker_id=$2 ORDER BY id ASC'),'Moji poslovi moraju filtrirati samo po worker_id');
assert(server.includes('WHERE j.company_id=$1 AND j.worker_id=$2 ORDER BY'),'Moj dan i Moj raspored moraju filtrirati samo po worker_id');
assert(server.includes('j.company_id=$2 AND j.worker_id=$1'));
assert(!server.includes('j.worker_id IS NULL AND lower(trim(j.worker))'),'Ne smije postojati fallback po imenu u posebnim radničkim rutama');
assert(!server.includes('worker_id=$2 OR (worker_id IS NULL AND lower(worker)=lower($3))'),'Ne smije postojati fallback po imenu u generičkoj listi poslova');
assert(server.includes("role='Radnik na terenu' AND status='Aktivan'"),'Dodjela mora potvrditi aktivnog terenskog radnika');
assert(server.includes("data.worker=assigned.rows[0].name"),'Ime se smije sinhronizovati tek nakon potvrde ID-a');
assert(server.includes("data.worker_id=null;data.worker=''"),'Novi posao bez izričite dodjele mora ostati nedodijeljen');
// workerOwnsJob se koristi za detalj, status, evidenciju, završavanje, zahtjev termina i PDF.
for(const marker of ["app.get('/api/my-day/jobs/:id'","workerTransition(req,res","app.put('/api/my-day/jobs/:id/work-log'","app.post('/api/my-day/jobs/:id/complete'","app.post('/api/my-day/jobs/:id/schedule-change'","app.get('/api/my-day/jobs/:id/pdf'"]){const i=server.indexOf(marker);assert(i>=0,`Nedostaje ruta ${marker}`);assert(server.slice(i,i+5000).includes('workerOwnsJob'),`${marker} mora koristiti strogu provjeru dodjele`)}
console.log('Field worker strict assignment tests passed');