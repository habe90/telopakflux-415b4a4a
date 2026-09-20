import React,{useEffect,useMemo,useState} from 'react';
import {Building2,Users,WalletCards,Activity,Search,ShieldCheck,Server,Database,Mail,CheckCircle2,Clock3,AlertTriangle,RefreshCw,ExternalLink} from 'lucide-react';
const api=async path=>{const r=await fetch(`/api/owner/${path}`,{credentials:'include'});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Greška prilikom učitavanja podataka.');return d};
const money=n=>new Intl.NumberFormat('bs-BA',{style:'currency',currency:'EUR'}).format(Number(n||0));
const s=v=>(v===null||v===undefined)?'':String(v);
const initials2=v=>s(v).trim().slice(0,2).toUpperCase()||'—';
const fmtDate=v=>{if(!v)return '—';const d=new Date(v);return isNaN(d.getTime())?'—':d.toLocaleDateString('bs-BA')};
function Metric({icon:Icon,label,value,meta,tone}){return <article className="owner-metric"><span className={`owner-metric-icon ${tone}`}>{Icon?<Icon/>:null}</span><div><small>{label}</small><strong>{value}</strong><p>{meta}</p></div></article>}
function Status({value}){return <span className={`owner-status ${s(value).toLowerCase().replace(/\s+/g,'-')||'nepoznato'}`}><i/>{s(value)||'Nepoznato'}</span>}
function Skeleton(){return <div className="owner-loading"><RefreshCw/><span>Učitavanje platforme...</span></div>}
function ErrorBox({error}){return <div className="owner-error"><AlertTriangle/>{error}</div>}
export function OwnerOverview({go}){
 const[data,setData]=useState(null),[companies,setCompanies]=useState([]),[error,setError]=useState('');
 useEffect(()=>{let alive=true;Promise.all([api('overview'),api('companies')]).then(([a,b])=>{if(!alive)return;setData(a);setCompanies(Array.isArray(b)?b:[])}).catch(e=>alive&&setError(e.message));return()=>{alive=false}},[]);
 if(error)return <ErrorBox error={error}/>;
 if(!data)return <Skeleton/>;
 return <><div className="owner-head"><div><p>PLATFORM CONTROL CENTER</p><h1>Dobro došli u Owner konzolu</h1><span>Globalni pregled TeloPak Flux SaaS platforme.</span></div><div className="owner-live"><i/> Svi sistemi operativni</div></div>
  <section className="owner-metrics"><Metric icon={Building2} label="UKUPNO FIRMI" value={data.companies?.total??0} meta={`${data.companies?.active??0} aktivnih`} tone="blue"/><Metric icon={Users} label="KORISNICI" value={data.users?.total??0} meta={`${data.users?.active??0} aktivnih naloga`} tone="violet"/><Metric icon={WalletCards} label="MJESEČNI PRIHOD" value={money(data.companies?.mrr)} meta={`${data.companies?.trials??0} trial naloga`} tone="green"/><Metric icon={Activity} label="AKTIVNE SESIJE" value={data.activeSessions??0} meta="Trenutno online" tone="orange"/></section>
  <section className="owner-grid"><article className="owner-panel owner-companies-card"><div className="owner-panel-head"><div><h3>Nove firme</h3><p>Posljednje registracije na platformi</p></div><button onClick={()=>go('Firme')}>Sve firme <ExternalLink/></button></div><div className="owner-company-list">{companies.slice(0,6).map(c=><div key={c.id}><span className="owner-company-logo">{initials2(c.name)}</span><div><strong>{s(c.name)||'Bez naziva'}</strong><small>{c.industry||'Djelatnost nije unesena'} · {c.users??0} korisnika</small></div><Status value={c.status}/><b>{c.plan||'—'}</b></div>)}{!companies.length&&<div className="owner-empty" style={{minHeight:120}}><Building2/><strong>Još nema registrovanih firmi</strong></div>}</div></article>
  <article className="owner-panel"><div className="owner-panel-head"><div><h3>Zdravlje sistema</h3><p>Produkcijske usluge</p></div></div><div className="owner-health"><div><Server/><span><strong>API server</strong><small>Express · Node.js</small></span><Status value="Operational"/></div><div><Database/><span><strong>PostgreSQL</strong><small>Persistent database</small></span><Status value="Operational"/></div><div><Mail/><span><strong>Email servis</strong><small>Zoho SMTP EU</small></span><Status value="Operational"/></div><div><ShieldCheck/><span><strong>Autentifikacija</strong><small>2FA · Secure sessions</small></span><Status value="Operational"/></div></div></article></section></>;
}
export function OwnerCompanies(){
 const[rows,setRows]=useState([]),[search,setSearch]=useState(''),[error,setError]=useState(''),[ready,setReady]=useState(false);
 const load=()=>api('companies').then(d=>{setRows(Array.isArray(d)?d:[]);setError('')}).catch(e=>setError(e.message)).finally(()=>setReady(true));
 useEffect(()=>{load()},[]);
 const visible=useMemo(()=>rows.filter(x=>`${s(x.name)} ${s(x.industry)} ${s(x.plan)}`.toLowerCase().includes(search.toLowerCase())),[rows,search]);
 const update=async(c,patch)=>{try{const r=await fetch(`/api/owner/companies/${c.id}`,{method:'PUT',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify(patch)});if(r.ok)load()}catch(e){}};
 return <><div className="owner-head"><div><p>TENANT MANAGEMENT</p><h1>Firme i pretplate</h1><span>Upravljajte svim organizacijama koje koriste platformu.</span></div></div>
  {error&&<ErrorBox error={error}/>}
  <section className="owner-panel"><div className="owner-table-tools"><div className="owner-search"><Search/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Pretraži firme, planove ili djelatnosti..."/></div><span>{visible.length} firmi</span></div>
   {!ready?<Skeleton/>:<div className="table-wrap"><table className="owner-table"><thead><tr><th>Firma</th><th>Plan</th><th>Korisnici</th><th>Poslovi</th><th>MRR</th><th>Status</th><th>Akcija</th></tr></thead><tbody>
    {!visible.length&&<tr><td colSpan={7} className="empty-row">Nema firmi za prikaz.</td></tr>}
    {visible.map(c=><tr key={c.id}><td><div className="owner-company-cell"><span>{initials2(c.name)}</span><div><strong>{s(c.name)||'Bez naziva'}</strong><small>{c.industry||'Bez djelatnosti'}</small></div></div></td><td><select value={c.plan||'Trial'} onChange={e=>update(c,{plan:e.target.value})}><option>Trial</option><option>Starter</option><option>Pro</option><option>Enterprise</option></select></td><td>{c.users??0}</td><td>{c.jobs??0}</td><td><strong>{money(c.monthly_price)}</strong></td><td><Status value={c.status}/></td><td><button className="owner-action" onClick={()=>update(c,{status:c.status==='Aktivna'?'Suspendovana':'Aktivna'})}>{c.status==='Aktivna'?'Suspenduj':'Aktiviraj'}</button></td></tr>)}
   </tbody></table></div>}
  </section></>;
}
export function OwnerUsers(){
 const[rows,setRows]=useState([]),[search,setSearch]=useState(''),[error,setError]=useState(''),[ready,setReady]=useState(false);
 useEffect(()=>{let alive=true;api('users').then(d=>{if(!alive)return;setRows(Array.isArray(d)?d:[])}).catch(e=>alive&&setError(e.message)).finally(()=>alive&&setReady(true));return()=>{alive=false}},[]);
 const visible=useMemo(()=>rows.filter(x=>`${s(x.name)} ${s(x.email)} ${s(x.company)}`.toLowerCase().includes(search.toLowerCase())),[rows,search]);
 if(error)return <><div className="owner-head"><div><p>GLOBAL USERS</p><h1>Korisnici platforme</h1></div></div><ErrorBox error={error}/></>;
 return <><div className="owner-head"><div><p>GLOBAL USERS</p><h1>Korisnici platforme</h1><span>Pregled svih vlasnika firmi i članova njihovih timova.</span></div></div>
  <section className="owner-panel"><div className="owner-table-tools"><div className="owner-search"><Search/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Pretraži korisnika, email ili firmu..."/></div><span>{visible.length} korisnika</span></div>
   {!ready?<Skeleton/>:<div className="table-wrap"><table className="owner-table"><thead><tr><th>Korisnik</th><th>Firma</th><th>Uloga</th><th>Email verifikovan</th><th>Status</th><th>Registracija</th></tr></thead><tbody>
    {!visible.length&&<tr><td colSpan={6} className="empty-row">Nema korisnika za prikaz.</td></tr>}
    {visible.map(u=><tr key={u.id}><td><div className="owner-company-cell"><span>{initials2(u.name)}</span><div><strong>{s(u.name)||'Bez imena'}</strong><small>{s(u.email)}</small></div></div></td><td>{u.company||'Platforma'}</td><td>{u.role||'—'}</td><td>{u.email_verified?<CheckCircle2 className="owner-check"/>:<Clock3 className="owner-wait"/>}</td><td><Status value={u.status}/></td><td>{fmtDate(u.created_at)}</td></tr>)}
   </tbody></table></div>}
  </section></>;
}
export function OwnerAudit(){
 const[rows,setRows]=useState([]),[error,setError]=useState(''),[ready,setReady]=useState(false);
 useEffect(()=>{let alive=true;api('audit').then(d=>{if(!alive)return;setRows(Array.isArray(d)?d:[])}).catch(e=>alive&&setError(e.message)).finally(()=>alive&&setReady(true));return()=>{alive=false}},[]);
 return <><div className="owner-head"><div><p>SECURITY & COMPLIANCE</p><h1>Audit zapis</h1><span>Neizmjenjiva evidencija administratorskih akcija.</span></div></div>
  {error&&<ErrorBox error={error}/>}
  <section className="owner-panel">{!ready?<Skeleton/>:<div className="owner-audit">{rows.length?rows.map(a=><article key={a.id}><span><ShieldCheck/></span><div><strong>{a.action}</strong><p>{a.actor||'Sistem'} · {a.target_type} #{a.target_id}</p></div><time>{fmtDate(a.created_at)}</time></article>):<div className="owner-empty"><ShieldCheck/><strong>Nema zabilježenih akcija</strong><p>Promjene planova i statusa firmi pojavit će se ovdje.</p></div>}</div>}</section></>;
}
