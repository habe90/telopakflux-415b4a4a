import fs from'node:fs';import assert from'node:assert/strict';
const app=fs.readFileSync('src/App.jsx','utf8');
function formatJoinedDate(value){if(!value)return'—';const raw=String(value);const iso=raw.match(/^(\d{4})-(\d{2})-(\d{2})/);if(iso)return`${iso[3]}.${iso[2]}.${iso[1]}`;const d=new Date(value);if(Number.isNaN(d.getTime()))return'—';return new Intl.DateTimeFormat('bs-BA',{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'UTC'}).format(d).replace(/\.$/,'')}
assert.equal(formatJoinedDate('2026-11-01'),'01.11.2026','Tase Tokic');
assert.equal(formatJoinedDate('2026-11-01T00:00:00.000Z'),'01.11.2026','Tase Tokic (puni ISO)');
assert.equal(formatJoinedDate('2026-10-04T00:00:00.000Z'),'04.10.2026','Halil Hodžić');
assert.equal(formatJoinedDate('2026-09-21T00:00:00.000Z'),'21.09.2026','Mersad Mujić');
assert.equal(formatJoinedDate('2026-11-01T23:30:00.000Z'),'01.11.2026','Ne smije se pomjeriti u susjednu vremensku zonu');
assert.equal(formatJoinedDate(null),'—');
assert(app.includes("const iso=raw.match(/^(\\d{4})-(\\d{2})-(\\d{2})/)"),'App.jsx mora koristiti direktno presložavanje YYYY-MM-DD, bez Date/timezone konverzije');
assert(app.includes("return`${iso[3]}.${iso[2]}.${iso[1]}`"),'Format mora biti DD.MM.YYYY iz izvornog teksta');
console.log('Users joined date tests passed');
