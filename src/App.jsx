import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard, Users, BriefcaseBusiness, CalendarDays, FileText, ReceiptText,
  Package, Wrench, BarChart3, Settings, Search, Bell, Plus, ChevronDown,
  ArrowUpRight, ArrowDownRight, MoreHorizontal, MapPin, Clock3, CheckCircle2,
  AlertCircle, TrendingUp, WalletCards, Menu, X, Phone, Mail, SlidersHorizontal,
  ArrowRight, Zap, Droplets, Wind, Hammer, UserRound, Check, Circle, ChevronRight,
  LogOut, UserCog, ShieldCheck, Ban, Trash2, Send, RotateCcw, Info, Bot, Save, Edit3, Eye, Download,
  Laptop, Smartphone, Globe, AlertTriangle, Building2, Archive, Activity, Database, Server, CreditCard, ScrollText
} from 'lucide-react';
import { Login, Register, ForgotPassword, AcceptInvite, PasswordStrength } from './Auth';
import { ClientsModule, JobsModule, ScheduleModule, OffersModule, InvoicesModule, StockModule, MaintenanceModule, ReportsModule, SettingsModule, exportToPDF } from './Modules';
import AIAssistant from './AIAssistant';
import { OwnerOverview, OwnerCompanies, OwnerUsers, OwnerAudit, OwnerSettings } from './PlatformOwner';
import { DataProvider, useData } from './store';

const navItems = [
  ['Početna', LayoutDashboard], ['Klijenti', Users], ['Poslovi', BriefcaseBusiness],
  ['Raspored', CalendarDays], ['Ponude', FileText], ['Računi', ReceiptText],
  ['Materijal', Package], ['Održavanje', Wrench], ['AI pomoćnik', Bot], ['Izvještaji', BarChart3]
];
const ownerNavItems=[
 ['Owner pregled',LayoutDashboard],['Firme',Building2],['Svi korisnici',Users],
 ['Pretplate',CreditCard],['Sistem',Server],['Audit zapis',ScrollText],['Postavke aplikacije',Settings]
];

const jobs = [
  {time:'08:00', client:'Porodić d.o.o.', task:'Servis bojlera', worker:'Marko Ilić', place:'Sarajevo', status:'U toku', tone:'blue', icon:Droplets},
  {time:'10:30', client:'Novak Stan', task:'Popravka instalacije', worker:'Ivan Kovač', place:'Ilidža', status:'Zakazano', tone:'amber', icon:Zap},
  {time:'13:00', client:'Kovač d.o.o.', task:'Montaža klime', worker:'Petar Jurić', place:'Vogošća', status:'Zakazano', tone:'purple', icon:Wind},
  {time:'15:30', client:'Marić Stan', task:'Curenje vode', worker:'Marko Ilić', place:'Centar', status:'Hitno', tone:'red', icon:Wrench}
];

const clients = [
 {name:'Novak Stan', contact:'novak@email.com', city:'Sarajevo', jobs:8, value:'2.450 €', status:'Aktivan', initials:'NS', color:'#dbeafe'},
 {name:'Porodić d.o.o.', contact:'+387 61 123 456', city:'Banja Luka', jobs:14, value:'7.820 €', status:'Aktivan', initials:'PD', color:'#dcfce7'},
 {name:'Kovač d.o.o.', contact:'info@kovac.ba', city:'Mostar', jobs:5, value:'3.180 €', status:'Novi upit', initials:'KD', color:'#fef3c7'},
 {name:'Ivanović', contact:'+387 62 987 654', city:'Tuzla', jobs:11, value:'4.600 €', status:'Aktivan', initials:'IV', color:'#ede9fe'},
 {name:'Marić Stan', contact:'maric@email.com', city:'Zenica', jobs:3, value:'960 €', status:'Potencijalni', initials:'MS', color:'#fee2e2'}
];

const teamUsersSeed = [
 {id:1,name:'Marko Kovač',email:'marko@telopak.ba',phone:'+387 61 111 222',role:'Administrator',status:'Aktivan',joined:'12.01.2024.',initials:'MK',color:'#dbeafe'},
 {id:2,name:'Ivan Kovač',email:'ivan@telopak.ba',phone:'+387 61 222 333',role:'Radnik na terenu',status:'Aktivan',joined:'03.03.2024.',initials:'IK',color:'#dcfce7'},
 {id:3,name:'Petar Jurić',email:'petar@telopak.ba',phone:'+387 61 333 444',role:'Radnik na terenu',status:'Aktivan',joined:'18.05.2024.',initials:'PJ',color:'#ede9fe'},
 {id:4,name:'Ana Horvat',email:'ana@telopak.ba',phone:'+387 61 444 555',role:'Kancelarija',status:'Aktivan',joined:'02.09.2024.',initials:'AH',color:'#fef3c7'},
 {id:5,name:'Nikola Babić',email:'nikola@telopak.ba',phone:'+387 61 555 666',role:'Radnik na terenu',status:'Neaktivan',joined:'11.11.2023.',initials:'NB',color:'#fee2e2'}
];

function Logo({brand}){return <div className="logo brand-sidebar-logo">{brand?.logo_data?<img src={brand.logo_data} alt={brand.app_name||'Logo'}/>:<img src={import.meta.env.BASE_URL + 'telopak-flux-logo.svg'} alt="TeloPak Flux"/>}</div>}

class ErrorBoundary extends React.Component{
 constructor(p){super(p);this.state={error:null}}
 static getDerivedStateFromError(error){return {error}}
 componentDidCatch(error,info){console.error('UI greška:',error,info)}
 render(){
  if(this.state.error) return <div className="crash-screen"><AlertTriangle/><h2>Nešto je pošlo po zlu</h2><p>Došlo je do neočekivane greške u ovom dijelu aplikacije. Detalji ispod mogu pomoći pri rješavanju problema.</p><pre>{String(this.state.error?.message||this.state.error)}</pre><button className="primary" onClick={()=>this.setState({error:null})}>Pokušaj ponovo</button></div>;
  return this.props.children;
 }
}
function Badge({children,tone}){return <span className={`badge ${tone||children.toLowerCase().replace(' ','-')}`}>{children}</span>}
function Stat({title,value,meta,up,icon:Icon,tone,onClick}){return <article className={`stat-card ${onClick?'clickable':''}`} onClick={onClick}><div className={`stat-icon ${tone}`}><Icon size={20}/></div><div className="stat-copy"><span>{title}</span><strong>{value}</strong><small className={up===false?'down':'up'}>{up===false?<ArrowDownRight/>:<ArrowUpRight/>}{meta}</small></div></article>}

const DASH_MONTHS=['januar','februar','mart','april','maj','juni','juli','august','septembar','oktobar','novembar','decembar'];
const DASH_DAYS=['nedjelja','ponedjeljak','utorak','srijeda','četvrtak','petak','subota'];
const chartDatasets={
 '7 dana':{total:'5.840 €',trend:'+18,2%',labels:['Pon','Uto','Sri','Čet','Pet','Sub','Ned'],values:[42,58,47,76,67,91,72]},
 '30 dana':{total:'18.420 €',trend:'+12,5%',labels:['S1','S2','S3','S4'],values:[54,68,61,88]}
};

function RowMenu({items}){
 const [open,setOpen]=useState(false); const ref=useRef(null); useClickOutside(ref,()=>setOpen(false));
 return <div className="row-menu-wrap" ref={ref} onClick={e=>e.stopPropagation()}>
  <button className="icon-btn" onClick={()=>setOpen(o=>!o)}><MoreHorizontal/></button>
  {open&&<div className="row-menu-pop">{items.map(it=><button key={it.label} className={it.danger?'danger':''} onClick={()=>{it.onClick();setOpen(false)}}>{it.icon&&<it.icon/>}{it.label}</button>)}</div>}
 </div>;
}

