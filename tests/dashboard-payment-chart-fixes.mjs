import fs from 'node:fs';import assert from 'node:assert/strict';
const app=fs.readFileSync('src/App.jsx','utf8'),css=fs.readFileSync('src/styles.css','utf8'),server=fs.readFileSync('server/index.js','utf8');

// 1) "Naplaćeno po danima" mora koristiti STVARAN prozor od `days` dana (uključujući danas), ne samo uplate od
// početka tekućeg mjeseca — to je bio uzrok nula za dane izvan tekućeg mjeseca kad je izabrano 30 dana.
assert(server.includes('periodPayments,jobs,offers,invoices,todayJobs,maintenance'),'Mora postojati zaseban upit uplata za period grafikona');
assert(server.includes("(now() AT TIME ZONE $2)::date - ($3::int - 1)"),'Period mora početi od (danas - (days-1)), uključujući danas');
assert(server.includes("periodPayments.rows.filter(p=>new Intl.DateTimeFormat"),'Grafikon mora graditi dane iz periodPayments, ne iz mjesečnog payments upita');
assert(server.includes('monthPaid=payments.rows.reduce'),'Kartica "Naplaćeno ovog mjeseca" mora ostati vezana za kalendarski mjesec');

// 2) Novac uvijek u obliku "18.420,00 €" — deterministički formatter, neovisan o ICU podacima okruženja.
assert(app.includes('function formatMoneyEU(v){'),'Mora postojati deterministički EUR formatter');
assert(app.includes("grouped.replace" ) || app.includes("grouped=intPart.replace(/\\B(?=(\\d{3})+(?!\\d))/g,'.')"),'Formatter mora grupisati hiljade tačkom');
assert(app.includes("fixed=abs.toFixed(2)") && app.includes("${grouped},${decPart} €"),'Formatter mora koristiti zarez za decimale i razmak prije €');
assert(app.includes('const fmt=formatMoneyEU'),'Dashboard mora koristiti deterministički formatter umjesto Intl');

// 3) Datumi u obliku "05.11.2026." — sa završnom tačkom, i za račune i za stupce grafikona.
assert(app.includes("function isoDateParts(isoDay){"),'Mora postojati pomoćna funkcija za ISO datum grafikona');
assert(app.includes("full:Number.isFinite(y)?`${pad2(d)}.${pad2(m)}.${y}.`")," Puni datum stupca mora imati završnu tačku");
assert(app.includes("dateParts.full} · ${fmt(amount)}"),'Tooltip stupca mora prikazati puni datum i iznos');

// 4) Uklonjeni sitni iznosi nagomilani pri dnu stubaca — prikaz samo na hover (tooltip), ne stalni tekst na stupcu.
assert(!app.includes('className="bar-value"'),'Stalni tekst iznosa na stupcu mora biti uklonjen');
assert(!css.includes('.dashboard-chart .bar-value'),'CSS za stalni tekst na stupcu mora biti uklonjen');
assert(app.includes('data-tooltip={`${dateParts.full}'),'Datum i iznos i dalje moraju biti dostupni pri prelasku mišem');

// 5) Objedinjeni obrazac "Novi posao" i administratorske prečice "Brzo dodaj" (uključujući "Novi materijal") ostaju netaknuti.
assert(app.includes("['material','Novi materijal','Evidentirajte artikl',Package,'amber']"),'Brzo dodaj mora zadržati Novi materijal za ne-kancelarijske uloge');
assert(app.includes("{modal&&<JobForm data={{status:'Novi'"),'Objedinjeni obrazac Novi posao mora ostati isti modal');

// 6) Nakon uspješnog čuvanja (Novi posao i Brzo dodaj) Početna se stvarno osvježava.
assert(app.includes('const [dashboardRefreshNonce,setDashboardRefreshNonce]=useState(0)'),'Mora postojati signal za osvježavanje Početne');
assert(app.includes('const refreshDashboardData=()=>setDashboardRefreshNonce(n=>n+1)'),'Signal mora biti pozivljiv iz više tokova');
assert(app.includes('refreshDashboardData();return saved}}/>'),'Novi posao mora osvježiti Početnu nakon uspješnog spremanja');
assert(app.includes('notify(`${label} je uspješno kreiran.`);\n  refreshDashboardData();\n  go(target);'),'Brzo dodaj mora osvježiti Početnu nakon uspješnog spremanja');
assert(app.includes('function Dashboard({openNew,go,profile,refreshKey})'),'Dashboard mora primati signal osvježavanja kao prop');
assert(app.includes('useEffect(load,[period,refreshKey])'),'Dashboard mora ponovo učitati podatke kad se signal promijeni');
assert(app.includes('refreshKey={dashboardRefreshNonce}'),'Signal mora biti proslijeđen iz AppShell u Dashboard');

console.log('Dashboard payment chart fixes tests passed');
