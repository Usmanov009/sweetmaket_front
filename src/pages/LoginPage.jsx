import { useState, useRef, useEffect } from 'react';
import {
  Phone, User, ArrowLeft,
  ArrowRight, ShieldCheck, CircleNotch, Storefront,
} from '@phosphor-icons/react';
import api from '../api';
import OtpInput from '../components/OtpInput';
import { formatPhone, rawDigits, isValidPhone } from '../utils/format';

export default function LoginPage({ onLogin, goSignup, goSellerLogin, C, isDesktop, setPage }) {
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
    timerRef.current = setInterval(() => setTimer(p => {
      if (p <= 1) { clearInterval(timerRef.current); return 0; }
      return p - 1;
    }), 1000);
  };
  useEffect(() => () => clearInterval(timerRef.current), []);

  const handleSend = async () => {
    if (!firstName.trim()) { setError('Ismingizni kiriting'); return; }
    if (!lastName.trim())  { setError('Familiyangizni kiriting'); return; }
    if (!isValidPhone(phone)) { setError("To'g'ri telefon raqam kiriting (+998 XX XXX XX XX)"); return; }
    setError(''); setLoading(true);
    try {
      const data = await api.post('/api/auth/request-otp', { phone });
      setDevOtp(data.devOtp || '');
      setStep('otp'); startTimer();
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleVerify = async () => {
    if (otp.length < 6) { setError('6 xonali kodni kiriting'); return; }
    setError(''); setLoading(true);
    try {
      const { token, user } = await api.post('/api/auth/verify', {
        phone, otp, firstName: firstName.trim(), lastName: lastName.trim(),
      });
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

  const ACCENT = '#4f46e5';

  const inputStyle = {
    width: '100%',
    background: C.s2,
    border: `1.5px solid ${C.border}`,
    borderRadius: 12,
    padding: '14px 16px 14px 48px',
    color: C.dark,
    fontSize: 15,
    transition: 'all .2s',
    outline: 'none',
  };

  const primaryBtn = (disabled) => ({
    width: '100%',
    padding: '15px 20px',
    borderRadius: 14,
    border: 'none',
    cursor: disabled ? 'default' : 'pointer',
    fontWeight: 700,
    fontSize: 15,
    color: '#fff',
    background: disabled
      ? C.mid
      : `linear-gradient(135deg, ${ACCENT}, #7c3aed)`,
    boxShadow: disabled ? 'none' : `0 4px 20px ${ACCENT}40`,
    transition: 'all .25s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    opacity: disabled ? 0.6 : 1,
  });

  const iconWrap = { position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: ACCENT, display: 'flex' };

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

      {/* ── INFO STEP ── */}
      {step === 'info' && (
        <>
          <div style={{ marginBottom: 28 }}>
            <div style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: isDesktop ? 30 : 24,
              fontWeight: 900,
              color: C.dark,
              lineHeight: 1.2,
              marginBottom: 8,
            }}>
              Xush kelibsiz
            </div>
            <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.6 }}>
              Hisobingizga kirish uchun ma'lumot kiriting
            </div>
          </div>

          {/* Ism / Familiya row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            {[
              { label: 'Ism',      value: firstName, set: setFirstName, placeholder: 'Aziz'   },
              { label: 'Familiya', value: lastName,  set: setLastName,  placeholder: 'Karimov' },
            ].map(({ label, value, set, placeholder }) => (
              <div key={label}>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: 'block', marginBottom: 6 }}>
                  {label}
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={iconWrap}><User size={18} weight="duotone" /></span>
                  <input
                    className="input-focus"
                    type="text"
                    value={value}
                    onChange={e => set(e.target.value)}
                    placeholder={placeholder}
                    style={inputStyle}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Telefon */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: 'block', marginBottom: 6 }}>
              Telefon raqam
            </label>
            <div style={{ position: 'relative' }}>
              <span style={iconWrap}><Phone size={18} weight="duotone" /></span>
              <input
                className="input-focus"
                type="tel"
                value={phone}
                onChange={e => setPhone(formatPhone(e.target.value))}
                onKeyDown={e => {
                  if (['Backspace','Delete'].includes(e.key) && rawDigits(phone).length <= 3) e.preventDefault();
                  if (e.key === 'Enter') handleSend();
                }}
                placeholder="+998 90 123 45 67"
                style={inputStyle}
              />
            </div>
          </div>

          {error && (
            <div style={{
              color: C.danger || '#ef4444',
              fontSize: 13,
              marginBottom: 16,
              background: 'rgba(239,68,68,.08)',
              padding: '10px 14px',
              borderRadius: 10,
            }}>
              {error}
            </div>
          )}

          <button className="btn-hover" onClick={handleSend} disabled={loading} style={primaryBtn(loading)}>
            {loading
              ? <CircleNotch size={18} style={{ animation: 'spin 1s linear infinite' }} />
              : <Phone size={18} />
            }
            {loading ? 'Yuborilmoqda...' : 'SMS kodni yuborish'}
            {!loading && <ArrowRight size={16} />}
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0', color: C.muted, fontSize: 13 }}>
            <div style={{ flex: 1, height: 1, background: C.border }} />
            yoki
            <div style={{ flex: 1, height: 1, background: C.border }} />
          </div>

          {/* Footer links */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '6px 16px',
            marginTop: 24,
            fontSize: 13,
            color: C.muted,
          }}>
            <span>
              Hisob yo'qmi?{' '}
              <span onClick={goSignup} style={{ color: ACCENT, fontWeight: 700, cursor: 'pointer' }}>
                Ro'yxatdan o'tish
              </span>
            </span>
            <span style={{ color: C.border }}>|</span>
            <span
              onClick={goSellerLogin}
              style={{ color: '#059669', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Storefront size={13} weight="fill" /> Sotuvchi kabineti
            </span>
          </div>
        </>
      )}

      {/* ── OTP STEP ── */}
      {step === 'otp' && (
        <>
          <button
            onClick={() => { setStep('info'); setOtp(''); setError(''); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: C.s2,
              border: 'none',
              cursor: 'pointer',
              color: C.muted,
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 24,
              padding: '8px 14px',
              borderRadius: 10,
            }}
          >
            <ArrowLeft size={15} /> Orqaga
          </button>

          <div style={{ marginBottom: 24 }}>
            <div style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: isDesktop ? 26 : 22,
              fontWeight: 900,
              color: C.dark,
              marginBottom: 8,
            }}>
              SMS kodni kiriting
            </div>
            <div style={{ fontSize: 14, color: C.muted }}>
              Kod yuborildi:{' '}
              <span style={{ color: ACCENT, fontWeight: 700 }}>{phone}</span>
            </div>
          </div>

          <OtpInput value={otp} onChange={setOtp} C={C} />

          {error && (
            <div style={{
              color: C.danger || '#ef4444',
              fontSize: 13,
              marginBottom: 16,
              background: 'rgba(239,68,68,.08)',
              padding: '10px 14px',
              borderRadius: 10,
            }}>
              {error}
            </div>
          )}

          <button
            className="btn-hover"
            onClick={handleVerify}
            disabled={loading || otp.length < 6}
            style={primaryBtn(loading || otp.length < 6)}
          >
            {loading
              ? <CircleNotch size={18} style={{ animation: 'spin 1s linear infinite' }} />
              : <ShieldCheck size={18} />
            }
            {loading ? 'Tekshirilmoqda...' : 'Tasdiqlash'}
          </button>

          {devOtp && (
            <div style={{
              marginTop: 16,
              background: C.pale,
              borderRadius: 12,
              padding: '12px 16px',
              fontSize: 13,
              color: ACCENT,
              textAlign: 'center',
              fontWeight: 600,
              border: `1px solid ${C.border}`,
            }}>
              Test kodi:{' '}
              <span style={{ letterSpacing: 4, fontFamily: 'monospace', fontSize: 16 }}>{devOtp}</span>
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: C.muted }}>
            {timer > 0
              ? <span>Qayta yuborish: <span style={{ color: ACCENT, fontWeight: 700 }}>00:{String(timer).padStart(2, '0')}</span></span>
              : (
                <span
                  onClick={handleResend}
                  style={{ color: ACCENT, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Phone size={14} /> SMS qayta yuborish
                </span>
              )
            }
          </div>
        </>
      )}
    </div>
  );

  /* ── DESKTOP layout ── */
  if (isDesktop) return (
    <div className="fade-in-up" style={{ minHeight: '100vh', display: 'flex', alignItems: 'stretch' }}>
      {/* Left hero */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(145deg, #1e1b4b 0%, #4f46e5 55%, #7c3aed 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 60,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position:'absolute', width:500, height:500, borderRadius:'50%', background:'rgba(255,255,255,.03)', top:-150, right:-150 }} />
        <div style={{ position:'absolute', width:280, height:280, borderRadius:'50%', background:'rgba(255,255,255,.05)', bottom:20, left:-80 }} />
        <div style={{ position:'absolute', width:130, height:130, borderRadius:'50%', background:'rgba(255,255,255,.04)', top:'35%', right:80 }} />

        <div style={{ position: 'relative', textAlign: 'center', zIndex: 1 }}>
          <div style={{
            fontFamily: "'Playfair Display',serif",
            fontSize: 56,
            fontWeight: 900,
            color: '#fff',
            marginBottom: 14,
            lineHeight: 1.1,
          }}>
            Sweet<span style={{ color: 'rgba(255,255,255,.45)' }}>Market</span>
          </div>
          <div style={{ color: 'rgba(255,255,255,.7)', fontSize: 16, maxWidth: 320, lineHeight: 1.8, marginBottom: 44 }}>
            Eng mazali tortlar — bevosita usta konditerlardan
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { icon: <Storefront size={20} weight="fill" />, text: "100+ ishonchli sotuvchi" },
              { icon: <ShieldCheck size={20} weight="fill" />, text: "Xavfsiz to'lov tizimi" },
              { icon: <Phone size={20} weight="fill" />, text: "Tez yetkazib berish" },
            ].map(({ icon, text }) => (
              <div key={text} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                background: 'rgba(255,255,255,.09)',
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

  /* ── MOBILE layout ── */
  return (
    <div className="fade-in-up" style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(180deg, #1e1b4b 0%, #4f46e5 45%, #f8fafc 100%)',
    }}>
      <div style={{ padding: '80px 24px 32px', textAlign: 'center' }}>
        <div style={{
          fontFamily: "'Playfair Display',serif",
          fontSize: 36,
          fontWeight: 900,
          color: '#fff',
          marginBottom: 8,
        }}>
          Sweet<span style={{ opacity: .5 }}>Market</span>
        </div>
        <div style={{ color: 'rgba(255,255,255,.65)', fontSize: 14 }}>
          Eng mazali tortlar bu yerda
        </div>
      </div>
      {formContent}
    </div>
  );
}
