import React, {useMemo,useState,useRef,useEffect} from 'react';
import {Plus,Search,SlidersHorizontal,MoreHorizontal,X,Check,Trash2,Edit3,Eye,Users,BriefcaseBusiness,FileText,ReceiptText,Package,Wrench,CalendarDays,Clock3,MapPin,Phone,Mail,Building2,UserRound,Euro,AlertTriangle,CheckCircle2,Send,Download,TrendingUp,WalletCards,BarChart3,Settings,ShieldCheck,ChevronLeft,ChevronRight,Save,Archive,Truck,RefreshCw,Filter,Lock,ArrowRight,Copy,Smartphone,Ban,UserCog,ImagePlus} from 'lucide-react';
import {useData} from './store';

const labels={Aktivan:'green','Novi upit':'amber','U toku':'blue',Zakazano:'purple',Novi:'amber',Završeno:'green',Poslata:'blue',Prihvaćena:'green',Nacrt:'gray',Istekla:'red',Plaćen:'green',Poslat:'blue',Kasni:'red',Dostupno:'green','Niska zaliha':'amber','Nema na stanju':'red'};
function Badge({children}){return <span className={`module-badge ${labels[children]||'gray'}`}>{children}</span>}
function Header({eyebrow,title,description,button,onAdd}){return <div className="page-head"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div>{button&&<button className="primary" onClick={onAdd}><Plus/>{button}</button>}</div>}

export function exportToPDF(title,subtitle,columns,rows){
 const win=window.open('','_blank');
 if(!win){window.alert('Dozvolite otvaranje novog prozora (popup) da bi izvoz u PDF radio.');return;}
 const style=`<style>*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;padding:34px;color:#1c2b3d}h1{font-size:19px;margin:0 0 3px}.sub{color:#68788a;font-size:11px;margin:0 0 20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #dde3ea;padding:8px 10px;font-size:11px;text-align:left}th{background:#f2f5f9;color:#4c5b6d}.brand{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #113e70;padding-bottom:13px;margin-bottom:18px}.brand strong{font-size:18px;color:#113e70}.brand span{font-size:10px;color:#8492a4}@media print{body{padding:0}}</style>`;
 const head=`<tr>${columns.map(c=>`<th>${c}</th>`).join('')}</tr>`;
 const body=rows.length?rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${columns.length}" style="text-align:center;color:#98a4b3;padding:20px">Nema podataka za prikaz</td></tr>`;
 win.document.write(`<html><head><title>${title} — TeloPak</title>${style}</head><body><div class="brand"><strong>TeloPak</strong><span>Generisano ${new Date().toLocaleDateString('bs-BA')} u ${new Date().toLocaleTimeString('bs-BA',{hour:'2-digit',minute:'2-digit'})}</span></div><h1>${title}</h1><p class="sub">${subtitle}</p><table><thead>${head}</thead><tbody>${body}</tbody></table></body></html>`);
 win.document.close();win.focus();
 setTimeout(()=>{win.print();},350);
}

function Toolbar({search,setSearch,placeholder='Pretraži...',right,statusOptions,statusValue,setStatusValue,filterLabel='Status',onExport}){
 const [open,setOpen]=useState(false);
 const ref=useRef(null);
 useEffect(()=>{const h=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false)};document.addEventListener('mousedown',h);return()=>document.removeEventListener('mousedown',h)},[]);
 const active=statusOptions&&statusValue&&statusValue!==statusOptions[0];
 return <div className="module-toolbar">
  <div className="search-inner"><Search/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={placeholder}/></div>
  {statusOptions&&<div className="filter-wrap" ref={ref}>
   <button type="button" className={`secondary ${active?'filter-active':''}`} onClick={()=>setOpen(o=>!o)}><SlidersHorizontal/> Filteri{active&&<i className="filter-dot"/>}</button>
   {open&&<div className="filter-pop">
    <label>{filterLabel}<select value={statusValue} onChange={e=>setStatusValue(e.target.value)}>{statusOptions.map(o=><option key={o}>{o}</option>)}</select></label>
    <button type="button" className="text-link" onClick={()=>{setStatusValue(statusOptions[0]);setOpen(false);}}>Poništi filter</button>
   </div>}
  </div>}
  {onExport&&<button type="button" className="secondary" onClick={onExport}><Download/> Izvezi PDF</button>}
  {right}
 </div>;
}
function Metric({icon:Icon,label,value,sub,tone='blue'}){return <div className="module-metric"><span className={`metric-icon ${tone}`}><Icon/></span><div><span>{label}</span><strong>{value}</strong><small>{sub}</small></div></div>}
function Actions({onView,onEdit,onDelete,extra}){return <div className="row-actions" onClick={e=>e.stopPropagation()}><button className="icon-btn sm" title="Detalji" onClick={onView}><Eye/></button><button className="icon-btn sm" title="Uredi" onClick={onEdit}><Edit3/></button>{extra}<button className="icon-btn sm danger" title="Obriši" onClick={onDelete}><Trash2/></button></div>}
function ConfirmDelete({name,onClose,onConfirm}){return <ModalShell title="Trajno brisanje" sub="Ova radnja se ne može poništiti." close={onClose} danger><div className="confirm-content"><div className="confirm-icon red"><Trash2/></div><h3>Obrisati zapis?</h3><p>Zapis <strong>{name}</strong> bit će trajno uklonjen. Povezana poslovna dokumentacija ostaje sačuvana gdje je zakonski obavezno.</p></div><ModalActions close={onClose}><button className="primary danger-primary" onClick={onConfirm}><Trash2/> Trajno obriši</button></ModalActions></ModalShell>}
function ModalShell({title,sub,close,children,danger=false,wide=false}){return <div className="modal-backdrop" onMouseDown={close}><div className={`modal module-modal ${danger?'danger-modal':''} ${wide?'wide-modal':''}`} onMouseDown={e=>e.stopPropagation()}><div className="modal-head"><div><span className="modal-kicker">TELOPAK RADNI PROSTOR</span><h2>{title}</h2><p>{sub}</p></div><button className="icon-btn" onClick={close}><X/></button></div>{children}</div></div>}
function ModalActions({close,children}){return <div className="modal-actions"><button type="button" className="secondary" onClick={close}>Odustani</button>{children}</div>}
function Field({label,children,full=false,hint}){return <label className={full?'full':''}>{label}{children}{hint&&<span className="field-help">{hint}</span>}</label>}
function Input({value,onChange,...p}){return <input value={value||''} onChange={e=>onChange(e.target.value)} {...p}/>} function Select({value,onChange,children}){return <select value={value||''} onChange={e=>onChange(e.target.value)}>{children}</select>}
function EUDate({value,onChange,minDate}){const [open,setOpen]=useState(false);const parse=()=>{const m=(value||'').match(/(\d{2})\.(\d{2})\.(\d{4})/);return m?new Date(+m[3],+m[2]-1,+m[1]):new Date()};const [view,setView]=useState(parse());const days=new Date(view.getFullYear(),view.getMonth()+1,0).getDate();const off=(new Date(view.getFullYear(),view.getMonth(),1).getDay()+6)%7;const fmt=d=>`${String(d).padStart(2,'0')}.${String(view.getMonth()+1).padStart(2,'0')}.${view.getFullYear()}.`;const min=minDate?new Date(minDate.getFullYear(),minDate.getMonth(),minDate.getDate()):null;return <div className="mini-picker"><button type="button" className="picker-input" onClick={()=>setOpen(!open)}><CalendarDays/>{value||'Odaberite datum'}</button>{open&&<div className="mini-calendar"><div><button type="button" onClick={()=>setView(new Date(view.getFullYear(),view.getMonth()-1,1))}><ChevronLeft/></button><strong>{['Januar','Februar','Mart','April','Maj','Juni','Juli','August','Septembar','Oktobar','Novembar','Decembar'][view.getMonth()]} {view.getFullYear()}</strong><button type="button" onClick={()=>setView(new Date(view.getFullYear(),view.getMonth()+1,1))}><ChevronRight/></button></div><section>{['Po','Ut','Sr','Če','Pe','Su','Ne'].map(x=><small key={x}>{x}</small>)}{Array(off).fill(0).map((_,i)=><i key={`e${i}`}/>)}{Array(days).fill(0).map((_,i)=>{const date=new Date(view.getFullYear(),view.getMonth(),i+1);const disabled=!!min&&date<min;return <button type="button" key={i} disabled={disabled} title={disabled?'Nije moguće zakazati termin u prošlosti':''} onClick={()=>{if(disabled)return;onChange(fmt(i+1));setOpen(false)}} className={`${value===fmt(i+1)?'selected ':''}${disabled?'past-date':''}`}>{i+1}</button>})}</section></div>}</div>}
function EUTime({value,onChange}){const times=[];for(let h=6;h<22;h++)for(const m of ['00','30'])times.push(`${String(h).padStart(2,'0')}:${m}`);return <div className="select-icon"><Clock3/><Select value={value} onChange={onChange}>{times.map(t=><option key={t}>{t}</option>)}</Select></div>}
function DetailDrawer({title,sub,close,children,actions}){return <><div className="drawer-overlay" onClick={close}/><aside className="detail-drawer"><div className="drawer-head"><div><span>DETALJNI PREGLED</span><h2>{title}</h2><p>{sub}</p></div><button className="icon-btn" onClick={close}><X/></button></div><div className="drawer-body">{children}</div>{actions&&<div className="drawer-actions">{actions}</div>}</aside></>}
function InfoGrid({items}){return <div className="info-grid">{items.map(([l,v])=><div key={l}><span>{l}</span><strong>{v||'—'}</strong></div>)}</div>}
function Empty(){return <div className="empty-row">Nema rezultata za odabranu pretragu ili filter.</div>}

