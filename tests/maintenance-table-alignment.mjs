import fs from'node:fs';import assert from'node:assert/strict';
const ui=fs.readFileSync('src/Modules.jsx','utf8'),css=fs.readFileSync('src/styles.css','utf8');
assert(ui.includes('className="table-wrap maintenance-table-wrap"')&&ui.includes('<table className="maintenance-table">'),'Poravnanje mora biti ograničeno samo na tabelu Održavanja');
assert(css.includes('.maintenance-table th,.maintenance-table td{text-align:center!important;vertical-align:middle!important}'),'Svih osam naslova i ćelija mora biti horizontalno i vertikalno centrirano');
assert(css.includes('.maintenance-table td>strong,.maintenance-table td>.table-sub{display:block;text-align:center;margin-left:auto;margin-right:auto}'),'Datum, rok, uređaj i lokacija moraju dijeliti središnju osu');
assert(css.includes('.maintenance-table td>.badge,.maintenance-table td>.countdown{display:inline-flex;width:auto;margin:0 auto}'),'Status mora ostati prirodne širine i biti centriran');
assert(css.includes('display:inline-flex;align-items:center;justify-content:center;gap:6px;margin:0 auto;white-space:nowrap'),'Akcije moraju biti jedna centrirana grupa u istom redu s jednakim razmakom');
console.log('Maintenance table alignment tests passed');