function Dashboard({openNew,go,notify,profile}){
 const {invoices:liveInvoices,downloadInvoicePDF,sendEmail}=useData();
 const invoicesToShow=useMemo(()=>[...liveInvoices].slice(-6).reverse(),[liveInvoices]);
 const handleDownloadPDF=async inv=>{
  try{ await downloadInvoicePDF(inv.id); notify(`PDF za račun ${inv.no} je preuzet.`); }
  catch(e){ exportToPDF(`Račun ${inv.no}`,`Klijent: ${inv.client}`,['Podatak','Vrijednost'],[['Klijent',inv.client],['Datum',inv.issued],['Iznos',inv.amount],['Status',inv.status]]); notify(`PDF za račun ${inv.no} je generisan lokalno (backend nedostupan).`); }
 };
 const handleSendReminder=async inv=>{
  try{
   const r=await sendEmail({to:'klijent@example.com',subject:`Podsjetnik za račun ${inv.no}`,message:`Poštovani, ovo je podsjetnik da je račun ${inv.no} u iznosu od ${inv.amount} na čekanju plaćanja.`});
   notify(r.simulated?`Podsjetnik za ${inv.no} je zabilježen (SMTP nije podešen u OctaCloud postavkama).`:`Podsjetnik za ${inv.no} je uspješno poslan emailom.`);
  }catch(e){ notify(`Podsjetnik za račun ${inv.no} je zabilježen lokalno (backend nedostupan).`); }
 };
 const now=new Date();
 const firstName=(profile?.name||'Marko').split(' ')[0];
 const greeting=now.getHours()<12?'Dobro jutro':now.getHours()<18?'Dobar dan':'Dobro veče';
 const dateLabel=`${DASH_DAYS[now.getDay()].toUpperCase()}, ${now.getDate()}. ${DASH_MONTHS[now.getMonth()].toUpperCase()}`;
 const [chartPeriod,setChartPeriod]=useState('7 dana');
 const chart=chartDatasets[chartPeriod];
 const attention=[
  {title:'Ponuda ističe danas',sub:'Kovač d.o.o. · P-028',tone:'amber',icon:Clock3,page:'Ponude'},
  {title:'Račun kasni 7 dana',sub:'Marić Stan · R-043',tone:'red',icon:AlertCircle,page:'Računi'},
  {title:'Servis za 5 dana',sub:'Novak Stan · Klima uređaj',tone:'green',icon:Wrench,page:'Održavanje'}
 ];
 return <>
  <div className="page-head"><div><p className="eyebrow">{dateLabel}</p><h1>{greeting}, {firstName} 👋</h1><p>Ovo je pregled vašeg poslovanja za danas.</p></div><button className="primary" onClick={openNew}><Plus/> Novi posao</button></div>
  <section className="stats-grid">
   <Stat title="Prihod ovog mjeseca" value="18.420 €" meta="12,5% od prošlog mj." icon={WalletCards} tone="blue" onClick={()=>go('Izvještaji')}/>
   <Stat title="Aktivni poslovi" value="24" meta="4 nova ove sedmice" icon={BriefcaseBusiness} tone="green" onClick={()=>go('Poslovi')}/>
   <Stat title="Otvorene ponude" value="8" meta="2 čekaju odgovor" icon={FileText} tone="orange" onClick={()=>go('Ponude')}/>
   <Stat title="Nenaplaćeno" value="2.150 €" meta="8,2% od prošlog mj." up={false} icon={AlertCircle} tone="red" onClick={()=>go('Računi')}/>
  </section>
  <section className="dashboard-grid">
   <article className="card schedule-card"><CardHead title="Današnji raspored" sub="4 intervencije" action="Otvori raspored" onAction={()=>go('Raspored')}/>
    <div className="timeline">{jobs.map((j,i)=><div className="timeline-row" key={j.client}><div className="time">{j.time}</div><div className={`line-dot ${j.tone}`}></div><div className="job-info"><div><strong>{j.client}</strong><span>{j.task}</span></div><div className="job-meta"><span><UserRound/> {j.worker}</span><span><MapPin/> {j.place}</span></div></div><Badge tone={j.tone}>{j.status}</Badge><RowMenu items={[{label:'Detalji posla',icon:Eye,onClick:()=>go('Poslovi')},{label:'Otvori u rasporedu',icon:CalendarDays,onClick:()=>go('Raspored')},{label:'Kontaktiraj klijenta',icon:Phone,onClick:()=>notify(`Poziv klijentu ${j.client} je zabilježen.`)}]}/></div>)}</div>
   </article>
   <article className="card activity-card"><CardHead title="Aktivnost poslova" sub={`Posljednjih ${chartPeriod}`}>
     <div className="segmented sm"><button className={chartPeriod==='7 dana'?'active':''} onClick={()=>setChartPeriod('7 dana')}>7 dana</button><button className={chartPeriod==='30 dana'?'active':''} onClick={()=>setChartPeriod('30 dana')}>30 dana</button></div>
    </CardHead>
    <div className="chart"><div className="chart-labels"><span>12k</span><span>8k</span><span>4k</span><span>0</span></div><div className="bars">{chart.values.map((h,i)=><div className="bar-col" key={i}><div className="bar" style={{height:`${h}%`}}></div><span>{chart.labels[i]}</span></div>)}</div></div>
    <div className="chart-total"><div><span>UKUPAN PRIHOD</span><strong>{chart.total}</strong></div><div className="trend"><TrendingUp/> {chart.trend}</div></div>
   </article>
   <article className="card tasks-card"><CardHead title="Zahtijeva pažnju" sub="5 stavki"/>
    {attention.map((t,i)=><div className="attention clickable" key={t.title} onClick={()=>go(t.page)}><div className={`attention-icon ${t.tone}`}><t.icon/></div><div><strong>{t.title}</strong><span>{t.sub}</span></div><ChevronRight/></div>)}
    <button className="text-button" onClick={()=>go('AI pomoćnik')}>Prikaži sve obaveze <ArrowRight/></button>
   </article>
  </section>
  <section className="card invoices"><CardHead title="Posljednji računi" sub="Pregled nedavno izdatih računa" action="Svi računi" onAction={()=>go('Računi')}/>
   <div className="table-wrap"><table><thead><tr><th>Broj</th><th>Klijent</th><th>Datum</th><th>Iznos</th><th>Status</th><th></th></tr></thead><tbody>{invoicesToShow.map(r=><tr key={r.id} className="clickable-row" onClick={()=>go('Računi')}><td className="mono">{r.no}</td><td><strong>{r.client}</strong></td><td>{r.issued}</td><td><strong>{r.amount}</strong></td><td><Badge>{r.status}</Badge></td><td><RowMenu items={[{label:'Pregledaj račun',icon:Eye,onClick:()=>go('Računi')},{label:'Preuzmi PDF',icon:Download,onClick:()=>handleDownloadPDF(r)},{label:'Pošalji podsjetnik',icon:Send,onClick:()=>handleSendReminder(r)}]}/></td></tr>)}</tbody></table></div>
  </section>
 </>
}

function CardHead({title,sub,action,onAction,children}){return <div className="card-head"><div><h3>{title}</h3><p>{sub}</p></div>{children}{action&&<button onClick={onAction}>{action}<ChevronRight/></button>}</div>}

function Clients({openNew}){return <><div className="page-head"><div><p className="eyebrow">BAZA KLIJENATA</p><h1>Klijenti</h1><p>Svi kontakti, poslovi i dokumenti na jednom mjestu.</p></div><button className="primary" onClick={openNew}><Plus/> Novi klijent</button></div><section className="card"><div className="toolbar"><div className="search-inner"><Search/><input placeholder="Pretraži klijente..."/></div><button className="secondary"><SlidersHorizontal/> Filteri</button></div><div className="table-wrap"><table><thead><tr><th>Klijent</th><th>Kontakt</th><th>Grad</th><th>Poslovi</th><th>Ukupna vrijednost</th><th>Status</th><th></th></tr></thead><tbody>{clients.map(c=><tr key={c.name}><td><div className="client-cell"><span className="avatar square" style={{background:c.color}}>{c.initials}</span><strong>{c.name}</strong></div></td><td>{c.contact}</td><td>{c.city}</td><td>{c.jobs}</td><td><strong>{c.value}</strong></td><td><Badge>{c.status}</Badge></td><td><MoreHorizontal size={18}/></td></tr>)}</tbody></table></div></section></>}

function GenericPage({page,openNew}){
 const data={
  'Poslovi':['Aktivni poslovi','Organizujte intervencije od upita do završetka.'],
  'Raspored':['Raspored ekipe','Pregled termina i dostupnosti radnika.'],
  'Ponude':['Ponude','Kreirajte, šaljite i pratite ponude klijentima.'],
  'Računi':['Računi i naplata','Potpun pregled izdatih računa i uplata.'],
  'Materijal':['Materijal i zalihe','Pratite potrošnju i stanje skladišta.'],
  'Održavanje':['Planirano održavanje','Automatizujte ponavljajuće servise.'],
  'Izvještaji':['Izvještaji','Pratite prihod, učinak i rast firme.'],
  'Postavke':['Postavke','Upravljajte firmom, timom i aplikacijom.']
 }[page]||[page,''];
 if(page==='Raspored') return <Schedule openNew={openNew}/>;
 return <><div className="page-head"><div><p className="eyebrow">TELOPAK</p><h1>{data[0]}</h1><p>{data[1]}</p></div><button className="primary" onClick={openNew}><Plus/> Dodaj novo</button></div><section className="stats-grid mini"><Stat title="Ukupno" value={page==='Računi'?'42':'24'} meta="Ovaj mjesec" icon={BriefcaseBusiness} tone="blue"/><Stat title="Aktivno" value="18" meta="3 danas" icon={CheckCircle2} tone="green"/><Stat title="Na čekanju" value="6" meta="Potrebna akcija" icon={Clock3} tone="orange"/></section><section className="card empty-feature"><div className="feature-icon"><Package/></div><h2>{data[0]} su spremni</h2><p>Ovaj modul koristi isti profesionalni dizajn sistem i biće povezan sa ostatkom poslovnog procesa.</p><button className="primary" onClick={openNew}><Plus/> Kreiraj prvi zapis</button></section></>
}

function Schedule({openNew}){return <><div className="page-head"><div><p className="eyebrow">ORGANIZACIJA TERENA</p><h1>Raspored ekipe</h1><p>Utorak, 25. mart 2025.</p></div><button className="primary" onClick={openNew}><Plus/> Novi termin</button></div><section className="card calendar"><div className="calendar-top"><button className="secondary">Danas</button><h3>24 — 30. mart</h3><div className="segmented"><button className="active">Sedmica</button><button>Mjesec</button></div></div><div className="week"><div className="hours"><span></span>{['08:00','10:00','12:00','14:00','16:00'].map(x=><span key={x}>{x}</span>)}</div>{['PON 24','UTO 25','SRI 26','ČET 27','PET 28'].map((d,i)=><div className={`day ${i===1?'today':''}`} key={d}><strong>{d}</strong>{i===0&&<div className="cal-job blue" style={{top:65}}>Porodić d.o.o.<small>Servis bojlera</small></div>}{i===1&&<><div className="cal-job green" style={{top:115}}>Novak Stan<small>Popravka instalacije</small></div><div className="cal-job red" style={{top:245}}>Marić Stan<small>Curenje vode</small></div></>}{i===2&&<div className="cal-job purple" style={{top:82}}>Kovač d.o.o.<small>Montaža klime</small></div>}{i===3&&<div className="cal-job amber" style={{top:172}}>Jurić Stan<small>Instalacija grijanja</small></div>}{i===4&&<div className="cal-job green" style={{top:205}}>Horvat Stan<small>Pregled instalacija</small></div>}</div>)}</div></section></>}

