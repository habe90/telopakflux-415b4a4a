import fs from 'node:fs';import assert from 'node:assert/strict';
const app=fs.readFileSync('src/App.jsx','utf8'),css=fs.readFileSync('src/styles.css','utf8');
// Administratorska Početna sada koristi stvarne podatke (vidi tests/dashboard-admin-overview.mjs i tests/dashboard-real-data.mjs
// za provjeru da DASHBOARD_DEMO_MODE=false i da je demo zastavica uklonjena iz navigacije). Ovdje ostaju samo i dalje važeće
// provjere rasporeda, formatiranja i izgleda koje ne zavise od demo/stvarnog režima.
assert(app.includes("const companyTZ='Europe/Paris'")&&app.includes("10:'okt.'")&&app.includes('dateLabel=`${Number(companyParts.day)}. ${monthShort}`'),'Datum zaglavlja mora koristiti francusko vrijeme i bosansku skraćenicu mjeseca');
assert(app.includes('setInterval(()=>setDateTick(Date.now()),60000)'),'Datum se mora automatski osvježavati nakon promjene dana');
assert(app.includes('formatDashboardDate(r.issued)')&&app.includes("return`${iso[3]}.${iso[2]}.${iso[1]}.`"),'Datum računa mora se formatirati u obliku DD.MM.GGGG. sa završnom tačkom');
assert(app.includes('dashboard-schedule-head')&&app.includes('dashboard-schedule-row')&&css.includes('--schedule-cols:64px'),'Zaglavlje i redovi rasporeda moraju koristiti iste kolone');
assert(app.includes('chart-y-axis')&&app.includes('data-tooltip'),'Grafikon mora imati EUR skalu i tooltip');
assert(css.includes('overflow:visible!important'),'Grafikon ne smije imati unutrašnji vertikalni scroll');
const gridStart=app.indexOf('className="dashboard-grid"',app.indexOf('function Dashboard({openNew,go,profile,refreshKey})')),scheduleIdx=app.indexOf('schedule-card',gridStart),invoicesIdx=app.indexOf('className="card invoices"',gridStart),activityIdx=app.indexOf('activity-card',gridStart),tasksIdx=app.indexOf('tasks-card',gridStart);assert(scheduleIdx<invoicesIdx&&invoicesIdx<activityIdx&&activityIdx<tasksIdx,'Raspored i računi moraju biti lijevo, grafikon i upozorenja desno');
console.log('Dashboard layout tests passed');
