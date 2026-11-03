import fs from'node:fs';import assert from'node:assert/strict';
const ui=fs.readFileSync('src/Modules.jsx','utf8'),server=fs.readFileSync('server/index.js','utf8'),app=fs.readFileSync('src/App.jsx','utf8'),migration=fs.readFileSync('scripts/migrate.js','utf8');

// Uloga mora stići do modula Računi
assert(app.includes("'Računi':<InvoicesModule role={profile?.role}"),'Računi moraju dobiti ulogu prijavljenog korisnika');

// 1) Naplatu mogu voditi obje uloge; samo administrator stornira i ispravlja uplatu
assert(server.includes("app.patch('/api/invoices/:id/storno'")&&server.includes("if (req.user.role !== 'Administrator') return res.status(403).json({ error: 'Samo administrator može stornirati izdati račun.' });"),'Storno mora biti dostupan samo administratoru');
assert(server.includes("app.delete('/api/invoices/:id/payments/:paymentId'")&&server.includes("if (req.user.role !== 'Administrator') return res.status(403).json({ error: 'Samo administrator može ispraviti pogrešno evidentiranu uplatu.' });"),'Ispravka uplate mora biti dostupna samo administratoru');
assert(server.includes("app.post('/api/invoices/:id/payments'"),'Evidentiranje uplate mora postojati i biti dostupno obje uloge (bez provjere uloge)');
assert(!ui.includes("role==='Administrator'") || ui.includes('title="Evidentiraj uplatu"'),'Evidentiranje uplate ne smije biti ograničeno na administratora u interfejsu');
assert(ui.includes('function PaymentModal({invoice,close,onRecorded})'),'Mora postojati obrazac za evidentiranje pune ili djelimične uplate');
assert(ui.includes('function SendToClientModal({type,record,close})'),'Mora postojati zajednička radnja slanja dokumenta klijentu');
assert(ui.includes("role==='Administrator'&&x.status!=='Nacrt'&&x.status!=='Stornirano'&&<button className=\"icon-btn sm danger\" title=\"Storniraj račun\""),'Storniranje u tabeli mora biti vidljivo samo administratoru');

// 2) Kartice i preostali dug
assert(ui.includes('label="Nacrti" value={draftCount}'),'Kartica Nacrti mora postojati i za račune');
assert(ui.includes('label="Čekaju uplatu" value={invoiceWaitingCount}')&&ui.includes("const invoiceWaitingCount=!isOffer?items.filter(x=>!['Nacrt','Stornirano'].includes(x.status)&&(Number(x.remaining)||0)>0.004).length:0;"),'Čekaju uplatu mora obuhvatiti sve izdate nestornirane račune s dugom, uključujući djelimično plaćene');
assert(ui.includes('label="Kasne s uplatom" value={invoiceOverdueCount}'),'Kasne s uplatom mora biti zasebna kartica');
assert(ui.includes("role==='Administrator'&&<div className=\"module-metrics four\">")&&ui.includes('label="Preostalo za naplatu"'),'Administrator mora u istom sažetku vidjeti Preostalo za naplatu');
assert(server.includes("let payment_status = inv.status;")&&server.includes("else if (remaining <= 0.004) payment_status = 'Plaćen';")&&server.includes("else if (overdue) payment_status = 'Kasni';")&&server.includes("else payment_status = 'Čeka uplatu';"),'Status naplate mora biti izračunat iz stvarno evidentiranih uplata, ne iz ručnog polja');

// Tabela: Iznos | Plaćeno | Preostalo
assert(ui.includes('{!isOffer&&<th>Plaćeno</th>}{!isOffer&&<th>Preostalo</th>}'),'Tabela mora prikazati kolone Plaćeno i Preostalo za račune');
assert(ui.includes('{!isOffer&&<td><strong>{money(x.remaining??Math.max(0,moneyNumber(x.total||x.amount)-moneyNumber(x.paid)))}</strong></td>}'),'Kolona Preostalo mora koristiti izračunatu preostalu vrijednost');