function roleClass(role){return role==='Administrator'?'admin':role==='Kancelarija'?'kancelarija':'radnik'}

function NewUserModal({close,onCreate}){
 const [name,setName]=useState(''); const [email,setEmail]=useState(''); const [phone,setPhone]=useState(''); const [role,setRole]=useState('Radnik na terenu');
 const submit=e=>{e.preventDefault(); onCreate({name:name||'Novi korisnik',email:email||'novi@telopak.ba',phone,role}); close();}
 return <div className="modal-backdrop" onMouseDown={close}><div className="modal user-modal" onMouseDown={e=>e.stopPropagation()}>
  <div className="modal-head"><div><span className="modal-kicker">NOVI ČLAN TIMA</span><h2>Kreiraj korisnički račun</h2><p>Radniku ćemo poslati siguran link za postavljanje lozinke.</p></div><button className="icon-btn" onClick={close}><X/></button></div>
  <form onSubmit={submit}>
   <div className="form-grid">
    <label className="full">Ime i prezime<input value={name} onChange={e=>setName(e.target.value)} placeholder="npr. Amar Selimović" required/></label>
    <label>Email adresa<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="amar@telopak.ba" required/></label>
    <label>Broj telefona<input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+387 6X XXX XXX"/></label>
    <label className="full">Uloga i nivo pristupa
     <select value={role} onChange={e=>setRole(e.target.value)}><option>Administrator</option><option>Kancelarija</option><option>Radnik na terenu</option></select>
     <span className="field-help">{role==='Administrator'?'Potpuni pristup sistemu, korisnicima i postavkama.':role==='Kancelarija'?'Pristup klijentima, poslovima, ponudama i računima.':'Pristup vlastitom rasporedu i dodijeljenim intervencijama.'}</span>
    </label>
    <div className="modal-note full"><Info/> Pozivnica važi 48 sati. Korisnik samostalno postavlja lozinku, a administrator je nikada ne vidi.</div>
   </div>
   <div className="modal-actions"><button type="button" className="secondary" onClick={close}>Odustani</button><button type="submit" className="primary"><Send/> Kreiraj i pošalji pozivnicu</button></div>
  </form>
 </div></div>
}

function UserActionModal({user,mode,close,onSave,onToggle,onDelete,onNotice}){
 const [form,setForm]=useState({...user});
 const set=(key,value)=>setForm(f=>({...f,[key]:value}));
 if(!user) return null;
 const title=mode==='edit'?'Uredi korisnika':mode==='resend'?'Ponovo pošalji pristup':mode==='status'?(user.status==='Aktivan'?'Deaktiviraj korisnika':'Aktiviraj korisnika'):mode==='delete'?'Trajno obriši korisnika':'Profil korisnika';
 const submit=e=>{e.preventDefault();if(mode==='edit'){onSave(form);onNotice('Podaci korisnika su uspješno ažurirani.')}if(mode==='resend')onNotice(`Nova pristupna pozivnica poslana je na ${user.email}.`);if(mode==='status'){onToggle(user.id);onNotice(user.status==='Aktivan'?'Pristup je odmah deaktiviran. Sve aktivne sesije su odjavljene.':'Korisnički pristup je ponovo aktiviran.');}if(mode==='delete'){onDelete(user.id);onNotice('Korisnički račun je trajno obrisan.');}close();};
 return <div className="modal-backdrop" onMouseDown={close}><div className={`modal user-modal ${mode==='delete'?'danger-modal':''}`} onMouseDown={e=>e.stopPropagation()}>
  <div className="modal-head"><div><span className="modal-kicker">UPRAVLJANJE PRISTUPOM</span><h2>{title}</h2><p>{mode==='detail'?'Pregled naloga, pristupa i sigurnosnog statusa.':mode==='edit'?'Izmjene se primjenjuju odmah na cijeli radni prostor.':mode==='resend'?'Generišite novi siguran link za postavljanje lozinke.':mode==='delete'?'Ova radnja je nepovratna i odmah ukida pristup.':'Sigurnosna promjena vrijedi odmah na svim uređajima.'}</p></div><button className="icon-btn" onClick={close}><X/></button></div>
  <form onSubmit={submit}>
   {mode==='detail'&&<div className="user-profile-content">
    <div className="user-profile-hero"><span className="avatar profile-avatar" style={{background:user.color}}>{user.initials}</span><div><h3>{user.name}</h3><div><span className={`role-badge ${roleClass(user.role)}`}>{user.role}</span><Badge>{user.status}</Badge></div></div></div>
    <div className="user-info-grid"><div><span>Email adresa</span><strong>{user.email}</strong></div><div><span>Broj telefona</span><strong>{user.phone||'Nije uneseno'}</strong></div><div><span>Član tima od</span><strong>{user.joined}</strong></div><div><span>Posljednja aktivnost</span><strong>Danas u 14:35</strong></div></div>
    <div className="access-card"><ShieldCheck/><div><strong>Pristup aplikaciji</strong><p>{user.status==='Aktivan'?'Korisnik se može prijaviti i koristiti funkcije dozvoljene njegovom ulogom.':'Pristup je blokiran. Korisnik se ne može prijaviti ni koristiti postojeću sesiju.'}</p></div></div>
    <div className="recent-login"><div><span className="status-dot"></span><div><strong>Posljednja prijava</strong><p>25.03.2025. u 14:35 · Sarajevo, BiH</p></div></div><small>Chrome · Windows</small></div>
   </div>}
   {mode==='edit'&&<div className="form-grid"><label className="full">Ime i prezime<input value={form.name} onChange={e=>set('name',e.target.value)} required/></label><label>Email adresa<input type="email" value={form.email} onChange={e=>set('email',e.target.value)} required/></label><label>Broj telefona<input value={form.phone} onChange={e=>set('phone',e.target.value)}/></label><label className="full">Uloga i nivo pristupa<select value={form.role} onChange={e=>set('role',e.target.value)}><option>Administrator</option><option>Kancelarija</option><option>Radnik na terenu</option></select><span className="field-help">Promjena uloge odmah mijenja dozvole korisnika.</span></label></div>}
   {mode==='resend'&&<div className="confirm-content"><div className="confirm-icon blue"><Send/></div><h3>Poslati novu pozivnicu?</h3><p>Novi pristupni link poslat ćemo korisniku <strong>{user.name}</strong> na:</p><div className="confirm-email"><Mail/>{user.email}</div><div className="modal-note"><Info/> Prethodno poslani link automatski će prestati važiti. Nova pozivnica važi 48 sati.</div></div>}
   {mode==='status'&&<div className="confirm-content"><div className={`confirm-icon ${user.status==='Aktivan'?'amber':'green'}`}>{user.status==='Aktivan'?<Ban/>:<RotateCcw/>}</div><h3>{user.status==='Aktivan'?'Odmah ukinuti pristup?':'Ponovo omogućiti pristup?'}</h3><p>{user.status==='Aktivan'?<><strong>{user.name}</strong> će biti odjavljen sa svih uređaja i neće se moći ponovo prijaviti dok ga ne aktivirate.</>:<><strong>{user.name}</strong> će se ponovo moći prijaviti i koristiti aplikaciju prema dodijeljenoj ulozi.</>}</p>{user.status==='Aktivan'&&<label className="full reason-label">Razlog deaktivacije<select><option>Prestanak radnog odnosa</option><option>Privremeno odsustvo</option><option>Sigurnosni razlog</option><option>Drugo</option></select></label>}</div>}
   {mode==='delete'&&<div className="confirm-content"><div className="confirm-icon red"><Trash2/></div><h3>Ovo se ne može poništiti</h3><p>Nalog korisnika <strong>{user.name}</strong> bit će trajno obrisan. Poslovni zapisi koje je kreirao ostaju sačuvani radi evidencije.</p><label className="delete-check"><input type="checkbox" required/> Razumijem da je brisanje trajno i želim nastaviti.</label></div>}
   <div className="modal-actions"><button type="button" className="secondary" onClick={close}>{mode==='detail'?'Zatvori':'Odustani'}</button>{mode!=='detail'&&<button type="submit" className={`primary ${mode==='delete'?'danger-primary':''}`}>{mode==='edit'?<><Check/> Sačuvaj izmjene</>:mode==='resend'?<><Send/> Pošalji pozivnicu</>:mode==='delete'?<><Trash2/> Trajno obriši</>:user.status==='Aktivan'?<><Ban/> Deaktiviraj pristup</>:<><RotateCcw/> Aktiviraj pristup</>}</button>}</div>
  </form>
 </div></div>
}

function InviteSentModal({user,close,onPreview}){
 return <div className="modal-backdrop" onMouseDown={close}><div className="modal invite-sent-modal" onMouseDown={e=>e.stopPropagation()}>
  <div className="modal-head"><div><span className="modal-kicker">POZIVNICA POSLANA</span><h2>Provjerite email korisnika</h2><p>Poslali smo siguran link za postavljanje lozinke.</p></div><button className="icon-btn" onClick={close}><X/></button></div>
  <div className="invite-sent-body">
   <div className="otp-icon success"><Mail/></div>
   <p>Pozivnica je poslana na <strong>{user.email}</strong>. Link važi 48 sati, a korisnik samostalno postavlja lozinku.</p>
   <div className="invite-demo-box"><ShieldCheck/><div><strong>Demo prikaz</strong><span>Pošto aplikacija nema pravi email server, možete otvoriti tačno ono što bi korisnik vidio klikom na link iz emaila.</span></div></div>
  </div>
  <div className="modal-actions"><button className="secondary" onClick={close}>Zatvori</button><button className="primary" onClick={()=>{onPreview(user);close();}}>Prikaži pozivnicu (demo) <ArrowRight/></button></div>
 </div></div>
}

