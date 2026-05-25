import { useState } from 'react';
import {
  Phone, Lock, Store, User, Eye, EyeOff,
  ArrowRight, Loader2, MapPin, Package, TrendingUp, Building2, ArrowLeft,
} from 'lucide-react';
import api from '../api';
import { formatPhone, rawDigits, isValidPhone } from '../utils/format';
import { REGIONS } from '../constants/regions.js';
import { useLocale } from '../locale.jsx';

export default function SellerLoginPage({ onLogin, goUserLogin, C, isDesktop }) {
  const { t, lang, setLang } = useLocale();
  const [mode,      setMode]      = useState('login');
  // register steps: 'region' → 'city' → 'form'
  const [regStep,   setRegStep]   = useState('region');
  const [selRegion, setSelRegion] = useState(null);
  const [selCity,   setSelCity]   = useState('');
  const [name,      setName]      = useState('');
  const [shopName,  setShopName]  = useState('');
  const [phone,     setPhone]     = useState('+998');
  const [password,  setPassword]  = useState('');
  const [password2, setPassword2] = useState('');
  const [address,   setAddress]   = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [showPass,  setShowPass]  = useState(false);
  const [showPass2, setShowPass2] = useState(false);

  const switchMode = (m) => {
    setMode(m); setError('');
    if (m === 'register') { setRegStep('region'); setSelRegion(null); setSelCity(''); }
  };

  const pickRegion = (r) => {
    setSelRegion(r);
    if (r.cities.length === 1) { setSelCity(r.cities[0]); setRegStep('form'); }
    else setRegStep('city');
  };

  const pickCity = (c) => { setSelCity(c); setRegStep('form'); };

  const handleLogin = async () => {
    if (!isValidPhone(phone)) { setError(t('correctPhone')); return; }
    if (!password) { setError(t('enterPassword')); return; }
    setError(''); setLoading(true);
    try {
      const { token, seller } = await api.post('/api/seller/login', { phone, password });
      localStorage.setItem('sm_seller_token', token);
      onLogin(seller);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleRegister = async () => {
    if (!name.trim())      { setError(t('enterName')); return; }
    if (!shopName.trim())  { setError(t('enterShopName')); return; }
    if (!isValidPhone(phone)) { setError(t('correctPhone')); return; }
    if (password.length < 6)  { setError(t('passwordMin')); return; }
    if (password !== password2) { setError(t('passwordsNoMatch')); return; }
    if (!address.trim()) { setError(t('enterStreet')); return; }
    setError(''); setLoading(true);
    const regionName = lang === 'ru' ? (selRegion?.nameRu || selRegion?.name || '') : (selRegion?.name || '');
    const fullAddress = `${regionName}, ${selCity}, ${address.trim()}`;
    try {
      const { token, seller } = await api.post('/api/seller/register', {
        name: name.trim(), shopName: shopName.trim(), phone, password,
        address: fullAddress, region: selRegion?.name || '', city: selCity,
      });
      localStorage.setItem('sm_seller_token', token);
      onLogin(seller);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const ACCENT = '#059669';
  const DARK_ACCENT = '#064e3b';

  const iStyle = {
    width: '100%',
    background: C.s2,
    border: `1.5px solid ${C.border}`,
    borderRadius: 12,
    padding: '14px 16px 14px 48px',
    color: C.dark,
    fontSize: 15,
    outline: 'none',
    transition: 'all .2s',
  };

  const iconPos = { position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: ACCENT, display: 'flex' };

  const passFieldStyle = { ...iStyle, paddingRight: 46 };
  const eyeBtnStyle = { position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 0, display: 'flex' };

  /* ── Region step (register only) ── */
  const regionStep = (
    <div>
      {/* Language toggle */}
      <div style={{ display:'flex', justifyContent:'flex-end', gap:6, marginBottom:12 }}>
        {['uz', 'ru'].map(l => (
          <button key={l} onClick={() => setLang(l)} style={{
            padding:'5px 12px', borderRadius:20, border:`1.5px solid ${l === lang ? ACCENT : C.border}`,
            cursor:'pointer', background: l === lang ? ACCENT : C.s2,
            color: l === lang ? '#fff' : C.muted,
            fontWeight:700, fontSize:12, transition:'all .15s',
          }}>{l.toUpperCase()}</button>
        ))}
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
        <div style={{ width:40, height:40, borderRadius:12, background:`linear-gradient(135deg,${DARK_ACCENT},${ACCENT})`,
          display:'flex', alignItems:'center', justifyContent:'center' }}>
          <MapPin size={20} color="#fff" weight="fill" />
        </div>
        <div>
          <div style={{ fontSize:17, fontWeight:800, color:C.dark }}>
            {regStep === 'region' ? t('regionPickerTitle') : (lang === 'ru' ? selRegion?.nameRu : selRegion?.name)}
          </div>
          <div style={{ fontSize:12, color:C.muted, marginTop:1 }}>
            {regStep === 'region' ? t('regionPickerSub') : t('cityPickerSub')}
          </div>
        </div>
      </div>

      {regStep === 'city' && (
        <button onClick={() => setRegStep('region')} style={{
          display:'flex', alignItems:'center', gap:6, background:'none', border:'none',
          cursor:'pointer', color:C.muted, fontSize:13, fontWeight:600, marginBottom:14, padding:0,
        }}>
          <ArrowLeft size={16} /> {t('backToRegion')}
        </button>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:340, overflowY:'auto' }}>
        {regStep === 'region' && REGIONS.map(r => (
          <button key={r.id} onClick={() => pickRegion(r)} style={{
            width:'100%', padding:'13px 16px', borderRadius:12,
            border:`1.5px solid ${C.border}`, background:C.s2,
            cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', justifyContent:'space-between',
            transition:'all .15s',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = ACCENT}
          onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:C.dark }}>
                {lang === 'ru' ? r.nameRu : r.name}
              </div>
              <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{r.cities.length} {t('citiesCount')}</div>
            </div>
            <span style={{ color:C.muted, fontSize:18 }}>›</span>
          </button>
        ))}
        {regStep === 'city' && selRegion?.cities.map((c, i) => (
          <button key={c} onClick={() => pickCity(c)} style={{
            width:'100%', padding:'13px 16px', borderRadius:12,
            border:`1.5px solid ${C.border}`, background:C.s2,
            cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:12,
            transition:'all .15s',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = ACCENT}
          onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
            <div style={{ width:32, height:32, borderRadius:9, background:`${ACCENT}18`,
              display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <MapPin size={16} color={ACCENT} />
            </div>
            <span style={{ fontSize:14, fontWeight:600, color:C.dark }}>
              {lang === 'ru' ? selRegion.citiesRu[i] : c}
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  const formContent = (
    <div style={{
      flex: 1,
      background: C.s1,
      borderRadius: isDesktop ? 20 : '28px 28px 0 0',
      padding: isDesktop ? '44px' : '32px 24px 52px',
      color: C.dark,
      maxWidth: isDesktop ? 460 : 'none',
      width: '100%',
      boxShadow: isDesktop ? '0 24px 80px rgba(0,0,0,.13)' : 'none',
    }}>

      {/* Tab switcher */}
      <div style={{
        display: 'flex',
        background: C.s2,
        borderRadius: 14,
        padding: 4,
        marginBottom: 28,
        gap: 4,
      }}>
        {[['login', t('login')], ['register', t('signUp')]].map(([m, label]) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            style={{
              flex: 1,
              padding: '11px 8px',
              borderRadius: 12,
              border: 'none',
              cursor: 'pointer',
              fontSize: 13.5,
              fontWeight: mode === m ? 700 : 500,
              background: mode === m
                ? `linear-gradient(135deg, ${DARK_ACCENT}, ${ACCENT})`
                : 'transparent',
              color: mode === m ? '#fff' : C.muted,
              transition: 'all .25s',
              boxShadow: mode === m ? `0 2px 12px ${ACCENT}40` : 'none',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Title */}
      <div style={{ marginBottom: 24 }}>
        <div style={{
          fontFamily: "'Playfair Display',serif",
          fontSize: isDesktop ? 28 : 22,
          fontWeight: 900,
          color: C.dark,
          marginBottom: 6,
        }}>
          {mode === 'login' ? t('sellerCabinet') : regStep === 'form' ? t('accountInfo') : t('newSeller')}
        </div>
        <div style={{ fontSize: 14, color: C.muted }}>
          {mode === 'login'
            ? t('manageStoreSubtitle')
            : regStep === 'form' ? `📍 ${lang === 'ru' ? selRegion?.nameRu : selRegion?.name}, ${selCity}` : t('pickLocationFirst')}
        </div>
      </div>

      {/* Register: region/city steps */}
      {mode === 'register' && regStep !== 'form' && regionStep}

      {/* Register: form step */}
      {mode === 'register' && regStep === 'form' && (
        <>
          {/* Location badge */}
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16,
            padding:'10px 14px', borderRadius:12, background:`${ACCENT}10`, border:`1px solid ${ACCENT}30` }}>
            <MapPin size={16} color={ACCENT} weight="fill"/>
            <span style={{ fontSize:13, fontWeight:700, color:ACCENT }}>{lang === 'ru' ? selRegion?.nameRu : selRegion?.name}, {selCity}</span>
            <button onClick={() => setRegStep('region')} style={{
              marginLeft:'auto', background:'none', border:'none', cursor:'pointer',
              fontSize:11, color:C.muted, fontWeight:600,
            }}>{t('changeLocation')}</button>
          </div>
          {[
            { label: t('yourName'), icon: <User size={18} weight="duotone" />, value: name, set: v => setName(v.replace(/[0-9]/g, '')), placeholder: 'Aziz Karimov' },
            { label: t('shopName'), icon: <Store size={18} weight="duotone" />, value: shopName, set: setShopName, placeholder: 'Aziz Shirinliklari' },
            { label: t('streetHouseLabel'), icon: <MapPin size={18} weight="duotone" />, value: address, set: setAddress, placeholder: "Mustaqillik ko'chasi, 12-uy" },
          ].map(({ label, icon, value, set, placeholder }) => (
            <div key={label} style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: 'block', marginBottom: 6 }}>{label}</label>
              <div style={{ position: 'relative' }}>
                <span style={iconPos}>{icon}</span>
                <input className="input-focus" type="text" value={value}
                  onChange={e => set(e.target.value)} placeholder={placeholder} style={iStyle} />
              </div>
            </div>
          ))}
        </>
      )}

      {/* Phone — only show for login or register form step */}
      {(mode === 'login' || regStep === 'form') && (
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: 'block', marginBottom: 6 }}>{t('phoneNumber')}</label>
          <div style={{ position: 'relative' }}>
            <span style={iconPos}><Phone size={18} weight="duotone" /></span>
            <input
              className="input-focus" type="tel" value={phone}
              onChange={e => setPhone(formatPhone(e.target.value))}
              onKeyDown={e => {
                if (['Backspace','Delete'].includes(e.key) && rawDigits(phone).length <= 3) e.preventDefault();
              }}
              placeholder="+998 90 123 45 67" style={iStyle}
            />
          </div>
        </div>
      )}

      {/* Password — only show for login or register form step */}
      {(mode === 'login' || regStep === 'form') && (
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: 'block', marginBottom: 6 }}>{t('password')}</label>
          <div style={{ position: 'relative' }}>
            <span style={iconPos}><Lock size={18} weight="duotone" /></span>
            <input
              type={showPass ? 'text' : 'password'} value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={mode === 'register' ? t('passwordPlaceholder') : t('yourPassword')}
              style={passFieldStyle} className="input-focus"
            />
            <button type="button" onClick={() => setShowPass(p => !p)} style={eyeBtnStyle}>
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
      )}

      {mode === 'register' && regStep === 'form' && (
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: 'block', marginBottom: 6 }}>{t('confirmPassword')}</label>
          <div style={{ position: 'relative' }}>
            <span style={iconPos}><Lock size={18} weight="duotone" /></span>
            <input
              type={showPass2 ? 'text' : 'password'} value={password2}
              onChange={e => setPassword2(e.target.value)}
              placeholder={t('repeatPassword')}
              style={passFieldStyle} className="input-focus"
            />
            <button type="button" onClick={() => setShowPass2(p => !p)} style={eyeBtnStyle}>
              {showPass2 ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div style={{
          color: '#ef4444',
          fontSize: 13,
          marginBottom: 16,
          background: 'rgba(239,68,68,.08)',
          padding: '10px 14px',
          borderRadius: 10,
        }}>
          {error}
        </div>
      )}

      {/* Submit — only show for login or register form step */}
      {(mode === 'login' || regStep === 'form') && <button
        onClick={mode === 'login' ? handleLogin : handleRegister}
        disabled={loading}
        style={{
          width: '100%',
          padding: '15px 20px',
          borderRadius: 14,
          border: 'none',
          cursor: loading ? 'default' : 'pointer',
          fontWeight: 700,
          fontSize: 15,
          color: '#fff',
          marginBottom: 16,
          background: loading
            ? ACCENT
            : `linear-gradient(135deg, ${DARK_ACCENT}, ${ACCENT})`,
          boxShadow: loading ? 'none' : `0 4px 20px ${ACCENT}40`,
          transition: 'all .25s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading
          ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
          : mode === 'login' ? <Lock size={18} /> : <Store size={18} />
        }
        {loading ? t('loadingText') : mode === 'login' ? t('login') : t('signUp')}
        {!loading && <ArrowRight size={16} />}
      </button>}

      <div style={{ textAlign: 'center', fontSize: 13, color: C.muted }}>
        <span onClick={goUserLogin} style={{ color: '#4f46e5', fontWeight: 700, cursor: 'pointer' }}>
          {t('userLoginLink')}
        </span>
      </div>
    </div>
  );

  /* ── DESKTOP ── */
  if (isDesktop) return (
    <div className="fade-in-up" style={{ minHeight: '100vh', display: 'flex', alignItems: 'stretch' }}>
      {/* Left hero */}
      <div style={{
        flex: 1,
        background: `linear-gradient(145deg, ${DARK_ACCENT} 0%, ${ACCENT} 60%, #34d399 100%)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 60,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position:'absolute', width:500, height:500, borderRadius:'50%', background:'rgba(255,255,255,.03)', top:-150, right:-150 }} />
        <div style={{ position:'absolute', width:250, height:250, borderRadius:'50%', background:'rgba(255,255,255,.05)', bottom:20, left:-70 }} />

        <div style={{ position: 'relative', textAlign: 'center', zIndex: 1 }}>
          <div style={{
            fontFamily: "'Playfair Display',serif",
            fontSize: 52,
            fontWeight: 900,
            color: '#fff',
            marginBottom: 12,
            lineHeight: 1.1,
          }}>
            {t('sellerHeroTitle')}
          </div>
          <div style={{ color: 'rgba(255,255,255,.75)', fontSize: 15, maxWidth: 300, lineHeight: 1.8, marginBottom: 44 }}>
            {t('sellerHeroDesc')}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { icon: <Package size={20} weight="fill" />,   text: t('sellerFeature1') },
              { icon: <Building2 size={20} weight="fill" />, text: t('sellerFeature2') },
              { icon: <TrendingUp size={20} weight="fill" />,   text: t('sellerFeature3') },
            ].map(({ icon, text }) => (
              <div key={text} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                background: 'rgba(255,255,255,.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: 14,
                padding: '13px 20px',
                border: '1px solid rgba(255,255,255,.1)',
              }}>
                <span style={{ color: 'rgba(255,255,255,.85)' }}>{icon}</span>
                <span style={{ color: '#fff', fontWeight: 500, fontSize: 14 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form */}
      <div style={{ width: 520, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, background: C.bg }}>
        {formContent}
      </div>
    </div>
  );

  /* ── MOBILE ── */
  return (
    <div className="fade-in-up" style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: `linear-gradient(180deg, ${DARK_ACCENT} 0%, ${ACCENT} 45%, #f0fdf4 100%)`,
    }}>
      <div style={{ padding: '80px 24px 32px', textAlign: 'center' }}>
        <div style={{
          fontFamily: "'Playfair Display',serif",
          fontSize: 34,
          fontWeight: 900,
          color: '#fff',
          marginBottom: 8,
        }}>
          {t('sellerHeroTitle')}
        </div>
        <div style={{ color: 'rgba(255,255,255,.65)', fontSize: 14 }}>
          {t('sellerHeroDesc')}
        </div>
      </div>
      {formContent}
    </div>
  );
}