export function ClientsModule(){
 const {clients:items,setClients:setItems}=useData();
 const [search,setSearch]=useState(''),[status,setStatus]=useState('Svi statusi'),[modal,setModal]=useState(null),[selected,setSelected]=useState(null);
 const filtered=items.filter(x=>`${x.name} ${x.contact} ${x.city}`.toLowerCase().includes(search.toLowerCase()) && (status==='Svi statusi'||x.status===status));
 const save=data=>{setItems(a=>data.id?a.map(x=>x.id===data.id?data:x):[...a,{...data,id:Date.now(),jobs:0,value:'0,00 €'}]);setModal(null)};
 const del=x=>{setItems(a=>a.filter(i=>i.id!==x.id));setModal(null);setSelected(null)};
 const exportList=()=>exportToPDF('Klijenti',`Pregled klijenata — ${filtered.length} od ${items.length} zapisa`,['Klijent','Kontakt osoba','Grad','Poslovi','Vrijednost','Status'],filtered.map(x=>[x.name,x.contact,x.city,x.jobs,x.value,x.status]));
 return <><Header eyebrow="CRM I ISTORIJA POSLOVA" title="Klijenti" description="Kontakti, lokacije i kompletna istorija saradnje." button="Novi klijent" onAdd={()=>setModal({type:'form',data:{type:'Fizičko lice',status:'Aktivan'}})}/><div className="module-metrics"><Metric icon={Users} label="Ukupno klijenata" value={items.length} sub="4 nova ovaj mjesec"/><Metric icon={BriefcaseBusiness} label="Aktivni poslovi" value="24" sub="Kod 12 klijenata" tone="green"/><Metric icon={Euro} label="Vrijednost saradnje" value="18.050 €" sub="Ovaj mjesec" tone="orange"/></div><section className="card"><Toolbar search={search} setSearch={setSearch} placeholder="Ime, kontakt ili grad..." statusOptions={['Svi statusi','Aktivan','Novi upit','Neaktivan']} statusValue={status} setStatusValue={setStatus} onExport={exportList}/><div className="table-wrap"><table><thead><tr><th>Klijent</th><th>Kontakt osoba</th><th>Lokacija</th><th>Poslovi</th><th>Vrijednost</th><th>Status</th><th>Akcije</th></tr></thead><tbody>{filtered.map(x=><tr key={x.id} className="clickable-row" onClick={()=>setSelected(x)}><td><div className="client-cell"><span className="avatar square">{x.name.split(' ').map(y=>y[0]).slice(0,2)}</span><div><strong>{x.name}</strong><small>{x.type}</small></div></div></td><td><strong>{x.contact}</strong><small className="table-sub">{x.email}</small></td><td>{x.city}<small className="table-sub">{x.address}</small></td><td>{x.jobs}</td><td><strong>{x.value}</strong></td><td><Badge>{x.status}</Badge></td><td><Actions onView={()=>setSelected(x)} onEdit={()=>setModal({type:'form',data:x})} onDelete={()=>setModal({type:'delete',data:x})}/></td></tr>)}</tbody></table>{!filtered.length&&<Empty/>}</div></section>{modal?.type==='form'&&<ClientForm data={modal.data} close={()=>setModal(null)} save={save}/>} {modal?.type==='delete'&&<ConfirmDelete name={modal.data.name} onClose={()=>setModal(null)} onConfirm={()=>del(modal.data)}/>} {selected&&<DetailDrawer title={selected.name} sub={`${selected.type} · ${selected.city}`} close={()=>setSelected(null)} actions={<><button className="secondary" onClick={()=>exportToPDF(`Klijent — ${selected.name}`,`${selected.type} · ${selected.city}`,['Podatak','Vrijednost'],[['Kontakt osoba',selected.contact],['Email',selected.email],['Telefon',selected.phone],['Adresa',`${selected.address}, ${selected.city}`],['Broj poslova',selected.jobs],['Ukupna vrijednost',selected.value],['Status',selected.status]])}><Download/> PDF</button><button className="secondary" onClick={()=>setModal({type:'form',data:selected})}><Edit3/> Uredi</button><button className="primary"><Plus/> Novi posao</button></>}><div className="drawer-profile"><span className="avatar profile-avatar">{selected.name.split(' ').map(y=>y[0]).slice(0,2)}</span><div><h3>{selected.contact}</h3><Badge>{selected.status}</Badge></div></div><InfoGrid items={[["Email",selected.email],["Telefon",selected.phone],["Adresa",`${selected.address}, ${selected.city}`],["Broj poslova",selected.jobs],["Ukupna vrijednost",selected.value]]}/><div className="drawer-section"><h4>Interna bilješka</h4><p>{selected.note||'Nema unesenih bilješki.'}</p></div><div className="drawer-section"><h4>Posljednja aktivnost</h4><div className="activity-line"><CheckCircle2/><div><strong>Račun R-041 plaćen</strong><span>24.03.2025. u 11:42</span></div></div><div className="activity-line"><Wrench/><div><strong>Završen servis</strong><span>21.03.2025. u 16:10</span></div></div></div></DetailDrawer>}</>}
function ClientForm({data,close,save}){const [f,setF]=useState({...data});const s=(k,v)=>setF(x=>({...x,[k]:v}));return <ModalShell title={data.id?'Uredi klijenta':'Novi klijent'} sub="Kontaktni i poslovni podaci klijenta." close={close} wide><form onSubmit={e=>{e.preventDefault();save(f)}}><div className="form-grid"><Field label="Vrsta klijenta"><Select value={f.type} onChange={v=>s('type',v)}><option>Fizičko lice</option><option>Pravno lice</option></Select></Field><Field label="Naziv / ime klijenta"><Input value={f.name} onChange={v=>s('name',v)} placeholder="npr. Kovač d.o.o." required/></Field><Field label="Kontakt osoba"><Input value={f.contact} onChange={v=>s('contact',v)} placeholder="Ime i prezime" required/></Field><Field label="Status"><Select value={f.status} onChange={v=>s('status',v)}><option>Aktivan</option><option>Novi upit</option><option>Neaktivan</option></Select></Field><Field label="Email"><Input type="email" value={f.email} onChange={v=>s('email',v)} placeholder="kontakt@firma.ba"/></Field><Field label="Telefon"><Input value={f.phone} onChange={v=>s('phone',v)} placeholder="+387 6X XXX XXX"/></Field><Field label="Grad"><Input value={f.city} onChange={v=>s('city',v)} placeholder="Sarajevo"/></Field><Field label="Adresa"><Input value={f.address} onChange={v=>s('address',v)} placeholder="Ulica i broj"/></Field><Field label="Interna bilješka" full><textarea value={f.note||''} onChange={e=>s('note',e.target.value)} placeholder="Važne informacije o klijentu..."/></Field></div><ModalActions close={close}><button className="primary"><Check/> Sačuvaj klijenta</button></ModalActions></form></ModalShell>}

export function JobsModule(){
 const {jobs:items,setJobs:setItems}=useData();
 const [search,setSearch]=useState(''),[status,setStatus]=useState('Svi statusi'),[modal,setModal]=useState(null),[selected,setSelected]=useState(null);
 const filtered=items.filter(x=>`${x.no} ${x.client} ${x.service} ${x.worker}`.toLowerCase().includes(search.toLowerCase()) && (status==='Svi statusi'||x.status===status));
 const save=f=>{setItems(a=>f.id?a.map(x=>x.id===f.id?f:x):[...a,{...f,id:Date.now(),no:`P-${1054+a.length}`}]);setModal(null)};
 const del=x=>{setItems(a=>a.filter(i=>i.id!==x.id));setModal(null)};
 const exportList=()=>exportToPDF('Poslovi',`Pregled poslova — ${filtered.length} od ${items.length} zapisa`,['Broj','Klijent','Usluga','Termin','Radnik','Prioritet','Status'],filtered.map(x=>[x.no,x.client,x.service,`${x.date} ${x.time}`,x.worker,x.priority,x.status]));
 return <><Header eyebrow="OPERATIVA NA TERENU" title="Poslovi" description="Od novog upita do završene intervencije." button="Novi posao" onAdd={()=>setModal({type:'form',data:{status:'Novi',priority:'Standardno',date:'25.03.2025.',time:'08:00'}})}/><div className="module-metrics"><Metric icon={BriefcaseBusiness} label="Aktivni poslovi" value={items.length} sub="4 zakazana danas"/><Metric icon={Clock3} label="U toku" value="1" sub="Radnik je na terenu" tone="orange"/><Metric icon={CheckCircle2} label="Završeno ovaj mjesec" value="38" sub="Prosjek 1,7 dnevno" tone="green"/></div><section className="card"><Toolbar search={search} setSearch={setSearch} placeholder="Broj, klijent, usluga ili radnik..." statusOptions={['Svi statusi','Novi','Zakazano','U toku','Završeno']} statusValue={status} setStatusValue={setStatus} onExport={exportList}/><div className="table-wrap"><table><thead><tr><th>Broj</th><th>Klijent i usluga</th><th>Termin</th><th>Radnik</th><th>Prioritet</th><th>Status</th><th>Akcije</th></tr></thead><tbody>{filtered.map(x=><tr key={x.id} onClick={()=>setSelected(x)} className="clickable-row"><td className="mono">{x.no}</td><td><strong>{x.client}</strong><small className="table-sub">{x.service}</small></td><td>{x.date}<small className="table-sub">{x.time} · {x.city}</small></td><td>{x.worker}</td><td><span className={`priority ${x.priority.toLowerCase()}`}>{x.priority}</span></td><td><Badge>{x.status}</Badge></td><td><Actions onView={()=>setSelected(x)} onEdit={()=>setModal({type:'form',data:x})} onDelete={()=>setModal({type:'delete',data:x})}/></td></tr>)}</tbody></table>{!filtered.length&&<Empty/>}</div></section>{modal?.type==='form'&&<JobForm data={modal.data} close={()=>setModal(null)} save={save}/>} {modal?.type==='delete'&&<ConfirmDelete name={`${modal.data.no} · ${modal.data.client}`} onClose={()=>setModal(null)} onConfirm={()=>del(modal.data)}/>} {selected&&<DetailDrawer title={selected.no} sub={`${selected.client} · ${selected.service}`} close={()=>setSelected(null)} actions={<><button className="secondary" onClick={()=>exportToPDF(`Posao ${selected.no}`,`${selected.client} · ${selected.service}`,['Podatak','Vrijednost'],[['Klijent',selected.client],['Usluga',selected.service],['Datum',selected.date],['Vrijeme',selected.time],['Radnik',selected.worker],['Lokacija',selected.city],['Prioritet',selected.priority],['Status',selected.status],['Vrijednost',selected.amount]])}><Download/> PDF</button><button className="secondary" onClick={()=>setModal({type:'form',data:selected})}><Edit3/> Uredi</button><button className="primary"><CheckCircle2/> Završi posao</button></>}><div className="job-status-hero"><Badge>{selected.status}</Badge><span className={`priority ${selected.priority.toLowerCase()}`}>{selected.priority}</span></div><InfoGrid items={[["Klijent",selected.client],["Usluga",selected.service],["Datum",selected.date],["Vrijeme",selected.time],["Radnik",selected.worker],["Lokacija",selected.city],["Procijenjena vrijednost",selected.amount]]}/><div className="drawer-section"><h4>Tok intervencije</h4><div className="process-list"><div className="done"><Check/> Upit zaprimljen <span>24.03. · 09:15</span></div><div className="done"><Check/> Termin potvrđen <span>24.03. · 11:30</span></div><div className="current"><Clock3/> Intervencija {selected.status==='U toku'?'u toku':'zakazana'}</div></div></div></DetailDrawer>}</>}
