import React, { createContext, useContext, useState, useEffect } from 'react';

// Početni (fallback) demo podaci — koriste se samo ako API/baza nisu dostupni
// (npr. u sandbox pregledu bez pokrenutog backend-a). Na produkciji (OctaDeploy)
// ovi podaci se koriste isključivo za prvo punjenje prazne baze (vidi scripts/migrate.js).
export const clientsSeed = [
 {id:1,name:'Novak Stan',type:'Fizičko lice',contact:'Novak Hadžić',email:'novak@email.com',phone:'+387 61 123 456',city:'Sarajevo',address:'Titova 12',jobs:8,value:'2.450,00 €',status:'Aktivan',note:'Redovni klijent. Godišnji servis klime.'},
 {id:2,name:'Porodić d.o.o.',type:'Pravno lice',contact:'Emir Porodić',email:'info@porodic.ba',phone:'+387 61 222 333',city:'Banja Luka',address:'Kralja Petra I 44',jobs:14,value:'7.820,00 €',status:'Aktivan',note:'Ugovoreno kvartalno održavanje.'},
 {id:3,name:'Kovač d.o.o.',type:'Pravno lice',contact:'Milan Kovač',email:'info@kovac.ba',phone:'+387 63 111 222',city:'Mostar',address:'Kneza Branimira 8',jobs:5,value:'3.180,00 €',status:'Novi upit',note:'Traži ponudu za tri poslovnice.'},
 {id:4,name:'Ivanović',type:'Fizičko lice',contact:'Maja Ivanović',email:'maja@email.com',phone:'+387 62 987 654',city:'Tuzla',address:'Slatina 16',jobs:11,value:'4.600,00 €',status:'Aktivan',note:''}
];
export const jobsSeed = [
 {id:1,no:'P-1054',client:'Porodić d.o.o.',service:'Servis bojlera',date:'25.03.2025.',time:'08:00',worker:'Marko Ilić',city:'Sarajevo',priority:'Standardno',status:'U toku',amount:'180,00 €'},
 {id:2,no:'P-1055',client:'Novak Stan',service:'Popravka instalacije',date:'25.03.2025.',time:'10:30',worker:'Ivan Kovač',city:'Ilidža',priority:'Standardno',status:'Zakazano',amount:'120,00 €'},
 {id:3,no:'P-1056',client:'Kovač d.o.o.',service:'Montaža klime',date:'25.03.2025.',time:'13:00',worker:'Petar Jurić',city:'Vogošća',priority:'Visoko',status:'Zakazano',amount:'640,00 €'},
 {id:4,no:'P-1057',client:'Marić Stan',service:'Curenje vode',date:'25.03.2025.',time:'15:30',worker:'Marko Ilić',city:'Centar',priority:'Hitno',status:'Novi',amount:'—'}
];
export const offersSeed = [
 {id:1,no:'PN-028',client:'Kovač d.o.o.',date:'24.03.2025.',valid:'31.03.2025.',amount:'1.850,00 €',status:'Poslata'},
 {id:2,no:'PN-027',client:'Novak Stan',date:'22.03.2025.',valid:'29.03.2025.',amount:'750,00 €',status:'Prihvaćena'},
 {id:3,no:'PN-026',client:'Marić Stan',date:'20.03.2025.',valid:'27.03.2025.',amount:'350,00 €',status:'Nacrt'},
 {id:4,no:'PN-025',client:'Porodić d.o.o.',date:'18.03.2025.',valid:'25.03.2025.',amount:'980,00 €',status:'Istekla'}
];
export const invoicesSeed = [
 {id:1,no:'R-041',client:'Novak Stan',issued:'24.03.2025.',due:'31.03.2025.',amount:'750,00 €',paid:'750,00 €',status:'Plaćen'},
 {id:2,no:'R-042',client:'Kovač d.o.o.',issued:'23.03.2025.',due:'30.03.2025.',amount:'1.200,00 €',paid:'0,00 €',status:'Poslat'},
 {id:3,no:'R-043',client:'Marić Stan',issued:'14.03.2025.',due:'21.03.2025.',amount:'350,00 €',paid:'0,00 €',status:'Kasni'},
 {id:4,no:'R-044',client:'Porodić d.o.o.',issued:'20.03.2025.',due:'27.03.2025.',amount:'450,00 €',paid:'450,00 €',status:'Plaćen'}
];
export const stockSeed = [
 {id:1,code:'MAT-001',name:'Klima uređaj 12K BTU',category:'Klima oprema',unit:'kom',stock:8,min:3,buy:'480,00 €',sell:'600,00 €',status:'Dostupno'},
 {id:2,code:'MAT-002',name:'Bakarna cijev 1/4',category:'Instalacije',unit:'m',stock:42,min:20,buy:'4,20 €',sell:'7,50 €',status:'Dostupno'},
 {id:3,code:'MAT-003',name:'Termostat digitalni',category:'Grijanje',unit:'kom',stock:2,min:5,buy:'35,00 €',sell:'55,00 €',status:'Niska zaliha'},
 {id:4,code:'MAT-004',name:'Ventil kuglasti 1/2',category:'Vodoinstalacije',unit:'kom',stock:0,min:10,buy:'6,50 €',sell:'12,00 €',status:'Nema na stanju'}
];
export const maintenanceSeed = [
 {id:1,client:'Novak Stan',asset:'Klima uređaj Daikin',service:'Godišnji servis',next:'15.05.2025.',cycle:'12 mjeseci',worker:'Ivan Kovač',status:'Za 50 dana'},
 {id:2,client:'Porodić d.o.o.',asset:'Bojler Bosch 80L',service:'Preventivni pregled',next:'20.06.2025.',cycle:'6 mjeseci',worker:'Marko Ilić',status:'Za 86 dana'},
 {id:3,client:'Kovač d.o.o.',asset:'Sistem grijanja',service:'Servis grijanja',next:'10.09.2025.',cycle:'12 mjeseci',worker:'Petar Jurić',status:'Za 168 dana'}
];