function UsersManagement({onPreviewInvite}){
 const [users,setUsers]=useState(teamUsersSeed); const [openModal,setOpenModal]=useState(false); const [action,setAction]=useState(null); const [notice,setNotice]=useState(''); const [inviteSent,setInviteSent]=useState(null);
 const [search,setSearch]=useState(''); const [roleFilter,setRoleFilter]=useState('Sve uloge');
 const filteredUsers=users.filter(u=>`${u.name} ${u.email} ${u.phone}`.toLowerCase().includes(search.toLowerCase()) && (roleFilter==='Sve uloge'||u.role===roleFilter));
 const toggleStatus=id=>setUsers(u=>u.map(x=>x.id===id?{...x,status:x.status==='Aktivan'?'Neaktivan':'Aktivan'}:x));
 const removeUser=id=>setUsers(u=>u.filter(x=>x.id!==id));
 const saveUser=user=>setUsers(u=>u.map(x=>x.id===user.id?{...user,initials:user.name.split(' ').filter(Boolean).slice(0,2).map(s=>s[0]).join('').toUpperCase()}:x));
 const notify=message=>{setNotice(message);window.setTimeout(()=>setNotice(''),4000)};
 const addUser=nu=>{const initials=nu.name.split(' ').filter(Boolean).slice(0,2).map(s=>s[0]).join('').toUpperCase();const palette=['#dbeafe','#dcfce7','#ede9fe','#fef3c7','#fee2e2'];setUsers(u=>[...u,{id:Date.now(),...nu,status:'Aktivan',joined:'Danas',initials,color:palette[u.length%palette.length]}]);setInviteSent(nu)};
 const total=users.length; const active=users.filter(u=>u.status==='Aktivan').length; const inactive=total-active;
 const openAction=(user,mode)=>setAction({user,mode});
 return <>
  <div className="page-head"><div><p className="eyebrow">ADMINISTRACIJA TIMA</p><h1>Korisnici i pristup</h1><p>Upravljajte nalozima zaposlenih i njihovim pristupom aplikaciji.</p></div><button className="primary" onClick={()=>setOpenModal(true)}><Plus/> Novi korisnik</button></div>
  <section className="security-banner"><div className="security-icon"><ShieldCheck/></div><div><strong>Sigurnost sistema</strong><p>Čim neko napusti firmu, deaktivirajte njegov nalog. Aktivne sesije bit će prekinute, a pristup poslovnim podacima odmah blokiran.</p></div></section>
  <section className="stats-grid mini"><Stat title="Ukupno korisnika" value={String(total)} meta="Svi nalozi u sistemu" icon={UserCog} tone="blue"/><Stat title="Aktivni nalozi" value={String(active)} meta="Trenutno imaju pristup" icon={CheckCircle2} tone="green"/><Stat title="Neaktivni / blokirani" value={String(inactive)} meta="Bez pristupa aplikaciji" icon={Ban} tone="red"/></section>
  <section className="card"><div className="user-table-head"><div><h3>Svi korisnici</h3><p>{filteredUsers.length} od {total} naloga povezanih sa vašom firmom</p></div><div className="user-table-controls"><div className="search-inner"><Search/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Pretraži članove tima..."/></div><select className="role-filter-select" value={roleFilter} onChange={e=>setRoleFilter(e.target.value)}><option>Sve uloge</option><option>Administrator</option><option>Kancelarija</option><option>Radnik na terenu</option></select></div></div>
   <div className="table-wrap"><table><thead><tr><th>Korisnik</th><th>Kontakt</th><th>Uloga</th><th>Pridružen</th><th>Status</th><th>Akcije</th></tr></thead><tbody>{!filteredUsers.length&&<tr><td colSpan={6} className="empty-row">Nema korisnika za odabranu pretragu ili filter.</td></tr>}{filteredUsers.map(u=><tr key={u.id} className="clickable-row" onClick={()=>openAction(u,'detail')}><td><div className="client-cell"><span className="avatar square" style={{background:u.color}}>{u.initials}</span><strong>{u.name}</strong></div></td><td><div className="contact-cell"><span>{u.email}</span><small>{u.phone}</small></div></td><td><span className={`role-badge ${roleClass(u.role)}`}>{u.role}</span></td><td>{u.joined}</td><td><Badge>{u.status}</Badge></td><td><div className="row-actions" onClick={e=>e.stopPropagation()}><button className="action-text-btn" onClick={()=>openAction(u,'edit')}>Uredi</button><button className="icon-btn sm" title="Pošalji pristup" onClick={()=>openAction(u,'resend')}><Send/></button><button className="icon-btn sm" title={u.status==='Aktivan'?'Deaktiviraj':'Aktiviraj'} onClick={()=>openAction(u,'status')}>{u.status==='Aktivan'?<Ban/>:<RotateCcw/>}</button><button className="icon-btn sm danger" title="Obriši" onClick={()=>openAction(u,'delete')}><Trash2/></button></div></td></tr>)}</tbody></table></div>
  </section>
  {openModal&&<NewUserModal close={()=>setOpenModal(false)} onCreate={addUser}/>} {action&&<UserActionModal {...action} close={()=>setAction(null)} onSave={saveUser} onToggle={toggleStatus} onDelete={removeUser} onNotice={notify}/>} {inviteSent&&<InviteSentModal user={inviteSent} close={()=>setInviteSent(null)} onPreview={onPreviewInvite}/>} {notice&&<div className="toast"><CheckCircle2/><div><strong>Uspješno</strong><span>{notice}</span></div><button onClick={()=>setNotice('')}><X/></button></div>}
 </>
}

const MONTHS=['Januar','Februar','Mart','April','Maj','Juni','Juli','August','Septembar','Oktobar','Novembar','Decembar'];
const WEEKDAYS=['Pon','Uto','Sri','Čet','Pet','Sub','Ned'];
const pad2=n=>String(n).padStart(2,'0');
const formatEUDate=d=>`${pad2(d.getDate())}.${pad2(d.getMonth()+1)}.${d.getFullYear()}.`;
const sameDay=(a,b)=>a&&b&&a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();

function useClickOutside(ref,onOutside){
 useEffect(()=>{
  const handler=e=>{ if(ref.current && !ref.current.contains(e.target)) onOutside(); };
  document.addEventListener('mousedown',handler);
  return ()=>document.removeEventListener('mousedown',handler);
 },[ref,onOutside]);
}

function DateField({label,value,onChange}){
 const [open,setOpen]=useState(false);
 const [view,setView]=useState(new Date(value.getFullYear(),value.getMonth(),1));
 const ref=useRef(null);
 useClickOutside(ref,()=>setOpen(false));
 const first=new Date(view.getFullYear(),view.getMonth(),1);
 const offset=(first.getDay()+6)%7;
 const daysInMonth=new Date(view.getFullYear(),view.getMonth()+1,0).getDate();
 const cells=[...Array(offset).fill(null),...Array(daysInMonth).fill(0).map((_,i)=>i+1)];
 const today=new Date();
 const pick=day=>{ onChange(new Date(view.getFullYear(),view.getMonth(),day)); setOpen(false); };
 const nav=dir=>setView(v=>new Date(v.getFullYear(),v.getMonth()+dir,1));
 return <label className="picker-field" ref={ref}>{label} <span className="format-hint">DD.MM.GGGG.</span>
  <div className="field-with-icon" onClick={()=>setOpen(o=>!o)}>
   <CalendarDays/><input readOnly value={formatEUDate(value)} placeholder="DD.MM.GGGG."/>
  </div>
  {open && <div className="picker-pop calendar-pop" onClick={e=>e.stopPropagation()}>
   <div className="picker-pop-head"><button type="button" onClick={()=>nav(-1)}><ChevronRight style={{transform:'rotate(180deg)'}}/></button><strong>{MONTHS[view.getMonth()]} {view.getFullYear()}</strong><button type="button" onClick={()=>nav(1)}><ChevronRight/></button></div>
   <div className="cal-weekdays">{WEEKDAYS.map(w=><span key={w}>{w}</span>)}</div>
   <div className="cal-days">{cells.map((d,i)=>d===null?<span key={i} className="cal-day empty"></span>:
    <button type="button" key={i} className={`cal-day ${sameDay(new Date(view.getFullYear(),view.getMonth(),d),value)?'selected':''} ${sameDay(new Date(view.getFullYear(),view.getMonth(),d),today)?'is-today':''}`} onClick={()=>pick(d)}>{d}</button>)}</div>
   <div className="picker-pop-foot"><button type="button" className="text-link" onClick={()=>{onChange(new Date());setView(new Date(new Date().getFullYear(),new Date().getMonth(),1));setOpen(false);}}>Danas</button></div>
  </div>}
 </label>;
}

function TimeField({label,value,onChange}){
 const [open,setOpen]=useState(false);
 const ref=useRef(null);
 useClickOutside(ref,()=>setOpen(false));
 const times=[]; for(let h=6;h<=21;h++) for(const m of ['00','30']) times.push(`${pad2(h)}:${m}`);
 return <label className="picker-field" ref={ref}>{label} <span className="format-hint">24-SATNI FORMAT</span>
  <div className="field-with-icon" onClick={()=>setOpen(o=>!o)}>
   <Clock3/><input readOnly value={value} placeholder="00:00"/>
  </div>
  {open && <div className="picker-pop time-pop" onClick={e=>e.stopPropagation()}>
   {times.map(t=><button type="button" key={t} className={`time-opt ${t===value?'selected':''}`} onClick={()=>{onChange(t);setOpen(false);}}>{t}</button>)}
  </div>}
 </label>;
}