function JobForm({data,close,save}){const {clients}=useData();const [f,setF]=useState({...data}),[error,setError]=useState('');const s=(k,v)=>{setF(x=>({...x,[k]:v}));setError('')};const submit=e=>{e.preventDefault();const d=parseEUFull(f.date);const chosen=new Date(d.getFullYear(),d.getMonth(),d.getDate(),Math.floor(timeToMin(f.time)/60),timeToMin(f.time)%60);if(chosen<new Date()){setError('Nije moguće zakazati termin u prošlosti.');return}if(!f.client||!f.service||!f.worker){setError('Klijent, vrsta usluge i radnik su obavezni.');return}const ok=save(f);if(ok===false)setError('Termin nije sačuvan. Provjerite zauzetost radnika i odabrani datum.')};return <ModalShell title={data.id?'Uredi posao':'Novi posao'} sub="Podaci o intervenciji, terminu i izvršiocu." close={close} wide><form onSubmit={submit}><div className="form-grid"><Field label="Klijent"><Select value={f.client} onChange={v=>s('client',v)}><option value="">Odaberite klijenta</option>{clients.map(c=><option key={c.id}>{c.name}</option>)}</Select></Field><Field label="Vrsta usluge"><Input value={f.service} onChange={v=>s('service',v)} placeholder="npr. Servis bojlera" required/></Field><Field label="Datum"><EUDate value={f.date} onChange={v=>s('date',v)} minDate={new Date()}/></Field><Field label="Vrijeme"><EUTime value={f.time} onChange={v=>s('time',v)}/></Field><Field label="Dodijeljeni radnik"><Select value={f.worker} onChange={v=>s('worker',v)}><option value="">Odaberite radnika</option><option>Marko Ilić</option><option>Ivan Kovač</option><option>Petar Jurić</option></Select></Field><Field label="Lokacija"><Input value={f.city} onChange={v=>s('city',v)} placeholder="Grad / naselje"/></Field><Field label="Prioritet"><Select value={f.priority} onChange={v=>s('priority',v)}><option>Standardno</option><option>Visoko</option><option>Hitno</option></Select></Field><Field label="Status"><Select value={f.status} onChange={v=>s('status',v)}><option>Novi</option><option>Zakazano</option><option>U toku</option><option>Završeno</option></Select></Field><Field label="Opis intervencije" full><textarea value={f.description||''} onChange={e=>s('description',e.target.value)} placeholder="Detaljan opis zahtjeva i napomene za radnika..."/></Field>{error&&<p className="otp-error full"><AlertTriangle/> {error}</p>}</div><ModalActions close={close}><button className="primary"><Check/> Sačuvaj posao</button></ModalActions></form></ModalShell>}

function DocumentModule({kind}){
 const isOffer=kind==='Ponude';
 const {offers,setOffers,invoices,setInvoices}=useData();
 const items=isOffer?offers:invoices; const setItems=isOffer?setOffers:setInvoices;
 const [search,setSearch]=useState(''),[status,setStatus]=useState('Svi statusi'),[modal,setModal]=useState(null),[selected,setSelected]=useState(null);
 const statusOptions=isOffer?['Svi statusi','Nacrt','Poslata','Prihvaćena','Istekla']:['Svi statusi','Nacrt','Poslat','Plaćen','Kasni'];
 const filtered=items.filter(x=>`${x.no} ${x.client}`.toLowerCase().includes(search.toLowerCase()) && (status==='Svi statusi'||x.status===status));
 const save=f=>{setItems(a=>f.id?a.map(x=>x.id===f.id?f:x):[...a,{...f,id:Date.now(),no:`${isOffer?'PN':'R'}-0${a.length+29}`}]);setModal(null)};
 const del=x=>{setItems(a=>a.filter(i=>i.id!==x.id));setModal(null)};
 const exportList=()=>exportToPDF(kind,`Pregled ${isOffer?'ponuda':'računa'} — ${filtered.length} od ${items.length} dokumenata`,isOffer?['Broj','Klijent','Datum','Važi do','Iznos','Status']:['Broj','Klijent','Izdato','Dospijeće','Iznos','Plaćeno','Status'],filtered.map(x=>isOffer?[x.no,x.client,x.date,x.valid,x.amount,x.status]:[x.no,x.client,x.issued,x.due,x.amount,x.paid,x.status]));
 const exportSingle=doc=>exportToPDF(`${isOffer?'Ponuda':'Račun'} ${doc.no}`,`Klijent: ${doc.client}`,['Opis','Količina','Cijena'],[['Servis i montaža opreme','1',doc.amount],['','','UKUPNO: '+doc.amount]]);
 return <><Header eyebrow={isOffer?'PRODAJA I UGOVARANJE':'FINANSIJE I NAPLATA'} title={kind} description={isOffer?'Kreirajte, šaljite i pratite prihvatanje ponuda.':'Izdavanje računa, dospijeća i evidencija uplata.'} button={isOffer?'Nova ponuda':'Novi račun'} onAdd={()=>setModal({type:'form',data:isOffer?{date:'25.03.2025.',valid:'01.04.2025.',status:'Nacrt'}:{issued:'25.03.2025.',due:'01.04.2025.',status:'Nacrt',paid:'0,00 €'}})}/><div className="module-metrics"><Metric icon={isOffer?FileText:ReceiptText} label={isOffer?'Otvorene ponude':'Izdati računi'} value={items.length} sub="Ovaj mjesec"/><Metric icon={Euro} label={isOffer?'Vrijednost ponuda':'Ukupno fakturisano'} value={isOffer?'3.930 €':'2.750 €'} sub="Bez PDV-a" tone="orange"/><Metric icon={isOffer?CheckCircle2:WalletCards} label={isOffer?'Stopa prihvatanja':'Naplaćeno'} value={isOffer?'68%':'1.200 €'} sub="U tekućem periodu" tone="green"/></div><section className="card"><Toolbar search={search} setSearch={setSearch} placeholder={`${isOffer?'Broj ponude':'Broj računa'} ili klijent...`} statusOptions={statusOptions} statusValue={status} setStatusValue={setStatus} onExport={exportList}/><div className="table-wrap"><table><thead><tr><th>Broj</th><th>Klijent</th><th>{isOffer?'Datum':'Izdato'}</th><th>{isOffer?'Važi do':'Dospijeće'}</th><th>Iznos</th>{!isOffer&&<th>Plaćeno</th>}<th>Status</th><th>Akcije</th></tr></thead><tbody>{filtered.map(x=><tr key={x.id} className="clickable-row" onClick={()=>setSelected(x)}><td className="mono">{x.no}</td><td><strong>{x.client}</strong></td><td>{isOffer?x.date:x.issued}</td><td>{isOffer?x.valid:x.due}</td><td><strong>{x.amount}</strong></td>{!isOffer&&<td>{x.paid}</td>}<td><Badge>{x.status}</Badge></td><td><Actions onView={()=>setSelected(x)} onEdit={()=>setModal({type:'form',data:x})} onDelete={()=>setModal({type:'delete',data:x})} extra={<button className="icon-btn sm" title="Pošalji"><Send/></button>}/></td></tr>)}</tbody></table>{!filtered.length&&<Empty/>}</div></section>{modal?.type==='form'&&<DocumentForm isOffer={isOffer} data={modal.data} close={()=>setModal(null)} save={save}/>} {modal?.type==='delete'&&<ConfirmDelete name={modal.data.no} onClose={()=>setModal(null)} onConfirm={()=>del(modal.data)}/>} {selected&&<DetailDrawer title={`${isOffer?'Ponuda':'Račun'} ${selected.no}`} sub={selected.client} close={()=>setSelected(null)} actions={<><button className="secondary" onClick={()=>exportSingle(selected)}><Download/> PDF</button><button className="primary"><Send/> Pošalji klijentu</button></>}><div className="document-preview"><div className="doc-brand"><strong>TeloPak</strong><Badge>{selected.status}</Badge></div><InfoGrid items={[["Klijent",selected.client],[isOffer?'Datum ponude':'Datum izdavanja',isOffer?selected.date:selected.issued],[isOffer?'Važi do':'Rok plaćanja',isOffer?selected.valid:selected.due]]}/><div className="doc-items"><div><span>Opis</span><span>Količina</span><span>Cijena</span></div><div><strong>Servis i montaža opreme</strong><span>1</span><strong>{selected.amount}</strong></div></div><div className="doc-total"><span>UKUPNO</span><strong>{selected.amount}</strong></div></div></DetailDrawer>}</>}
