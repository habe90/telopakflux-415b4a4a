import React, { useMemo, useState } from 'react';
import {
  Bot, Sparkles, MessageSquareText, FileText, CalendarDays, AlertTriangle,
  ArrowRight, Clock3, CheckCircle2, Send, Copy, RefreshCw, X, ChevronRight,
  UserRound, MapPin, ReceiptText, BriefcaseBusiness, Zap, ShieldCheck
} from 'lucide-react';

const alerts = [
  {id:1,title:'3 neodgovorena upita',text:'Najstariji upit čeka odgovor 19 sati.',type:'Upiti',tone:'red',icon:MessageSquareText,action:'Napiši odgovore'},
  {id:2,title:'2 ponude bez odgovora',text:'Ponude P-028 i P-031 ističu za manje od 48 sati.',type:'Ponude',tone:'amber',icon:FileText,action:'Pripremi podsjetnik'},
  {id:3,title:'1 račun kasni 7 dana',text:'Marić Stan · račun R-043 · 350,00 €',type:'Naplata',tone:'red',icon:ReceiptText,action:'Napiši opomenu'},
  {id:4,title:'Servis dospijeva za 5 dana',text:'Novak Stan · redovni servis klima uređaja.',type:'Održavanje',tone:'blue',icon:BriefcaseBusiness,action:'Predloži termin'}
];

const slots = [
  {day:'Srijeda, 26.03.',time:'09:00 – 10:30',worker:'Ivan Kovač',place:'Sarajevo'},
  {day:'Četvrtak, 27.03.',time:'13:30 – 15:00',worker:'Marko Ilić',place:'Ilidža'},
  {day:'Petak, 28.03.',time:'08:00 – 09:30',worker:'Petar Jurić',place:'Sarajevo'}
];

const activities = [
  ['Analizirano 8 otvorenih ponuda','Danas u 14:32'],
  ['Pronađen račun koji kasni','Danas u 13:05'],
  ['Predložena 3 slobodna termina','Danas u 11:48']
];

function StatusPill({tone,children}){return <span className={`ai-pill ${tone}`}>{children}</span>}

function ActionModal({kind,close}){
 const content={
  reply:{eyebrow:'ODGOVOR KLIJENTU',title:'AI prijedlog odgovora',subject:'Odgovor na upit za servis bojlera',body:'Poštovani,\n\nhvala vam na upitu. Možemo organizovati pregled i servis bojlera u srijedu, 26.03. u 09:00 sati. Procijenjeno trajanje intervencije je 60–90 minuta.\n\nMolimo potvrdite da li vam predloženi termin odgovara.\n\nSrdačan pozdrav,\nTeloPak tim'},
  offer:{eyebrow:'NACRT DOKUMENTA',title:'AI nacrt ponude',subject:'Ponuda — servis i zamjena sigurnosnog ventila',body:'1. Dolazak i dijagnostika ........ 35,00 €\n2. Zamjena sigurnosnog ventila ... 48,00 €\n3. Potrošni materijal ............ 12,00 €\n\nUkupno bez PDV-a: 95,00 €\nPDV 17%: 16,15 €\nUKUPNO: 111,15 €\n\nRok važenja ponude: 7 dana.'},
  reminder:{eyebrow:'PODSJETNIK KLIJENTU',title:'AI prijedlog podsjetnika',subject:'Podsjetnik za ponudu P-028',body:'Poštovani,\n\nljubazno vas podsjećamo da ponuda P-028 za montažu klima uređaja ističe za dva dana. Ako imate pitanja ili želite izmjenu ponude, stojimo vam na raspolaganju.\n\nSrdačan pozdrav,\nTeloPak tim'},
  payment:{eyebrow:'OPOMENA ZA PLAĆANJE',title:'AI prijedlog poruke',subject:'Podsjetnik za račun R-043',body:'Poštovani,\n\nevidentirali smo da račun R-043 u iznosu od 350,00 € još nije izmiren, a rok plaćanja istekao je prije 7 dana. Molimo vas da provjerite status uplate ili nam javite ukoliko je plaćanje već izvršeno.\n\nHvala na razumijevanju.'}
 }[kind]||null;
 const [text,setText]=useState(content?.body||''); const [copied,setCopied]=useState(false);
 if(!content)return null;
 const copy=()=>{navigator.clipboard?.writeText(text);setCopied(true);setTimeout(()=>setCopied(false),1800)};
 return <div className="modal-backdrop" onMouseDown={close}><div className="modal ai-modal" onMouseDown={e=>e.stopPropagation()}>
  <div className="modal-head"><div><span className="modal-kicker">{content.eyebrow}</span><h2>{content.title}</h2><p>Provjerite i uredite sadržaj prije slanja klijentu.</p></div><button className="icon-btn" onClick={close}><X/></button></div>
  <div className="ai-modal-body"><label>Naslov<input defaultValue={content.subject}/></label><label>Sadržaj<textarea value={text} onChange={e=>setText(e.target.value)}/></label><div className="ai-disclaimer"><ShieldCheck/> AI sadržaj je prijedlog. Prije slanja provjerite cijene, termine i podatke klijenta.</div></div>
  <div className="modal-actions"><button className="secondary" onClick={()=>setText(content.body)}><RefreshCw/> Generiši ponovo</button><button className="secondary" onClick={copy}><Copy/> {copied?'Kopirano':'Kopiraj'}</button><button className="primary" onClick={close}><Send/> Pošalji klijentu</button></div>
 </div></div>
}

