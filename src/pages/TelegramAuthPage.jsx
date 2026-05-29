import { useState } from 'react';
import { User, Store, ArrowLeft, Loader2, MapPin, Lock } from 'lucide-react';
import { useLocale } from '../locale.jsx';

const BASE = import.meta.env.VITE_API_URL || '';

export default function TelegramAuthPage({ onBack, onAuthSuccess, C }) {
  const { t } = useLocale();
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [setupMode,   setSetupMode]   = useState(false);
  const [tgName,      setTgName]      = useState('');
  const [address,     setAddress]     = useState('');
  const [password,    setPassword]    = useState('');
  const [setupLoading,setSetupLoading]= useState(false);

  const getInitData = () => window.Telegram?.WebApp?.initData || '';

  const handleAuth = async (userType) => {
    const tg = window.Telegram?.WebApp;
    if (!tg?.initData) { setError("Telegram WebApp topilmadi"); return; }
    setLoading(true); setError('');
    try {
      const r = await fetch(`${BASE}/api/auth/telegram`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: tg.initData, userType }),
      });
      const data = await r.json();
      if (!r.ok) {
        if (data.needSetup) {
          setTgName(data.tgName || '');
          setSetupMode(true);
          setError('');
        } else {
          setError(data.error || 'Xatolik yuz berdi');
        }
        return;
      }
      if (data.userType === 'seller') {
        localStorage.setItem('sm_seller_token', data.token);
        onAuthSuccess(data.seller, 'seller');
      } else {
        localStorage.setItem('sm_token', data.token);
        onAuthSuccess(data.user, 'user');
      }
    } catch (err) {
      setError(err?.message === 'Failed to fetch'
        ? "Server bilan bog'lanib bo'lmadi. Biroz kuting va qayta urinib ko'ring."
        : "Xatolik yuz berdi. Qayta urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async () => {
    if (!address.trim() || !password.trim()) { setError("Manzil va parol kiriting"); return; }
    setSetupLoading(true); setError('');
    try {
      const r = await fetch(`${BASE}/api/auth/telegram`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: getInitData(), userType: 'seller', address: address.trim(), password: password.trim() }),
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error || 'Xatolik'); return; }
      localStorage.setItem('sm_seller_token', data.token);
      onAuthSuccess(data.seller, 'seller');
    } catch (err) {
      setError(err?.message === 'Failed to fetch'
        ? "Server bilan bog'lanib bo'lmadi. Biroz kuting va qayta urinib ko'ring."
        : "Xatolik yuz berdi.");
    } finally {
      setSetupLoading(false);
    }
  };

  const inp = {
    width: '100%', background: C.s2, border: `1.5px solid ${C.border}`,
    borderRadius: 12, padding: '13px 16px', color: C.dark, fontSize: 15,
    outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
        {onBack && (
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.dark, display: 'flex' }}>
            <ArrowLeft size={24} />
          </button>
        )}
        <div style={{ fontSize: 18, fontWeight: 700, color: C.dark }}>{t('telegramLogin')}</div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '32px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 400, margin: '0 auto', width: '100%' }}>

        {/* Logo */}
        <div style={{ width: 80, height: 80, borderRadius: 20, background: 'linear-gradient(135deg,#0088cc,#005580)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 40 }}>
          📱
        </div>

        {!setupMode ? (
          <>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.dark, textAlign: 'center', marginBottom: 8 }}>{t('welcome')}!</div>
            <div style={{ fontSize: 14, color: C.muted, textAlign: 'center', marginBottom: 32, lineHeight: 1.6 }}>
              {t('chooseRole')}
            </div>

            {error && (
              <div style={{ padding: 12, borderRadius: 12, background: '#fee2e2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 14, marginBottom: 20, textAlign: 'center' }}>
                {error}
              </div>
            )}

            <button onClick={() => handleAuth('user')} disabled={loading} style={{
              width: '100%', padding: '16px 20px', borderRadius: 16, border: 'none',
              background: loading ? C.border : `linear-gradient(135deg,${C.navy},${C.mid})`,
              color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
              marginBottom: 12, boxShadow: `0 4px 20px ${C.navy}40`,
            }}>
              {loading ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <User size={20} />}
              {t('loginAsUser')}
            </button>

            <button onClick={() => handleAuth('seller')} disabled={loading} style={{
              width: '100%', padding: '16px 20px', borderRadius: 16,
              border: `2px solid ${C.border}`, background: C.s1,
              color: C.dark, fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            }}>
              <Store size={20} color="#059669" />
              {t('loginAsSeller')}
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.dark, textAlign: 'center', marginBottom: 6 }}>
              Sotuvchi sifatida ro'yxatdan o'tish
            </div>
            <div style={{ fontSize: 13, color: C.muted, textAlign: 'center', marginBottom: 24, lineHeight: 1.5 }}>
              Telegram orqali avtomatik aniqlandingiz
            </div>

            {error && (
              <div style={{ padding: 12, borderRadius: 12, background: '#fee2e2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 14, marginBottom: 16, textAlign: 'center' }}>
                {error}
              </div>
            )}

            {/* Name (readonly, from Telegram) */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 4, paddingLeft: 4 }}>Ism (Telegramdan)</div>
              <div style={{ ...inp, background: C.s1, color: C.muted, border: `1.5px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                <User size={16} color={C.muted} />
                {tgName || 'Sotuvchi'}
              </div>
            </div>

            {/* Address */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 4, paddingLeft: 4 }}>Do'kon manzili</div>
              <div style={{ position: 'relative' }}>
                <MapPin size={16} color={C.muted} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Toshkent, Chilonzor..."
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  style={{ ...inp, paddingLeft: 38 }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 4, paddingLeft: 4 }}>Parol o'rnating</div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color={C.muted} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  placeholder="Kamida 6 ta belgi"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ ...inp, paddingLeft: 38 }}
                />
              </div>
            </div>

            <button onClick={handleSetup} disabled={setupLoading} style={{
              width: '100%', padding: '15px', borderRadius: 14, border: 'none',
              background: setupLoading ? C.border : 'linear-gradient(135deg,#059669,#047857)',
              color: '#fff', fontSize: 15, fontWeight: 700, cursor: setupLoading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              marginBottom: 10,
            }}>
              {setupLoading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Store size={18} />}
              {setupLoading ? 'Ro\'yxatdan o\'tilmoqda...' : 'Ro\'yxatdan o\'tish'}
            </button>

            <button onClick={() => { setSetupMode(false); setError(''); }} style={{
              width: '100%', padding: '12px', borderRadius: 14, border: `1px solid ${C.border}`,
              background: 'transparent', color: C.muted, fontSize: 14, cursor: 'pointer',
            }}>
              {t('back')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}