function DocumentForm({isOffer,data,close,save}){const {clients}=useData();const [f,setF]=useState({...data,amount:data.amount||'0,00 €'}),[rows,setRows]=useState([{description:'',qty:1,price:''}]);const s=(k,v)=>setF(x=>({...x,[k]:v}));return <ModalShell title={`${data.id?'Uredi':'Nova'} ${isOffer?'ponuda':'račun'}`} sub="Dokument sa stavkama, iznosima i rokovima." close={close} wide><form onSubmit={e=>{e.preventDefault();save(f)}}><div className="form-grid"><Field label="Klijent" full><Select value={f.client} onChange={v=>s('client',v)}><option value="">Odaberite klijenta</option>{clients.map(c=><option key={c.id}>{c.name}</option>)}</Select></Field><Field label={isOffer?'Datum ponude':'Datum izdavanja'}><EUDate value={isOffer?f.date:f.issued} onChange={v=>s(isOffer?'date':'issued',v)}/></Field><Field label={isOffer?'Važi do':'Rok plaćanja'}><EUDate value={isOffer?f.valid:f.due} onChange={v=>s(isOffer?'valid':'due',v)}/></Field><Field label="Status"><Select value={f.status} onChange={v=>s('status',v)}>{(isOffer?['Nacrt','Poslata','Prihvaćena','Istekla']:['Nacrt','Poslat','Plaćen','Kasni']).map(x=><option key={x}>{x}</option>)}</Select></Field><Field label="Ukupan iznos"><Input value={f.amount} onChange={v=>s('amount',v)} placeholder="0,00 €"/></Field><div className="full line-items"><div className="line-items-head"><strong>Stavke dokumenta</strong><button type="button" onClick={()=>setRows(r=>[...r,{description:'',qty:1,price:''}])}><Plus/> Dodaj stavku</button></div>{rows.map((r,i)=><div className="line-item" key={i}><input placeholder="Opis usluge ili materijala"/><input type="number" defaultValue={r.qty} min="1"/><input placeholder="Cijena (€)"/><button type="button" onClick={()=>setRows(a=>a.filter((_,j)=>j!==i))}><X/></button></div>)}</div><Field label="Napomena klijentu" full><textarea placeholder="Uslovi plaćanja, garancija ili dodatne informacije..."/></Field></div><ModalActions close={close}><button type="button" className="secondary"><Save/> Sačuvaj nacrt</button><button className="primary"><Check/> Sačuvaj dokument</button></ModalActions></form></ModalShell>}
export const OffersModule=()=> <DocumentModule kind="Ponude"/>; export const InvoicesModule=()=> <DocumentModule kind="Računi"/>;

export function StockModule(){
 const {stock:items,setStock:setItems}=useData();
 const [search,setSearch]=useState(''),[status,setStatus]=useState('Svi statusi'),[modal,setModal]=useState(null);
 const filtered=items.filter(x=>`${x.code} ${x.name} ${x.category}`.toLowerCase().includes(search.toLowerCase()) && (status==='Svi statusi'||x.status===status));
 const save=f=>{const stat=+f.stock===0?'Nema na stanju':+f.stock<=+f.min?'Niska zaliha':'Dostupno';setItems(a=>f.id?a.map(x=>x.id===f.id?{...f,status:stat}:x):[...a,{...f,id:Date.now(),code:`MAT-00${a.length+1}`,status:stat}]);setModal(null)};
 const del=x=>{setItems(a=>a.filter(i=>i.id!==x.id));setModal(null)};
 const exportList=()=>exportToPDF('Materijal',`Pregled zaliha — ${filtered.length} od ${items.length} artikala`,['Šifra','Artikl','Kategorija','Stanje','Min.','Nabavna','Prodajna','Status'],filtered.map(x=>[x.code,x.name,x.category,`${x.stock} ${x.unit}`,`${x.min} ${x.unit}`,x.buy,x.sell,x.status]));
 return <><Header eyebrow="SKLADIŠTE I POTROŠNJA" title="Materijal" description="Zalihe, nabavne cijene i potrošnja po intervenciji." button="Novi artikl" onAdd={()=>setModal({type:'form',data:{unit:'kom',stock:0,min:5}})}/><div className="module-metrics"><Metric icon={Package} label="Artikli na stanju" value={items.length} sub="4 kategorije"/><Metric icon={AlertTriangle} label="Ispod minimuma" value={items.filter(x=>x.status!=='Dostupno').length} sub="Potrebna nabavka" tone="orange"/><Metric icon={Euro} label="Vrijednost zaliha" value="6.840 €" sub="Po nabavnim cijenama" tone="green"/></div><section className="card"><Toolbar search={search} setSearch={setSearch} placeholder="Šifra, naziv ili kategorija..." statusOptions={['Svi statusi','Dostupno','Niska zaliha','Nema na stanju']} statusValue={status} setStatusValue={setStatus} onExport={exportList} right={<button className="secondary"><Truck/> Nova nabavka</button>}/><div className="table-wrap"><table><thead><tr><th>Šifra</th><th>Artikl</th><th>Kategorija</th><th>Stanje</th><th>Min.</th><th>Nabavna</th><th>Prodajna</th><th>Status</th><th>Akcije</th></tr></thead><tbody>{filtered.map(x=><tr key={x.id}><td className="mono">{x.code}</td><td><strong>{x.name}</strong></td><td>{x.category}</td><td><strong>{x.stock} {x.unit}</strong></td><td>{x.min} {x.unit}</td><td>{x.buy}</td><td>{x.sell}</td><td><Badge>{x.status}</Badge></td><td><Actions onView={()=>setModal({type:'form',data:x})} onEdit={()=>setModal({type:'form',data:x})} onDelete={()=>setModal({type:'delete',data:x})}/></td></tr>)}</tbody></table>{!filtered.length&&<Empty/>}</div></section>{modal?.type==='form'&&<StockForm data={modal.data} close={()=>setModal(null)} save={save}/>} {modal?.type==='delete'&&<ConfirmDelete name={modal.data.name} onClose={()=>setModal(null)} onConfirm={()=>del(modal.data)}/>}</>}
function StockForm({data,close,save}){const [f,setF]=useState({...data});const s=(k,v)=>setF(x=>({...x,[k]:v}));return <ModalShell title={data.id?'Uredi artikl':'Novi artikl'} sub="Šifra, zaliha i prodajne informacije." close={close}><form onSubmit={e=>{e.preventDefault();save(f)}}><div className="form-grid"><Field label="Naziv artikla" full><Input value={f.name} onChange={v=>s('name',v)} placeholder="Naziv materijala ili opreme" required/></Field><Field label="Kategorija"><Input value={f.category} onChange={v=>s('category',v)} placeholder="npr. Instalacije"/></Field><Field label="Jedinica mjere"><Select value={f.unit} onChange={v=>s('unit',v)}><option>kom</option><option>m</option><option>kg</option><option>l</option></Select></Field><Field label="Trenutna zaliha"><Input type="number" value={f.stock} onChange={v=>s('stock',v)} min="0"/></Field><Field label="Minimalna zaliha"><Input type="number" value={f.min} onChange={v=>s('min',v)} min="0"/></Field><Field label="Nabavna cijena"><Input value={f.buy} onChange={v=>s('buy',v)} placeholder="0,00 €"/></Field><Field label="Prodajna cijena"><Input value={f.sell} onChange={v=>s('sell',v)} placeholder="0,00 €"/></Field></div><ModalActions close={close}><button className="primary"><Check/> Sačuvaj artikl</button></ModalActions></form></ModalShell>}

export function MaintenanceModule(){
 const {maintenance:items,setMaintenance:setItems}=useData();
 const [search,setSearch]=useState(''),[worker,setWorker]=useState('Svi radnici'),[modal,setModal]=useState(null);
 const filtered=items.filter(x=>`${x.client} ${x.asset} ${x.service}`.toLowerCase().includes(search.toLowerCase()) && (worker==='Svi radnici'||x.worker===worker));
 const save=f=>{setItems(a=>f.id?a.map(x=>x.id===f.id?f:x):[...a,{...f,id:Date.now(),status:'Novo'}]);setModal(null)};
 const exportList=()=>exportToPDF('Održavanje',`Pregled servisnih planova — ${filtered.length} od ${items.length} zapisa`,['Klijent','Oprema','Servis','Sljedeći termin','Ciklus','Radnik','Status'],filtered.map(x=>[x.client,x.asset,x.service,x.next,x.cycle,x.worker,x.status]));
 return <><Header eyebrow="PONAVLJAJUĆI POSLOVI" title="Održavanje" description="Servisni planovi, rokovi i automatski podsjetnici." button="Novi plan" onAdd={()=>setModal({type:'form',data:{next:'25.04.2025.',cycle:'12 mjeseci'}})}/><div className="module-metrics"><Metric icon={RefreshCw} label="Aktivni planovi" value={items.length} sub="Automatski se obnavljaju"/><Metric icon={Clock3} label="U narednih 30 dana" value="1" sub="Klijenta treba kontaktirati" tone="orange"/><Metric icon={CheckCircle2} label="Obnovljeno" value="12" sub="Ove godine" tone="green"/></div><section className="card"><Toolbar search={search} setSearch={setSearch} placeholder="Klijent, uređaj ili servis..." statusOptions={['Svi radnici','Marko Ilić','Ivan Kovač','Petar Jurić']} statusValue={worker} setStatusValue={setWorker} filterLabel="Radnik" onExport={exportList}/><div className="table-wrap"><table><thead><tr><th>Klijent</th><th>Oprema / lokacija</th><th>Vrsta servisa</th><th>Sljedeći termin</th><th>Ciklus</th><th>Radnik</th><th>Status</th><th>Akcije</th></tr></thead><tbody>{filtered.map(x=><tr key={x.id}><td><strong>{x.client}</strong></td><td>{x.asset}</td><td>{x.service}</td><td><strong>{x.next}</strong></td><td>{x.cycle}</td><td>{x.worker}</td><td><span className="countdown">{x.status}</span></td><td><Actions onView={()=>setModal({type:'form',data:x})} onEdit={()=>setModal({type:'form',data:x})} onDelete={()=>setModal({type:'delete',data:x})}/></td></tr>)}</tbody></table>{!filtered.length&&<Empty/>}</div></section>{modal?.type==='form'&&<MaintenanceForm data={modal.data} close={()=>setModal(null)} save={save}/>} {modal?.type==='delete'&&<ConfirmDelete name={`${modal.data.client} · ${modal.data.asset}`} onClose={()=>setModal(null)} onConfirm={()=>{setItems(a=>a.filter(x=>x.id!==modal.data.id));setModal(null)}}/>}</>}
