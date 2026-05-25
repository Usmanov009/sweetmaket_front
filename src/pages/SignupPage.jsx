import { useState } from 'react';
import { Phone, User, ShieldCheck } from 'lucide-react';
import api from '../api';
import { formatPhone, rawDigits, isValidPhone } from '../utils/format';
import { useLocale } from '../locale.jsx';

export default function SignupPage({ onLogin, goLogin, C, isDesktop }) {
  const { t } = useLocale();
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [phone,     setPhone]     = useState('+998');
  const [password,  setPassword]  = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  const iStyle = {
    width:'100%', background:C.s2, border:`1.5px solid ${C.border}`,
    borderRadius:14, padding:'13px 16px 13px 46px', color:C.dark, fontSize:15, transition:'all .2s',
  };

  const handleRegister = async () => {
    if (!firstName.trim()) { setError(t('firstName') + ' ' + t('required')); return; }
    if (!lastName.trim())  { setError(t('lastName') + ' ' + t('required')); return; }
    if (!isValidPhone(phone)) { setError(t('correctPhone')); return; }
    if (!password.trim())   { setError(t('password') + ' ' + t('required')); return; }
    setError(''); setLoading(true);
    try {
      const { token, user } = await api.post('/api/auth/register', {
        phone,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        password: password.trim(),
      });
      localStorage.setItem('sm_token', token);
      onLogin(user);
    } catch(e) {
      setError(e.message || t('registrationFailed'));
    } finally { setLoading(false); }
  };

  const formContent = (
    <div style={{
      flex:1, background:C.s1, borderRadius: isDesktop?20:'28px 28px 0 0',
      padding: isDesktop?'40px':'30px 24px 48px',
      color:C.dark, maxWidth: isDesktop?440:'none', width:'100%',
      boxShadow: isDesktop?'0 24px 64px rgba(0,0,0,.1)':'none',
    }}>
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
              onKeyDown={e=>{if(['Backspace','Delete'].includes(e.key)&&rawDigits(phone).length<=3)e.preventDefault(); if (e.key==='Enter') handleRegister();}}
              placeholder="+998 90 123 45 67" style={{...iStyle,fontSize:15}}/>
          </div>
        </div>

        <div style={{ marginBottom:18 }}>
          <label style={{ fontSize:12, fontWeight:600, color:C.navy, display:'block', marginBottom:6 }}>{t('password')}</label>
          <div style={{ position:'relative' }}>
            <span style={{ position:'absolute', left:15, top:'50%', transform:'translateY(-50%)', color:C.muted }}><ShieldCheck size={17}/></span>
            <input className="input-focus" type="password" value={password}
              onChange={e=>setPassword(e.target.value)}
              onKeyDown={e=>{ if (e.key==='Enter') handleRegister(); }}
              placeholder="********" style={{...iStyle,fontSize:15}}/>
          </div>
        </div>

        {error && <div style={{ color:'#ef4444', fontSize:12, marginBottom:14, background:'rgba(239,68,68,.07)', padding:'10px 14px', borderRadius:12 }}>{error}</div>}

        <button className="btn-hover" onClick={handleRegister} disabled={loading} style={{
          width:'100%', padding:14, borderRadius:14, border:'none', cursor:loading?'default':'pointer',
          fontWeight:700, fontSize:15, color:'#fff',
          background:loading?C.mid:`linear-gradient(135deg,${C.navy},${C.mid})`,
          boxShadow:`0 4px 16px ${C.navy}40`, transition:'all .25s',
        }}>
          {loading ? t('sending') : t('register')}
        </button>

        <div style={{ textAlign:'center', marginTop:22, fontSize:14, color:C.muted }}>
          {t('accountExists')}{' '}
          <span onClick={goLogin} style={{ color:C.navy, fontWeight:700, cursor:'pointer' }}>{t('login')}</span>
        </div>
      </>
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