function EUDateTimeFields({date,setDate,time,setTime}){
 return <><DateField label="Datum" value={date} onChange={setDate}/><TimeField label="Vrijeme" value={time} onChange={setTime}/></>
}

function Modal({close,onCreate,clients}){
 const [date,setDate]=useState(new Date(2025,2,25));
 const [time,setTime]=useState('10:00');
 const [client,setClient]=useState(''); const [service,setService]=useState(''); const [description,setDescription]=useState('');
 const [worker,setWorker]=useState('Marko Ilić'); const [priority,setPriority]=useState('Standardno');
 const submit=e=>{e.preventDefault();onCreate({client,service:service||description,date:formatEUDate(date),time,worker,priority,status:'Zakazano',city:'',amount:'—'});close()};
 return <div className="modal-backdrop" onMouseDown={close}><div className="modal" onMouseDown={e=>e.stopPropagation()}><div className="modal-head"><div><h2>Novi posao</h2><p>Unesite osnovne podatke o intervenciji.</p></div><button className="icon-btn" onClick={close}><X/></button></div><form onSubmit={submit}><div className="form-grid"><label>Klijent<select required value={client} onChange={e=>setClient(e.target.value)}><option value="" disabled>Odaberite klijenta</option>{clients.map(c=><option key={c.id}>{c.name}</option>)}</select></label><label>Vrsta usluge<select value={service} onChange={e=>setService(e.target.value)}><option value="">Odaberite vrstu</option><option>Servis i popravka</option><option>Montaža</option><option>Održavanje</option></select></label><label className="full">Opis posla<textarea value={description} onChange={e=>setDescription(e.target.value)} required placeholder="Kratko opišite zahtjev klijenta..."></textarea></label><EUDateTimeFields date={date} setDate={setDate} time={time} setTime={setTime}/><label>Dodijeli radnika<select value={worker} onChange={e=>setWorker(e.target.value)}><option>Marko Ilić</option><option>Ivan Kovač</option><option>Petar Jurić</option></select></label><label>Prioritet<select value={priority} onChange={e=>setPriority(e.target.value)}><option>Standardno</option><option>Hitno</option></select></label></div><div className="modal-actions"><button type="button" className="secondary" onClick={close}>Odustani</button><button className="primary"><Check/> Sačuvaj posao</button></div></form></div></div>}

const notificationSeed=[
 {id:1,type:'payment',title:'Račun kasni 7 dana',text:'Marić Stan · R-043 · 350,00 €',time:'Prije 12 min',read:false,page:'Računi'},
 {id:2,type:'offer',title:'Ponuda uskoro ističe',text:'Ponuda PN-028 za Kovač d.o.o. ističe danas.',time:'Prije 45 min',read:false,page:'Ponude'},
 {id:3,type:'job',title:'Intervencija je završena',text:'Ivan Kovač završio je posao kod Novak Stan.',time:'Prije 2 sata',read:false,page:'Poslovi'},
 {id:4,type:'schedule',title:'Novi termin sutra',text:'Servis bojlera · Porodić d.o.o. u 08:00.',time:'Jučer',read:true,page:'Raspored'},
 {id:5,type:'stock',title:'Niska zaliha materijala',text:'Termostat digitalni pao je ispod minimuma.',time:'Jučer',read:true,page:'Materijal'}
];

function NotificationCenter({items,setItems,close,go}){
 const [filter,setFilter]=useState('Sve'); const ref=useRef(null); useClickOutside(ref,close);
 const visible=filter==='Nepročitane'?items.filter(n=>!n.read):items;
 const open=n=>{setItems(a=>a.map(x=>x.id===n.id?{...x,read:true}:x));close();go(n.page)};
 const icon=n=>n.type==='payment'?<ReceiptText/>:n.type==='offer'?<FileText/>:n.type==='job'?<BriefcaseBusiness/>:n.type==='schedule'?<CalendarDays/>:<Package/>;
 return <div className="nav-pop notifications-pop" ref={ref}>
  <div className="nav-pop-head"><div><h3>Obavijesti</h3><p>{items.filter(n=>!n.read).length} nepročitane obavijesti</p></div><button className="icon-btn sm" onClick={close}><X/></button></div>
  <div className="notification-tools"><div className="mini-tabs"><button className={filter==='Sve'?'active':''} onClick={()=>setFilter('Sve')}>Sve</button><button className={filter==='Nepročitane'?'active':''} onClick={()=>setFilter('Nepročitane')}>Nepročitane</button></div><button onClick={()=>setItems(a=>a.map(n=>({...n,read:true})))}><Check/> Označi sve pročitano</button></div>
  <div className="notification-list">{visible.length?visible.map(n=><article key={n.id} className={!n.read?'unread':''} onClick={()=>open(n)}><div className={`notification-icon ${n.type}`}>{icon(n)}</div><div><strong>{n.title}</strong><p>{n.text}</p><span>{n.time}</span></div>{!n.read&&<i/>}<button title="Ukloni" onClick={e=>{e.stopPropagation();setItems(a=>a.filter(x=>x.id!==n.id))}}><X/></button></article>):<div className="notification-empty"><Bell/><strong>Sve je pregledano</strong><span>Trenutno nema nepročitanih obavijesti.</span></div>}</div>
  <div className="nav-pop-foot"><button onClick={()=>{close();go('AI pomoćnik')}}>Otvori centar upozorenja <ArrowRight/></button></div>
 </div>
}

function QuickAddMenu({close,onSelect}){
 const ref=useRef(null);useClickOutside(ref,close);
 const actions=[['job','Novi posao','Zakažite intervenciju',BriefcaseBusiness,'blue'],['client','Novi klijent','Dodajte kontakt u bazu',Users,'green'],['offer','Nova ponuda','Kreirajte prodajni dokument',FileText,'purple'],['invoice','Novi račun','Izdajte račun klijentu',ReceiptText,'orange'],['term','Novi termin','Dodajte termin u raspored',CalendarDays,'cyan'],['material','Novi materijal','Evidentirajte artikl',Package,'amber']];
 return <div className="nav-pop quick-pop" ref={ref}><div className="nav-pop-head"><div><h3>Brzo dodaj</h3><p>Odaberite šta želite kreirati</p></div><button className="icon-btn sm" onClick={close}><X/></button></div><div className="quick-grid">{actions.map(([id,title,sub,Icon,tone])=><button key={id} onClick={()=>onSelect(id)}><span className={`quick-icon ${tone}`}><Icon/></span><div><strong>{title}</strong><small>{sub}</small></div><ChevronRight/></button>)}</div></div>
}