function MaintenanceForm({data,close,save}){const {clients}=useData();const [f,setF]=useState({...data});const s=(k,v)=>setF(x=>({...x,[k]:v}));return <ModalShell title={data.id?'Uredi servisni plan':'Novi servisni plan'} sub="Automatski plan ponavljajućeg održavanja." close={close}><form onSubmit={e=>{e.preventDefault();save(f)}}><div className="form-grid"><Field label="Klijent" full><Select value={f.client} onChange={v=>s('client',v)}><option value="">Odaberite klijenta</option>{clients.map(c=><option key={c.id}>{c.name}</option>)}</Select></Field><Field label="Oprema / uređaj"><Input value={f.asset} onChange={v=>s('asset',v)} placeholder="npr. Klima uređaj Daikin"/></Field><Field label="Vrsta servisa"><Input value={f.service} onChange={v=>s('service',v)} placeholder="Godišnji servis"/></Field><Field label="Sljedeći termin"><EUDate value={f.next} onChange={v=>s('next',v)}/></Field><Field label="Ponavljanje"><Select value={f.cycle} onChange={v=>s('cycle',v)}><option>3 mjeseca</option><option>6 mjeseci</option><option>12 mjeseci</option><option>24 mjeseca</option></Select></Field><Field label="Odgovorni radnik" full><Select value={f.worker} onChange={v=>s('worker',v)}><option value="">Odaberite radnika</option><option>Marko Ilić</option><option>Ivan Kovač</option><option>Petar Jurić</option></Select></Field></div><ModalActions close={close}><button className="primary"><Check/> Sačuvaj plan</button></ModalActions></form></ModalShell>}

const DAY_START=7,DAY_END=19,SLOT_PX=60,HEAD_PX=42;
const DAY_SHORT=['PON','UTO','SRI','ČET','PET','SUB','NED'];
const MONTH_NAMES=['januar','februar','mart','april','maj','juni','juli','august','septembar','oktobar','novembar','decembar'];
const SCHEDULE_TODAY=(()=>{const d=new Date();return new Date(d.getFullYear(),d.getMonth(),d.getDate())})();
const ABSENCES=[{worker:'Petar Jurić',date:'28.03.2025.',reason:'Godišnji odmor'}];
const WORKER_NAMES=['Marko Ilić','Ivan Kovač','Petar Jurić'];
function pad2(n){return String(n).padStart(2,'0');}
function formatEUFull(d){return `${pad2(d.getDate())}.${pad2(d.getMonth()+1)}.${d.getFullYear()}.`;}
function parseEUFull(s){const m=(s||'').match(/(\d{2})\.(\d{2})\.(\d{4})/);return m?new Date(+m[3],+m[2]-1,+m[1]):new Date();}
function addDays(d,n){const r=new Date(d);r.setDate(r.getDate()+n);return r;}
function mondayOf(d){const day=(d.getDay()+6)%7;return addDays(d,-day);}
function sameDate(a,b){return a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();}
function timeToMin(t){const [h,m]=(t||'08:00').split(':').map(Number);return h*60+m;}
function toneOfWorker(w){return w==='Marko Ilić'?'marko':w==='Ivan Kovač'?'ivan':w==='Petar Jurić'?'petar':'gray';}
function weekRangeLabel(monday){const sunday=addDays(monday,6);return monday.getMonth()===sunday.getMonth()?`${monday.getDate()}. — ${sunday.getDate()}. ${MONTH_NAMES[monday.getMonth()]} ${monday.getFullYear()}.`:`${monday.getDate()}. ${MONTH_NAMES[monday.getMonth()]} — ${sunday.getDate()}. ${MONTH_NAMES[sunday.getMonth()]} ${sunday.getFullYear()}.`;}
function yToTime(relY){let minutes=DAY_START*60+Math.round(((relY-HEAD_PX)/SLOT_PX)*60/30)*30;minutes=Math.max(DAY_START*60,Math.min((DAY_END-1)*60+30,minutes));return `${pad2(Math.floor(minutes/60))}:${pad2(minutes%60)}`;}

