import fs from 'node:fs';import assert from 'node:assert/strict';
const app=fs.readFileSync('src/App.jsx','utf8'),assistant=fs.readFileSync('src/AIAssistant.jsx','utf8');
assert(app.includes('previousInternalPage'),'Aplikacija mora pratiti prethodnu internu stranicu');
assert(app.includes("'Početna'"),'Povratak mora imati dashboard fallback');
assert(app.includes('<AIAssistant onBack={leaveAssistant}/>'),'Pomoćnik mora dobiti callback za povratak');
assert(assistant.includes('ai-back-button'),'Pomoćnik mora prikazati dugme Nazad');
assert(assistant.includes('<ArrowLeft/>'),'Dugme mora imati strelicu ulijevo');
assert(assistant.includes('aria-label="Nazad na prethodnu stranicu"'),'Dugme mora biti dostupno tastaturom i čitačima ekrana');
console.log('Assistant navigation tests passed');