function QuickCreateModal({type,close,onSave,clients}){
 const config={client:{title:'Novi klijent',sub:'Brzo dodavanje kontakta u bazu.'},offer:{title:'Nova ponuda',sub:'Osnovni podaci za nacrt ponude.'},invoice:{title:'Novi račun',sub:'Kreirajte račun za postojećeg klijenta.'},term:{title:'Novi termin',sub:'Rezervišite vrijeme u rasporedu ekipe.'},material:{title:'Novi materijal',sub:'Dodajte artikl i početno stanje zalihe.'}}[type];
 const [date,setDate]=useState(new Date());const [time,setTime]=useState('10:00');
 const [name,setName]=useState(''); const [contact,setContact]=useState(''); const [phone,setPhone]=useState(''); const [email,setEmail]=useState(''); const [city,setCity]=useState('');
 const [client,setClient]=useState(''); const [amount,setAmount]=useState(''); const [description,setDescription]=useState('');
 const [worker,setWorker]=useState('Marko Ilić');
 const [category,setCategory]=useState(''); const [unit,setUnit]=useState('kom'); const [stockQty,setStockQty]=useState(0); const [minQty,setMinQty]=useState(5);
 const submit=e=>{
  e.preventDefault();
  if(type==='client') onSave('client',{name,contact,phone,email,city});
  else if(type==='offer'){const valid=new Date(date);valid.setDate(valid.getDate()+7);onSave('offer',{client,date:formatEUDate(date),valid:formatEUDate(valid),amount});}
  else if(type==='invoice'){const due=new Date(date);due.setDate(due.getDate()+7);onSave('invoice',{client,issued:formatEUDate(date),due:formatEUDate(due),amount});}
  else if(type==='term') onSave('term',{client,service:description,date:formatEUDate(date),time,worker});
  else if(type==='material') onSave('material',{name,category,unit,stock:Number(stockQty),min:Number(minQty)});
  close();
 };
 return <div className="modal-backdrop" onMouseDown={close}><div className="modal quick-create-modal" onMouseDown={e=>e.stopPropagation()}><div className="modal-head"><div><span className="modal-kicker">BRZO KREIRANJE</span><h2>{config.title}</h2><p>{config.sub}</p></div><button className="icon-btn" onClick={close}><X/></button></div><form onSubmit={submit}><div className="form-grid">
  {type==='client'&&<><label className="full">Naziv / ime klijenta<input value={name} onChange={e=>setName(e.target.value)} required placeholder="npr. Kovač d.o.o."/></label><label>Kontakt osoba<input value={contact} onChange={e=>setContact(e.target.value)} required placeholder="Ime i prezime"/></label><label>Telefon<input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+387 6X XXX XXX"/></label><label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="kontakt@firma.ba"/></label><label>Grad<input value={city} onChange={e=>setCity(e.target.value)} placeholder="Sarajevo"/></label></>}
  {(type==='offer'||type==='invoice')&&<><label className="full">Klijent<select required value={client} onChange={e=>setClient(e.target.value)}><option value="" disabled>Odaberite klijenta</option>{clients.map(c=><option key={c.id}>{c.name}</option>)}</select></label><DateField label={type==='offer'?'Datum ponude':'Datum izdavanja'} value={date} onChange={setDate}/><label>Ukupan iznos<input value={amount} onChange={e=>setAmount(e.target.value)} required placeholder="0,00 €"/></label><label className="full">Opis<textarea value={description} onChange={e=>setDescription(e.target.value)} required placeholder="Usluga, materijal i napomena..."/></label></>}
  {type==='term'&&<><label className="full">Klijent<select required value={client} onChange={e=>setClient(e.target.value)}><option value="" disabled>Odaberite klijenta</option>{clients.map(c=><option key={c.id}>{c.name}</option>)}</select></label><EUDateTimeFields date={date} setDate={setDate} time={time} setTime={setTime}/><label className="full">Radnik<select value={worker} onChange={e=>setWorker(e.target.value)}><option>Marko Ilić</option><option>Ivan Kovač</option><option>Petar Jurić</option></select></label><label className="full">Opis termina<textarea value={description} onChange={e=>setDescription(e.target.value)} required placeholder="Vrsta intervencije..."/></label></>}
  {type==='material'&&<><label className="full">Naziv artikla<input value={name} onChange={e=>setName(e.target.value)} required placeholder="Naziv materijala ili opreme"/></label><label>Kategorija<input value={category} onChange={e=>setCategory(e.target.value)} placeholder="npr. Instalacije"/></label><label>Jedinica mjere<select value={unit} onChange={e=>setUnit(e.target.value)}><option>kom</option><option>m</option><option>kg</option><option>l</option></select></label><label>Početna količina<input type="number" min="0" value={stockQty} onChange={e=>setStockQty(e.target.value)}/></label><label>Minimalna zaliha<input type="number" min="0" value={minQty} onChange={e=>setMinQty(e.target.value)}/></label></>}
 </div><div className="modal-actions"><button type="button" className="secondary" onClick={close}>Odustani</button><button className="primary"><Check/> Kreiraj zapis</button></div></form></div></div>
}

function initials(name){return (name||'').split(' ').filter(Boolean).slice(0,2).map(s=>s[0]).join('').toUpperCase()||'MK'}
function Avatar({profile,className}){return profile?.avatar?<img className={className} src={profile.avatar} alt={profile.name}/>:<span className={className}>{initials(profile?.name)}</span>}

function ProfileMenu({close,go,onProfile,onLogout,profile}){
 const ref=useRef(null);useClickOutside(ref,close);
 return <div className="nav-pop profile-pop" ref={ref}><div className="profile-pop-hero"><Avatar profile={profile} className="avatar profile-nav-avatar"/><div><strong>{profile.name}</strong><span>{profile.email}</span><em>{profile.role||'Administrator'}</em></div></div><div className="profile-menu-list"><button onClick={()=>{close();onProfile()}}><UserRound/><div><strong>Moj profil</strong><span>Lični podaci i lozinka</span></div><ChevronRight/></button><button onClick={()=>{close();go('Postavke')}}><Settings/><div><strong>Postavke firme</strong><span>Dokumenti i sigurnost</span></div><ChevronRight/></button><button onClick={()=>{close();go('Korisnici')}}><UserCog/><div><strong>Korisnici i pristup</strong><span>Upravljanje članovima tima</span></div><ChevronRight/></button></div><button className="profile-logout" onClick={onLogout}><LogOut/> Odjavi se</button></div>
}

const globalSearchData=[
 {id:'c1',group:'Klijenti',page:'Klijenti',title:'Novak Stan',meta:'Sarajevo · novak@email.com',icon:Users},
 {id:'c2',group:'Klijenti',page:'Klijenti',title:'Porodić d.o.o.',meta:'Banja Luka · +387 61 123 456',icon:Users},
 {id:'c3',group:'Klijenti',page:'Klijenti',title:'Kovač d.o.o.',meta:'Mostar · info@kovac.ba',icon:Users},
 {id:'c4',group:'Klijenti',page:'Klijenti',title:'Marić Stan',meta:'Zenica · maric@email.com',icon:Users},
 {id:'j1',group:'Poslovi',page:'Poslovi',title:'P-1054 · Servis bojlera',meta:'Porodić d.o.o. · Marko Ilić · U toku',icon:BriefcaseBusiness},
 {id:'j2',group:'Poslovi',page:'Poslovi',title:'P-1055 · Popravka instalacije',meta:'Novak Stan · Ivan Kovač · Zakazano',icon:BriefcaseBusiness},
 {id:'j3',group:'Poslovi',page:'Poslovi',title:'P-1056 · Montaža klime',meta:'Kovač d.o.o. · Petar Jurić',icon:BriefcaseBusiness},
 {id:'o1',group:'Ponude',page:'Ponude',title:'PN-028 · Kovač d.o.o.',meta:'1.850,00 € · Poslata',icon:FileText},
 {id:'o2',group:'Ponude',page:'Ponude',title:'PN-027 · Novak Stan',meta:'750,00 € · Prihvaćena',icon:FileText},
 {id:'i1',group:'Računi',page:'Računi',title:'R-041 · Novak Stan',meta:'750,00 € · Plaćen',icon:ReceiptText},
 {id:'i2',group:'Računi',page:'Računi',title:'R-043 · Marić Stan',meta:'350,00 € · Kasni 7 dana',icon:ReceiptText},
 {id:'m1',group:'Materijal',page:'Materijal',title:'MAT-003 · Termostat digitalni',meta:'Grijanje · Niska zaliha',icon:Package},
 {id:'u1',group:'Korisnici',page:'Korisnici',title:'Ivan Kovač',meta:'Radnik na terenu · Aktivan',icon:UserCog}
];

function GlobalSearch({close,go}){
 const [query,setQuery]=useState(''); const [selected,setSelected]=useState(0); const [recent,setRecent]=useState(['Novak Stan','R-043','Montaža klime']); const inputRef=useRef(null);
 const results=useMemo(()=>{const q=query.trim().toLowerCase();return q?globalSearchData.filter(x=>`${x.title} ${x.meta} ${x.group}`.toLowerCase().includes(q)):[]},[query]);
 const groups=['Klijenti','Poslovi','Ponude','Računi','Materijal','Korisnici'];
 useEffect(()=>inputRef.current?.focus(),[]);
 useEffect(()=>setSelected(0),[query]);
 const open=item=>{setRecent(r=>[item.title,...r.filter(x=>x!==item.title)].slice(0,3));go(item.page);close();};
 const key=e=>{if(e.key==='Escape')close();if(e.key==='ArrowDown'){e.preventDefault();setSelected(s=>Math.min(s+1,results.length-1))}if(e.key==='ArrowUp'){e.preventDefault();setSelected(s=>Math.max(s-1,0))}if(e.key==='Enter'&&results[selected])open(results[selected]);};
 return <div className="command-backdrop" onMouseDown={close}><div className="command-palette" onMouseDown={e=>e.stopPropagation()} onKeyDown={key}>
  <div className="command-input"><Search/><input ref={inputRef} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Pretraži klijente, poslove, ponude, račune..."/><kbd>ESC</kbd></div>
  <div className="command-body">
   {!query&&<><div className="command-section-title">NEDAVNE PRETRAGE</div><div className="recent-searches">{recent.map(r=><button key={r} onClick={()=>setQuery(r)}><Clock3/>{r}<ArrowRight/></button>)}</div><div className="command-section-title">BRZA NAVIGACIJA</div><div className="command-quick-nav">{navItems.slice(0,8).map(([name,Icon])=><button key={name} onClick={()=>{go(name);close()}}><Icon/><span>{name}</span></button>)}</div></>}
   {query&&results.length===0&&<div className="command-empty"><Search/><strong>Nema rezultata za „{query}“</strong><span>Pokušajte pretražiti po nazivu, broju dokumenta, klijentu ili radniku.</span></div>}
   {query&&results.length>0&&groups.map(group=>{const list=results.filter(x=>x.group===group);if(!list.length)return null;return <div className="command-group" key={group}><div className="command-section-title">{group.toUpperCase()} <span>{list.length}</span></div>{list.map(item=>{const Icon=item.icon;const index=results.indexOf(item);return <button key={item.id} className={selected===index?'selected':''} onMouseEnter={()=>setSelected(index)} onClick={()=>open(item)}><span className={`command-result-icon ${item.page.toLowerCase()}`}><Icon/></span><div><strong>{item.title}</strong><small>{item.meta}</small></div><span className="command-open">Otvori <ArrowRight/></span></button>})}</div>})}
  </div>
  <div className="command-footer"><span><kbd>↑</kbd><kbd>↓</kbd> navigacija</span><span><kbd>ENTER</kbd> otvori</span><span><kbd>ESC</kbd> zatvori</span></div>
 </div></div>
}

function parseDevice(ua=''){
 if(/iphone/i.test(ua))return 'Safari · iPhone';
 if(/android/i.test(ua))return 'Chrome · Android';
 if(/ipad/i.test(ua))return 'Safari · iPad';
 if(/edg/i.test(ua))return 'Edge · Windows';
 if(/chrome/i.test(ua)&&/windows/i.test(ua))return 'Chrome · Windows';
 if(/chrome/i.test(ua)&&/mac/i.test(ua))return 'Chrome · macOS';
 if(/firefox/i.test(ua))return 'Firefox';
 if(/safari/i.test(ua)&&/mac/i.test(ua))return 'Safari · macOS';
 return ua?ua.slice(0,40):'Nepoznat uređaj';
}
function relTime(iso){
 const d=new Date(iso),diff=(Date.now()-d.getTime())/1000;
 if(diff<60)return 'Upravo sada';
 if(diff<3600)return `Prije ${Math.floor(diff/60)} min`;
 if(diff<86400)return `Prije ${Math.floor(diff/3600)} h`;
 return d.toLocaleString('bs-BA');
}

function ProfileModal({close,onSaved,profile,setProfile}){
 const [tab,setTab]=useState('Podaci');
 const [name,setName]=useState(profile.name),[phone,setPhone]=useState(profile.phone);
 const [curPw,setCurPw]=useState(''),[newPw,setNewPw]=useState(''),[confirmPw,setConfirmPw]=useState(''),[pwError,setPwError]=useState('');
 const [savingInfo,setSavingInfo]=useState(false),[savingPw,setSavingPw]=useState(false),[uploading,setUploading]=useState(false);
 const [sessions,setSessions]=useState([]),[sessionsLoading,setSessionsLoading]=useState(true),[sessionsError,setSessionsError]=useState('');
 const fileRef=useRef(null);
 const pickPhoto=()=>fileRef.current?.click();
 const loadSessions=()=>{setSessionsLoading(true);fetch('/api/auth/sessions',{credentials:'include'}).then(r=>r.json()).then(d=>{setSessions(Array.isArray(d)?d:[]);setSessionsError('')}).catch(()=>setSessionsError('Nije moguće učitati sesije.')).finally(()=>setSessionsLoading(false))};
 useEffect(()=>{if(tab==='Sesije')loadSessions()},[tab]);
 const onPhoto=e=>{
  const file=e.target.files?.[0];if(!file)return;
  if(file.size>1024*1024){onSaved('Slika mora biti manja od 1 MB.');return}
  const reader=new FileReader();
  reader.onload=async()=>{
   setUploading(true);
   try{
    const r=await fetch('/api/auth/profile',{method:'PUT',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({avatar_data:reader.result})});
    const d=await r.json();if(!r.ok)throw new Error(d.error||'Greška');
    setProfile(p=>({...p,...d.user}));onSaved('Profilna slika je sačuvana.');
   }catch(err){onSaved(err.message||'Slanje slike nije uspjelo.')}finally{setUploading(false)}
  };
  reader.readAsDataURL(file);
 };
 const removePhoto=async()=>{
  setUploading(true);
  try{const r=await fetch('/api/auth/profile',{method:'PUT',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({avatar_data:''})});const d=await r.json();if(!r.ok)throw new Error(d.error);setProfile(p=>({...p,...d.user}));onSaved('Profilna slika je uklonjena.')}
  catch(err){onSaved(err.message||'Greška prilikom uklanjanja slike.')}finally{setUploading(false)}
 };
 const submit=async e=>{
  e.preventDefault();
  if(tab==='Podaci'){
   setSavingInfo(true);
   try{
    const r=await fetch('/api/auth/profile',{method:'PUT',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,phone})});
    const d=await r.json();if(!r.ok)throw new Error(d.error||'Greška');
    setProfile(p=>({...p,...d.user}));onSaved('Profil je uspješno ažuriran i sačuvan.');close();
   }catch(err){onSaved(err.message||'Ažuriranje profila nije uspjelo.')}finally{setSavingInfo(false)}
   return;
  }
  if(tab==='Sigurnost'){
   if(!curPw){setPwError('Unesite trenutnu lozinku.');return;}
   if(newPw.length<12){setPwError('Nova lozinka mora imati najmanje 12 znakova.');return;}
   if(newPw!==confirmPw){setPwError('Nova lozinka i potvrda se ne podudaraju.');return;}
   setPwError('');setSavingPw(true);
   try{
    const r=await fetch('/api/auth/password',{method:'PUT',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({currentPassword:curPw,newPassword:newPw})});
    const d=await r.json();if(!r.ok)throw new Error(d.error||'Greška');
    onSaved('Lozinka je uspješno promijenjena. Ostale sesije su odjavljene.');setCurPw('');setNewPw('');setConfirmPw('');close();
   }catch(err){setPwError(err.message||'Promjena lozinke nije uspjela.')}finally{setSavingPw(false)}
   return;
  }
 };
 const endSession=async id=>{try{await fetch(`/api/auth/sessions/${id}`,{method:'DELETE',credentials:'include'});loadSessions()}catch{}};
 const endAllOther=async()=>{try{await fetch('/api/auth/sessions/revoke-others',{method:'POST',credentials:'include'});loadSessions();onSaved('Odjavljeni ste sa svih drugih uređaja.')}catch{}};
 return <div className="modal-backdrop" onMouseDown={close}><div className="modal profile-modal" onMouseDown={e=>e.stopPropagation()}>
  <div className="modal-head"><div><span className="modal-kicker">KORISNIČKI RAČUN</span><h2>Moj profil</h2><p>Upravljajte ličnim podacima i sigurnošću naloga.</p></div><button className="icon-btn" onClick={close}><X/></button></div>
  <div className="profile-modal-top"><div className="profile-photo"><Avatar profile={profile}/><button type="button" onClick={pickPhoto} disabled={uploading}><Edit3/></button><input type="file" accept="image/png,image/jpeg,image/webp" ref={fileRef} style={{display:'none'}} onChange={onPhoto}/></div><div><strong>{profile.name}</strong><span>{profile.role||'Administrator'}</span><small><i></i> Aktivan nalog</small>{profile.avatar&&<button type="button" className="text-link" onClick={removePhoto} disabled={uploading}>Ukloni sliku</button>}</div></div>
  <div className="profile-tabs"><button className={tab==='Podaci'?'active':''} onClick={()=>setTab('Podaci')}>Lični podaci</button><button className={tab==='Sigurnost'?'active':''} onClick={()=>setTab('Sigurnost')}>Sigurnost</button><button className={tab==='Sesije'?'active':''} onClick={()=>setTab('Sesije')}>Sesije</button></div>
  <form onSubmit={submit}>
   {tab==='Podaci'&&<div className="form-grid"><label className="full">Ime i prezime<input value={name} onChange={e=>setName(e.target.value)} required/></label><label>Email adresa<input type="email" value={profile.email} disabled/><span className="field-help">Za promjenu email adrese kontaktirajte podršku.</span></label><label>Broj telefona<input value={phone||''} onChange={e=>setPhone(e.target.value)}/></label><label className="full">Uloga<input value={profile.role||'Administrator'} disabled/><span className="field-help">Ulogu može promijeniti samo drugi administrator.</span></label></div>}
   {tab==='Sigurnost'&&<div className="form-grid"><label className="full">Trenutna lozinka<input type="password" value={curPw} onChange={e=>{setCurPw(e.target.value);setPwError('')}} placeholder="Unesite trenutnu lozinku" required/></label><label>Nova lozinka<input type="password" value={newPw} onChange={e=>{setNewPw(e.target.value);setPwError('')}} minLength="12" placeholder="Najmanje 12 znakova" required/></label><PasswordStrength value={newPw}/><label>Ponovite novu lozinku<input type="password" value={confirmPw} onChange={e=>{setConfirmPw(e.target.value);setPwError('')}} minLength="12" placeholder="Ponovite lozinku" required/></label>{pwError&&<p className="otp-error full"><AlertTriangle/> {pwError}</p>}<div className="modal-note full"><ShieldCheck/> Nakon promjene lozinke ostat ćete prijavljeni na ovom uređaju, a ostale sesije će biti odjavljene.</div></div>}
   {tab==='Sesije'&&<div className="sessions-body">
     <div className="sessions-head"><div><strong>Aktivni uređaji</strong><span>Uređaji trenutno prijavljeni na vaš nalog</span></div><button type="button" className="secondary" onClick={endAllOther} disabled={sessions.length<=1}>Odjavi sa svih drugih uređaja</button></div>
     {sessionsLoading&&<p className="field-help">Učitavanje sesija...</p>}
     {sessionsError&&<p className="otp-error"><AlertTriangle/> {sessionsError}</p>}
     {!sessionsLoading&&!sessionsError&&<div className="session-list">{sessions.map(s=><div className="session-row" key={s.id}><span className="session-icon">{/iphone|android|ipad/i.test(s.user_agent||'')?<Smartphone/>:<Laptop/>}</span><div><strong>{parseDevice(s.user_agent)} {s.current&&<em className="current-tag">Ovaj uređaj</em>}</strong><span><Globe/> {s.ip_address||'Nepoznata IP'} · {relTime(s.created_at)}</span></div>{!s.current&&<button type="button" className="text-link" onClick={()=>endSession(s.id)}>Odjavi</button>}</div>)}{!sessions.length&&<p className="field-help">Nema aktivnih sesija.</p>}</div>}
   </div>}
   <div className="modal-actions"><button type="button" className="secondary" onClick={close}>{tab==='Sesije'?'Zatvori':'Odustani'}</button>{tab==='Podaci'&&<button className="primary" disabled={savingInfo}><Save/> {savingInfo?'Čuvanje...':'Sačuvaj profil'}</button>}{tab==='Sigurnost'&&<button className="primary" disabled={savingPw}><Save/> {savingPw?'Čuvanje...':'Promijeni lozinku'}</button>}</div>
  </form>
 </div></div>
}