export function ScheduleModule(){
 const {jobs,setJobs,clients}=useData();
 const [weekStart,setWeekStart]=useState(()=>mondayOf(SCHEDULE_TODAY));
 const [monthCursor,setMonthCursor]=useState(()=>new Date(SCHEDULE_TODAY.getFullYear(),SCHEDULE_TODAY.getMonth(),1));
 const [view,setView]=useState('week');
 const [modal,setModal]=useState(null);
 const [selected,setSelected]=useState(null);
 const [workerFilter,setWorkerFilter]=useState('Svi radnici');
 const [statusFilter,setStatusFilter]=useState('Svi statusi');
 const [dragOverKey,setDragOverKey]=useState('');
 const [warning,setWarning]=useState('');
 const [notice,setNotice]=useState('');

 const flash=(msg,isWarning)=>{if(isWarning){setWarning(msg);setTimeout(()=>setWarning(''),5000);}else{setNotice(msg);setTimeout(()=>setNotice(''),3000);}};
 const filteredJobs=jobs.filter(j=>(workerFilter==='Svi radnici'||j.worker===workerFilter)&&(statusFilter==='Svi statusi'||j.status===statusFilter));
 const weekDays=Array.from({length:7},(_,i)=>addDays(weekStart,i));
 const hours=Array.from({length:DAY_END-DAY_START},(_,i)=>`${pad2(DAY_START+i)}:00`);

 const checkOverlap=(job,excludeId)=>jobs.find(x=>x.id!==excludeId&&x.worker===job.worker&&x.date===job.date&&Math.abs(timeToMin(x.time)-timeToMin(job.time))<90);
 const isPastSlot=(date,time='00:00')=>{const d=parseEUFull(date);const chosen=new Date(d.getFullYear(),d.getMonth(),d.getDate(),Math.floor(timeToMin(time)/60),timeToMin(time)%60);return chosen<new Date()};
 const openNewSlot=(day,time='08:00')=>{
  const date=formatEUFull(day);
  if(isPastSlot(date,time)){flash('Nije moguće zakazati termin u prošlosti.',true);return;}
  setModal({type:'form',data:{status:'Zakazano',priority:'Standardno',date,time,worker:workerFilter!=='Svi radnici'?workerFilter:''}});
 };

 const saveJob=f=>{
  if(isPastSlot(f.date,f.time)){flash('Termin mora biti u budućnosti. Odaberite današnji kasniji termin ili naredni datum.',true);return false;}
  if(!f.client||!f.service||!f.worker){flash('Odaberite klijenta i radnika te unesite vrstu usluge.',true);return false;}
  const overlap=checkOverlap(f,f.id);
  if(overlap){flash(`${f.worker} već ima termin ${overlap.time} (${overlap.client}). Odaberite drugi termin.`,true);return false;}
  setJobs(a=>f.id?a.map(x=>x.id===f.id?f:x):[...a,{...f,id:Date.now(),no:`P-${1054+a.length}`}]);
  setModal(null);
  flash(`Termin za ${f.client||'klijenta'} je sačuvan.`);
  return true;
 };
 const deleteJob=job=>{setJobs(a=>a.filter(x=>x.id!==job.id));setModal(null);setSelected(null);flash('Termin je obrisan.');};
 const reassignWorker=(job,worker)=>{
  const updated={...job,worker};
  const overlap=checkOverlap(updated,job.id);
  setJobs(a=>a.map(x=>x.id===job.id?updated:x));
  setSelected(updated);
  flash(overlap?`Upozorenje: ${worker} već ima termin u to vrijeme.`:`Radnik promijenjen na ${worker}.`,!!overlap);
 };
 const setJobStatus=(job,status)=>{const updated={...job,status};setJobs(a=>a.map(x=>x.id===job.id?updated:x));setSelected(updated);flash(`Status ažuriran na "${status}".`);};

 const handleDrop=(e,day)=>{
  e.preventDefault();setDragOverKey('');
  const id=Number(e.dataTransfer.getData('text/plain'));
  const job=jobs.find(x=>x.id===id);if(!job)return;
  const rect=e.currentTarget.getBoundingClientRect();
  const newTime=yToTime(e.clientY-rect.top);
  const updated={...job,date:formatEUFull(day),time:newTime};
  if(isPastSlot(updated.date,updated.time)){flash('Termin nije moguće premjestiti u prošlost.',true);return;}
  const overlap=checkOverlap(updated,job.id);
  if(overlap){flash(`${job.worker} već ima termin ${overlap.time} (${overlap.client}). Premještanje nije izvršeno.`,true);return;}
  setJobs(a=>a.map(x=>x.id===id?updated:x));
  flash(`Termin premješten na ${updated.date} u ${newTime}.`);
 };
 const dayClick=(e,day)=>{
  if(e.target.closest('.schedule-job'))return;
  const rect=e.currentTarget.getBoundingClientRect();
  openNewSlot(day,yToTime(e.clientY-rect.top));
 };

 const monthStart=new Date(monthCursor.getFullYear(),monthCursor.getMonth(),1);
 const monthEnd=new Date(monthCursor.getFullYear(),monthCursor.getMonth()+1,0);
 const gridStart=mondayOf(monthStart);
 const gridEndMonday=mondayOf(monthEnd);
 const totalDays=Math.round((addDays(gridEndMonday,6)-gridStart)/86400000)+1;
 const monthCells=Array.from({length:totalDays},(_,i)=>addDays(gridStart,i));

 const exportWeek=()=>exportToPDF('Raspored',`Sedmica: ${weekRangeLabel(weekStart)}`,['Datum','Vrijeme','Klijent','Usluga','Radnik','Status'],weekDays.flatMap(d=>filteredJobs.filter(j=>j.date===formatEUFull(d)).map(j=>[j.date,j.time,j.client,j.service,j.worker,j.status])));

 return <><Header eyebrow="PLANIRANJE EKIPE" title="Raspored" description="Sedmični i mjesečni pregled termina i dostupnosti radnika. Kliknite na slobodan termin ili datum za dodavanje zadatka." button="Novi termin" onAdd={()=>openNewSlot(SCHEDULE_TODAY,`${pad2(Math.max(DAY_START,new Date().getHours()+1))}:00`)}/>
 <div className="report-filter schedule-filter-row">
  <div><label>Radnik</label><div className="select-icon report-select"><UserRound/><Select value={workerFilter} onChange={setWorkerFilter}>{['Svi radnici',...WORKER_NAMES].map(w=><option key={w}>{w}</option>)}</Select></div></div>
  <div><label>Status</label><div className="select-icon report-select"><Filter/><Select value={statusFilter} onChange={setStatusFilter}>{['Svi statusi','Novi','Zakazano','U toku','Završeno'].map(s=><option key={s}>{s}</option>)}</Select></div></div>
  {(workerFilter!=='Svi radnici'||statusFilter!=='Svi statusi')&&<button type="button" className="text-link" onClick={()=>{setWorkerFilter('Svi radnici');setStatusFilter('Svi statusi');}}>Poništi filtere</button>}
  <button type="button" className="secondary export-btn" onClick={exportWeek}><Download/> Izvezi PDF</button>
 </div>
 {warning&&<div className="schedule-warning"><AlertTriangle/> {warning}</div>}
 {notice&&<div className="settings-inline-notice"><CheckCircle2/> {notice}</div>}
 <section className="card schedule-pro">
  <div className="schedule-nav">
   <div><button type="button" className="secondary" onClick={()=>view==='week'?setWeekStart(d=>addDays(d,-7)):setMonthCursor(d=>new Date(d.getFullYear(),d.getMonth()-1,1))}><ChevronLeft/></button><button type="button" className="secondary today-btn" onClick={()=>{setWeekStart(mondayOf(SCHEDULE_TODAY));setMonthCursor(new Date(SCHEDULE_TODAY.getFullYear(),SCHEDULE_TODAY.getMonth(),1));}}>Danas</button><button type="button" className="secondary" onClick={()=>view==='week'?setWeekStart(d=>addDays(d,7)):setMonthCursor(d=>new Date(d.getFullYear(),d.getMonth()+1,1))}><ChevronRight/></button></div>
   <strong>{view==='week'?weekRangeLabel(weekStart):`${MONTH_NAMES[monthCursor.getMonth()][0].toUpperCase()}${MONTH_NAMES[monthCursor.getMonth()].slice(1)} ${monthCursor.getFullYear()}.`}</strong>
   <div className="segmented"><button type="button" className={view==='week'?'active':''} onClick={()=>setView('week')}>Sedmica</button><button type="button" className={view==='month'?'active':''} onClick={()=>{setMonthCursor(new Date(weekStart.getFullYear(),weekStart.getMonth(),1));setView('month');}}>Mjesec</button></div>
  </div>
  <div className="worker-legend"><span><i className="marko"></i>Marko Ilić</span><span><i className="ivan"></i>Ivan Kovač</span><span><i className="petar"></i>Petar Jurić</span></div>
  {view==='week'?
  <div className="pro-week days7">
   <div className="pro-hours"><strong>Vrijeme</strong>{hours.map(t=><span key={t}>{t}</span>)}</div>
   {weekDays.map((d,i)=>{
    const key=formatEUFull(d);
    const dayJobs=filteredJobs.filter(j=>j.date===key);
    const isToday=sameDate(d,SCHEDULE_TODAY);
    const isWeekend=i===6;
    const absence=ABSENCES.find(a=>sameDate(parseEUFull(a.date),d));
    return <div key={key} className={`pro-day ${isToday?'today':''} ${isWeekend?'nonworking':''} ${dragOverKey===key?'drag-over':''}`}
     onDragOver={e=>{e.preventDefault();setDragOverKey(key);}} onDragLeave={()=>setDragOverKey(k=>k===key?'':k)} onDrop={e=>handleDrop(e,d)}
     onClick={e=>dayClick(e,d)}>
     <strong>{DAY_SHORT[i]} {d.getDate()}</strong>
     {isWeekend&&<span className="nonworking-flag">Neradni dan</span>}
     {absence&&<span className="absence-flag">{absence.worker.split(' ')[0]} odsutan — {absence.reason}</span>}
     {dayJobs.map(j=><button key={j.id} type="button" draggable className={`schedule-job ${toneOfWorker(j.worker)}`}
       style={{top:HEAD_PX+((timeToMin(j.time)-DAY_START*60)/60)*SLOT_PX,height:80}}
       onDragStart={e=>e.dataTransfer.setData('text/plain',String(j.id))}
       onDoubleClick={e=>e.stopPropagation()}
       onClick={e=>{e.stopPropagation();setSelected(j);}}>
       <strong>{j.client}</strong><span>{j.service}</span><small><Clock3/>{j.time} · {j.worker.split(' ')[0]}</small>
      </button>)}
    </div>;
   })}
  </div>
  :
  <>
   <div className="month-weekdays">{DAY_SHORT.map(x=><span key={x}>{x}</span>)}</div>
   <div className="month-grid">{monthCells.map((d,i)=>{
    const dayJobs=filteredJobs.filter(j=>parseEUFull(j.date).getTime()===new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime());
    const otherMonth=d.getMonth()!==monthCursor.getMonth();
    const isToday=sameDate(d,SCHEDULE_TODAY);
    const absence=ABSENCES.find(a=>sameDate(parseEUFull(a.date),d));
    const past=new Date(d.getFullYear(),d.getMonth(),d.getDate())<SCHEDULE_TODAY;
    return <button type="button" key={i} disabled={past} title={past?'Nije moguće zakazati termin u prošlosti':'Kliknite za novi termin'} className={`month-cell ${otherMonth?'otherMonth':''} ${isToday?'today':''} ${past?'past-day':''}`} onClick={()=>openNewSlot(d,'08:00')}>
     <strong>{d.getDate()}</strong>
     {absence&&<span className="m-absence">{absence.worker.split(' ')[0]} odsutan</span>}
     {dayJobs.length>0&&<div className="m-dots">{dayJobs.slice(0,4).map(j=><span key={j.id} className={`m-dot ${toneOfWorker(j.worker)}`}/>)}</div>}
     {dayJobs.length>0&&<span className="m-more">{dayJobs.length} termin{dayJobs.length===1?'':'a'}</span>}
    </button>;
   })}</div>
  </>}
 </section>
 {modal?.type==='form'&&<JobForm data={modal.data} close={()=>setModal(null)} save={saveJob}/>}
 {modal?.type==='delete'&&<ConfirmDelete name={`${modal.data.no||''} ${modal.data.client}`} onClose={()=>setModal(null)} onConfirm={()=>deleteJob(modal.data)}/>}
 {selected&&<DetailDrawer title={selected.client} sub={`${selected.service} · ${selected.date} u ${selected.time}`} close={()=>setSelected(null)} actions={<><button className="secondary" onClick={()=>setModal({type:'delete',data:selected})}><Trash2/> Obriši</button><button className="secondary" onClick={()=>setModal({type:'form',data:selected})}><Edit3/> Uredi termin</button>{selected.status!=='Završeno'&&<button className="primary" onClick={()=>setJobStatus(selected,selected.status==='U toku'?'Završeno':'U toku')}><CheckCircle2/> {selected.status==='U toku'?'Završi posao':'Označi u toku'}</button>}</>}>
  <div className="job-status-hero"><Badge>{selected.status}</Badge><span className={`priority ${selected.priority?.toLowerCase()}`}>{selected.priority}</span></div>
  <InfoGrid items={[["Klijent",selected.client],["Usluga",selected.service],["Datum",selected.date],["Vrijeme",selected.time],["Lokacija",selected.city],["Vrijednost",selected.amount]]}/>
  <div className="drawer-section"><h4>Promijeni radnika</h4><Select value={selected.worker} onChange={v=>reassignWorker(selected,v)}>{WORKER_NAMES.map(w=><option key={w}>{w}</option>)}</Select></div>
 </DetailDrawer>}
 </>;
}