export default function AIAssistant(){
 const [tab,setTab]=useState('Pregled'); const [modal,setModal]=useState(null); const [prompt,setPrompt]=useState(''); const [answer,setAnswer]=useState('');
 const visibleAlerts=useMemo(()=>tab==='Upozorenja'?alerts:alerts.slice(0,3),[tab]);
 const ask=e=>{e.preventDefault();if(!prompt.trim())return;setAnswer('Na osnovu rasporeda ekipe, najbolji termin je četvrtak 27.03. u 13:30 kod Marka Ilića. Mogu odmah pripremiti poruku klijentu i kreirati termin u rasporedu.');setPrompt('')};
 const alertAction=a=>setModal(a.type==='Ponude'?'reminder':a.type==='Naplata'?'payment':a.type==='Upiti'?'reply':null);
 return <>
  <div className="page-head ai-page-head"><div><p className="eyebrow">PAMETNI RADNI PROSTOR</p><h1>AI pomoćnik <span className="ai-beta">BETA</span></h1><p>Prijedlozi, nacrti i upozorenja zasnovani na podacima vaše firme.</p></div><div className="ai-online"><i></i> AI pomoćnik je aktivan</div></div>

  <section className="ai-hero">
   <div className="ai-orb"><Bot/></div><div className="ai-hero-copy"><span>DOBAR DAN, MARKO</span><h2>Šta želite uraditi danas?</h2><p>Pitajte za klijente, ponude, naplatu ili slobodne termine.</p></div>
   <form className="ai-prompt" onSubmit={ask}><Sparkles/><input value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Npr. pronađi slobodan termin za servis naredne sedmice..."/><button><Send/></button></form>
   <div className="ai-suggestions"><button onClick={()=>setModal('reply')}><MessageSquareText/> Napiši odgovor klijentu</button><button onClick={()=>setModal('offer')}><FileText/> Izradi nacrt ponude</button><button onClick={()=>setTab('Termini')}><CalendarDays/> Pronađi slobodan termin</button></div>
  </section>

  {answer&&<section className="ai-answer"><div className="ai-answer-icon"><Bot/></div><div><strong>AI odgovor</strong><p>{answer}</p><div><button onClick={()=>setTab('Termini')}>Pogledaj termine <ArrowRight/></button><button onClick={()=>setModal('reply')}>Pripremi poruku</button></div></div><button className="icon-btn" onClick={()=>setAnswer('')}><X/></button></section>}

  <div className="ai-tabs">{['Pregled','Upozorenja','Slobodni termini','Aktivnost'].map(t=><button key={t} className={tab===t||tab==='Termini'&&t==='Slobodni termini'?'active':''} onClick={()=>setTab(t)}>{t}{t==='Upozorenja'&&<em>4</em>}</button>)}</div>

  {(tab==='Pregled'||tab==='Upozorenja')&&<div className="ai-layout">
   <section className="card ai-alerts"><div className="card-head"><div><h3>Zahtijeva vašu pažnju</h3><p>AI je pronašao {alerts.length} stavke koje treba provjeriti</p></div>{tab==='Pregled'&&<button onClick={()=>setTab('Upozorenja')}>Prikaži sve <ChevronRight/></button>}</div>
    <div>{visibleAlerts.map(a=>{const Icon=a.icon;return <article className="ai-alert-row" key={a.id}><div className={`ai-alert-icon ${a.tone}`}><Icon/></div><div className="ai-alert-copy"><div><strong>{a.title}</strong><StatusPill tone={a.tone}>{a.type}</StatusPill></div><p>{a.text}</p></div><button onClick={()=>alertAction(a)}>{a.action}<ArrowRight/></button></article>})}</div>
   </section>
   <aside className="card ai-summary"><div className="ai-summary-top"><Bot/><div><span>DNEVNI SAŽETAK</span><strong>AI pregled poslovanja</strong></div></div><div className="ai-score"><div><strong>82</strong><span>/100</span></div><p>Poslovanje je stabilno</p></div><ul><li><CheckCircle2/><span><strong>5 poslova</strong> završeno ove sedmice</span></li><li><AlertTriangle/><span><strong>3 obaveze</strong> zahtijevaju pažnju</span></li><li><Clock3/><span><strong>5 slobodnih termina</strong> naredne sedmice</span></li></ul><button className="primary" onClick={()=>setTab('Upozorenja')}>Pogledaj detalje <ArrowRight/></button></aside>
  </div>}

  {(tab==='Slobodni termini'||tab==='Termini')&&<section className="card ai-slots"><div className="card-head"><div><h3>Predloženi slobodni termini</h3><p>Izračunato prema rasporedu, lokaciji i trajanju posla</p></div><StatusPill tone="blue">Ažurirano upravo sada</StatusPill></div><div className="slot-list">{slots.map((s,i)=><article key={s.time}><div className="slot-date"><CalendarDays/><div><strong>{s.day}</strong><span>{s.time}</span></div></div><div className="slot-meta"><span><UserRound/> {s.worker}</span><span><MapPin/> {s.place}</span></div><div className="slot-fit"><Zap/> {i===0?'Najbolji izbor':'Slobodan termin'}</div><button className="primary" onClick={()=>setModal('reply')}>Predloži klijentu</button></article>)}</div></section>}

  {tab==='Aktivnost'&&<section className="card ai-activity"><div className="card-head"><div><h3>Aktivnost AI pomoćnika</h3><p>Pregled nedavnih analiza i preporuka</p></div></div>{activities.map((a,i)=><div className="ai-activity-row" key={a[0]}><span><Sparkles/></span><div><strong>{a[0]}</strong><p>{a[1]}</p></div><StatusPill tone={i===1?'amber':'blue'}>{i===1?'Upozorenje':'Analiza'}</StatusPill></div>)}</section>}

  {modal&&<ActionModal kind={modal} close={()=>setModal(null)}/>} 
 </>
}