const API = '/api';
async function apiGet(table){const r=await fetch(`${API}/${table}`);if(!r.ok)throw new Error('get failed');return r.json();}
async function apiPost(table,body){const r=await fetch(`${API}/${table}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});if(!r.ok)throw new Error('post failed');return r.json();}
async function apiPut(table,id,body){const r=await fetch(`${API}/${table}/${id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});if(!r.ok)throw new Error('put failed');return r.json();}
async function apiDelete(table,id){const r=await fetch(`${API}/${table}/${id}`,{method:'DELETE'});if(!r.ok)throw new Error('delete failed');return r.json();}
function stripId(o){const c={...o};delete c.id;return c;}

// Pretvara obično setStanje(updater) pozivanje (koje cijela aplikacija već koristi) u
// istovremeno ažuriranje lokalnog stanja I sinhronizaciju sa pravim backend-om/bazom.
// Ako backend nije dostupan (npr. sandbox pregled bez servera), lokalna izmjena i dalje
// prolazi — aplikacija ostaje upotrebljiva, samo se ne trajno ne čuva.
function makeSynced(table, currentArr, rawSetter) {
  return updater => {
    const next = typeof updater === 'function' ? updater(currentArr) : updater;
    const prevIds = new Set(currentArr.map(x => x.id));
    const nextIds = new Set(next.map(x => x.id));
    currentArr.forEach(p => { if (!nextIds.has(p.id)) apiDelete(table, p.id).catch(() => {}); });
    next.forEach(n => {
      if (!prevIds.has(n.id)) {
        apiPost(table, stripId(n)).then(saved => {
          rawSetter(cur => cur.map(x => x.id === n.id ? saved : x));
        }).catch(() => {});
      } else {
        const before = currentArr.find(p => p.id === n.id);
        if (before && JSON.stringify(before) !== JSON.stringify(n)) {
          apiPut(table, n.id, stripId(n)).catch(() => {});
        }
      }
    });
    rawSetter(next);
  };
}

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [clients, _setClients] = useState(clientsSeed);
  const [jobs, _setJobs] = useState(jobsSeed);
  const [offers, _setOffers] = useState(offersSeed);
  const [invoices, _setInvoices] = useState(invoicesSeed);
  const [stock, _setStock] = useState(stockSeed);
  const [maintenance, _setMaintenance] = useState(maintenanceSeed);
  const [loading, setLoading] = useState(true);
  const [backendOnline, setBackendOnline] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [c, j, o, i, s, m] = await Promise.all([
          apiGet('clients'), apiGet('jobs'), apiGet('offers'), apiGet('invoices'), apiGet('stock'), apiGet('maintenance')
        ]);
        if (cancelled) return;
        _setClients(c); _setJobs(j); _setOffers(o); _setInvoices(i); _setStock(s); _setMaintenance(m);
        setBackendOnline(true);
      } catch (e) {
        // Backend/baza nisu dostupni (npr. sandbox pregled) — ostajemo na demo podacima iznad.
        setBackendOnline(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const setClients = makeSynced('clients', clients, _setClients);
  const setJobs = makeSynced('jobs', jobs, _setJobs);
  const setOffers = makeSynced('offers', offers, _setOffers);
  const setInvoices = makeSynced('invoices', invoices, _setInvoices);
  const setStock = makeSynced('stock', stock, _setStock);
  const setMaintenance = makeSynced('maintenance', maintenance, _setMaintenance);

  const addClient = data => { const rec = { type: 'Fizičko lice', status: 'Aktivan', address: '', note: '', jobs: 0, value: '0,00 €', ...data, id: Date.now() }; setClients(a => [...a, rec]); return rec; };
  const addJob = data => { const no = data.no || `P-${1058 + jobs.length}`; const rec = { priority: 'Standardno', status: 'Zakazano', city: '', amount: '—', ...data, id: Date.now(), no }; setJobs(a => [...a, rec]); return rec; };
  const addOffer = data => { const no = data.no || `PN-0${29 + offers.length}`; const rec = { status: 'Nacrt', ...data, id: Date.now(), no }; setOffers(a => [...a, rec]); return rec; };
  const addInvoice = data => { const no = data.no || `R-0${45 + invoices.length}`; const rec = { status: 'Nacrt', paid: '0,00 €', ...data, id: Date.now(), no }; setInvoices(a => [...a, rec]); return rec; };
  const addStock = data => {
    const stockNum = +data.stock || 0, minNum = +data.min || 0;
    const status = stockNum === 0 ? 'Nema na stanju' : stockNum <= minNum ? 'Niska zaliha' : 'Dostupno';
    const rec = { unit: 'kom', buy: '0,00 €', sell: '0,00 €', category: 'Ostalo', ...data, id: Date.now(), code: data.code || `MAT-0${10 + stock.length}`, status };
    setStock(a => [...a, rec]);
    return rec;
  };

  // PDF preko pravog backend-a (pdfkit); ako backend nije dostupan, poziv baca grešku
  // i poziva strana (App.jsx) se vraća na klijentski exportToPDF.
  const downloadInvoicePDF = async invoiceId => {
    const r = await fetch(`${API}/pdf/invoice/${invoiceId}`);
    if (!r.ok) throw new Error('pdf failed');
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `racun-${invoiceId}.pdf`; a.click();
    URL.revokeObjectURL(url);
  };
  const downloadOfferPDF = async offerId => {
    const r = await fetch(`${API}/pdf/offer/${offerId}`);
    if (!r.ok) throw new Error('pdf failed');
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `ponuda-${offerId}.pdf`; a.click();
    URL.revokeObjectURL(url);
  };

  // Slanje pravog emaila preko backend-a (koristi SMTP ako je podešen u OctaCloud env-u,
  // inače backend vrati simulated:true i email zabilježi u serverskim logovima).
  const sendEmail = async ({ to, subject, message }) => {
    const r = await fetch(`${API}/email/send`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to, subject, message }) });
    if (!r.ok) throw new Error('email failed');
    return r.json();
  };

  const value = {
    clients, setClients, jobs, setJobs, offers, setOffers, invoices, setInvoices, stock, setStock, maintenance, setMaintenance,
    addClient, addJob, addOffer, addInvoice, addStock,
    loading, backendOnline, downloadInvoicePDF, downloadOfferPDF, sendEmail
  };
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within <DataProvider>');
  return ctx;
}
