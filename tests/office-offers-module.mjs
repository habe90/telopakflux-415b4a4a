import fs from'node:fs';import assert from'node:assert/strict';
const ui=fs.readFileSync('src/Modules.jsx','utf8'),app=fs.readFileSync('src/App.jsx','utf8');

// 1) role se mora proslijediti do modula Ponude
assert(app.includes("'Ponude':<OffersModule role={profile?.role}"),'Ponude moraju dobiti ulogu prijavljenog korisnika');

// 2) Role-svjesne kartice za Kancelariju: Nacrti / Čekaju odgovor / Ističu u narednih 7 dana
assert(ui.includes('const isOfficeOffers=isOffer&&role===\'Kancelarija\';'),'Mora postojati zasebna grana za Kancelariju na Ponudama');
assert(ui.includes('label="Nacrti" value={draftCount}')&&ui.includes("const draftCount=isOffer?items.filter(x=>x.status==='Nacrt').length:0;"),'Kartica Nacrti mora brojati status Nacrt');
assert(ui.includes('label="Čekaju odgovor" value={waitingCount}')&&ui.includes("const waitingCount=isOffer?items.filter(x=>x.status==='Poslata').length:0;"),'Kartica Čekaju odgovor mora brojati samo poslane ponude bez odgovora (Nacrt se ne računa)');
assert(ui.includes('label="Ističu u narednih 7 dana" value={expiringCount}'),'Treća kartica mora biti Ističu u narednih 7 dana');
assert(ui.includes("const isExpiringSoon=x=>{if(x.status!=='Poslata')return false;"),'Ističuća kartica smije gledati samo poslane ponude, ne nacrte');
// Admin i dalje zadržava zbirnu vrijednost ponuda i stopu prihvatanja
assert(ui.includes("label={isOffer?'Vrijednost ponuda':'Ukupno fakturisano'}")&&ui.includes("label={isOffer?'Stopa prihvatanja':'Naplaćeno'}"),'Administrator mora zadržati karticu vrijednosti ponuda i stope prihvatanja');

// 3) Akcije: bez trajnog brisanja za Kancelariju na Ponudama, uređivanje samo za nacrt
assert(ui.includes('onDelete={isOfficeOffers?null:()=>setModal({type:\'delete\',data:x})}'),'Kancelarija ne smije imati trajno brisanje ponude');
assert(ui.includes("onEdit={isOfficeOffers&&x.status!=='Nacrt'?null:()=>setModal({type:'form',data:x})}"),'Kancelarija smije uređivati samo nacrt ponude');
assert(ui.includes('{onEdit&&<button className="icon-btn sm" title="Uredi"'),'Actions mora sakriti dugme Uredi kad onEdit nije proslijeđen');

// Slanje ponude i evidentiranje odgovora moraju stvarno raditi (ne prazno dugme)
assert(ui.includes("const sendOffer=x=>save({...x,status:'Poslata'});"),'Pošalji ponudu mora mijenjati status na Poslata preko stvarnog čuvanja');
assert(ui.includes("const respondOffer=(x,resp)=>save({...x,status:resp});"),'Evidentiranje odgovora mora stvarno sačuvati status');
assert(ui.includes('title="Pošalji ponudu"')&&ui.includes('title="Evidentiraj odgovor"'),'Moraju postojati akcije Pošalji ponudu i Evidentiraj odgovor');
assert(ui.includes('function OfferResponseModal({offer,close,respond})')&&ui.includes("onClick={()=>pick('Prihvaćena')}")&&ui.includes("onClick={()=>pick('Istekla')}"),'Modal odgovora mora nuditi Prihvaćena i Istekla/odbijena');

// 4) Ispravka formata novca — i kartica i red moraju prikazivati isti ispravan iznos
function moneyNumber(value){
 if(typeof value==='number')return Number.isFinite(value)?value:0;
 const raw=String(value||'').replace(/[^0-9,.-]/g,'');
 if(!raw)return 0;
 const lastComma=raw.lastIndexOf(','),lastDot=raw.lastIndexOf('.');
 let normalized;
 if(lastComma>-1&&lastDot>-1){normalized=lastComma>lastDot?raw.replace(/\./g,'').replace(',','.'):raw.replace(/,/g,'');}
 else if(lastComma>-1){const parts=raw.split(',');normalized=(parts.length===2&&parts[1].length<=2)?raw.replace(',','.'):raw.replace(/,/g,'');}
 else if(lastDot>-1){const parts=raw.split('.');normalized=(parts.length===2&&parts[1].length<=2)?raw:raw.replace(/\./g,'');}
 else normalized=raw;
 const n=Number(normalized);
 return Number.isFinite(n)?n:0;
}
function money(value){const n=Number(value)||0,sign=n<0?'-':'',abs=Math.abs(n),fixed=abs.toFixed(2),[intPart,decPart]=fixed.split('.'),grouped=intPart.replace(/\B(?=(\d{3})+(?!\d))/g,'.');return `${sign}${grouped},${decPart} €`}
assert.equal(moneyNumber('€ 1,427.40'),1427.40,'Stari US zapis (zarez=hiljade, tačka=decimale) mora biti ispravno pročitan');
assert.equal(money(moneyNumber('€ 1,427.40')),'1.427,40 €','I kartica i red moraju prikazati 1.427,40 €, ne 1,43 €');
assert.equal(moneyNumber('1.427,40 €'),1427.40,'Bosanski zapis mora i dalje raditi ispravno');
assert.equal(moneyNumber('150'),150,'Cijeli broj bez separatora mora ostati ispravan');
assert(ui.includes('<strong>{money(moneyNumber(x.amount))}</strong>'),'Red u tabeli mora prikazivati preformatiran iznos, ne sirovi string');
assert(ui.includes('<td>{money(moneyNumber(x.paid))}</td>'),'Kolona Plaćeno mora biti preformatirana na isti način');

console.log('Office offers module tests passed');
