import fs from'node:fs';import assert from'node:assert/strict';
const ui=fs.readFileSync('src/Modules.jsx','utf8'),server=fs.readFileSync('server/index.js','utf8');

// 1) Format novca na ekranu mora biti stabilan (0,00 € i 1.250,50 €), bez oslanjanja na
// Intl.NumberFormat('bs-BA') koji u nekim okruženjima vrati "€ 0.00" umjesto "0,00 €".
assert(!ui.includes("new Intl.NumberFormat('bs-BA',{style:'currency',currency:'EUR'})"),'Ekran ne smije koristiti nepouzdan Intl.NumberFormat za novac');
assert(ui.includes("function money(value){const n=Number(value)||0,sign=n<0?'-':'',abs=Math.abs(n),fixed=abs.toFixed(2),[intPart,decPart]=fixed.split('.'),grouped=intPart.replace(/\\B(?=(\\d{3})+(?!\\d))/g,'.');return `${sign}${grouped},${decPart} €`}"),'money() mora ručno formatirati iznos u oblik 0,00 € / 1.250,50 €');
function money(value){const n=Number(value)||0,sign=n<0?'-':'',abs=Math.abs(n),fixed=abs.toFixed(2),[intPart,decPart]=fixed.split('.'),grouped=intPart.replace(/\B(?=(\d{3})+(?!\d))/g,'.');return `${sign}${grouped},${decPart} €`}
assert.equal(money(0),'0,00 €');
assert.equal(money(1250.5),'1.250,50 €');
assert.equal(money(300),'300,00 €');
assert.equal(money(150),'150,00 €');

// Kartica "Ukupno naplaćeno" mora koristiti istu funkciju (bez "€ 0.00")
assert(ui.includes('label="Ukupno naplaćeno" value={loading?\'—\':money(cards.total_paid)}'),'Kartica Ukupno naplaćeno mora koristiti ispravnu money() funkciju');

// Isti format mora biti i u PDF-u (server), ne Intl.NumberFormat
assert(!server.includes("new Intl.NumberFormat('bs-BA',{style:'currency',currency:'EUR'})"),'PDF ne smije koristiti nepouzdan Intl.NumberFormat za novac');
assert(server.includes('function pdfMoney(value){'),'Server mora imati istu ručnu funkciju za formatiranje novca u PDF-u');
function pdfMoney(value){const n=Number(value)||0,sign=n<0?'-':'',abs=Math.abs(n),fixed=abs.toFixed(2),[intPart,decPart]=fixed.split('.'),grouped=intPart.replace(/\B(?=(\d{3})+(?!\d))/g,'.');return `${sign}${grouped},${decPart} €`}
assert.equal(pdfMoney(100),'100,00 €');

// 2) Tabela "Vrijednost završenih poslova po usluzi" — naslov, prazno stanje, agregacija na serveru
assert(ui.includes('<h3>Vrijednost završenih poslova po usluzi</h3>'),'Tabela mora imati tačan naslov');
assert(ui.includes('Nema završenih poslova s evidentiranim iznosom za ovaj izbor.'),'Prazno stanje tabele mora imati tačan tekst');
assert(server.includes("const serviceMap=new Map();for(const j of jobs.rows){const amt=parseMoneyValue(j.amount);if(!(amt>0))continue;"),'Agregacija po usluzi mora koristiti stvarno evidentirane iznose završenih poslova iz odabranog perioda/radnika');
assert(server.includes('average:x.revenue/x.count'),'Prosječna vrijednost mora biti izračunata po usluzi');
assert(server.includes("text('Vrijednost završenih poslova po usluzi')"),'PDF mora sadržavati istu sekciju kao ekran');
assert(server.includes('Nema završenih poslova s evidentiranim iznosom za ovaj izbor.'),'PDF mora imati isti tekst praznog stanja');

console.log('Reports money/services tests passed');
