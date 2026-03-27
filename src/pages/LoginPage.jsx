import { useState, useRef, useEffect } from 'react';
import { Phone, User, Lock } from 'lucide-react';
import api from '../api';
import OtpInput from '../components/OtpInput';
import { formatPhone, rawDigits, isValidPhone } from '../utils/format';

export default function LoginPage({ onLogin, goSignup, C, isDesktop }) {
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [phone,     setPhone]     = useState('+998');
  const [step,      setStep]      = useState('info');
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
    borderRadius:14, padding:'13px 16px 13px 46px',
    color:C.dark, fontSize:15, transition:'all .2s',
  };

  const handleSend = async () => {
    if (!firstName.trim()) { setError('Введите ваше имя'); return; }
    if (!lastName.trim())  { setError('Введите фамилию'); return; }
    if (!isValidPhone(phone)) { setError('Введите корректный номер (+998 XX XXX XX XX)'); return; }
    setError(''); setLoading(true);
    try {
      const data = await api.post('/api/auth/request-otp', { phone });
      setDevOtp(data.devOtp || '');
      setStep('otp'); startTimer();
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleVerify = async () => {
    if (otp.length < 6) { setError('Введите 6-значный код'); return; }
    setError(''); setLoading(true);
    try {
      const { token, user } = await api.post('/api/auth/verify', { phone, otp, firstName: firstName.trim(), lastName: lastName.trim() });
      localStorage.setItem('sm_token', token);
      onLogin(user);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleResend = async () => {
    setOtp(''); setError(''); setLoading(true);
    try {
      const data = await api.post('/api/auth/request-otp', { phone });
      setDevOtp(data.devOtp || ''); startTimer();
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const formContent = (
    <div style={{
      flex:1, background:C.s1, borderRadius: isDesktop?20:'28px 28px 0 0',
      padding: isDesktop?'40px':'30px 24px 48px',
      color:C.dark, maxWidth: isDesktop?440:'none', width:'100%',
      boxShadow: isDesktop ? '0 24px 64px rgba(0,0,0,.1)' : 'none',
    }}>
      {step==='info' ? (
        <>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:isDesktop?28:22, fontWeight:900, marginBottom:4, color:C.dark }}>
            Добро пожаловать 👋
          </div>
          <div style={{ fontSize:13, color:C.muted, marginBottom:24 }}>Войдите в аккаунт</div>

          {[
            { label:'Имя', icon:<User size={17}/>, value:firstName, set:setFirstName, placeholder:'Азиз' },
            { label:'Фамилия', icon:<User size={17}/>, value:lastName, set:setLastName, placeholder:'Каримов' },
          ].map(({ label, icon, value, set, placeholder }) => (
            <div key={label} style={{ marginBottom:14 }}>
              <label style={{ fontSize:12, fontWeight:600, color:C.navy, display:'block', marginBottom:6 }}>{label}</label>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', left:15, top:'50%', transform:'translateY(-50%)', color:C.muted }}>{icon}</span>
                <input className="input-focus" type="text" value={value} onChange={e=>set(e.target.value)} placeholder={placeholder} style={iStyle}/>
              </div>
            </div>
          ))}

          <div style={{ marginBottom:18 }}>
            <label style={{ fontSize:12, fontWeight:600, color:C.navy, display:'block', marginBottom:6 }}>Номер телефона</label>
            <div style={{ position:'relative' }}>
              <span style={{ position:'absolute', left:15, top:'50%', transform:'translateY(-50%)', color:C.muted }}><Phone size={17}/></span>
              <input className="input-focus" type="tel" value={phone}
                onChange={e=>setPhone(formatPhone(e.target.value))}
                onKeyDown={e=>{if(['Backspace','Delete'].includes(e.key)&&rawDigits(phone).length<=3)e.preventDefault();}}
                placeholder="+998 90 123 45 67" style={{...iStyle,fontSize:15}}/>
            </div>
          </div>

          {error && <div style={{ color:C.danger||'#ef4444', fontSize:12, marginBottom:14, background:'rgba(239,68,68,.07)', padding:'10px 14px', borderRadius:12 }}>{error}</div>}

          <button className="btn-hover" onClick={handleSend} disabled={loading} style={{
            width:'100%', padding:14, borderRadius:14, border:'none', cursor:loading?'default':'pointer',
            fontWeight:700, fontSize:15, color:'#fff',
            background: loading ? C.mid : `linear-gradient(135deg,${C.navy},${C.mid})`,
            boxShadow:`0 4px 16px ${C.navy}40`, transition:'all .25s',
          }}>
            {loading ? 'Отправка...' : '📲 Получить SMS код'}
          </button>

          <div style={{ textAlign:'center', marginTop:20, fontSize:14, color:C.muted }}>
            Нет аккаунта?{' '}
            <span onClick={goSignup} style={{ color:C.navy, fontWeight:700, cursor:'pointer' }}>Зарегистрироваться</span>
          </div>
        </>
      ) : (
        <>
          <button onClick={()=>{setStep('info');setOtp('');setError('');}}
            style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', color:C.muted, fontSize:13, fontWeight:600, marginBottom:20, padding:0 }}>
            ← Назад
          </button>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:900, marginBottom:4, color:C.dark }}>
            Введите SMS код
          </div>
          <div style={{ fontSize:13, color:C.muted, marginBottom:4 }}>
            Код отправлен на <span style={{ color:C.navy, fontWeight:700 }}>{phone}</span>
          </div>

          <OtpInput value={otp} onChange={setOtp} C={C}/>

          {error && <div style={{ color:C.danger||'#ef4444', fontSize:12, marginBottom:14, background:'rgba(239,68,68,.07)', padding:'10px 14px', borderRadius:12 }}>{error}</div>}

          <button className="btn-hover" onClick={handleVerify} disabled={loading||otp.length<6} style={{
            width:'100%', padding:14, borderRadius:14, border:'none',
            cursor:(loading||otp.length<6)?'default':'pointer',
            fontWeight:700, fontSize:15, color:'#fff',
            background:(loading||otp.length<6)?C.mid:`linear-gradient(135deg,${C.navy},${C.mid})`,
            boxShadow:`0 4px 16px ${C.navy}40`, transition:'all .25s', opacity:(loading||otp.length<6)?.6:1,
          }}>
            {loading ? 'Проверяем...' : '✓ Войти'}
          </button>

          {devOtp && (
            <div style={{ marginTop:16, background:C.pale, borderRadius:14, padding:'12px 16px', fontSize:13, color:C.navy, textAlign:'center', fontWeight:600, border:`1px solid ${C.border}` }}>
              <Lock size={14} style={{ marginRight:6, verticalAlign:'middle' }}/>
              Код для разработки: <span style={{ letterSpacing:4, fontFamily:'monospace' }}>{devOtp}</span>
            </div>
          )}

          <div style={{ textAlign:'center', marginTop:16, fontSize:13, color:C.muted }}>
            {timer > 0
              ? <span>Повторить через <span style={{ color:C.navy, fontWeight:700 }}>00:{String(timer).padStart(2,'0')}</span></span>
              : <span onClick={handleResend} style={{ color:C.navy, fontWeight:700, cursor:'pointer' }}>📲 Отправить снова</span>
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
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:60,
        position:'relative', overflow:'hidden',
      }}>
        <div style={{ position:'absolute', fontSize:220, opacity:.04, userSelect:'none', lineHeight:1, top:'50%', left:'50%', transform:'translate(-50%,-50%)' }}>🎂</div>
        <div style={{ position:'absolute', top:'10%', right:'10%', width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,.04)' }}/>
        <div style={{ position:'absolute', bottom:'5%', left:'5%', width:140, height:140, borderRadius:'50%', background:'rgba(255,255,255,.06)' }}/>
        <div style={{ position:'relative', textAlign:'center' }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:52, fontWeight:900, color:'#fff', marginBottom:16, lineHeight:1.1 }}>
            Sweet<span style={{ color:'rgba(255,255,255,.7)' }}>Market</span>
          </div>
          <div style={{ color:'rgba(255,255,255,.7)', fontSize:16, maxWidth:320, lineHeight:1.7 }}>
            Торты вашей мечты. Доставка по всему Узбекистану.
          </div>
          <div style={{ display:'flex', gap:12, justifyContent:'center', marginTop:32 }}>
            {['🎂 Oddiy tort','🎁 Bento tort','🧁 Кексы'].map(t=>(
              <div key={t} style={{ background:'rgba(255,255,255,.12)', backdropFilter:'blur(8px)', borderRadius:50, padding:'8px 18px', fontSize:13, color:'#fff', fontWeight:500 }}>{t}</div>
            ))}
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
        <div style={{ color:'rgba(255,255,255,.65)', fontSize:13 }}>Ваше приложение для сладкого</div>
      </div>
      {formContent}
    </div>
  );
}