function AppShell(){
 const {clients,addClient,addJob,addOffer,addInvoice,addStock,loading,backendOnline}=useData();
 const [authed,setAuthed]=useState(false);
 const [authLoading,setAuthLoading]=useState(true);
 const [authView,setAuthView]=useState('login');
 const [inviteView,setInviteView]=useState(null);
 const [page,setPage]=useState('Početna'); const [mobile,setMobile]=useState(false); const [modal,setModal]=useState(false);
 const [navPopup,setNavPopup]=useState(null); const [quickCreate,setQuickCreate]=useState(null); const [profileModal,setProfileModal]=useState(false); const [searchOpen,setSearchOpen]=useState(false); const [notifications,setNotifications]=useState(notificationSeed); const [notice,setNotice]=useState('');
 const [profile,setProfile]=useState({name:'',email:'',phone:'',avatar:null});
 const [brand,setBrand]=useState(null);
 const applyBrand=b=>{if(!b)return;setBrand(b);document.documentElement.style.setProperty('--blue',b.primary_color||'#1769d2');document.title=b.app_name||'TeloPak Flux';if(b.favicon_data){let link=document.querySelector("link[rel='icon']");if(!link){link=document.createElement('link');link.rel='icon';document.head.appendChild(link)}link.href=b.favicon_data}};
 useEffect(()=>{fetch('/api/public/settings').then(r=>r.json()).then(applyBrand).catch(()=>{})},[]);
 useEffect(()=>{fetch('/api/auth/me',{credentials:'include'}).then(r=>r.ok?r.json():Promise.reject()).then(d=>{setProfile(p=>({...p,...d.user}));setAuthed(true)}).catch(()=>setAuthed(false)).finally(()=>setAuthLoading(false))},[]);
 useEffect(()=>{const handler=e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();setSearchOpen(true)}};window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler)},[]);
 const notify=message=>{setNotice(message);window.setTimeout(()=>setNotice(''),3500)};
 const quickSelect=type=>{setNavPopup(null);if(type==='job')setModal(true);else setQuickCreate(type)};
 const quickSaved=(type,data)=>{
  const map={client:['Novi klijent','Klijenti'],offer:['Nova ponuda','Ponude'],invoice:['Novi račun','Računi'],term:['Novi termin','Poslovi'],material:['Novi materijal','Materijal']};
  const [label,target]=map[type];
  if(type==='client')addClient(data);
  else if(type==='offer')addOffer(data);
  else if(type==='invoice')addInvoice(data);
  else if(type==='term')addJob(data);
  else if(type==='material')addStock(data);
  notify(`${label} je uspješno kreiran.`);
  setPage(target);
 };
 const authSuccess=user=>{setProfile(p=>({...p,...user}));setAuthed(true);setAuthView('login')};
 const logout=async()=>{setNavPopup(null);try{await fetch('/api/auth/logout',{method:'POST',credentials:'include'})}catch{}setAuthed(false);setProfile({name:'',email:'',phone:'',avatar:null});setAuthView('login')};
 const isOwner=profile?.isPlatformOwner||profile?.role==='Platform Owner';
 const go=p=>{setPage(p);setMobile(false)};
 useEffect(()=>{if(authed&&isOwner&&!ownerNavItems.some(([n])=>n===page))setPage('Owner pregled')},[authed,isOwner]);
 const content=useMemo(()=>{
  if(isOwner){
   const ownerScreens={'Owner pregled':<OwnerOverview go={go}/>,'Firme':<OwnerCompanies/>,'Svi korisnici':<OwnerUsers/>,'Pretplate':<OwnerCompanies/>,'Sistem':<OwnerOverview go={go}/>,'Audit zapis':<OwnerAudit/>,'Postavke aplikacije':<OwnerSettings onBrandChange={applyBrand}/>};
   return ownerScreens[page]||ownerScreens['Owner pregled'];
  }
  const screens={
   'Klijenti':<ClientsModule/>,
   'Poslovi':<JobsModule/>,
   'Raspored':<ScheduleModule/>,
   'Ponude':<OffersModule/>,
   'Računi':<InvoicesModule/>,
   'Materijal':<StockModule/>,
   'Održavanje':<MaintenanceModule/>,
   'AI pomoćnik':<AIAssistant/>,
   'Izvještaji':<ReportsModule/>,
   'Postavke':<SettingsModule/>,
   'Korisnici':<UsersManagement onPreviewInvite={setInviteView}/>
  };
  return page==='Početna'?<Dashboard openNew={()=>setModal(true)} go={go} notify={notify} profile={profile}/>:screens[page];
 },[page,isOwner,profile]);

 if(inviteView){
  return <AcceptInvite invite={inviteView} goLogin={()=>{setInviteView(null);setAuthed(false);setAuthView('login');}} brand={brand}/>;
 }

 if(authLoading) return <div className="auth-loading"><ShieldCheck/><strong>Sigurna provjera sesije...</strong></div>;
 if(!authed){
  if(authView==='forgot') return <ForgotPassword goLogin={()=>setAuthView('login')} brand={brand}/>;
  return authView==='login'
   ? <Login onLogin={authSuccess} goRegister={()=>setAuthView('register')} goForgot={()=>setAuthView('forgot')} brand={brand}/>
   : <Register onRegister={authSuccess} goLogin={()=>setAuthView('login')} brand={brand}/>;
 }

 return <div className="app">
  {mobile&&<div className="mobile-overlay" onClick={()=>setMobile(false)}/>}<aside className={`${mobile?'open ':''}${isOwner?'owner-sidebar':''}`}><Logo brand={brand}/><nav><span className="nav-label">{isOwner?'PLATFORMA':'GLAVNI MENI'}</span>{(isOwner?ownerNavItems:navItems).map(([name,Icon])=><button className={page===name?'active':''} onClick={()=>go(name)} key={name}><Icon/>{name}{!isOwner&&name==='Poslovi'&&<em>6</em>}</button>)}</nav><div className="sidebar-bottom">{!isOwner&&<><span className="nav-label">ADMINISTRACIJA</span><button className={page==='Korisnici'?'active':''} onClick={()=>go('Korisnici')}><UserCog/>Korisnici</button><button className={page==='Postavke'?'active':''} onClick={()=>go('Postavke')}><Settings/>Postavke</button><div className="help"><div><Zap/></div><strong>Treba vam pomoć?</strong><span>Naš tim je tu za vas.</span><button>Kontaktirajte podršku</button></div></>} {isOwner&&<div className="owner-sidebar-note"><ShieldCheck/><div><strong>Owner pristup</strong><span>Globalne ovlasti platforme</span></div></div>}<div className="sidebar-user"><Avatar profile={profile} className="avatar"/><div><strong>{profile.name}</strong><span>{isOwner?'Platform Owner':profile.role||'Administrator'}</span></div><button className="icon-btn logout-btn" title="Odjava" onClick={logout}><LogOut/></button></div></div></aside>
  <main className={isOwner?'owner-main':''}><header><button className="menu-btn" onClick={()=>setMobile(true)}><Menu/></button><button className="global-search global-search-button" onClick={()=>!isOwner&&setSearchOpen(true)}><Search/><span>{isOwner?'Pretraži firme i korisnike...':'Pretraži klijente, poslove, račune...'}</span><kbd>⌘ K</kbd></button><div className="header-actions">
   {!isOwner&&<div className="header-pop-wrap"><button className={`quick ${navPopup==='quick'?'active':''}`} onClick={()=>setNavPopup(navPopup==='quick'?null:'quick')}><Plus/> Brzo dodaj <ChevronDown/></button>{navPopup==='quick'&&<QuickAddMenu close={()=>setNavPopup(null)} onSelect={quickSelect}/>}</div>}
   <div className="header-pop-wrap"><button className={`bell ${navPopup==='notifications'?'active':''}`} onClick={()=>setNavPopup(navPopup==='notifications'?null:'notifications')}><Bell/>{notifications.some(n=>!n.read)&&<i></i>}</button>{navPopup==='notifications'&&<NotificationCenter items={notifications} setItems={setNotifications} close={()=>setNavPopup(null)} go={go}/>}</div>
   <div className="header-pop-wrap"><button className={`profile-trigger ${navPopup==='profile'?'active':''}`} onClick={()=>setNavPopup(navPopup==='profile'?null:'profile')}><Avatar profile={profile} className="avatar header-avatar"/><ChevronDown/></button>{navPopup==='profile'&&<ProfileMenu close={()=>setNavPopup(null)} go={go} onProfile={()=>setProfileModal(true)} onLogout={logout} profile={profile}/>}</div>
  </div></header>{!loading&&!backendOnline&&<div className="demo-mode-banner"><AlertTriangle/> Demo režim: nije moguće povezati se na bazu, pa se izmjene ne čuvaju trajno. Na produkcijskom serveru sve radi sa pravom bazom podataka.</div>}<div className="content"><ErrorBoundary key={page}>{content}</ErrorBoundary></div></main>
  {modal&&<Modal close={()=>setModal(false)} clients={clients} onCreate={job=>{addJob(job);notify('Novi posao je kreiran i dodan u raspored.');}}/>} {quickCreate&&<QuickCreateModal type={quickCreate} close={()=>setQuickCreate(null)} onSave={quickSaved} clients={clients}/>} {profileModal&&<ProfileModal close={()=>setProfileModal(false)} onSaved={notify} profile={profile} setProfile={setProfile}/>} {searchOpen&&<GlobalSearch close={()=>setSearchOpen(false)} go={go}/>} {notice&&<div className="toast"><CheckCircle2/><div><strong>Uspješno</strong><span>{notice}</span></div><button onClick={()=>setNotice('')}><X/></button></div>}
 </div>
}

export default function App(){
 return <DataProvider><AppShell/></DataProvider>;
}