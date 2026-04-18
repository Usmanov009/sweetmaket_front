import { useState } from 'react';
import { User, Storefront, ArrowLeft, CircleNotch } from '@phosphor-icons/react';
import { useLocale } from '../locale.jsx';

const BASE = import.meta.env.VITE_API_URL || '';

export default function TelegramAuthPage({ onBack, onAuthSuccess, C, isDesktop }) {
  const { t } = useLocale();
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  // seller link form (when telegram_id not in sellers yet)
  const [linkMode,     setLinkMode]     = useState(false);
  const [phone,        setPhone]        = useState('');
  const [password,     setPassword]     = useState('');
  const [linkLoading,  setLinkLoading]  = useState(false);

  const getTelegramId = () => {
    try {
      const params = new URLSearchParams(window.Telegram?.WebApp?.initData || '');
      const u = JSON.parse(params.get('user') || '{}');
      return u.id ? String(u.id) : null;
    } catch { return null; }
  };

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
        if (data.needRegistration) {
          // Seller topilmadi — inline forma ko'rsat
          setLinkMode(true);
          setError('');
        } else {
          setError(data.error || 'Xatolik yuz berdi');
        }
        return;
      }
      // Muvaffaqiyatli login
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

  // Seller — telefon/parol bilan bog'lash
  const handleLink = async () => {
    if (!phone.trim() || !password.trim()) { setError("Telefon va parol kiriting"); return; }
    setLinkLoading(true); setError('');
    try {
      const telegramId = getTelegramId();
      const r = await fetch(`${BASE}/api/seller/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), password: password.trim(), telegramId }),
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
      setLinkLoading(false);
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

        {!linkMode ? (
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

            {/* Foydalanuvchi */}
            <button onClick={() => handleAuth('user')} disabled={loading} style={{
              width: '100%', padding: '16px 20px', borderRadius: 16, border: 'none',
              background: loading ? C.border : `linear-gradient(135deg,${C.navy},${C.mid})`,
              color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
              marginBottom: 12, boxShadow: `0 4px 20px ${C.navy}40`,
            }}>
              {loading ? <CircleNotch size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <User size={20} />}
              {t('loginAsUser')}
            </button>

            {/* Qandolatchi */}
            <button onClick={() => handleAuth('seller')} disabled={loading} style={{
              width: '100%', padding: '16px 20px', borderRadius: 16,
              border: `2px solid ${C.border}`, background: C.s1,
              color: C.dark, fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            }}>
              <Storefront size={20} color="#059669" />
              {t('loginAsSeller')}
            </button>
          </>
        ) : (
          <>
            {/* Seller link form */}
            <div style={{ fontSize: 18, fontWeight: 800, color: C.dark, textAlign: 'center', marginBottom: 8 }}>
              {t('linkAccount')}
            </div>
            <div style={{ fontSize: 13, color: C.muted, textAlign: 'center', marginBottom: 24, lineHeight: 1.5 }}>
              Qandolatchi hisobingiz telefon raqami va paroli bilan kiring — Telegram hisobingiz avtomatik bog'lanadi
            </div>

            {error && (
              <div style={{ padding: 12, borderRadius: 12, background: '#fee2e2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 14, marginBottom: 16, textAlign: 'center' }}>
                {error}
              </div>
            )}

            <input
              type="tel"
              placeholder="+998 90 123 45 67"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              style={{ ...inp, marginBottom: 12 }}
            />
            <input
              type="password"
              placeholder="Parol"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ ...inp, marginBottom: 20 }}
            />

            <button onClick={handleLink} disabled={linkLoading} style={{
              width: '100%', padding: '15px', borderRadius: 14, border: 'none',
              background: linkLoading ? C.border : 'linear-gradient(135deg,#059669,#047857)',
              color: '#fff', fontSize: 15, fontWeight: 700, cursor: linkLoading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              marginBottom: 10,
            }}>
              {linkLoading ? <CircleNotch size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Storefront size={18} />}
              {linkLoading ? t('loggingIn') : t('loginAndLink')}
            </button>

            <button onClick={() => { setLinkMode(false); setError(''); }} style={{
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
