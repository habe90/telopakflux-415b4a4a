import fs from'node:fs';import assert from'node:assert/strict';
const server=fs.readFileSync('server/index.js','utf8'),app=fs.readFileSync('src/App.jsx','utf8'),ui=fs.readFileSync('src/Modules.jsx','utf8');

// 1) Server vraća samo obavijesti prijavljenog korisnika, radničke obavijesti strogo vezane za company_id+worker_id.
assert(server.includes("WHERE n.user_id=$1"),'Obavijesti moraju biti ograničene na prijavljenog korisnika');
assert(server.includes("j.company_id=$2 AND j.worker_id=$1"),'Radničke obavijesti o nalozima moraju provjeriti firmu i worker_id');
assert(server.includes("UPDATE notifications SET read_at=COALESCE(read_at,now()) WHERE id=$1 AND user_id=$2"),'Označavanje pročitanog mora provjeriti primaoca');
assert(server.includes("UPDATE notifications SET read_at=COALESCE(read_at,now()) WHERE user_id=$1"),'Označi sve pročitano smije uticati samo na obavijesti prijavljenog korisnika');
assert(server.includes("DELETE FROM notifications WHERE id=$1 AND user_id=$2"),'Brisanje obavijesti mora provjeriti primaoca');

// 2) createCompanyNotification podržava excludeUserId da se izbjegne dupla obavijest istom primaocu.
assert(server.includes('excludeUserId = null'),'createCompanyNotification mora podržati isključivanje jednog primaoca');
assert(server.includes("($3::int IS NULL OR u.id<>$3)"),'Isključivanje primaoca mora biti stvarno primijenjeno u upitu');

// 3) Kreiranje posla: dodijeljenom radniku ide tačno jedna, jasna obavijest s brojem naloga; ne i generička emisija svima.
const postJobStart=server.indexOf("app.post('/api/jobs',requireAuth");
const postJobBlock=server.slice(postJobStart,postJobStart+2600);
assert(postJobBlock.includes("excludeUserId:saved.worker_id||null"),'Generička emisija ne smije duplo obavijestiti dodijeljenog radnika');
assert(postJobBlock.includes("'Dodijeljen vam je posao'"),'Dodijeljeni radnik mora dobiti jasnu obavijest o dodjeli');
assert(postJobBlock.includes('${saved.no||\'\'} ·'),'Obavijest o dodjeli mora sadržavati broj naloga');

// 4) Spremanje bez stvarne promjene ne kreira obavijest; dodjela/termin/adresa porede se sa stanjem PRIJE izmjene.
assert(server.includes('const workerIdChanged=data.worker_id!==undefined&&String(data.worker_id||\'\')!==String(previousRow?.worker_id||\'\')'),'Dodjela radnika mora se porediti sa stvarnim prethodnim stanjem');
assert(server.includes('const dateChanged=data.date!==undefined&&String(data.date||\'\')!==String(previousRow?.date||\'\')'),'Promjena datuma mora se porediti sa stvarnim prethodnim stanjem');
assert(server.includes('const timeChanged=data.time!==undefined'),'Promjena vremena mora se provjeriti prije slanja obavijesti');
assert(server.includes('const addressChanged=data.service_address!==undefined'),'Promjena adrese mora se provjeriti prije slanja obavijesti');
assert(!server.includes("const before=await pool.query('SELECT worker_id,worker,date,time,service_address FROM jobs WHERE id=$1 AND company_id=$2',[req.params.id,req.user.company_id]);const b=before.rows[0]"),'Stari (pogrešan) upit nakon UPDATE-a mora biti uklonjen');

// 5) Otkazivanje posla: idempotentno (bez duplog eventa) i sa obavijesti dodijeljenom radniku.
const cancelStart=server.indexOf("app.patch('/api/jobs/:id/cancel'");
const cancelBlock=server.slice(cancelStart,cancelStart+900);
assert(cancelBlock.includes("status<>'Otkazano'"),'Otkazivanje mora biti zaštićeno od ponovljenog eventa');
assert(cancelBlock.includes("'Posao je otkazan'"),'Otkazivanje mora obavijestiti dodijeljenog radnika');

// 6) Odobravanje/odbijanje zahtjeva za promjenu termina šalju obavijest radniku koji je poslao zahtjev; reject ruta postoji.
assert(server.includes("app.post('/api/schedule-change-requests/:id/reject'"),'Mora postojati ruta za odbijanje zahtjeva');
const approveStart=server.indexOf("app.post('/api/schedule-change-requests/:id/approve'");
const approveBlock=server.slice(approveStart,server.indexOf("app.post('/api/schedule-change-requests/:id/reject'"));
assert(approveBlock.includes("'schedule_response'")&&approveBlock.includes("'Zahtjev za promjenu termina je odobren'"),'Odobravanje mora kreirati obavijest tipa schedule_response');
assert(approveBlock.includes('x.requested_by'),'Obavijest o odobravanju mora ići radniku koji je poslao zahtjev');
const rejectStart=server.indexOf("app.post('/api/schedule-change-requests/:id/reject'");
const rejectBlock=server.slice(rejectStart,rejectStart+1400);
assert(rejectBlock.includes("status='Odbijen'")&&rejectBlock.includes("'Zahtjev za promjenu termina je odbijen'"),'Odbijanje mora promijeniti status i obavijestiti radnika');
assert(rejectBlock.includes("status='Otvoren' FOR UPDATE"),'Odbijanje mora zaključati i provjeriti da je zahtjev još otvoren (bez duplikata)');

// 7) Frontend: klik na obavijest zatvara panel i otvara WorkerOrder prema ID-u; neuspjeh osvježava obavijesti.
assert(app.includes("close();if(n.page)go(n.page,{id:n.target_id})"),'Klik na obavijest mora zatvoriti panel i navigirati prema ID-u naloga');
assert(app.includes('refreshNotifications'),'Moji poslovi mora moći osvježiti obavijesti kad nalog nije dostupan');
assert(app.includes("refreshNotifications?.()"),'Neuspjeh otvaranja naloga iz obavijesti mora osvježiti listu obavijesti');

// 8) Admin/kancelarija mogu stvarno odobriti/odbiti zahtjev (inače obavijest tipa schedule_response nikad ne bi nastala).
assert(ui.includes("fetch('/api/schedule-change-requests'"),'Raspored mora dohvatiti otvorene zahtjeve za promjenu termina');
assert(ui.includes("respondChangeRequest"),'Raspored mora imati akciju za obradu zahtjeva');
assert(ui.includes("/approve`") || ui.includes('`/api/schedule-change-requests/${req.id}/${action}`'),'Akcija mora pozivati approve/reject rutu');
assert(ui.includes('Odobri')&&ui.includes('Odbij'),'Raspored mora prikazati dugmad Odobri i Odbij');

console.log('Field worker notifications tests passed');
