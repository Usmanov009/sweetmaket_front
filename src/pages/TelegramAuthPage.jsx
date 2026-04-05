import { useState } from 'react';
import { User, Storefront, ArrowLeft } from '@phosphor-icons/react';

export default function TelegramAuthPage({ onBack, onAuthSuccess, C, isDesktop }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = (userType) => {
    setLoading(true);
    setError('');

    // Telegram WebApp ni ochish
    const telegram = window.Telegram;
    if (!telegram) {
      setError('Telegram WebApp topilmadi. Iltimos, Telegram orqali oching');
      setLoading(false);
      return;
    }

    const webApp = telegram.WebApp;
    webApp.ready();

    const initData = webApp.initData;
    if (!initData) {
      setError('Telegram ma\'lumotlari topilmadi');
      setLoading(false);
      return;
    }

    // Backend ga yuborish
    fetch(`${import.meta.env.VITE_API_URL}/api/auth/telegram`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        initData,
        userType
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        if (data.needRegistration) {
          setError(data.error);
          // Sotuvchi ro'yxatdan o'tish sahifasiga yo'naltirish
          setTimeout(() => {
            window.open('/seller-login', '_blank');
          }, 2000);
        } else {
          setError(data.error);
        }
      } else {
        localStorage.setItem('sm_token', data.token);
        localStorage.setItem('sm_user_type', data.userType);
        onAuthSuccess(data.user, data.userType);
      }
    })
    .catch(err => {
      console.error('Auth error:', err);
      setError('Xatolik yuz berdi. Qayta urinib ko\'ring');
    })
    .finally(() => {
      setLoading(false);
    });
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: C.bg,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{ 
        padding: isDesktop ? '20px' : '16px 20px',
        borderBottom: `1px solid ${C.border}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap:12 }}>
          {onBack && (
            <button 
              onClick={onBack}
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                color: C.dark,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <ArrowLeft size={24} />
            </button>
          )}
          <div style={{ fontSize: 18, fontWeight: 700, color: C.dark }}>
            Telegram orqali kirish
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ 
        flex: 1,
        padding: isDesktop ? '40px' : '24px 20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        maxWidth: 400,
        margin: '0 auto',
        width: '100%'
      }}>
        {/* Logo */}
        <div style={{ 
          width: 80, 
          height: 80, 
          borderRadius: 20,
          background: 'linear-gradient(135deg, #0088cc, #005580)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
          fontSize: 40
        }}>
          📱
        </div>

        {/* Title */}
        <div style={{ 
          fontSize: isDesktop ? 28 : 24, 
          fontWeight: 700, 
          color: C.dark,
          textAlign: 'center',
          marginBottom: 12
        }}>
          Xush kelibsiz!
        </div>

        {/* Description */}
        <div style={{ 
          fontSize: 16, 
          color: C.muted,
          textAlign: 'center',
          marginBottom: 32,
          lineHeight: 1.5
        }}>
          Iltimos, o'zingizga mos bo'lgan ro'yxatdan o'tish turini tanlang
        </div>

        {/* Error */}
        {error && (
          <div style={{
            width: '100%',
            padding: 12,
            borderRadius: 12,
            background: '#fee2e2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            fontSize: 14,
            marginBottom: 24,
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {/* Buttons */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            onClick={() => handleAuth('user')}
            disabled={loading}
            style={{
              width: '100%',
              padding: 16,
              borderRadius: 12,
              border: 'none',
              background: loading ? C.border : C.navy,
              color: '#fff',
              fontSize: 16,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              transition: 'all 0.2s'
            }}
          >
            <User size={20} />
            {loading ? 'Kutilmoqda...' : 'Foydalanuvchi sifatida kirish'}
          </button>

          <button
            onClick={() => handleAuth('seller')}
            disabled={loading}
            style={{
              width: '100%',
              padding: 16,
              borderRadius: 12,
              border: `2px solid ${C.border}`,
              background: loading ? C.s2 : C.s1,
              color: loading ? C.muted : C.dark,
              fontSize: 16,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              transition: 'all 0.2s'
            }}
          >
            <Storefront size={20} />
            {loading ? 'Kutilmoqda...' : 'Qandolatchi sifatida kirish'}
          </button>
        </div>

        {/* Info */}
        <div style={{ 
          marginTop: 24,
          padding: 16,
          borderRadius: 12,
          background: `${C.navy}10`,
          border: `1px solid ${C.navy}20`,
          fontSize: 13,
          color: C.navy,
          textAlign: 'center',
          lineHeight: 1.4
        }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>⚠️ Eslatma</div>
          Bir Telegram hisobi faqat bitta turda ro'yxatdan o'ta oladi. 
          Agar siz allaqachon foydalanuvchi bo'lsangiz, qandolatchi sifatida ro'yxatdan o'tolmaysiz.
        </div>
      </div>
    </div>
  );
}
