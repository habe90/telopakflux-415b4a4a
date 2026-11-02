import fs from'node:fs';import assert from'node:assert/strict';
const loc=fs.readFileSync('src/LocationFields.jsx','utf8');

// Jedna zajednička registry/mehanizam za sve padajuće liste (Poštanski broj, Grad, Departman)
assert(loc.includes('const comboRegistry=new Map()')&&loc.includes('function useExclusiveDropdown()'),'Mora postojati zajednički mehanizam za ekskluzivno otvaranje liste');
assert(loc.includes("document.addEventListener('mousedown',closeOutside,true)")&&loc.includes("document.addEventListener('touchstart',closeOutside,true)"),'Klik i dodir izvan liste moraju je zatvoriti, bez osvježavanja stranice');
assert(loc.includes('if(v)comboRegistry.forEach((entry,key)=>{if(key!==idRef.current)entry.close()})'),'Otvaranje jedne liste mora zatvoriti sve ostale (samo jedna otvorena odjednom)');

// Combo (Poštanski broj / Grad): fokus otvara, blur/Esc/ponovni klik na strelicu zatvaraju
assert(loc.includes('const[open,setOpen,ref]=useExclusiveDropdown()'),'Combo mora koristiti zajednički mehanizam');
assert(loc.includes('onBlur={()=>setOpen(false)}'),'Napuštanje polja (Tab) mora zatvoriti listu');
assert(loc.includes("onClick={()=>setOpen(!open)}"),'Klik na strelicu mora preklapati (toggle) otvoreno/zatvoreno stanje');
assert(loc.includes("else if(e.key==='Escape')setOpen(false)"),'Esc mora zatvoriti listu');
assert(loc.includes('onClick={()=>{onSelect(x);setOpen(false)}}'),'Odabir rezultata mora upisati vrijednost i zatvoriti listu');

// "Nema rezultata" samo u aktivnom polju, nakon unosa
assert(loc.includes("typed.length<2?<div className=\"combo-state\">Upišite bar 2 znaka za pretragu.</div>"),'Prazno/kratko polje ne smije prikazati "Nema rezultata"');
assert(loc.includes(':!queryResults.length?<div className="combo-state">Nema rezultata. Nastavite s ručnim unosom.</div>'),'"Nema rezultata" mora se prikazati samo nakon unosa bez pogotka');

// Departman dropdown — ista pravila
assert(loc.includes('[depOpen,setDepOpen,depRef]=useExclusiveDropdown()'),'Departman mora koristiti isti zajednički mehanizam kao Poštanski broj/Grad');
assert(loc.includes('onBlur={()=>setDepOpen(false)}')&&loc.includes("onClick={()=>setDepOpen(!depOpen)}")&&loc.includes("if(e.key==='Escape')setDepOpen(false)"),'Departman mora imati isto zatvaranje (Tab/strelica/Esc)');
assert(loc.includes("depQuery.trim().length>0&&!depFiltered.length?<div className=\"combo-state\">Nema rezultata. Nastavite s ručnim unosom.</div>"),'Departman mora prikazati "Nema rezultata" samo nakon unosa bez pogotka');

console.log('Registration dropdown behavior tests passed');
