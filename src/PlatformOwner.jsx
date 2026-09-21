import React,{useEffect,useMemo,useState} from 'react';
import {Building2,Users,WalletCards,Activity,Search,ShieldCheck,Server,Database,Mail,CheckCircle2,Clock3,AlertTriangle,RefreshCw,ExternalLink,X,Plus,Trash2,Save,Image,Palette,Globe2,ToggleLeft,Upload,BriefcaseBusiness,FileText,ReceiptText,UserCog,Pencil,BadgeCheck} from 'lucide-react';
const api=async(path,opts)=>{const r=await fetch(`/api/owner/${path}`,{credentials:'include',headers:opts?.body?{'Content-Type':'application/json'}:undefined,...opts});if(r.status===413)throw new Error('Fajl je prevelik za slanje. Odaberite manju sliku (do 1 MB).');const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||`Greška prilikom obrade zahtjeva (HTTP ${r.status}).`);return d};
const money=n=>new Intl.NumberFormat('bs-BA',{style:'currency',currency:'EUR'}).format(Number(n||0));
const s=v=>(v===null||v===undefined)?'':String(v);
const initials2=v=>s(v).trim().slice(0,2).toUpperCase()||'—';
const fmtDate=v=>{if(!v)return '—';const d=new Date(v);return isNaN(d.getTime())?'—':d.toLocaleDateString('bs-BA')};
function Metric({icon:Icon,label,value,meta,tone}){return <article className="owner-metric"><span className={`owner-metric-icon ${tone}`}>{Icon?<Icon/>:null}</span><div><small>{label}</small><strong>{value}</strong><p>{meta}</p></div></article>}
function Status({value}){return <span className={`owner-status ${s(value).toLowerCase().replace(/\s+/g,'-')||'nepoznato'}`}><i/>{s(value)||'Nepoznato'}</span>}
function Skeleton(){return <div className="owner-loading"><RefreshCw/><span>Učitavanje platforme...</span></div>}
function ErrorBox({error}){return <div className="owner-error"><AlertTriangle/>{error}</div>}
function Modal({title,onClose,children,wide}){
 useEffect(()=>{const onKey=e=>e.key==='Escape'&&onClose();window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey)},[onClose]);
 return <div className="owner-modal-backdrop" onClick={onClose}><div className={`owner-modal ${wide?'wide':''}`} onClick={e=>e.stopPropagation()}><div className="owner-modal-head"><h3>{title}</h3><button className="owner-modal-close" onClick={onClose}><X/></button></div><div className="owner-modal-body">{children}</div></div></div>;
}
function NewCompanyForm({onCreated,onClose}){
 const[f,setF]=useState({name:'',industry:'',plan:'Trial',monthly_price:0,status:'Aktivna'}),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const set=(k,v)=>setF(x=>({...x,[k]:v}));
 const submit=async e=>{e.preventDefault();setBusy(true);setError('');try{await api('companies',{method:'POST',body:JSON.stringify(f)});onCreated();onClose()}catch(x){setError(x.message)}finally{setBusy(false)}};
 return <form onSubmit={submit} className="owner-form">
  <label>Naziv firme<input value={f.name} onChange={e=>set('name',e.target.value)} placeholder="npr. Kovač Servis d.o.o." required/></label>
  <label>Djelatnost<input value={f.industry} onChange={e=>set('industry',e.target.value)} placeholder="npr. Klimatizacija"/></label>
  <div className="owner-form-row">
   <label>Plan<select value={f.plan} onChange={e=>set('plan',e.target.value)}><option>Trial</option><option>Starter</option><option>Pro</option><option>Enterprise</option></select></label>
   <label>Mjesečna cijena (€)<input type="number" min="0" step="0.01" value={f.monthly_price} onChange={e=>set('monthly_price',e.target.value)}/></label>
  </div>
  <label>Status<select value={f.status} onChange={e=>set('status',e.target.value)}><option>Aktivna</option><option>Suspendovana</option></select></label>
  {error&&<p className="owner-form-error"><AlertTriangle/>{error}</p>}
  <button className="primary owner-form-submit" disabled={busy}>{busy?'Kreiranje...':'Kreiraj firmu'}</button>
 </form>;
}
function SettingToggle({checked,onChange,title,text}){return <label className="owner-setting-toggle"><div><strong>{title}</strong><span>{text}</span></div><input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)}/><i/></label>}
const imageToData=(file,done,fail)=>{if(!file)return;if(file.size>1024*1024){fail('Fajl mora biti manji od 1 MB.');return}const reader=new FileReader();reader.onload=()=>done(reader.result);reader.onerror=()=>fail('Fajl nije moguće pročitati.');reader.readAsDataURL(file)};
export function OwnerSettings({onBrandChange}){
 const[f,setF]=useState(null),[busy,setBusy]=useState(false),[saved,setSaved]=useState(''),[error,setError]=useState('');
 useEffect(()=>{api('settings').then(setF).catch(e=>setError(e.message))},[]);
 const set=(k,v)=>setF(x=>({...x,[k]:v}));
 const upload=(key,file)=>imageToData(file,v=>{set(key,v);setError('')},setError);
 const save=async e=>{e.preventDefault();setBusy(true);setError('');setSaved('');try{const d=await api('settings',{method:'PUT',body:JSON.stringify(f)});setF(d);onBrandChange?.(d);setSaved('Postavke su sačuvane i primijenjene na aplikaciju.')}catch(x){setError(x.message)}finally{setBusy(false)}};
 if(!f)return error?<ErrorBox error={error}/>:<Skeleton/>;
 return <><div className="owner-head"><div><p>PLATFORM CONFIGURATION</p><h1>Postavke aplikacije</h1><span>Upravljajte identitetom, brendom i globalnim ponašanjem platforme.</span></div></div>
 <form className="owner-settings-layout" onSubmit={save}>
  <div className="owner-settings-main">
   <section className="owner-settings-card"><div className="owner-settings-title"><span><Image/></span><div><h3>Vizuelni identitet</h3><p>Logo i favicon koji se prikazuju svim korisnicima platforme.</p></div></div><div className="owner-settings-body">
    <div className="owner-brand-upload"><div className="owner-brand-preview">{f.logo_data?<img src={f.logo_data}/>:<strong>{f.app_name}</strong>}</div><div><strong>Glavni logo</strong><p>PNG, JPG, WebP ili SVG · maksimalno 1 MB</p><label className="owner-upload-btn"><Upload/> Odaberi logo<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={e=>upload('logo_data',e.target.files?.[0])}/></label>{f.logo_data&&<button type="button" className="owner-link-danger" onClick={()=>set('logo_data',null)}>Ukloni logo</button>}</div></div>
    <div className="owner-brand-upload favicon"><div className="owner-favicon-preview">{f.favicon_data?<img src={f.favicon_data}/>:initials2(f.app_name)}</div><div><strong>Favicon preglednika</strong><p>Kvadratna PNG/ICO slika, preporučeno 64 × 64 px.</p><label className="owner-upload-btn"><Upload/> Odaberi favicon<input type="file" accept="image/png,image/x-icon,image/vnd.microsoft.icon,image/svg+xml" onChange={e=>upload('favicon_data',e.target.files?.[0])}/></label>{f.favicon_data&&<button type="button" className="owner-link-danger" onClick={()=>set('favicon_data',null)}>Ukloni favicon</button>}</div></div>
   </div></section>
   <section className="owner-settings-card"><div className="owner-settings-title"><span><Palette/></span><div><h3>Naziv i izgled</h3><p>Osnovni podaci i primarna boja korisničkog interfejsa.</p></div></div><div className="owner-settings-body owner-settings-fields"><label>Naziv aplikacije<input value={f.app_name||''} onChange={e=>set('app_name',e.target.value)} placeholder="TeloPak Flux" required/></label><label>Tagline<input value={f.tagline||''} onChange={e=>set('tagline',e.target.value)} placeholder="Cijeli posao. Na jednom mjestu."/></label><label>Email podrške<input type="email" value={f.support_email||''} onChange={e=>set('support_email',e.target.value)} placeholder="podrska@domena.com"/></label><label>Primarna boja<div className="owner-color-field"><input type="color" value={f.primary_color||'#1769d2'} onChange={e=>set('primary_color',e.target.value)}/><input value={f.primary_color||''} onChange={e=>set('primary_color',e.target.value)} pattern="#[0-9a-fA-F]{6}"/></div></label><label>Jezik platforme<select value={f.locale||'bs-BA'} onChange={e=>set('locale',e.target.value)}><option value="bs-BA">Bosanski</option><option value="hr-HR">Hrvatski</option><option value="sr-Latn-RS">Srpski (latinica)</option><option value="en-US">English</option></select></label></div></section>
  </div>
  <div className="owner-settings-side"><section className="owner-settings-card"><div className="owner-settings-title"><span><ToggleLeft/></span><div><h3>Globalne kontrole</h3><p>Primjenjuju se na cijelu platformu.</p></div></div><div className="owner-settings-toggles"><SettingToggle checked={!!f.registrations_enabled} onChange={v=>set('registrations_enabled',v)} title="Nove registracije" text="Dozvoli firmama da samostalno otvore nalog."/><SettingToggle checked={!!f.maintenance_mode} onChange={v=>set('maintenance_mode',v)} title="Maintenance režim" text="Prikaži obavijest da se izvode radovi."/></div></section><section className="owner-settings-card owner-settings-help"><Globe2/><h3>Javne postavke</h3><p>Sačuvani naziv, logo, favicon i boja učitavaju se i prije prijave korisnika.</p></section></div>
  <div className="owner-settings-save">{error&&<span className="owner-save-error"><AlertTriangle/>{error}</span>}{saved&&<span className="owner-save-success"><CheckCircle2/>{saved}</span>}<button className="primary" disabled={busy}><Save/>{busy?'Čuvanje...':'Sačuvaj postavke'}</button></div>
 </form></>;
}
function NewUserModal({companies,onClose,onCreated}){
 const[f,setF]=useState({company_id:companies[0]?.id||'',name:'',email:'',phone:'',role:'Radnik',status:'Aktivan',password:'',email_verified:true,send_email:true}),[busy,setBusy]=useState(false),[error,setError]=useState(''),[showPassword,setShowPassword]=useState(false);
 const set=(k,v)=>setF(x=>({...x,[k]:v}));
 const generatePassword=()=>{const chars='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';let p='';for(let i=0;i<16;i++)p+=chars[Math.floor(Math.random()*chars.length)];set('password',p)};
 const submit=async e=>{e.preventDefault();setBusy(true);setError('');try{const d=await api('users',{method:'POST',body:JSON.stringify({...f,company_id:Number(f.company_id)})});onCreated(d);onClose()}catch(x){setError(x.message)}finally{setBusy(false)}};
 return <Modal title="Novi korisnik" onClose={onClose} wide><form onSubmit={submit} className="owner-form">
  <label>Firma<select value={f.company_id} onChange={e=>set('company_id',e.target.value)} required><option value="">Odaberite firmu</option>{companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
  <div className="owner-form-row"><label>Ime i prezime<input value={f.name} onChange={e=>set('name',e.target.value)} required/></label><label>Email adresa<input type="email" value={f.email} onChange={e=>set('email',e.target.value)} required/></label></div>
  <label>Telefon<input value={f.phone} onChange={e=>set('phone',e.target.value)} placeholder="Opcionalno"/></label>
  <div className="owner-form-row"><label>Uloga<select value={f.role} onChange={e=>set('role',e.target.value)}><option>Administrator</option><option>Menadžer</option><option>Radnik</option></select></label><label>Status<select value={f.status} onChange={e=>set('status',e.target.value)}><option>Aktivan</option><option>Neaktivan</option></select></label></div>
  <label>Privremena lozinka<div style={{display:'flex',gap:8}}><input type={showPassword?'text':'password'} value={f.password} onChange={e=>set('password',e.target.value)} placeholder="Najmanje 12 znakova" required/><button type="button" className="owner-action" onClick={generatePassword}>Generiši</button><button type="button" className="owner-action" onClick={()=>setShowPassword(v=>!v)}>{showPassword?'Sakrij':'Prikaži'}</button></div><small>Veliko i malo slovo, broj i specijalni znak.</small></label>
  <SettingToggle checked={f.email_verified} onChange={v=>set('email_verified',v)} title="Email je verifikovan" text="Korisnik može odmah pristupiti prijavi."/>
  <SettingToggle checked={f.send_email} onChange={v=>set('send_email',v)} title="Pošalji pristupne podatke emailom" text="Korisnik dobija firmu, email i privremenu lozinku."/>
  {error&&<p className="owner-form-error"><AlertTriangle/>{error}</p>}
  <button className="primary owner-form-submit" disabled={busy||!companies.length}>{busy?'Kreiranje...':'Kreiraj korisnika'}</button>
 </form></Modal>
}
function UserEditModal({user,onClose,onSaved}){
 const[f,setF]=useState({name:user.name||'',email:user.email||'',phone:user.phone||'',role:user.role||'Administrator',status:user.status||'Aktivan',email_verified:!!user.email_verified});
 const[busy,setBusy]=useState(false),[error,setError]=useState('');
 const set=(k,v)=>setF(x=>({...x,[k]:v}));
 const submit=async e=>{e.preventDefault();setBusy(true);setError('');try{await api(`users/${user.id}`,{method:'PUT',body:JSON.stringify(f)});onSaved();onClose()}catch(x){setError(x.message)}finally{setBusy(false)}};
 return <Modal title="Uredi korisnika" onClose={onClose}>
  <form onSubmit={submit} className="owner-form">
   <label>Ime i prezime<input value={f.name} onChange={e=>set('name',e.target.value)} required/></label>
   <label>Email adresa<input type="email" value={f.email} onChange={e=>set('email',e.target.value)} required/></label>
   <label>Telefon<input value={f.phone} onChange={e=>set('phone',e.target.value)} placeholder="Nije unesen"/></label>
   <div className="owner-form-row">
    <label>Uloga<select value={f.role} onChange={e=>set('role',e.target.value)}><option>Administrator</option><option>Menadžer</option><option>Radnik</option><option>Platform Owner</option></select></label>
    <label>Status<select value={f.status} onChange={e=>set('status',e.target.value)}><option>Aktivan</option><option>Neaktivan</option></select></label>
   </div>
   <SettingToggle checked={f.email_verified} onChange={v=>set('email_verified',v)} title="Email ručno verifikovan" text="Uključite da odmah označite email kao potvrđen, bez slanja koda korisniku."/>
   {error&&<p className="owner-form-error"><AlertTriangle/>{error}</p>}
   <button className="primary owner-form-submit" disabled={busy}>{busy?'Čuvanje...':'Sačuvaj izmjene'}</button>
  </form>
 </Modal>;
}
function CompanyDetail({id,onClose,onChanged}){
 const[data,setData]=useState(null),[error,setError]=useState('');
 const load=()=>api(`companies/${id}`).then(setData).catch(e=>setError(e.message));
 useEffect(()=>{load()},[id]);
 const updateCompany=async patch=>{try{await api(`companies/${id}`,{method:'PUT',body:JSON.stringify(patch)});load();onChanged?.()}catch(e){}};
 const updateUser=async(uid,patch)=>{try{await api(`users/${uid}`,{method:'PUT',body:JSON.stringify(patch)});load()}catch(e){}};
 const deleteUser=async uid=>{if(!window.confirm('Obrisati ovog korisnika iz firme?'))return;try{await api(`users/${uid}`,{method:'DELETE'});load()}catch(e){alert(e.message)}};
 const deleteCompany=async()=>{if(!window.confirm('Ovo trajno briše firmu i sve njene podatke (klijente, poslove, račune, korisnike). Nastaviti?'))return;try{await api(`companies/${id}`,{method:'DELETE'});onChanged?.();onClose()}catch(e){alert(e.message)}};
 if(error)return <Modal title="Detalji firme" onClose={onClose} wide><ErrorBox error={error}/></Modal>;
 if(!data)return <Modal title="Detalji firme" onClose={onClose} wide><Skeleton/></Modal>;
 const c=data.company;
 return <Modal title={c.name} onClose={onClose} wide>
  <div className="owner-company-hero"><span>{initials2(c.name)}</span><div><p>ORGANIZACIJA #{c.id}</p><h2>{c.name}</h2><small>{c.industry||'Djelatnost nije unesena'} · Registrovana {fmtDate(c.created_at)}</small></div><Status value={c.status}/></div>
  <div className="owner-detail-stats">
   <div><small>Korisnici</small><strong>{data.users.length}</strong></div>
   <div><small>Klijenti</small><strong>{data.stats.clients}</strong></div>
   <div><small>Poslovi</small><strong>{data.stats.jobs}</strong></div>
   <div><small>Ponude</small><strong>{data.stats.offers}</strong></div>
   <div><small>Računi</small><strong>{data.stats.invoices}</strong></div>
  </div>
  <h4 className="owner-subhead">Podaci i pretplata</h4>
  <div className="owner-detail-form">
   <label>Naziv firme<input defaultValue={c.name} onBlur={e=>e.target.value!==c.name&&updateCompany({name:e.target.value})}/></label>
   <label>Djelatnost<input defaultValue={c.industry||''} placeholder="Nije unesena" onBlur={e=>e.target.value!==(c.industry||'')&&updateCompany({industry:e.target.value})}/></label>
   <label>Plan<select value={c.plan} onChange={e=>updateCompany({plan:e.target.value})}><option>Trial</option><option>Starter</option><option>Pro</option><option>Enterprise</option></select></label>
   <label>Mjesečna cijena (€)<input type="number" step="0.01" defaultValue={c.monthly_price} onBlur={e=>updateCompany({monthly_price:e.target.value})}/></label>
   <label>Trial ističe<input type="date" defaultValue={c.trial_ends_at?s(c.trial_ends_at).slice(0,10):''} onChange={e=>updateCompany({trial_ends_at:e.target.value})}/></label>
   <label>Status<select value={c.status} onChange={e=>updateCompany({status:e.target.value})}><option>Aktivna</option><option>Suspendovana</option></select></label>
  </div>
  <h4 className="owner-subhead">Korisnici firme</h4>
  <div className="owner-detail-users">
   {data.users.map(u=><div key={u.id}><div><strong>{s(u.name)}</strong><small>{s(u.email)}</small></div>
     <select value={u.role} onChange={e=>updateUser(u.id,{role:e.target.value})}><option>Administrator</option><option>Menadžer</option><option>Radnik</option><option>Platform Owner</option></select>
     <select value={u.status} onChange={e=>updateUser(u.id,{status:e.target.value})}><option>Aktivan</option><option>Neaktivan</option></select>
     <button className="owner-action danger" onClick={()=>deleteUser(u.id)}><Trash2/></button>
   </div>)}
   {!data.users.length&&<p className="owner-empty-inline">Nema korisnika u ovoj firmi.</p>}
  </div>
  <div className="owner-modal-footer"><button className="owner-action danger big" onClick={deleteCompany}><Trash2/> Obriši firmu trajno</button></div>
 </Modal>;
}
export function OwnerOverview({go}){
 const[data,setData]=useState(null),[companies,setCompanies]=useState([]),[error,setError]=useState('');
 useEffect(()=>{let alive=true;Promise.all([api('overview'),api('companies')]).then(([a,b])=>{if(!alive)return;setData(a);setCompanies(Array.isArray(b)?b:[])}).catch(e=>alive&&setError(e.message));return()=>{alive=false}},[]);
 if(error)return <ErrorBox error={error}/>;
 if(!data)return <Skeleton/>;
 return <><div className="owner-head"><div><p>PLATFORM CONTROL CENTER</p><h1>Dobro došli u Owner konzolu</h1><span>Globalni pregled TeloPak Flux SaaS platforme.</span></div><div className="owner-live"><i/> Svi sistemi operativni</div></div>
  <section className="owner-metrics"><Metric icon={Building2} label="UKUPNO FIRMI" value={data.companies?.total??0} meta={`${data.companies?.active??0} aktivnih`} tone="blue"/><Metric icon={Users} label="KORISNICI" value={data.users?.total??0} meta={`${data.users?.active??0} aktivnih naloga`} tone="violet"/><Metric icon={WalletCards} label="MJESEČNI PRIHOD" value={money(data.companies?.mrr)} meta={`${data.companies?.trials??0} trial naloga`} tone="green"/><Metric icon={Activity} label="AKTIVNE SESIJE" value={data.activeSessions??0} meta="Trenutno online" tone="orange"/></section>
  <section className="owner-grid"><article className="owner-panel owner-companies-card"><div className="owner-panel-head"><div><h3>Nove firme</h3><p>Posljednje registracije na platformi</p></div><button onClick={()=>go('Firme')}>Sve firme <ExternalLink/></button></div><div className="owner-company-list">{companies.slice(0,6).map(c=><div key={c.id}><span className="owner-company-logo">{initials2(c.name)}</span><div><strong>{s(c.name)||'Bez naziva'}</strong><small>{c.industry||'Djelatnost nije unesena'} · {c.users??0} korisnika</small></div><Status value={c.status}/><b>{c.plan||'—'}</b></div>)}{!companies.length&&<div className="owner-empty" style={{minHeight:120}}><Building2/><strong>Još nema registrovanih firmi</strong></div>}</div></article>
  <article className="owner-panel"><div className="owner-panel-head"><div><h3>Zdravlje sistema</h3><p>Produkcijske usluge</p></div></div><div className="owner-health"><div><Server/><span><strong>API server</strong><small>Express · Node.js</small></span><Status value="Operational"/></div><div><Database/><span><strong>PostgreSQL</strong><small>Persistent database</small></span><Status value="Operational"/></div><div><Mail/><span><strong>Email servis</strong><small>SMTP provjera uživo</small></span><Status value={data.system?.email||'Nepoznato'}/></div><div><ShieldCheck/><span><strong>Autentifikacija</strong><small>2FA · Secure sessions</small></span><Status value="Operational"/></div></div></article></section></>;
}
export function OwnerCompanies(){
 const[rows,setRows]=useState([]),[search,setSearch]=useState(''),[error,setError]=useState(''),[ready,setReady]=useState(false),[showNew,setShowNew]=useState(false),[detailId,setDetailId]=useState(null);
 const load=()=>api('companies').then(d=>{setRows(Array.isArray(d)?d:[]);setError('')}).catch(e=>setError(e.message)).finally(()=>setReady(true));
 useEffect(()=>{load()},[]);
 const visible=useMemo(()=>rows.filter(x=>`${s(x.name)} ${s(x.industry)} ${s(x.plan)}`.toLowerCase().includes(search.toLowerCase())),[rows,search]);
 const update=async(c,patch)=>{try{await api(`companies/${c.id}`,{method:'PUT',body:JSON.stringify(patch)});load()}catch(e){}};
 const quickDelete=async c=>{if(!window.confirm(`Obrisati firmu "${c.name}" i sve njene podatke?`))return;try{await api(`companies/${c.id}`,{method:'DELETE'});load()}catch(e){alert(e.message)}};
 return <><div className="owner-head"><div><p>TENANT MANAGEMENT</p><h1>Firme i pretplate</h1><span>Upravljajte svim organizacijama koje koriste platformu.</span></div><button className="primary owner-new-btn" onClick={()=>setShowNew(true)}><Plus/> Nova firma</button></div>
  {error&&<ErrorBox error={error}/>}
  <section className="owner-panel"><div className="owner-table-tools"><div className="owner-search"><Search/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Pretraži firme, planove ili djelatnosti..."/></div><span>{visible.length} firmi</span></div>
   {!ready?<Skeleton/>:<div className="table-wrap"><table className="owner-table"><thead><tr><th>Firma</th><th>Plan</th><th>Korisnici</th><th>Poslovi</th><th>MRR</th><th>Status</th><th>Akcije</th></tr></thead><tbody>
    {!visible.length&&<tr><td colSpan={7} className="empty-row">Nema firmi za prikaz.</td></tr>}
    {visible.map(c=><tr key={c.id}><td><button className="owner-company-cell as-link" onClick={()=>setDetailId(c.id)}><span>{initials2(c.name)}</span><div><strong>{s(c.name)||'Bez naziva'}</strong><small>{c.industry||'Bez djelatnosti'}</small></div></button></td><td><select value={c.plan||'Trial'} onChange={e=>update(c,{plan:e.target.value})}><option>Trial</option><option>Starter</option><option>Pro</option><option>Enterprise</option></select></td><td>{c.users??0}</td><td>{c.jobs??0}</td><td><strong>{money(c.monthly_price)}</strong></td><td><Status value={c.status}/></td><td className="owner-row-actions"><button className="owner-action" onClick={()=>setDetailId(c.id)}>Detalji</button><button className="owner-action" onClick={()=>update(c,{status:c.status==='Aktivna'?'Suspendovana':'Aktivna'})}>{c.status==='Aktivna'?'Suspenduj':'Aktiviraj'}</button><button className="owner-action danger" onClick={()=>quickDelete(c)}><Trash2/></button></td></tr>)}
   </tbody></table></div>}
  </section>
  {showNew&&<Modal title="Nova firma" onClose={()=>setShowNew(false)}><NewCompanyForm onCreated={load} onClose={()=>setShowNew(false)}/></Modal>}
  {detailId&&<CompanyDetail id={detailId} onClose={()=>setDetailId(null)} onChanged={load}/>}
  </>;
}
export function OwnerUsers(){
 const[rows,setRows]=useState([]),[companies,setCompanies]=useState([]),[search,setSearch]=useState(''),[error,setError]=useState(''),[ready,setReady]=useState(false),[editUser,setEditUser]=useState(null),[showNew,setShowNew]=useState(false),[savingId,setSavingId]=useState(null),[notice,setNotice]=useState('');
 const load=()=>Promise.all([api('users'),api('companies')]).then(([u,c])=>{setRows(Array.isArray(u)?u:[]);setCompanies(Array.isArray(c)?c:[]);setError('')}).catch(e=>setError(e.message)).finally(()=>setReady(true));
 useEffect(()=>{load()},[]);
 const visible=useMemo(()=>rows.filter(x=>`${s(x.name)} ${s(x.email)} ${s(x.company)}`.toLowerCase().includes(search.toLowerCase())),[rows,search]);
 const updateUser=async(u,patch)=>{
  const previous={...u};setSavingId(u.id);setNotice('');
  setRows(list=>list.map(x=>x.id===u.id?{...x,...patch}:x));
  try{
   const saved=await api(`users/${u.id}`,{method:'PUT',body:JSON.stringify(patch)});
   setRows(list=>list.map(x=>x.id===u.id?{...x,...saved}:x));
   setNotice('Promjena je uspješno sačuvana.');
  }catch(e){setRows(list=>list.map(x=>x.id===u.id?previous:x));setError(e.message)}finally{setSavingId(null)}
 };
 const verifyUser=u=>updateUser(u,{email_verified:true});
 const deleteUser=async u=>{if(!window.confirm(`Obrisati korisnika ${u.name}?`))return;try{await api(`users/${u.id}`,{method:'DELETE'});load()}catch(e){alert(e.message)}};
 if(error)return <><div className="owner-head"><div><p>GLOBAL USERS</p><h1>Korisnici platforme</h1></div></div><ErrorBox error={error}/></>;
 return <><div className="owner-head"><div><p>GLOBAL USERS</p><h1>Korisnici platforme</h1><span>Pregled svih vlasnika firmi i članova njihovih timova.</span></div><button className="primary owner-new-btn" onClick={()=>setShowNew(true)}><Plus/> Novi korisnik</button></div>
  {error&&<ErrorBox error={error}/>} {notice&&<div className="owner-save-notice"><CheckCircle2/>{notice}</div>}
  <section className="owner-panel"><div className="owner-table-tools"><div className="owner-search"><Search/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Pretraži korisnika, email ili firmu..."/></div><span>{visible.length} korisnika</span></div>
   {!ready?<Skeleton/>:<div className="table-wrap"><table className="owner-table"><thead><tr><th>Korisnik</th><th>Firma</th><th>Uloga</th><th>Email verifikovan</th><th>Status</th><th>Registracija</th><th>Akcije</th></tr></thead><tbody>
    {!visible.length&&<tr><td colSpan={7} className="empty-row">Nema korisnika za prikaz.</td></tr>}
    {visible.map(u=><tr key={u.id}><td><div className="owner-company-cell"><span>{initials2(u.name)}</span><div><strong>{s(u.name)||'Bez imena'}</strong><small>{s(u.email)}</small></div></div></td><td>{u.company||'Platforma'}</td><td><select value={u.role} disabled={savingId===u.id} onChange={e=>updateUser(u,{role:e.target.value})}><option>Administrator</option><option>Menadžer</option><option>Radnik</option><option>Platform Owner</option></select>{savingId===u.id&&<small className="owner-saving-inline">Čuvanje...</small>}</td><td>{u.email_verified?<span className="owner-verified-tag"><CheckCircle2/> Verifikovan</span>:<button className="owner-action verify" onClick={()=>verifyUser(u)}><BadgeCheck/> Verifikuj ručno</button>}</td><td><select value={u.status} onChange={e=>updateUser(u,{status:e.target.value})}><option>Aktivan</option><option>Neaktivan</option></select></td><td>{fmtDate(u.created_at)}</td><td className="owner-row-actions"><button className="owner-action" onClick={()=>setEditUser(u)}><Pencil/> Uredi</button><button className="owner-action danger" onClick={()=>deleteUser(u)}><Trash2/></button></td></tr>)}
   </tbody></table></div>}
  </section>
  {showNew&&<NewUserModal companies={companies} onClose={()=>setShowNew(false)} onCreated={d=>{setNotice(`Korisnik ${d.name} je uspješno kreiran.${d.emailDelivered?' Pristupni podaci su poslani emailom.':''}`);load()}}/>}
  {editUser&&<UserEditModal user={editUser} onClose={()=>setEditUser(null)} onSaved={load}/>}
  </>;
}
export function OwnerAudit(){
 const[rows,setRows]=useState([]),[error,setError]=useState(''),[ready,setReady]=useState(false);
 useEffect(()=>{let alive=true;api('audit').then(d=>{if(!alive)return;setRows(Array.isArray(d)?d:[])}).catch(e=>alive&&setError(e.message)).finally(()=>alive&&setReady(true));return()=>{alive=false}},[]);
 return <><div className="owner-head"><div><p>SECURITY & COMPLIANCE</p><h1>Audit zapis</h1><span>Neizmjenjiva evidencija administratorskih akcija.</span></div></div>
  {error&&<ErrorBox error={error}/>}
  <section className="owner-panel">{!ready?<Skeleton/>:<div className="owner-audit">{rows.length?rows.map(a=><article key={a.id}><span><ShieldCheck/></span><div><strong>{a.action}</strong><p>{a.actor||'Sistem'} · {a.target_type} #{a.target_id}</p></div><time>{fmtDate(a.created_at)}</time></article>):<div className="owner-empty"><ShieldCheck/><strong>Nema zabilježenih akcija</strong><p>Promjene planova i statusa firmi pojavit će se ovdje.</p></div>}</div>}</section></>;
}
