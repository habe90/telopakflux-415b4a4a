import fs from'node:fs';import assert from'node:assert/strict';
const auth=fs.readFileSync('src/Auth.jsx','utf8'),location=fs.readFileSync('src/LocationFields.jsx','utf8'),css=fs.readFileSync('src/styles.css','utf8');
assert(auth.includes('<PhoneField form={f} set={set} showHelp={false}/>'),'Registracija mora sakriti napomenu telefona');
assert(location.includes('showHelp=true')&&location.includes('{showHelp&&<span className="field-help">'),'Zajednička komponenta mora opcionalno prikazivati napomenu bez promjene telefonske logike');
assert(css.includes('.register-company-form .auth-submit{margin:14px 0 0}'),'Dugme Nastavi mora slijediti telefon sa standardnim razmakom');
console.log('Registration phone help tests passed');
