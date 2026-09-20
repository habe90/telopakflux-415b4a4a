import React, { useState, useEffect, useRef } from 'react';
import { Wrench, Mail, Lock, User, Building2, Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle2, ShieldCheck, Zap, Users, KeyRound, Smartphone, AlertTriangle } from 'lucide-react';

function BrandPanel({ quote }) {
  return (
    <div className="auth-brand">
      <div className="auth-brand-top brand-logo-wrap">
        <img src={import.meta.env.BASE_URL + 'telopak-flux-logo.svg'} alt="TeloPak Flux" className="brand-logo-image"/>
        <span>Cijeli posao. Na jednom mjestu.</span>
      </div>
      <div className="auth-brand-mid">
        <h1>Manje administracije.<br/>Više posla.</h1>
        <p>Klijenti, ponude, raspored, računi i materijal — sve povezano u jednom sistemu napravljenom za terenske firme.</p>
        <ul>
          <li><CheckCircle2/> Ponuda za 2 minute umjesto 20</li>
          <li><ShieldCheck/> Nijedan podatak ne unosite dvaput</li>
          <li><Zap/> Raspored i naplata na jednom mjestu</li>
        </ul>
      </div>
      <div className="auth-brand-bottom">
        <div className="auth-avatars"><span>MK</span><span>IK</span><span>PJ</span><span className="plus">+120</span></div>
        <p>„{quote}“</p>
      </div>
    </div>
  );
}

function OtpInputs({ value, setValue, error }) {
  const refs = useRef([]);
  const change = (i, v) => {
    const digit = v.replace(/\D/g, '').slice(-1);
    const next = [...value]; next[i] = digit; setValue(next);
    if (digit && i < 5) refs.current[i + 1]?.focus();
  };
  const keyDown = (i, e) => {
    if (e.key === 'Backspace' && !value[i] && i > 0) refs.current[i - 1]?.focus();
  };
  const paste = e => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length) {
      e.preventDefault();
      setValue(Array(6).fill('').map((_, i) => text[i] || ''));
      refs.current[Math.min(text.length, 6) - 1]?.focus();
    }
  };
  return (
    <div className={`otp-inputs ${error ? 'shake' : ''}`}>
      {value.map((d, i) => (
        <input key={i} ref={el => refs.current[i] = el} value={d} inputMode="numeric" maxLength={1}
          className={error ? 'error' : ''} onChange={e => change(i, e.target.value)}
          onKeyDown={e => keyDown(i, e)} onPaste={paste} autoFocus={i === 0}/>
      ))}
    </div>
  );
}

