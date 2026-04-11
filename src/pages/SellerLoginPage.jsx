import { useState } from 'react';
import {
  Phone, Lock, Storefront, User, Eye, EyeSlash,
  ArrowRight, CircleNotch, MapPin, Package, TrendUp, Buildings,
} from '@phosphor-icons/react';
import api from '../api';
import { formatPhone, rawDigits, isValidPhone } from '../utils/format';

export default function SellerLoginPage({ onLogin, goUserLogin, C, isDesktop }) {
  const [mode,      setMode]      = useState('login');
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
    if (password.length < 6)  { setError("Parol kamida 6 ta belgi bo'lishi kerak"); return; }
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

  const PasswordField = ({ label, value, onChange, show, onToggle, placeholder }) => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: 'block', marginBottom: 6 }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <span style={iconPos}><Lock size={18} weight="duotone" /></span>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          style={{ ...iStyle, paddingRight: 46 }}
          className="input-focus"
        />
        <button
          type="button"
          onClick={onToggle}
          style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 0, display: 'flex' }}
        >
          {show ? <EyeSlash size={18} /> : <Eye size={18} />}
        </button>
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
        {[['login', 'Kirish'], ['register', "Ro'yxatdan o'tish"]].map(([m, label]) => (
          <button
            key={m}
            onClick={() => { setMode(m); setError(''); }}
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
          {mode === 'login' ? 'Sotuvchi kabineti' : 'Yangi sotuvchi'}
        </div>
        <div style={{ fontSize: 14, color: C.muted }}>
          {mode === 'login'
            ? "Do'koningizni boshqaring"
            : "Yangi sotuvchi hisobi yarating"}
        </div>
      </div>

      {/* Register fields */}
      {mode === 'register' && (
        <>
          {[
            { label: 'Ism Familiya', icon: <User size={18} weight="duotone" />, value: name, set: setName, placeholder: 'Aziz Karimov' },
            { label: "Do'kon nomi",  icon: <Storefront size={18} weight="duotone" />, value: shopName, set: setShopName, placeholder: 'Aziz Shirinliklari' },
            { label: 'Manzil (ixtiyoriy)', icon: <MapPin size={18} weight="duotone" />, value: address, set: setAddress, placeholder: 'Toshkent, Chilonzor' },
          ].map(({ label, icon, value, set, placeholder }) => (
            <div key={label} style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: 'block', marginBottom: 6 }}>{label}</label>
              <div style={{ position: 'relative' }}>
                <span style={iconPos}>{icon}</span>
                <input
                  className="input-focus"
                  type="text"
                  value={value}
                  onChange={e => set(e.target.value)}
                  placeholder={placeholder}
                  style={iStyle}
                />
              </div>
            </div>
          ))}
        </>
      )}

      {/* Phone */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: 'block', marginBottom: 6 }}>Telefon raqam</label>
        <div style={{ position: 'relative' }}>
          <span style={iconPos}><Phone size={18} weight="duotone" /></span>
          <input
            className="input-focus"
            type="tel"
            value={phone}
            onChange={e => setPhone(formatPhone(e.target.value))}
            onKeyDown={e => {
              if (['Backspace','Delete'].includes(e.key) && rawDigits(phone).length <= 3) e.preventDefault();
            }}
            placeholder="+998 90 123 45 67"
            style={iStyle}
          />
        </div>
      </div>

      {/* Password */}
      <PasswordField
        label="Parol"
        value={password}
        onChange={e => setPassword(e.target.value)}
        show={showPass}
        onToggle={() => setShowPass(p => !p)}
        placeholder={mode === 'register' ? 'Kamida 6 ta belgi' : 'Parolingiz'}
      />

      {mode === 'register' && (
        <PasswordField
          label="Parolni tasdiqlang"
          value={password2}
          onChange={e => setPassword2(e.target.value)}
          show={showPass2}
          onToggle={() => setShowPass2(p => !p)}
          placeholder="Parolni qayta kiriting"
        />
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

      {/* Submit */}
      <button
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
          ? <CircleNotch size={18} style={{ animation: 'spin 1s linear infinite' }} />
          : mode === 'login' ? <Lock size={18} /> : <Storefront size={18} />
        }
        {loading ? 'Yuklanmoqda...' : mode === 'login' ? 'Kirish' : "Ro'yxatdan o'tish"}
        {!loading && <ArrowRight size={16} />}
      </button>

      <div style={{ textAlign: 'center', fontSize: 13, color: C.muted }}>
        Xaridor sifatida kirish?{' '}
        <span onClick={goUserLogin} style={{ color: '#4f46e5', fontWeight: 700, cursor: 'pointer' }}>
          Bu yerga bosing
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
            Sotuvchi<span style={{ color: 'rgba(255,255,255,.45)' }}> Kabineti</span>
          </div>
          <div style={{ color: 'rgba(255,255,255,.75)', fontSize: 15, maxWidth: 300, lineHeight: 1.8, marginBottom: 44 }}>
            Buyurtmalarni kuzating, do'koningizni boshqaring
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { icon: <Package size={20} weight="fill" />,   text: "Buyurtmalarni real vaqtda kuzating" },
              { icon: <Buildings size={20} weight="fill" />, text: "Do'koningizni to'liq boshqaring"    },
              { icon: <TrendUp size={20} weight="fill" />,   text: "Daromad statistikasini ko'ring"     },
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
          Sotuvchi <span style={{ opacity: .5 }}>Kabineti</span>
        </div>
        <div style={{ color: 'rgba(255,255,255,.65)', fontSize: 14 }}>
          SweetMarket biznes platformasi
        </div>
      </div>
      {formContent}
    </div>
  );
}
