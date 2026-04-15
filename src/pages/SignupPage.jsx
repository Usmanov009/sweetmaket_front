import { useState, useRef, useEffect } from 'react';
import { Phone, User, Lock } from '@phosphor-icons/react';
import api from '../api';
import OtpInput from '../components/OtpInput';
import { formatPhone, rawDigits, isValidPhone } from '../utils/format';
import { useLocale } from '../locale.js';

export default function SignupPage({ onLogin, goLogin, C, isDesktop }) {
  const { t } = useLocale();
  const [step,      setStep]      = useState(1);
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [phone,     setPhone]     = useState('+998');
  const [otp,       setOtp]       = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [timer,     setTimer]     = useState(0);
  const [devOtp,    setDevOtp]    = useState('');
  const timerRef = useRef(null);

  const startTimer = () => {
    setTimer(59);
    timerRef.current = setInterval(() => setTimer(p => { if(p<=1){clearInterval(timerRef.current);return 0;} return p-1; }), 1000);
  };
  useEffect(() => () => clearInterval(timerRef.current), []);

  const iStyle = {
    width:'100%', background:C.s2, border:`1.5px solid ${C.border}`,
    borderRadius:14, padding:'13px 16px 13px 46px', color:C.dark, fontSize:15, transition:'all .2s',
  };

  const handleStep1 = async () => {
    if (!firstName.trim()) { setError(t('firstName') + ' ' + t('required')); return; }
    if (!lastName.trim())  { setError(t('lastName') + ' ' + t('required')); return; }
    if (!isValidPhone(phone)) { setError(t('correctPhone')); return; }
    setError(''); setLoading(true);
    try {
      const data = await api.post('/api/auth/request-otp', { phone });
      setDevOtp(data.devOtp || '');
      setStep(2); startTimer();
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleRegister = async () => {
    if (otp.length < 6) { setError(t('enterCode')); return; }
    setError(''); setLoading(true);
    try {
      const { token, user } = await api.post('/api/auth/verify', { phone, otp, firstName: firstName.trim(), lastName: lastName.trim() });
      localStorage.setItem('sm_token', token);
      onLogin(user);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const formContent = (
    <div style={{
      flex:1, background:C.s1, borderRadius: isDesktop?20:'28px 28px 0 0',
      padding: isDesktop?'40px':'30px 24px 48px',
      color:C.dark, maxWidth: isDesktop?440:'none', width:'100%',
      boxShadow: isDesktop?'0 24px 64px rgba(0,0,0,.1)':'none',
    }}>
      {step===1 ? (
        <>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:isDesktop?26:22, fontWeight:900, marginBottom:4, color:C.dark }}>
            {t('createAccount')}
          </div>
          <div style={{ fontSize:13, color:C.muted, marginBottom:22 }}>{t('registrationText')}</div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
            {[{ label:t('firstName'), placeholder:'Aziz', value:firstName, set:setFirstName }, { label:t('lastName'), placeholder:'Karimov', value:lastName, set:setLastName }].map(({ label, placeholder, value, set })=> (
              <div key={label}>
                <label style={{ fontSize:12, fontWeight:600, color:C.navy, display:'block', marginBottom:6 }}>{label}</label>
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:C.muted }}><User size={16}/></span>
                  <input className="input-focus" type="text" value={value} onChange={e=>set(e.target.value)} placeholder={placeholder}
                    style={{...iStyle,padding:'13px 12px 13px 40px'}}/>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginBottom:18 }}>
            <label style={{ fontSize:12, fontWeight:600, color:C.navy, display:'block', marginBottom:6 }}>{t('phoneNumber')}</label>
            <div style={{ position:'relative' }}>
              <span style={{ position:'absolute', left:15, top:'50%', transform:'translateY(-50%)', color:C.muted }}><Phone size={17}/></span>
              <input className="input-focus" type="tel" value={phone}
                onChange={e=>setPhone(formatPhone(e.target.value))}
                onKeyDown={e=>{if(['Backspace','Delete'].includes(e.key)&&rawDigits(phone).length<=3)e.preventDefault();}}
                placeholder="+998 90 123 45 67" style={{...iStyle,fontSize:15}}/>
            </div>
          </div>

          {error && <div style={{ color:'#ef4444', fontSize:12, marginBottom:14, background:'rgba(239,68,68,.07)', padding:'10px 14px', borderRadius:12 }}>{error}</div>}

          <button className="btn-hover" onClick={handleStep1} disabled={loading} style={{
            width:'100%', padding:14, borderRadius:14, border:'none', cursor:loading?'default':'pointer',
            fontWeight:700, fontSize:15, color:'#fff',
            background:loading?C.mid:`linear-gradient(135deg,${C.navy},${C.mid})`,
            boxShadow:`0 4px 16px ${C.navy}40`, transition:'all .25s',
          }}>
            {loading ? t('sending') : t('sendSms')}
          </button>

          <div style={{ textAlign:'center', marginTop:22, fontSize:14, color:C.muted }}>
            {t('accountExists')}{' '}
            <span onClick={goLogin} style={{ color:C.navy, fontWeight:700, cursor:'pointer' }}>{t('login')}</span>
          </div>
        </>
      ) : (
        <>
          <button onClick={()=>{setStep(1);setOtp('');setError('');}}
            style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', color:C.muted, fontSize:13, fontWeight:600, marginBottom:20, padding:0 }}>
            ← {t('back')}
          </button>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:900, marginBottom:4, color:C.dark }}>{t('smsCode')}</div>
          <div style={{ fontSize:13, color:C.muted, marginBottom:6 }}>
            <span style={{ color:C.navy, fontWeight:700 }}>{phone}</span> — {t('codeSent')}
          </div>

          <OtpInput value={otp} onChange={setOtp} C={C}/>

          {error && <div style={{ color:'#ef4444', fontSize:12, marginBottom:14, background:'rgba(239,68,68,.07)', padding:'10px 14px', borderRadius:12 }}>{error}</div>}

          <button className="btn-hover" onClick={handleRegister} disabled={loading||otp.length<6} style={{
            width:'100%', padding:14, borderRadius:14, border:'none',
            cursor:(loading||otp.length<6)?'default':'pointer', fontWeight:700, fontSize:15, color:'#fff',
            background:(loading||otp.length<6)?C.mid:`linear-gradient(135deg,${C.navy},${C.mid})`,
            boxShadow:`0 4px 16px ${C.navy}40`, transition:'all .25s', opacity:(loading||otp.length<6)?.6:1,
          }}>
            {loading ? t('sending') : t('register')}
          </button>

          {devOtp && (
            <div style={{ marginTop:16, background:C.pale, borderRadius:14, padding:'12px 16px', fontSize:13, color:C.navy, textAlign:'center', fontWeight:600, border:`1px solid ${C.border}` }}>
              <Lock size={14} style={{ marginRight:6, verticalAlign:'middle' }}/>
              {t('testCode')} <span style={{ letterSpacing:4, fontFamily:'monospace' }}>{devOtp}</span>
            </div>
          )}

          <div style={{ textAlign:'center', marginTop:16, fontSize:13, color:C.muted }}>
            {timer>0
              ? <span>{t('resendIn')} <span style={{ color:C.navy, fontWeight:700 }}>00:{String(timer).padStart(2,'0')}</span></span>
              : <span onClick={handleStep1} style={{ color:C.navy, fontWeight:700, cursor:'pointer' }}>{t('sendAgain')}</span>
            }
          </div>
        </>
      )}
    </div>
  );

  if (isDesktop) return (
    <div className="fade-in-up" style={{ minHeight:'100vh', display:'flex', alignItems:'stretch' }}>
      <div style={{
        flex:1, background:`linear-gradient(145deg,${C.navy} 0%,${C.mid} 70%,${C.light} 100%)`,
        display:'flex', alignItems:'center', justifyContent:'center', padding:60, position:'relative', overflow:'hidden',
      }}>
        <div style={{ position:'absolute', fontSize:220, opacity:.04, userSelect:'none', top:'50%', left:'50%', transform:'translate(-50%,-50%)', lineHeight:1 }}>🎂</div>
        <div style={{ position:'relative', textAlign:'center' }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:52, fontWeight:900, color:'#fff', marginBottom:16, lineHeight:1.1 }}>
            Sweet<span style={{ opacity:.7 }}>Market</span>
          </div>
          <div style={{ color:'rgba(255,255,255,.7)', fontSize:16, maxWidth:320, lineHeight:1.7 }}>
            {t('signupHeroText')}
          </div>
        </div>
      </div>
      <div style={{ width:500, display:'flex', alignItems:'center', justifyContent:'center', padding:40, background:C.bg }}>
        {formContent}
      </div>
    </div>
  );

  return (
    <div className="fade-in-up" style={{ minHeight:'100vh', display:'flex', flexDirection:'column', background:`linear-gradient(180deg,${C.navy} 0%,${C.mid} 50%,${C.pale} 100%)` }}>
      <div style={{ padding:'72px 24px 32px', textAlign:'center' }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:34, fontWeight:900, color:'#fff', marginBottom:6 }}>
          Sweet<span style={{ opacity:.7 }}>Market</span>
        </div>
        <div style={{ color:'rgba(255,255,255,.65)', fontSize:13 }}>{t('signupMobileSubtitle')}</div>
      </div>
      {formContent}
    </div>
  );
}
