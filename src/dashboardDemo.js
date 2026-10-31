const COMPANY_TIMEZONE='Europe/Paris';
const isoInZone=(date=new Date())=>new Intl.DateTimeFormat('en-CA',{timeZone:COMPANY_TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
const displayDate=iso=>{const [y,m,d]=iso.split('-');return `${d}.${m}.${y}.`};
const offsetDate=days=>{const d=new Date(`${isoInZone()}T12:00:00Z`);d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10)};
const euro=n=>new Intl.NumberFormat('bs-BA',{minimumFractionDigits:2,maximumFractionDigits:2}).format(n)+' €';

export function buildDemoDashboard(days=7){
 const today=isoInZone(),year=today.slice(0,4);
 const base=[680,1240,930,2150,760,1880,1320,540,970,1620,1100,830,2010,1450,690,1770,1180,920,1560,740,2250,1010,1340,860,1940,1210,650,1690,1080,1820];
 const chart=Array.from({length:days},(_,i)=>{const date=offsetDate(-(days-1-i));return{date,amount:base[(30-days+i)%base.length]}});
 const invoiceRows=[
  {id:'demo-inv-1',no:`R-${year}-1045`,client:'Atelier Moreau',issued:displayDate(offsetDate(-1)),total_value:2450,paid_value:1000,remaining:1450,status:'Djelimično plaćen'},
  {id:'demo-inv-2',no:`R-${year}-1044`,client:'Boulangerie Martin',issued:displayDate(offsetDate(-2)),total_value:700,paid_value:0,remaining:700,status:'Poslat'},
  {id:'demo-inv-3',no:`R-${year}-1043`,client:'Hôtel du Parc',issued:displayDate(offsetDate(-4)),total_value:3180,paid_value:3180,remaining:0,status:'Plaćen'},
  {id:'demo-inv-4',no:`R-${year}-1042`,client:'Pharmacie Centrale',issued:displayDate(offsetDate(-6)),total_value:1280,paid_value:1280,remaining:0,status:'Plaćen'},
  {id:'demo-inv-5',no:`R-${year}-1041`,client:'Restaurant Le Jardin',issued:displayDate(offsetDate(-8)),total_value:1960,paid_value:1960,remaining:0,status:'Plaćen'}
 ];
 return{
  demo:true,timezone:COMPANY_TIMEZONE,period_days:days,payment_tracking_available:true,
  cards:{month_paid:18420,previous_month_paid:16345,active_jobs:24,waiting_offers:5,open_offers:8,outstanding:invoiceRows.reduce((s,x)=>s+x.remaining,0),overdue_amount:780},
  chart,chart_total:chart.reduce((s,x)=>s+x.amount,0),
  today_jobs:[
   {id:'demo-job-1',time:'08:00',client:'Atelier Moreau',service:'Servis industrijskih vrata',worker:'Amir Hadžić',city:'Lyon',status:'Zakazano',priority:'Standardno'},
   {id:'demo-job-2',time:'10:30',client:'Boulangerie Martin',service:'Hitna intervencija rashladnog sistema',worker:'Kerim Delić',city:'Boulogne-Billancourt',status:'Zakazano',priority:'Hitno'},
   {id:'demo-job-3',time:'13:15',client:'Hôtel du Parc',service:'Preventivno održavanje',worker:'Adnan Kovač',city:'Lyon',status:'U toku',priority:'Standardno'},
   {id:'demo-job-4',time:'16:00',client:'Pharmacie Centrale',service:'Pregled elektroinstalacija',worker:'Emir Selimović',city:'Bron',status:'Zakazano',priority:'Standardno'}
  ],
  alerts:[
   {type:'invoice',id:'demo-alert-1',title:`Račun R-${year}-1038 kasni`,sub:`Atelier Lumière · ${euro(780)} · dospio ${displayDate(offsetDate(-5))}`,page:'Računi'},
   {type:'offer',id:'demo-alert-2',title:`Ponuda P-${year}-0217 uskoro ističe`,sub:`Maison Bernard · važi do ${displayDate(offsetDate(2))}`,page:'Ponude'},
   {type:'maintenance',id:'demo-alert-3',title:'Održavanje uskoro dospijeva',sub:`Hôtel du Parc · ${displayDate(offsetDate(3))}`,page:'Održavanje'}
  ],
  latest_invoices:invoiceRows
 };
}