const reportPeriods=['01.03.2025. — 31.03.2025.','01.02.2025. — 28.02.2025.','01.01.2025. — 31.01.2025.'];
const reportWorkers=[['Marko Ilić',14,92],['Ivan Kovač',12,78],['Petar Jurić',9,62],['Ana Horvat',3,28]];
const reportPeriodData={
 '01.03.2025. — 31.03.2025.':{revenue:'18.420 €',jobs:'38',rate:'68%',avgPay:'8 dana',weeks:[55,72,64,91],amounts:['3.450 €','4.620 €','4.050 €','5.840 €']},
 '01.02.2025. — 28.02.2025.':{revenue:'16.150 €',jobs:'31',rate:'61%',avgPay:'9 dana',weeks:[48,60,58,77],amounts:['2.980 €','3.760 €','3.640 €','4.820 €']},
 '01.01.2025. — 31.01.2025.':{revenue:'14.280 €',jobs:'27',rate:'57%',avgPay:'11 dana',weeks:[40,52,49,66],amounts:['2.540 €','3.180 €','2.990 €','4.010 €']}
};
export function ReportsModule(){
 const [period,setPeriod]=useState(reportPeriods[0]);
 const workerNames=['Svi radnici',...reportWorkers.map(w=>w[0])];
 const [worker,setWorker]=useState('Svi radnici');
 const data=reportPeriodData[period];
 const filteredWorkers=worker==='Svi radnici'?reportWorkers:reportWorkers.filter(w=>w[0]===worker);
 const exportReport=()=>exportToPDF('Izvještaj poslovanja',`Period: ${period}${worker!=='Svi radnici'?' · Radnik: '+worker:''}`,['Radnik','Završeni poslovi','Učinak'],filteredWorkers.map(w=>[w[0],w[1],`${w[2]}%`]));
 return <><Header eyebrow="ANALITIKA POSLOVANJA" title="Izvještaji" description="Prihod, naplata, produktivnost i prodajni rezultat."/><div className="report-filter"><div><label>Period</label><div className="select-icon report-select"><CalendarDays/><Select value={period} onChange={setPeriod}>{reportPeriods.map(p=><option key={p}>{p}</option>)}</Select></div></div><div><label>Radnik</label><div className="select-icon report-select"><Users/><Select value={worker} onChange={setWorker}>{workerNames.map(w=><option key={w}>{w}</option>)}</Select></div></div><button className="secondary export-btn" onClick={exportReport}><Download/> Izvezi PDF</button></div><div className="module-metrics four"><Metric icon={WalletCards} label="Ukupan prihod" value={data.revenue} sub="Odabrani period"/><Metric icon={BriefcaseBusiness} label="Završeni poslovi" value={data.jobs} sub="Odabrani period" tone="green"/><Metric icon={FileText} label="Prihvaćene ponude" value={data.rate} sub="Odabrani period" tone="orange"/><Metric icon={Clock3} label="Prosječna naplata" value={data.avgPay} sub="Odabrani period" tone="purple"/></div><div className="reports-grid"><section className="card report-chart"><div className="card-head"><div><h3>Prihod po sedmicama</h3><p>{period}</p></div></div><div className="big-chart"><div className="y-labels"><span>6k</span><span>4k</span><span>2k</span><span>0</span></div>{data.weeks.map((h,i)=><div className="report-bar" key={i}><div style={{height:`${h}%`}}><span>{data.amounts[i]}</span></div><small>{i+1}. sedmica</small></div>)}</div></section><section className="card"><div className="card-head"><div><h3>Učinak radnika</h3><p>{worker==='Svi radnici'?'Svi radnici':worker}</p></div></div><div className="worker-performance">{filteredWorkers.map(x=><div key={x[0]}><span className="avatar">{x[0].split(' ').map(y=>y[0]).join('')}</span><div><strong>{x[0]}</strong><span><i style={{width:`${x[2]}%`}}></i></span></div><b>{x[1]}</b></div>)}{!filteredWorkers.length&&<Empty/>}</div></section><section className="card report-wide"><div className="card-head"><div><h3>Najprofitabilnije usluge</h3><p>Po ostvarenom prihodu</p></div></div><table><thead><tr><th>Usluga</th><th>Broj poslova</th><th>Prihod</th><th>Prosječna vrijednost</th><th>Udio</th></tr></thead><tbody><tr><td><strong>Montaža klima uređaja</strong></td><td>12</td><td><strong>7.200 €</strong></td><td>600 €</td><td><span className="share-bar"><i style={{width:'39%'}}></i></span>39%</td></tr><tr><td><strong>Servis grijanja</strong></td><td>9</td><td><strong>4.450 €</strong></td><td>494 €</td><td><span className="share-bar"><i style={{width:'24%'}}></i></span>24%</td></tr><tr><td><strong>Vodoinstalaterski radovi</strong></td><td>17</td><td><strong>3.870 €</strong></td><td>228 €</td><td><span className="share-bar"><i style={{width:'21%'}}></i></span>21%</td></tr></tbody></table></section></div></>}

function OtpInputsLocal({value,setValue,error}){
 const refs=useRef([]);
 const change=(i,v)=>{const digit=v.replace(/\D/g,'').slice(-1);const next=[...value];next[i]=digit;setValue(next);if(digit&&i<5)refs.current[i+1]?.focus();};
 const keyDown=(i,e)=>{if(e.key==='Backspace'&&!value[i]&&i>0)refs.current[i-1]?.focus();};
 const paste=e=>{const text=e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6);if(text.length){e.preventDefault();setValue(Array(6).fill('').map((_,i)=>text[i]||''));refs.current[Math.min(text.length,6)-1]?.focus();}};
 return <div className={`otp-inputs ${error?'shake':''}`}>{value.map((d,i)=><input key={i} ref={el=>refs.current[i]=el} value={d} inputMode="numeric" maxLength={1} className={error?'error':''} onChange={e=>change(i,e.target.value)} onKeyDown={e=>keyDown(i,e)} onPaste={paste}/>)}</div>;
}
function FakeQR(){
 const size=21;const cells=[];
 for(let r=0;r<size;r++)for(let c=0;c<size;c++){
  const inFinder=(r<7&&c<7)||(r<7&&c>=size-7)||(r>=size-7&&c<7);
  let on;
  if(inFinder){const lr=r<7?r:r-(size-7);const lc=c<7?c:c-(size-7);on=lr===0||lr===6||lc===0||lc===6||(lr>=2&&lr<=4&&lc>=2&&lc<=4);}
  else on=((r*31+c*17+(r%3)*7)%5)<2;
  cells.push(on);
 }
 return <div className="fake-qr" style={{gridTemplateColumns:`repeat(${size},1fr)`}}>{cells.map((on,i)=><span key={i} className={on?'on':''}/>)}</div>;
}
function genRecoveryCodes(){const codes=[];const part=()=>Math.random().toString(36).slice(2,6).toUpperCase();for(let i=0;i<10;i++)codes.push(`${part()}-${part()}`);return codes;}

