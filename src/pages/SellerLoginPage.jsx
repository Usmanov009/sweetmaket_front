import { useState } from 'react';
import { Phone, Lock, Storefront, User } from '@phosphor-icons/react';
import api from '../api';
import { formatPhone, rawDigits, isValidPhone } from '../utils/format';

export default function SellerLoginPage({ onLogin, goUserLogin, C, isDesktop }) {
  const [mode,      setMode]      = useState('login'); // 'login' | 'register'
  const [name,      setName]      = useState('');
  const [shopName,  setShopName]  = useState('');
  const [phone,     setPhone]     = useState('+998');
  const [password,  setPassword]  = useState('');
  const [password2, setPassword2] = useState('');
  const [address,   setAddress]   = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  const iStyle = {
    width:'100%', background:C.s2, border:`1.5px solid ${C.border}`,
    borderRadius:14, padding:'13px 16px 13px 46px',
    color:C.dark, fontSize:15, outline:'none',
  };

  const handleLogin = async () => {
    if (!isValidPhone(phone)) { setError("To'g'ri telefon raqam kiriting"); return; }
    if (!password) { setError('Parol kiriting'); return; }
    setError(''); setLoading(true);
    try {
      const { token, seller } = await api.post('/api/seller/login', { phone, password });
      localStorage.setItem('sm_seller_token', token);
      onLogin(seller);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleRegister = async () => {
    if (!name.trim())      { setError('Ism kiriting'); return; }
    if (!shopName.trim())  { setError("Do'kon nomi kiriting"); return; }
    if (!isValidPhone(phone)) { setError("To'g'ri telefon raqam kiriting"); return; }
    if (password.length < 6) { setError("Parol kamida 6 ta belgi bo'lishi kerak"); return; }
    if (password !== password2) { setError('Parollar mos kelmadi'); return; }
    setError(''); setLoading(true);
    try {
      const { token, seller } = await api.post('/api/seller/register', {
        name: name.trim(), shopName: shopName.trim(), phone, password, address: address.trim(),
      });
      localStorage.setItem('sm_seller_token', token);
      onLogin(seller);
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
      {/* Tab switcher */}
      <div style={{ display:'flex', gap:0, background:C.s2, borderRadius:14, padding:4, marginBottom:24 }}>
        {[['login','Kirish'],['register',"Ro'yxatdan o'tish"]].map(([m, label]) => (
          <button key={m} onClick={()=>{ setMode(m); setError(''); }}
            style={{ flex:1, padding:'10px 8px', borderRadius:12, border:'none', cursor:'pointer', fontSize:13, fontWeight:mode===m?700:500,
              background: mode===m ? `linear-gradient(135deg,${C.navy},${C.mid})` : 'transparent',
              color: mode===m ? '#fff' : C.muted, transition:'all .2s' }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:isDesktop?26:20, fontWeight:900, marginBottom:4, color:C.dark }}>
        {mode==='login' ? '🏪 Sotuvchi kabineti' : "🏪 Ro'yxatdan o'tish"}
      </div>
      <div style={{ fontSize:13, color:C.muted, marginBottom:22 }}>
        {mode==='login' ? "Do'koningizni boshqaring" : "Yangi sotuvchi hisobi yarating"}
      </div>

      {mode==='register' && (
        <>
          {[
            { label:'Ism Familiya', icon:<User size={17}/>, value:name, set:setName, placeholder:'Aziz Karimov' },
            { label:"Do'kon nomi",  icon:<Storefront size={17}/>, value:shopName, set:setShopName, placeholder:'Aziz Shirinliklari' },
            { label:'Manzil (ixtiyoriy)', icon:<Storefront size={17}/>, value:address, set:setAddress, placeholder:'Toshkent, Chilonzor' },
          ].map(({ label, icon, value, set, placeholder }) => (
            <div key={label} style={{ marginBottom:12 }}>
              <label style={{ fontSize:12, fontWeight:600, color:C.navy, display:'block', marginBottom:6 }}>{label}</label>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', left:15, top:'50%', transform:'translateY(-50%)', color:C.muted }}>{icon}</span>
                <input type="text" value={value} onChange={e=>set(e.target.value)} placeholder={placeholder} style={iStyle}/>
              </div>
            </div>
          ))}
        </>
      )}

      <div style={{ marginBottom:12 }}>
        <label style={{ fontSize:12, fontWeight:600, color:C.navy, display:'block', marginBottom:6 }}>Telefon raqam</label>
        <div style={{ position:'relative' }}>
          <span style={{ position:'absolute', left:15, top:'50%', transform:'translateY(-50%)', color:C.muted }}><Phone size={17}/></span>
          <input type="tel" value={phone}
            onChange={e=>setPhone(formatPhone(e.target.value))}
            onKeyDown={e=>{ if(['Backspace','Delete'].includes(e.key)&&rawDigits(phone).length<=3) e.preventDefault(); }}
            placeholder="+998 90 123 45 67" style={iStyle}/>
        </div>
      </div>

      <div style={{ marginBottom:12 }}>
        <label style={{ fontSize:12, fontWeight:600, color:C.navy, display:'block', marginBottom:6 }}>Parol</label>
        <div style={{ position:'relative' }}>
          <span style={{ position:'absolute', left:15, top:'50%', transform:'translateY(-50%)', color:C.muted }}><Lock size={17}/></span>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
            placeholder={mode==='register' ? 'Kamida 6 ta belgi' : 'Parolingiz'} style={iStyle}/>
        </div>
      </div>

      {mode==='register' && (
        <div style={{ marginBottom:16 }}>
          <label style={{ fontSize:12, fontWeight:600, color:C.navy, display:'block', marginBottom:6 }}>Parolni tasdiqlang</label>
          <div style={{ position:'relative' }}>
            <span style={{ position:'absolute', left:15, top:'50%', transform:'translateY(-50%)', color:C.muted }}><Lock size={17}/></span>
            <input type="password" value={password2} onChange={e=>setPassword2(e.target.value)}
              placeholder="Parolni qayta kiriting" style={iStyle}/>
          </div>
        </div>
      )}

      {error && (
        <div style={{ color:'#ef4444', fontSize:12, marginBottom:14, background:'rgba(239,68,68,.07)', padding:'10px 14px', borderRadius:12 }}>
          {error}
        </div>
      )}

      <button onClick={mode==='login' ? handleLogin : handleRegister} disabled={loading}
        style={{ width:'100%', padding:14, borderRadius:14, border:'none', cursor:loading?'default':'pointer',
          fontWeight:700, fontSize:15, color:'#fff', marginBottom:16,
          background: loading ? C.mid : `linear-gradient(135deg,${C.navy},${C.mid})`,
          boxShadow:`0 4px 16px ${C.navy}40`, transition:'all .25s' }}>
        {loading ? 'Yuklanmoqda...' : mode==='login' ? '🔑 Kirish' : "✅ Ro'yxatdan o'tish"}
      </button>

      <div style={{ textAlign:'center', fontSize:13, color:C.muted }}>
        Xaridor sifatida kirish?{' '}
        <span onClick={goUserLogin} style={{ color:C.navy, fontWeight:700, cursor:'pointer' }}>Bu yerga bosing</span>
      </div>
    </div>
  );

  if (isDesktop) return (
    <div className="fade-in-up" style={{ minHeight:'100vh', display:'flex', alignItems:'stretch' }}>
      <div style={{
        flex:1, background:`linear-gradient(145deg,#064e3b 0%,#059669 60%,#34d399 100%)`,
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:60,
        position:'relative', overflow:'hidden',
      }}>
        <div style={{ position:'absolute', fontSize:200, opacity:.05, top:'50%', left:'50%', transform:'translate(-50%,-50%)' }}>🏪</div>
        <div style={{ position:'relative', textAlign:'center' }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:48, fontWeight:900, color:'#fff', marginBottom:16, lineHeight:1.1 }}>
            Sotuvchi<span style={{ color:'rgba(255,255,255,.6)' }}> Kabineti</span>
          </div>
          <div style={{ color:'rgba(255,255,255,.75)', fontSize:15, maxWidth:300, lineHeight:1.7 }}>
            Buyurtmalarni kuzating, do'koningizni boshqaring
          </div>
          <div style={{ display:'flex', gap:12, justifyContent:'center', marginTop:32 }}>
            {["📦 Buyurtmalar","💰 Daromad","⭐ Reytinglar"].map(t=>(
              <div key={t} style={{ background:'rgba(255,255,255,.12)', backdropFilter:'blur(8px)', borderRadius:50, padding:'8px 18px', fontSize:13, color:'#fff', fontWeight:500 }}>{t}</div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ width:520, display:'flex', alignItems:'center', justifyContent:'center', padding:40, background:C.bg }}>
        {formContent}
      </div>
    </div>
  );

  return (
    <div className="fade-in-up" style={{ minHeight:'100vh', display:'flex', flexDirection:'column', background:'linear-gradient(180deg,#064e3b 0%,#059669 50%,#d1fae5 100%)' }}>
      <div style={{ padding:'72px 24px 32px', textAlign:'center' }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:32, fontWeight:900, color:'#fff', marginBottom:6 }}>
          Sotuvchi <span style={{ opacity:.7 }}>Kabineti</span>
        </div>
        <div style={{ color:'rgba(255,255,255,.65)', fontSize:13 }}>SweetMarket biznes platformasi</div>
      </div>
      {formContent}
    </div>
  );
}