import fs from'node:fs';import assert from'node:assert/strict';
const ui=fs.readFileSync('src/Modules.jsx','utf8'),server=fs.readFileSync('server/index.js','utf8'),mig=fs.readFileSync('scripts/migrate.js','utf8');

// Kritičan pre-postojeći bug u generičkom UPDATE-u (nedostajali $ placeholderi) mora biti ispravljen.
assert(server.includes('const set = cols.map((c, i) => `${c}=$${i + 1}`).join'),'Generički PUT mora koristiti $ placeholdere, inače puca svako uređivanje klijenta/stocka/održavanja');

// 1) Slanje ponude: nacrt s isteklim rokom ostaje Nacrt, status se mijenja tek nakon potvrđenog slanja.
assert(!ui.includes("const sendOffer=x=>save({...x,status:'Poslata'})"),'Klik na slanje ne smije direktno flipovati status bez potvrde i uspješnog slanja');
assert(ui.includes("onClick={()=>setModal({type:'send-offer',data:x})}"),'Ikonica slanja mora otvoriti pravi tok slanja ponude');
assert(ui.includes('function SendOfferModal({offer,close,onSent}){'),'Mora postojati poseban modal za stvarno slanje ponude');
assert(ui.includes('info?.expired?'),'Istekao rok mora tražiti novi datum prije slanja');
assert(server.includes("app.get('/api/offers/:id/send-info'"));
assert(server.includes("if(row.status!=='Nacrt')return res.status(409)"));
assert(server.includes("app.post('/api/offers/:id/send'"));
assert(server.includes('if(o.status!==\'Nacrt\')return res.status(409)'));
assert(server.includes('if(validDate&&validDate<today)return res.status(409)'));
assert(server.includes("UPDATE offers SET status='Poslata',sent_at=now()"));

// 2) PDV po stavci: razlika neodabrano/0%, placeholder dok nema klijenta, prijedlog stope, nepotpun nacrt dozvoljen, validacija prije izdavanja/slanja.
assert(ui.includes("tax_rate:''"),'Nova stavka mora početi bez odabrane stope (ne 0%)');
assert(ui.includes('!f.client?<span className="field-help">Odaberite klijenta</span>'),'Prije izbora klijenta mora pisati Odaberite klijenta umjesto stope');
assert(ui.includes("x===standardRate?' (standardna)':''"),'Mora predložiti standardnu stopu iz postavki firme');
assert(ui.includes('Prilagođeno %'),'Mora dozvoliti ručni unos stope različit od ponuđenih');
assert(ui.includes('const isDraftSave=status===\'Nacrt\''),'Nacrt mora imati olabavljenu validaciju');
assert(ui.includes("if(validItems.some(x=>x.tax_rate===''))throw new Error('Odaberite PDV stopu za svaku stavku prije izdavanja ili slanja.')"));
assert(server.includes("if (items.some(x => x.tax_rate === '' || x.tax_rate == null)) return res.status(400)"),'Server mora provjeriti PDV stopu prije izdavanja/slanja pri kreiranju');
assert(server.includes("if (effectiveItems.some(x => x.tax_rate === '' || x.tax_rate == null)) return res.status(400)"),'Server mora provjeriti PDV stopu prije izdavanja/slanja pri izmjeni');

// 3) Akcije računa: nacrt/izdavanje/slanje razdvojeni, zaštita od duplog klika i duplog zapisa.
assert(ui.includes("onClick={()=>submit('Nacrt')}")&&ui.includes("Sačuvaj nacrt"));
assert(ui.includes("onClick={()=>submit('Poslat')}")&&ui.includes("Izdaj račun"));
assert(ui.includes("onClick={()=>submit('Poslat',{openSend:true})}")&&ui.includes('Pošalji klijentu'));
assert(ui.includes('const submitting=useRef(false);const createKey=useRef('),'Obrazac ponude/računa mora imati zaštitu od dvostrukog slanja i create_key');
assert(ui.includes('if(submitting.current)return;submitting.current=true'));
assert(mig.includes('idx_offers_company_create_key')&&mig.includes('idx_invoices_company_create_key'));
assert(server.includes('const createKey = req.body?.create_key'));
assert(server.includes("if (e?.code === '23505' && req.body?.create_key)"));

// 4) Naplata i prava: djelimična/puna uplata, Plaćeno/Preostalo iz stvarnih uplata, Čeka/Kasni s uplatom, storno i ispravka samo admin.
assert(server.includes("app.post('/api/invoices/:id/payments'"));
assert(server.includes('paid_total,remaining'.replace(',', ''))||server.includes('paid_total'));
assert(server.includes("if (req.user.role !== 'Administrator') return res.status(403).json({ error: 'Samo administrator može stornirati izdati račun.' })"));
assert(server.includes("if (req.user.role !== 'Administrator') return res.status(403).json({ error: 'Samo administrator može ispraviti pogrešno evidentiranu uplatu.' })"));
assert(ui.includes("role==='Administrator'&&<AdminPaymentsPanel"),'Ispravka uplate mora biti dostupna samo administratoru u interfejsu');
assert(ui.includes('function AdminPaymentsPanel('));
assert(ui.includes("invoiceWaitingCount=!isOffer?items.filter(x=>!['Nacrt','Stornirano'].includes(x.status)&&(Number(x.remaining)||0)>0.004).length:0"));
assert(ui.includes('overdueWithDebt=x=>!!x.overdue'));

console.log('Office offers/invoices tests passed');