function TwoFactorEnableModal({close,onEnabled}){
 const [step,setStep]=useState('password');
 const [password,setPassword]=useState(''); const [pwError,setPwError]=useState('');
 const [code,setCode]=useState(Array(6).fill('')); const [codeError,setCodeError]=useState(false);
 const [confirmed,setConfirmed]=useState(false);
 const [codes]=useState(()=>genRecoveryCodes());
 const secret='TPWK-XJ4M-9KLQ-2ZRT-88HF';
 const submitPassword=e=>{e.preventDefault();if(!password){setPwError('Unesite trenutnu lozinku.');return;}setStep('qr');};
 const submitVerify=e=>{e.preventDefault();const c=code.join('');if(c.length<6)return;if(c==='123456')setStep('codes');else{setCodeError(true);setTimeout(()=>{setCodeError(false);setCode(Array(6).fill(''))},700);}};
 const finish=()=>{onEnabled();close();};
 const copyAll=()=>navigator.clipboard?.writeText(codes.join('\n'));
 const downloadCodes=()=>{const blob=new Blob([`TeloPak — rezervni kodovi\n\n${codes.join('\n')}\n\nČuvajte ove kodove na sigurnom mjestu. Svaki se može iskoristiti samo jednom.`],{type:'text/plain'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='telopak-rezervni-kodovi.txt';a.click();URL.revokeObjectURL(url);};
 return <ModalShell title="Uključi dvofaktorsku autentifikaciju" sub="Dodatni sloj sigurnosti za vaš administratorski nalog." close={close} wide>
  <div className="twofa-steps">{['Lozinka','QR kod','Potvrda','Kodovi'].map((s,i)=><div key={s} className={`twofa-step ${['password','qr','verify','codes'].indexOf(step)>=i?'active':''}`}><span>{i+1}</span>{s}</div>)}</div>
  {step==='password'&&<form onSubmit={submitPassword}><div className="twofa-body"><div className="otp-icon"><Lock/></div><h3>Potvrdite identitet</h3><p>Unesite trenutnu lozinku prije uključivanja dvofaktorske autentifikacije.</p><Field label="Trenutna lozinka" full><input type="password" value={password} onChange={e=>{setPassword(e.target.value);setPwError('')}} placeholder="Unesite lozinku" required/></Field>{pwError&&<p className="otp-error"><AlertTriangle/> {pwError}</p>}</div><ModalActions close={close}><button className="primary">Nastavi <ArrowRight/></button></ModalActions></form>}
  {step==='qr'&&<div className="twofa-body"><h3>Skenirajte QR kod</h3><p>Otvorite Google Authenticator, Authy ili sličnu aplikaciju i skenirajte kod ispod.</p><div className="qr-wrap"><FakeQR/></div><div className="secret-key"><span>Ili unesite ključ ručno</span><code>{secret}</code><button type="button" onClick={()=>navigator.clipboard?.writeText(secret)}><Copy/></button></div><ModalActions close={close}><button className="primary" onClick={()=>setStep('verify')}>Nastavi <ArrowRight/></button></ModalActions></div>}
  {step==='verify'&&<form onSubmit={submitVerify}><div className="twofa-body"><div className="otp-icon"><Smartphone/></div><h3>Unesite kod iz aplikacije</h3><p>Unesite šestocifreni kod prikazan u vašoj aplikaciji za autentifikaciju.</p><OtpInputsLocal value={code} setValue={setCode} error={codeError}/>{codeError&&<p className="otp-error"><AlertTriangle/> Kod nije ispravan. Pokušajte ponovo.</p>}<p className="otp-hint">Demo kod: <strong>123456</strong></p></div><ModalActions close={close}><button className="primary" disabled={code.join('').length<6}>Potvrdi kod <ArrowRight/></button></ModalActions></form>}
  {step==='codes'&&<div className="twofa-body"><div className="otp-icon success"><ShieldCheck/></div><h3>Sačuvajte rezervne kodove</h3><p>Svaki kod se može iskoristiti samo jednom, ako izgubite pristup aplikaciji za autentifikaciju.</p><div className="recovery-codes">{codes.map(c=><span key={c}>{c}</span>)}</div><div className="recovery-actions"><button type="button" className="secondary" onClick={copyAll}><Copy/> Kopiraj sve</button><button type="button" className="secondary" onClick={downloadCodes}><Download/> Preuzmi .txt</button></div><label className="checkbox full"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/> Sačuvao/la sam ove kodove na sigurno mjesto</label><ModalActions close={close}><button className="primary" disabled={!confirmed} onClick={finish}><Check/> Završi podešavanje</button></ModalActions></div>}
 </ModalShell>;
}
function TwoFactorDisableModal({close,onDisabled}){
 const [step,setStep]=useState('password'); const [password,setPassword]=useState(''); const [pwError,setPwError]=useState('');
 const submit=e=>{e.preventDefault();if(!password){setPwError('Unesite lozinku za potvrdu.');return;}setStep('confirm');};
 const disable=()=>{onDisabled();close();};
 return <ModalShell title="Isključi dvofaktorsku autentifikaciju" sub="Ovo smanjuje sigurnost vašeg naloga." close={close} danger>
  {step==='password'&&<form onSubmit={submit}><div className="confirm-content"><div className="confirm-icon red"><Lock/></div><h3>Potvrdite identitet</h3><p>Unesite trenutnu lozinku da nastavite sa isključivanjem dvofaktorske autentifikacije.</p><Field label="Trenutna lozinka" full><input type="password" value={password} onChange={e=>{setPassword(e.target.value);setPwError('')}} required/></Field>{pwError&&<p className="otp-error"><AlertTriangle/> {pwError}</p>}</div><ModalActions close={close}><button className="primary danger-primary">Nastavi</button></ModalActions></form>}
  {step==='confirm'&&<><div className="confirm-content"><div className="confirm-icon red"><AlertTriangle/></div><h3>Isključiti 2FA?</h3><p>Vaš nalog će biti manje zaštićen. Rezervni kodovi generisani ranije više neće biti važeći.</p></div><ModalActions close={close}><button className="primary danger-primary" onClick={disable}><Trash2/> Isključi 2FA</button></ModalActions></>}
 </ModalShell>;
}

const activityLogSeed=[
 {icon:UserRound,title:'Prijava na nalog',meta:'Marko Kovač · Chrome, Windows',time:'Danas u 08:14'},
 {icon:ShieldCheck,title:'Uključena dvofaktorska autentifikacija',meta:'Marko Kovač',time:'Jučer u 17:45'},
 {icon:Edit3,title:'Ažurirani podaci firme',meta:'Promijenjen broj telefona',time:'20.03.2025. u 11:02'},
 {icon:UserCog,title:'Poslana pozivnica novom korisniku',meta:'ana@telopak.ba',time:'18.03.2025. u 09:30'},
 {icon:Ban,title:'Deaktiviran korisnički nalog',meta:'Nikola Babić',time:'15.03.2025. u 14:12'},
 {icon:Package,title:'Dodan novi artikl u zalihe',meta:'Termostat digitalni',time:'12.03.2025. u 10:05'}
];
function ActivityLogModal({close}){
 return <ModalShell title="Dnevnik aktivnosti" sub="Pregled prijava i važnih promjena u radnom prostoru." close={close} wide>
  <div className="activity-log-list">{activityLogSeed.map((a,i)=><div className="activity-log-row" key={i}><span className="activity-log-icon"><a.icon/></span><div><strong>{a.title}</strong><span>{a.meta}</span></div><small>{a.time}</small></div>)}</div>
  <div className="modal-actions"><button type="button" className="primary" onClick={close}><Check/> Zatvori</button></div>
 </ModalShell>;
}

export function SettingsModule(){const [tab,setTab]=useState('Firma'),[saved,setSaved]=useState(false);
 const [twoFAEnabled,setTwoFAEnabled]=useState(false); const [twoFAModal,setTwoFAModal]=useState(null); const [twoFaNotice,setTwoFaNotice]=useState('');
 const [company,setCompany]=useState({name:'TeloPak d.o.o.',taxId:'4201234560007',phone:'+387 33 123 456',email:'info@telopak.ba',website:'www.telopak.ba',address:'Zmaja od Bosne 12, 71000 Sarajevo',logo:null});
 const [docSettings,setDocSettings]=useState({currency:'EUR',taxRate:'17%',prefix:'R-',dueDays:'7 dana',note:'Hvala na ukazanom povjerenju. Molimo izvršite uplatu do naznačenog roka.'});
 const [notifPrefs,setNotifPrefs]=useState([
  {label:'Podsjetnik za sutrašnje intervencije',sub:'Svaki dan u 16:00',on:true},
  {label:'Ponuda ističe za 2 dana',sub:'Email administratoru',on:true},
  {label:'Račun kasni s plaćanjem',sub:'Svaki dan nakon dospijeća',on:true},
  {label:'Materijal ispod minimalne zalihe',sub:'Odmah nakon evidentirane potrošnje',on:false}
 ]);
 const [autoLogout,setAutoLogout]=useState('8 sati');
 const [testSent,setTestSent]=useState(false);
 const [logOpen,setLogOpen]=useState(false);
 const logoRef=useRef(null);
 const cs=(k,v)=>setCompany(c=>({...c,[k]:v}));
 const ds=(k,v)=>setDocSettings(d=>({...d,[k]:v}));
 const toggleNotif=i=>setNotifPrefs(a=>a.map((n,idx)=>idx===i?{...n,on:!n.on}:n));
 const onLogo=e=>{const file=e.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>cs('logo',reader.result);reader.readAsDataURL(file);};
 const sendTest=()=>{setTestSent(true);setTimeout(()=>setTestSent(false),3000);};
 const enable2FA=()=>{setTwoFAEnabled(true);setTwoFaNotice('Dvofaktorska autentifikacija je uključena.');setTimeout(()=>setTwoFaNotice(''),3500);};
 const disable2FA=()=>{setTwoFAEnabled(false);setTwoFaNotice('Dvofaktorska autentifikacija je isključena.');setTimeout(()=>setTwoFaNotice(''),3500);};
 const save=e=>{e.preventDefault();setSaved(true);setTimeout(()=>setSaved(false),2500)};
 return <><Header eyebrow="RADNI PROSTOR" title="Postavke" description="Podaci firme, dokumenti, obavijesti i sigurnost."/><div className="settings-layout"><nav className="settings-nav">{[['Firma',Building2],['Dokumenti',FileText],['Obavijesti',AlertTriangle],['Sigurnost',ShieldCheck]].map(([x,I])=><button key={x} className={tab===x?'active':''} onClick={()=>setTab(x)}><I/>{x}</button>)}</nav><section className="card settings-card"><form onSubmit={save}>{tab==='Firma'&&<><div className="settings-title"><h3>Podaci firme</h3><p>Prikazuju se na ponudama, računima i izvještajima.</p></div><div className="company-logo-row"><div className="company-logo">{company.logo?<img src={company.logo} alt="Logo firme"/>:'TP'}</div><div><button type="button" className="secondary" onClick={()=>logoRef.current?.click()}><ImagePlus/> Promijeni logo</button><input type="file" accept="image/*" ref={logoRef} style={{display:'none'}} onChange={onLogo}/><p>PNG ili JPG, maksimalno 2 MB.</p></div></div><div className="form-grid settings-form"><Field label="Naziv firme" full><Input value={company.name} onChange={v=>cs('name',v)}/></Field><Field label="ID / PDV broj"><Input value={company.taxId} onChange={v=>cs('taxId',v)}/></Field><Field label="Telefon"><Input value={company.phone} onChange={v=>cs('phone',v)}/></Field><Field label="Email"><Input value={company.email} onChange={v=>cs('email',v)}/></Field><Field label="Web stranica"><Input value={company.website} onChange={v=>cs('website',v)}/></Field><Field label="Adresa" full><Input value={company.address} onChange={v=>cs('address',v)}/></Field></div></>}{tab==='Dokumenti'&&<><div className="settings-title"><h3>Postavke dokumenata</h3><p>Numeracija, valuta i rokovi plaćanja.</p></div><div className="form-grid settings-form"><Field label="Valuta"><Select value={docSettings.currency} onChange={v=>ds('currency',v)}><option>EUR</option><option>BAM</option></Select></Field><Field label="Porezna stopa"><Select value={docSettings.taxRate} onChange={v=>ds('taxRate',v)}><option>17%</option><option>0%</option></Select></Field><Field label="Prefiks računa"><Input value={docSettings.prefix} onChange={v=>ds('prefix',v)}/></Field><Field label="Rok plaćanja"><Select value={docSettings.dueDays} onChange={v=>ds('dueDays',v)}><option>7 dana</option><option>15 dana</option><option>30 dana</option></Select></Field><Field label="Napomena na dokumentu" full><textarea value={docSettings.note} onChange={e=>ds('note',e.target.value)}/></Field></div></>}{tab==='Obavijesti'&&<><div className="settings-title notif-title-row"><div><h3>Obavijesti i podsjetnici</h3><p>Odaberite kada aplikacija treba obavijestiti administraciju.</p></div><button type="button" className="secondary" onClick={sendTest}><Send/> {testSent?'Testna obavijest poslana':'Pošalji testnu obavijest'}</button></div><div className="toggle-list">{notifPrefs.map((x,i)=><label key={x.label}><div><strong>{x.label}</strong><span>{x.sub}</span></div><input type="checkbox" checked={x.on} onChange={()=>toggleNotif(i)}/><i></i></label>)}</div></>}{tab==='Sigurnost'&&<><div className="settings-title"><h3>Sigurnost radnog prostora</h3><p>Zaštita naloga i poslovnih podataka.</p></div>{twoFaNotice&&<div className="settings-inline-notice"><CheckCircle2/> {twoFaNotice}</div>}<div className="security-settings"><div><ShieldCheck/><div><strong>Dvofaktorska autentifikacija</strong><p>Dodatna zaštita administratorskog naloga jednokratnim kodom.</p></div>{twoFAEnabled?<div className="twofa-status"><span className="twofa-on"><CheckCircle2/> Uključeno</span><button type="button" className="secondary" onClick={()=>setTwoFAModal('disable')}>Isključi 2FA</button></div>:<button type="button" className="secondary" onClick={()=>setTwoFAModal('enable')}>Uključi 2FA</button>}</div><div><Clock3/><div><strong>Automatska odjava</strong><p>Odjavi neaktivne korisnike nakon određenog vremena.</p></div><Select value={autoLogout} onChange={setAutoLogout}><option>1 sat</option><option>8 sati</option><option>24 sata</option></Select></div><div><Archive/><div><strong>Dnevnik aktivnosti</strong><p>Pregled prijava i važnih promjena u sistemu.</p></div><button type="button" className="secondary" onClick={()=>setLogOpen(true)}>Otvori dnevnik</button></div></div></>}<div className="settings-save"><button className="primary"><Save/>{saved?'Sačuvano':'Sačuvaj promjene'}</button></div></form></section></div>{twoFAModal==='enable'&&<TwoFactorEnableModal close={()=>setTwoFAModal(null)} onEnabled={enable2FA}/>}{twoFAModal==='disable'&&<TwoFactorDisableModal close={()=>setTwoFAModal(null)} onDisabled={disable2FA}/>}{logOpen&&<ActivityLogModal close={()=>setLogOpen(false)}/>}</>}