export function PasswordStrength({ value }) {
  if (!value) return null;
  let score = 0;
  if (value.length >= 8) score++;
  if (/[A-Z]/.test(value)) score++;
  if (/[0-9]/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;
  const labels = ['Vrlo slaba', 'Slaba', 'Solidna', 'Jaka', 'Vrlo jaka'];
  const tone = score <= 1 ? 'weak' : score === 2 ? 'mid' : 'strong';
  return (
    <div className="pw-strength">
      <div className="pw-bars">{[0, 1, 2, 3].map(i => <span key={i} className={i < score ? tone : ''}/>)}</div>
      <small>{labels[score]}</small>
    </div>
  );
}

export function Login({ onLogin, goRegister, goForgot }) {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState('credentials');
  const [otp, setOtp] = useState(Array(6).fill(''));
  const [otpError, setOtpError] = useState(false);
  const [resendIn, setResendIn] = useState(30);
  const [remember, setRemember] = useState(true);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [recoveryError, setRecoveryError] = useState(false);

  useEffect(() => {
    if (step !== 'otp' || resendIn <= 0) return;
    const t = setTimeout(() => setResendIn(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [step, resendIn]);

  const submitCredentials = e => { e.preventDefault(); setStep('otp'); setResendIn(30); };
  const verifyOtp = e => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) return;
    if (code === '123456') onLogin();
    else { setOtpError(true); setTimeout(() => { setOtpError(false); setOtp(Array(6).fill('')); }, 700); }
  };
  const verifyRecovery = e => {
    e.preventDefault();
    if (recoveryCode.trim().replace(/-/g, '').length >= 8) onLogin();
    else setRecoveryError(true);
  };

  return (
    <div className="auth-page">
      <BrandPanel quote="TeloPak nam je prepolovio administraciju za mjesec dana." />
      <div className="auth-form-wrap">
        <div className="auth-form">
          <div className="auth-mobile-logo"><img src={import.meta.env.BASE_URL + 'telopak-flux-logo.svg'} alt="TeloPak Flux"/></div>

          {step === 'credentials' && <>
            <p className="eyebrow">DOBRODOŠLI NAZAD</p>
            <h2>Prijava na nalog</h2>
            <p className="auth-sub">Unesite podatke da nastavite na vašu kontrolnu tablu.</p>

            <button className="oauth-btn">
              <svg width="17" height="17" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.6 15.9 18.9 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34.6 6.1 29.6 4 24 4c-7.4 0-13.8 4.1-17.1 10.1"/><path fill="#4CAF50" d="M24 44c5.5 0 10.4-1.9 14.2-5.1l-6.6-5.4C29.6 35.4 27 36 24 36c-5.3 0-9.7-3.4-11.3-8l-6.6 5.1C9.9 39.6 16.4 44 24 44"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.5l6.6 5.4C39.9 36.6 44 30.9 44 24c0-1.3-.1-2.7-.4-3.5z"/></svg>
              Nastavi sa Google nalogom
            </button>
            <div className="auth-divider"><span>ili prijava putem emaila</span></div>

            <form onSubmit={submitCredentials}>
              <label>Email adresa
                <div className="input-icon"><Mail/><input type="email" placeholder="marko@telopak.ba" defaultValue="marko@telopak.ba" required/></div>
              </label>
              <label>Lozinka
                <div className="input-icon">
                  <Lock/><input type={show ? 'text' : 'password'} placeholder="••••••••" defaultValue="password123" required/>
                  <button type="button" className="eye-btn" onClick={() => setShow(s => !s)}>{show ? <EyeOff/> : <Eye/>}</button>
                </div>
              </label>
              <div className="auth-row">
                <label className="checkbox"><input type="checkbox" defaultChecked/> Zapamti me</label>
                <button type="button" className="link-btn" onClick={goForgot}>Zaboravljena lozinka?</button>
              </div>
              <button type="submit" className="primary auth-submit">Prijavi se <ArrowRight/></button>
            </form>
            <p className="auth-switch">Nemate nalog? <button onClick={goRegister}>Registrujte firmu</button></p>
          </>}

          {step === 'otp' && <div className="otp-screen">
            <button type="button" className="back-link" onClick={() => setStep('credentials')}><ArrowLeft/> Nazad</button>
            <div className="otp-icon"><Smartphone/></div>
            <p className="eyebrow">SIGURNOSNA PROVJERA</p>
            <h2>Unesite kod za potvrdu</h2>
            <p className="auth-sub">Poslali smo šestocifreni kod u vašu aplikaciju za autentifikaciju povezanu s ovim nalogom.</p>
            <form onSubmit={verifyOtp}>
              <OtpInputs value={otp} setValue={setOtp} error={otpError}/>
              {otpError && <p className="otp-error"><AlertTriangle/> Pogrešan kod. Pokušajte ponovo.</p>}
              <p className="otp-hint">Demo kod: <strong>123456</strong></p>
              <label className="checkbox full"><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}/> Zapamti ovaj uređaj na 30 dana</label>
              <button type="submit" className="primary auth-submit" disabled={otp.join('').length < 6}>Potvrdi kod <ArrowRight/></button>
            </form>
            <div className="otp-actions">
              <button type="button" className="link-btn" disabled={resendIn > 0} onClick={() => setResendIn(30)}>{resendIn > 0 ? `Pošalji ponovo za ${resendIn}s` : 'Pošalji kod ponovo'}</button>
              <button type="button" className="link-btn" onClick={() => setStep('recovery')}>Koristi rezervni kod</button>
            </div>
          </div>}

          {step === 'recovery' && <div className="otp-screen">
            <button type="button" className="back-link" onClick={() => setStep('otp')}><ArrowLeft/> Nazad na kod</button>
            <div className="otp-icon"><KeyRound/></div>
            <p className="eyebrow">REZERVNI PRISTUP</p>
            <h2>Unesite rezervni kod</h2>
            <p className="auth-sub">Koristite jedan od deset rezervnih kodova generisanih prilikom uključivanja dvofaktorske autentifikacije.</p>
            <form onSubmit={verifyRecovery}>
              <label>Rezervni kod
                <div className="input-icon"><KeyRound/><input value={recoveryCode} onChange={e => { setRecoveryCode(e.target.value); setRecoveryError(false); }} placeholder="XXXX-XXXX" required/></div>
              </label>
              {recoveryError && <p className="otp-error"><AlertTriangle/> Kod nije ispravan ili je već iskorišten.</p>}
              <button type="submit" className="primary auth-submit">Potvrdi i prijavi se <ArrowRight/></button>
            </form>
          </div>}
        </div>
      </div>
    </div>
  );
}

export function ForgotPassword({ goLogin }) {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('marko@telopak.ba');
  const [otp, setOtp] = useState(Array(6).fill(''));
  const [otpError, setOtpError] = useState(false);
  const [resendIn, setResendIn] = useState(45);
  const [pw, setPw] = useState(''); const [pw2, setPw2] = useState(''); const [show, setShow] = useState(false);
  const [pwError, setPwError] = useState('');

  useEffect(() => {
    if (step !== 'sent' || resendIn <= 0) return;
    const t = setTimeout(() => setResendIn(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [step, resendIn]);

  const sendEmail = e => { e.preventDefault(); setStep('sent'); setResendIn(45); };
  const verifyOtp = e => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) return;
    if (code === '123456') setStep('reset');
    else { setOtpError(true); setTimeout(() => { setOtpError(false); setOtp(Array(6).fill('')); }, 700); }
  };
  const submitReset = e => {
    e.preventDefault();
    if (pw.length < 8) { setPwError('Lozinka mora imati najmanje 8 karaktera.'); return; }
    if (pw !== pw2) { setPwError('Lozinke se ne podudaraju.'); return; }
    setPwError(''); setStep('success');
  };

  return (
    <div className="auth-page">
      <BrandPanel quote="Siguran pristup vašem poslovanju, u svakom trenutku." />
      <div className="auth-form-wrap">
        <div className="auth-form">
          <div className="auth-mobile-logo"><img src={import.meta.env.BASE_URL + 'telopak-flux-logo.svg'} alt="TeloPak Flux"/></div>

          {step === 'email' && <>
            <button type="button" className="back-link" onClick={goLogin}><ArrowLeft/> Nazad na prijavu</button>
            <div className="otp-icon"><KeyRound/></div>
            <p className="eyebrow">RESETUJTE PRISTUP</p>
            <h2>Zaboravili ste lozinku?</h2>
            <p className="auth-sub">Unesite email adresu naloga i poslat ćemo vam sigurnosni kod za resetovanje lozinke.</p>
            <form onSubmit={sendEmail}>
              <label>Email adresa<div className="input-icon"><Mail/><input type="email" value={email} onChange={e => setEmail(e.target.value)} required/></div></label>
              <button type="submit" className="primary auth-submit">Pošalji sigurnosni kod <ArrowRight/></button>
            </form>
          </>}

          {step === 'sent' && <div className="otp-screen center-block">
            <div className="otp-icon success"><Mail/></div>
            <p className="eyebrow">PROVJERITE EMAIL</p>
            <h2>Poslali smo vam kod</h2>
            <p className="auth-sub">Kod za resetovanje lozinke poslan je na <strong>{email}</strong>. Provjerite i neželjenu poštu (spam).</p>
            <button className="primary auth-submit" onClick={() => setStep('otp')}>Imam kod, nastavi <ArrowRight/></button>
            <div className="otp-actions center"><button type="button" className="link-btn" disabled={resendIn > 0} onClick={() => setResendIn(45)}>{resendIn > 0 ? `Pošalji ponovo za ${resendIn}s` : 'Pošalji kod ponovo'}</button></div>
            <button type="button" className="back-link center" onClick={goLogin}><ArrowLeft/> Nazad na prijavu</button>
          </div>}

          {step === 'otp' && <div className="otp-screen">
            <button type="button" className="back-link" onClick={() => setStep('sent')}><ArrowLeft/> Nazad</button>
            <p className="eyebrow">POTVRDA KODA</p>
            <h2>Unesite sigurnosni kod</h2>
            <p className="auth-sub">Unesite šestocifreni kod poslan na {email}.</p>
            <form onSubmit={verifyOtp}>
              <OtpInputs value={otp} setValue={setOtp} error={otpError}/>
              {otpError && <p className="otp-error"><AlertTriangle/> Kod nije ispravan ili je istekao.</p>}
              <p className="otp-hint">Demo kod: <strong>123456</strong></p>
              <button type="submit" className="primary auth-submit" disabled={otp.join('').length < 6}>Potvrdi kod <ArrowRight/></button>
            </form>
          </div>}

          {step === 'reset' && <div className="otp-screen">
            <p className="eyebrow">NOVA LOZINKA</p>
            <h2>Postavite novu lozinku</h2>
            <p className="auth-sub">Odaberite jaku lozinku koju niste ranije koristili.</p>
            <form onSubmit={submitReset}>
              <label>Nova lozinka
                <div className="input-icon"><Lock/><input type={show ? 'text' : 'password'} value={pw} onChange={e => { setPw(e.target.value); setPwError(''); }} placeholder="Minimum 8 karaktera" required minLength={8}/>
                  <button type="button" className="eye-btn" onClick={() => setShow(s => !s)}>{show ? <EyeOff/> : <Eye/>}</button>
                </div>
              </label>
              <PasswordStrength value={pw}/>
              <label>Ponovite lozinku
                <div className="input-icon"><Lock/><input type={show ? 'text' : 'password'} value={pw2} onChange={e => { setPw2(e.target.value); setPwError(''); }} placeholder="Ponovite lozinku" required minLength={8}/></div>
              </label>
              {pwError && <p className="otp-error"><AlertTriangle/> {pwError}</p>}
              <button type="submit" className="primary auth-submit">Sačuvaj novu lozinku <ArrowRight/></button>
            </form>
          </div>}

          {step === 'success' && <div className="otp-screen center-block">
            <div className="otp-icon success"><CheckCircle2/></div>
            <p className="eyebrow">GOTOVO</p>
            <h2>Lozinka je promijenjena</h2>
            <p className="auth-sub">Sada se možete prijaviti novom lozinkom na svoj TeloPak nalog.</p>
            <button className="primary auth-submit" onClick={goLogin}>Nazad na prijavu <ArrowRight/></button>
          </div>}
        </div>
      </div>
    </div>
  );
}

export function Register({ onRegister, goLogin }) {
  const [step, setStep] = useState(1);
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(Array(6).fill(''));
  const [codeError, setCodeError] = useState(false);
  const [resendIn, setResendIn] = useState(30);

  useEffect(() => {
    if (step !== 'verify' || resendIn <= 0) return;
    const t = setTimeout(() => setResendIn(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [step, resendIn]);

  const verifyEmail = e => {
    e.preventDefault();
    const c = code.join('');
    if (c.length < 6) return;
    if (c === '123456') setStep('welcome');
    else { setCodeError(true); setTimeout(() => { setCodeError(false); setCode(Array(6).fill('')); }, 700); }
  };

  const activeSteps = step === 1 ? 1 : step === 2 ? 2 : 3;

  return (
    <div className="auth-page">
      <BrandPanel quote="Za sedmicu dana smo organizovali cijeli tim na terenu." />
      <div className="auth-form-wrap">
        <div className="auth-form">
          <div className="auth-mobile-logo"><img src={import.meta.env.BASE_URL + 'telopak-flux-logo.svg'} alt="TeloPak Flux"/></div>

          {(step === 1 || step === 2) && <>
            <p className="eyebrow">POČNIMO ZAJEDNO</p>
            <h2>Registrujte firmu</h2>
            <p className="auth-sub">14 dana besplatno, bez kartice. Otkažite kad god želite.</p>
          </>}

          <div className="steps">
            <div className={`step ${activeSteps>=1?'active':''}`}><span>1</span>Firma</div>
            <div className="step-line"></div>
            <div className={`step ${activeSteps>=2?'active':''}`}><span>2</span>Nalog</div>
            <div className="step-line"></div>
            <div className={`step ${activeSteps>=3?'active':''}`}><span>3</span>Email</div>
          </div>

          {(step === 1 || step === 2) && <form onSubmit={e=>{e.preventDefault(); if(step===1) setStep(2); else { setStep('verify'); setResendIn(30); } }}>
            {step===1 ? (
              <>
                <label>Naziv firme
                  <div className="input-icon"><Building2/><input placeholder="npr. Kovač Instalacije d.o.o." required/></div>
                </label>
                <label>Djelatnost
                  <select defaultValue="">
                    <option value="" disabled>Odaberite djelatnost</option>
                    <option>Vodoinstalateri</option>
                    <option>Električari</option>
                    <option>Grijanje i klimatizacija</option>
                    <option>Bravari</option>
                    <option>Staklari</option>
                    <option>Servisne firme</option>
                  </select>
                </label>
                <label>Broj radnika na terenu
                  <div className="input-icon"><Users/><input type="number" placeholder="npr. 5" min="1" required/></div>
                </label>
                <button type="submit" className="primary auth-submit">Nastavi <ArrowRight/></button>
              </>
            ) : (
              <>
                <label>Vaše ime i prezime
                  <div className="input-icon"><User/><input placeholder="Marko Kovač" required/></div>
                </label>
                <label>Email adresa
                  <div className="input-icon"><Mail/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="marko@firma.ba" required/></div>
                </label>
                <label>Lozinka
                  <div className="input-icon">
                    <Lock/><input type={show?'text':'password'} placeholder="Minimum 8 karaktera" required/>
                    <button type="button" className="eye-btn" onClick={()=>setShow(s=>!s)}>{show?<EyeOff/>:<Eye/>}</button>
                  </div>
                </label>
                <label className="checkbox full"><input type="checkbox" required/> Slažem se sa <a href="#">Uslovima korištenja</a> i <a href="#">Politikom privatnosti</a></label>
                <div className="auth-row-btns">
                  <button type="button" className="secondary" onClick={()=>setStep(1)}>Nazad</button>
                  <button type="submit" className="primary auth-submit">Kreiraj nalog <ArrowRight/></button>
                </div>
              </>
            )}
          </form>}

          {step === 'verify' && <div className="otp-screen">
            <button type="button" className="back-link" onClick={()=>setStep(2)}><ArrowLeft/> Nazad</button>
            <div className="otp-icon"><Mail/></div>
            <p className="eyebrow">POTVRDITE EMAIL</p>
            <h2>Provjerite svoj email</h2>
            <p className="auth-sub">Poslali smo šestocifreni kod za potvrdu na <strong>{email || 'vašu email adresu'}</strong>.</p>
            <form onSubmit={verifyEmail}>
              <OtpInputs value={code} setValue={setCode} error={codeError}/>
              {codeError && <p className="otp-error"><AlertTriangle/> Kod nije ispravan. Pokušajte ponovo.</p>}
              <p className="otp-hint">Demo kod: <strong>123456</strong></p>
              <button type="submit" className="primary auth-submit" disabled={code.join('').length<6}>Potvrdi email <ArrowRight/></button>
            </form>
            <div className="otp-actions center"><button type="button" className="link-btn" disabled={resendIn>0} onClick={()=>setResendIn(30)}>{resendIn>0?`Pošalji ponovo za ${resendIn}s`:'Pošalji kod ponovo'}</button></div>
          </div>}

          {step === 'welcome' && <div className="otp-screen center-block">
            <div className="otp-icon success"><CheckCircle2/></div>
            <p className="eyebrow">DOBRODOŠLI U TELOPAK</p>
            <h2>Email je potvrđen!</h2>
            <p className="auth-sub">Vaša firma je uspješno registrovana. Spremni ste da počnete organizovati poslovanje.</p>
            <button className="primary auth-submit" onClick={onRegister}>Uđi u aplikaciju <ArrowRight/></button>
          </div>}

          {(step === 1 || step === 2) && <p className="auth-switch">Već imate nalog? <button onClick={goLogin}>Prijavite se</button></p>}
        </div>
      </div>
    </div>
  );
}

export function AcceptInvite({ invite, goLogin }) {
  const [step, setStep] = useState('form');
  const [expired, setExpired] = useState(false);
  const [name, setName] = useState(invite?.name || '');
  const [pw, setPw] = useState(''); const [pw2, setPw2] = useState(''); const [show, setShow] = useState(false);
  const [error, setError] = useState('');

  const submit = e => {
    e.preventDefault();
    if (pw.length < 8) { setError('Lozinka mora imati najmanje 8 karaktera.'); return; }
    if (pw !== pw2) { setError('Lozinke se ne podudaraju.'); return; }
    setError(''); setStep('success');
  };

  return (
    <div className="auth-page">
      <BrandPanel quote="Pridružite se timu i budite organizovani od prvog dana." />
      <div className="auth-form-wrap">
        <div className="auth-form">
          <div className="auth-mobile-logo"><img src={import.meta.env.BASE_URL + 'telopak-flux-logo.svg'} alt="TeloPak Flux"/></div>

          {expired ? (
            <div className="otp-screen center-block">
              <div className="otp-icon expired"><AlertTriangle/></div>
              <p className="eyebrow">POZIVNICA JE ISTEKLA</p>
              <h2>Ovaj link više ne važi</h2>
              <p className="auth-sub">Pozivnice važe 48 sati od slanja. Zatražite od administratora da pošalje novi link.</p>
              <button className="primary auth-submit" onClick={goLogin}>Nazad na prijavu <ArrowRight/></button>
            </div>
          ) : step === 'form' ? (
            <>
              <p className="eyebrow">POZVANI STE U TELOPAK</p>
              <h2>Dovršite postavljanje naloga</h2>
              <p className="auth-sub">{invite?.email ? <>Nalog se kreira za <strong>{invite.email}</strong>.</> : 'Postavite ime i lozinku da dovršite kreiranje naloga.'}</p>
              <form onSubmit={submit}>
                <label>Email adresa<div className="input-icon"><Mail/><input value={invite?.email || ''} disabled/></div></label>
                <label>Ime i prezime<div className="input-icon"><User/><input value={name} onChange={e=>setName(e.target.value)} required/></div></label>
                <label>Lozinka
                  <div className="input-icon">
                    <Lock/><input type={show?'text':'password'} value={pw} onChange={e=>{setPw(e.target.value);setError('');}} placeholder="Minimum 8 karaktera" required minLength={8}/>
                    <button type="button" className="eye-btn" onClick={()=>setShow(s=>!s)}>{show?<EyeOff/>:<Eye/>}</button>
                  </div>
                </label>
                <PasswordStrength value={pw}/>
                <label>Ponovite lozinku<div className="input-icon"><Lock/><input type={show?'text':'password'} value={pw2} onChange={e=>{setPw2(e.target.value);setError('');}} required minLength={8}/></div></label>
                {error && <p className="otp-error"><AlertTriangle/> {error}</p>}
                <label className="checkbox full"><input type="checkbox" required/> Slažem se sa <a href="#">Uslovima korištenja</a> i <a href="#">Politikom privatnosti</a></label>
                <button type="submit" className="primary auth-submit">Aktiviraj nalog <ArrowRight/></button>
              </form>
              <p className="auth-switch">Pozivnica istekla? <button onClick={()=>setExpired(true)}>Prikaži demo stanje</button></p>
            </>
          ) : (
            <div className="otp-screen center-block">
              <div className="otp-icon success"><CheckCircle2/></div>
              <p className="eyebrow">DOBRODOŠLI</p>
              <h2>Nalog je aktiviran</h2>
              <p className="auth-sub">Vaš nalog je uspješno kreiran. Sada se možete prijaviti svojim podacima.</p>
              <button className="primary auth-submit" onClick={goLogin}>Idi na prijavu <ArrowRight/></button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