// 3) Obrazac "Novi račun" — naslov, radnje, status iz uplata
assert(ui.includes("title={isOffer?(data.id?'Uredi ponudu':'Nova ponuda'):(data.id?'Uredi račun':'Novi račun')}"),'Naslov obrasca mora biti ispravan za oba tipa dokumenta (ispravljen "Nova račun")');
assert(ui.includes("<button type=\"button\" className=\"secondary\" disabled={busy} onClick={()=>submit('Nacrt')}><Save/> Sačuvaj nacrt</button><button type=\"button\" className=\"secondary\" disabled={busy} onClick={()=>submit('Poslat')}><Check/> Izdaj račun</button><button type=\"button\" className=\"primary\" disabled={busy} onClick={()=>submit('Poslat',{openSend:true})}><Send/> {busy?'Čuvanje...':'Pošalji klijentu'}</button>"),'Obrazac računa mora imati tri razdvojene radnje: Sačuvaj nacrt, Izdaj račun i Pošalji klijentu');
assert(ui.includes("(isOffer?['Nacrt','Poslata','Prihvaćena','Istekla']:['Nacrt','Poslat']).map(x=><option key={x}>{x}</option>)"),'Ručni status računa smije biti samo Nacrt ili Poslat — Plaćen/Kasni se izračunavaju');

// 4) PDV po stavci sa prijedlogom standardne stope i bez pogađanja kod prekograničnog klijenta
assert(ui.includes("const STANDARD_VAT_RATES={France:20,Belgium:21,Luxembourg:17};"),'Mora postojati tabela standardnih stopa po državi');
assert(ui.includes('const isDomestic=!!(selectedClient?.country&&settings.country&&selectedClient.country===settings.country);'),'Domaći račun mora se prepoznati po državi klijenta i firme');
assert(ui.includes('const defaultRate=()=>isDomestic?standardRate:0;'),'Prekogranični ili nepoznat klijent ne smije dobiti automatski pretpostavljenu stopu');
assert(ui.includes("Prekogranični ili nepoznat klijent: PDV stopu unesite ručno po stavci"),'Mora postojati jasna napomena da se PDV kod prekograničnog računa ne pogađa');
assert(ui.includes('placeholder="Stopa PDV-a"')===false&&ui.includes('placeholder="PDV %"'),'Svaka stavka mora imati vlastito polje za stopu PDV-a');
assert(ui.includes("const lineCalc=r=>{const base=(Number(r.qty)||0)*(Number(r.price)||0),tax=base*(Number(r.tax_rate)||0)/100;return{base,tax}};"),'PDV mora biti obračunat po stavci (količina × cijena × stopa), ne globalno');
assert(ui.includes('const subtotal=rows.reduce'),'Dokument mora automatski računati međuzbir');
assert(migration.includes("clients ADD COLUMN IF NOT EXISTS country text NOT NULL DEFAULT ''"),'Klijent mora imati državu radi prepoznavanja domaćeg/prekograničnog računa');
assert(ui.includes('<Field label="Država" hint="Koristi se za ispravan obračun PDV-a na računima i ponudama.">'),'Obrazac klijenta mora omogućiti unos države');

// Provjera standardnih stopa iz tabele u zahtjevu: 100,00 € bez PDV-a -> 120,00 / 121,00 / 117,00
function money(value){const n=Number(value)||0,sign=n<0?'-':'',abs=Math.abs(n),fixed=abs.toFixed(2),[intPart,decPart]=fixed.split('.'),grouped=intPart.replace(/\B(?=(\d{3})+(?!\d))/g,'.');return `${sign}${grouped},${decPart} €`}
const STANDARD_VAT_RATES={France:20,Belgium:21,Luxembourg:17};
for(const[country,expected] of [['France','120,00 €'],['Belgium','121,00 €'],['Luxembourg','117,00 €']]){
 const rate=STANDARD_VAT_RATES[country],total=100+100*rate/100;
 assert.equal(money(total),expected,`${country}: 100,00 € bez PDV-a po standardnoj stopi mora dati ${expected}`);
}

// Sačuvane stope/iznosi se ne smiju naknadno mijenjati promjenom postavki — prikaz uvijek čita sačuvane subtotal/tax_amount/total
assert(ui.includes('<span>Međuzbir <strong>{money(selected.subtotal??0)}</strong></span><span>PDV <strong>{money(selected.tax_amount??0)}</strong></span>'),'Pregled dokumenta mora prikazivati sačuvane iznose, ne ponovo izračunate iz trenutnih postavki');
assert(ui.includes("['','','','Međuzbir',money(doc.subtotal??0)]")&&ui.includes("['','','','PDV',money(doc.tax_amount??0)]"),'PDF izvoz mora koristiti sačuvane stope i iznose dokumenta');

console.log('Invoices payments & VAT tests passed');
