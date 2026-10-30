import fs from 'node:fs';import assert from 'node:assert/strict';
const ai=fs.readFileSync('src/AIAssistant.jsx','utf8');
for(const q of ['Koji računi kasne?','Koje ponude čekaju odgovor?','Šta je zakazano danas?','Koji su poslovi otvoreni?'])assert(ai.includes(q),`Nedostaje brzo pitanje: ${q}`);
assert(ai.includes('submitQuestion(text)'),'Brzo pitanje mora koristiti isti tok slanja');
assert(ai.includes('Provjeravam podatke…'),'Mora postojati stanje obrade');
assert(ai.includes('Pokušaj ponovo'),'Mora postojati ponavljanje nakon greške');
assert(ai.includes('disabled={processing}'),'Ponovno slanje mora biti onemogućeno tokom obrade');
assert(ai.includes('overdue')&&ai.includes('waitingOffers')&&ai.includes('todayJobs')&&ai.includes('openJobs'),'Odgovori moraju koristiti stvarne podatke firme');
console.log('Assistant quick questions tests passed');
