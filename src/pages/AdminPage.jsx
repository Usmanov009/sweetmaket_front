import { useState, useEffect } from 'react';
import { TrendingUp, Users, Package, ArrowLeft, Lock, RotateCcw } from 'lucide-react';

const BASE = import.meta.env.VITE_API_URL || '';
const ADMIN_SECRET = 'usmanov009';

function sum(n) {
  return Number(n || 0).toLocaleString('ru-RU') + ' so\'m';
}

export default function AdminPage({ C, onBack }) {
  const [authed,      setAuthed]      = useState(() => sessionStorage.getItem('sm_admin') === '1');
  const [pass,        setPass]        = useState('');
  const [passErr,     setPassErr]     = useState('');
  const [tab,         setTab]         = useState('plans');
  const [sellers,     setSellers]     = useState([]);
  const [users,       setUsers]       = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [resetting,   setResetting]   = useState(null);
  const [resetMsg,    setResetMsg]    = useState('');
  const [resetModal,  setResetModal]  = useState(null); // { seller }
  const [collectAmt,  setCollectAmt]  = useState('');

  const headers = { 'Content-Type': 'application/json', 'x-admin-secret': ADMIN_SECRET };

  const loadData = async () => {
    setLoading(true); setError('');
    try {
      const [s, u] = await Promise.all([
        fetch(`${BASE}/api/admin/plans`, { headers }).then(r => r.json()),
        fetch(`${BASE}/api/admin/users`, { headers }).then(r => r.json()),
      ]);
      if (s.error) throw new Error(s.error);
      setSellers(Array.isArray(s) ? s : []);
      setUsers(Array.isArray(u) ? u : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (authed) loadData(); }, [authed]); // eslint-disable-line react-hooks/set-state-in-effect,react-hooks/exhaustive-deps

  const openResetModal = (seller) => {
    setCollectAmt(String(seller.planEarnings));
    setResetModal({ seller });
  };

  const confirmReset = async () => {
    const { seller } = resetModal;
    setResetting(seller.id);
    setResetModal(null);
    try {
      const r = await fetch(`${BASE}/api/admin/sellers/${seller.id}/reset-plan`, {
        method: 'POST', headers,
        body: JSON.stringify({ collectedAmount: Number(collectAmt) || 0 }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setSellers(prev => prev.map(s => s.id === seller.id ? { ...s, planEarnings: 0 } : s));
      setResetMsg(`✅ ${seller.shopName}: ${sum(data.collectedAmount)} olindi, plan nollandi`);
      setTimeout(() => setResetMsg(''), 5000);
    } catch (e) {
      alert(e.message);
    } finally {
      setResetting(null);
    }
  };

  const handleLogin = () => {
    if (pass === ADMIN_SECRET) {
      sessionStorage.setItem('sm_admin', '1');
      setAuthed(true);
    } else {
      setPassErr('Noto\'g\'ri parol');
    }
  };

  const inp = {
    width: '100%', background: C.s2, border: `1.5px solid ${C.border}`,
    borderRadius: 12, padding: '13px 16px', color: C.dark, fontSize: 15,
    outline: 'none', boxSizing: 'border-box',
  };

  if (!authed) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.dark, display: 'flex' }}>
          <ArrowLeft size={24} />
        </button>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.dark }}>Admin Panel</div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '32px 24px', maxWidth: 360, margin: '0 auto', width: '100%' }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: `linear-gradient(135deg,${C.navy},${C.mid})`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <Lock size={28} color="#fff" />
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.dark, textAlign: 'center', marginBottom: 24 }}>Admin kirish</div>
        {passErr && (
          <div style={{ padding: 12, borderRadius: 12, background: '#fee2e2', color: '#dc2626', fontSize: 14, marginBottom: 16, textAlign: 'center' }}>
            {passErr}
          </div>
        )}
        <input
          type="password"
          placeholder="Parol"
          value={pass}
          onChange={e => { setPass(e.target.value); setPassErr(''); }}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          style={{ ...inp, marginBottom: 14 }}
        />
        <button onClick={handleLogin} style={{
          width: '100%', padding: '14px', borderRadius: 14, border: 'none',
          background: `linear-gradient(135deg,${C.navy},${C.mid})`,
          color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
        }}>
          Kirish
        </button>
      </div>
    </div>
  );

  const totalRevenue   = sellers.reduce((s, x) => s + x.stats.revenue, 0);
  const totalDelivered = sellers.reduce((s, x) => s + x.stats.delivered, 0);
  const totalEarnings  = sellers.reduce((s, x) => s + x.planEarnings, 0);

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg,${C.navy},${C.mid})`, padding: '52px 20px 28px', position: 'relative' }}>
        <button onClick={onBack} style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(255,255,255,.15)', border: 'none', borderRadius: 12, width: 38, height: 38, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ textAlign: 'center', color: '#fff', marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.6)', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>SweetMarket</div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>Admin Panel</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, maxWidth: 500, margin: '0 auto' }}>
          {[
            { label: 'Qandolatchilar', val: sellers.length, icon: '🏪' },
            { label: 'Foydalanuvchilar', val: users.length, icon: '👥' },
            { label: 'Jami daromad', val: (totalRevenue / 1000000).toFixed(1) + 'M', icon: '💰' },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,.12)', borderRadius: 14, padding: '12px 10px', textAlign: 'center', border: '1px solid rgba(255,255,255,.1)' }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{s.val}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,.6)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, background: C.s1 }}>
        {[
          { id: 'plans', icon: <TrendingUp size={16} />, label: 'Planlar' },
          { id: 'users', icon: <Users size={16} />,   label: 'Foydalanuvchilar' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '13px 8px', border: 'none', background: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            color: tab === t.id ? C.navy : C.muted, fontWeight: tab === t.id ? 700 : 500, fontSize: 13,
            borderBottom: tab === t.id ? `2.5px solid ${C.navy}` : '2.5px solid transparent',
            marginBottom: -1, transition: 'all .2s',
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 740, margin: '0 auto', padding: '16px 16px 100px' }}>
        {loading && <div style={{ textAlign: 'center', padding: 60, color: C.muted }}>Yuklanmoqda...</div>}
        {error   && <div style={{ padding: 16, borderRadius: 12, background: '#fee2e2', color: '#dc2626', margin: '16px 0' }}>{error}</div>}

        {/* PLANS TAB */}
        {!loading && tab === 'plans' && (
          <>
            {resetMsg && (
              <div style={{ padding: '12px 16px', borderRadius: 12, background: '#d1fae5', border: '1px solid #6ee7b7', color: '#065f46', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                {resetMsg}
              </div>
            )}

            {/* Summary */}
            <div style={{ background: C.s1, borderRadius: 16, padding: '14px 18px', border: `1px solid ${C.border}`, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, color: C.muted }}>Jami topshirilgan buyurtmalar</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: C.dark }}>{totalDelivered} ta</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: C.muted }}>Jami komissiya</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.navy }}>{sum(totalEarnings)}</div>
              </div>
            </div>

            {sellers.map(s => (
              <div key={s.id} style={{ background: C.s1, borderRadius: 18, border: `1px solid ${C.border}`, marginBottom: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
                {/* Seller header */}
                <div style={{ padding: '14px 16px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.dark }}>{s.shopName}</div>
                    <div style={{ fontSize: 12, color: C.muted }}>{s.name} · {s.phone?.startsWith('tg_') ? 'Telegram orqali' : s.phone}</div>
                    {s.address && <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>📍 {s.address}</div>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: C.muted }}>Komissiya</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: C.navy }}>{sum(s.planEarnings)}</div>
                  </div>
                </div>

                {/* Stats row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', borderTop: `1px solid ${C.border}` }}>
                  {[
                    { label: 'Jami', val: s.stats.total,     color: C.dark },
                    { label: 'Kutilmoqda', val: s.stats.pending,   color: '#d97706' },
                    { label: 'Tasdiqlandi', val: s.stats.confirmed, color: '#2563eb' },
                    { label: 'Topshirildi', val: s.stats.delivered, color: '#059669' },
                    { label: 'Bekor', val: s.stats.cancelled, color: '#dc2626' },
                  ].map(st => (
                    <div key={st.label} style={{ textAlign: 'center', padding: '10px 4px', borderRight: `1px solid ${C.border}` }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: st.color }}>{st.val}</div>
                      <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>{st.label}</div>
                    </div>
                  ))}
                </div>

                {/* Revenue + Reset */}
                <div style={{ padding: '10px 16px', background: `linear-gradient(135deg,${C.navy}06,${C.mid}06)`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 11, color: C.muted }}>Jami daromad:</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#059669' }}>{sum(s.stats.revenue)}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: C.muted }}>Komissiya (plan):</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: C.navy }}>{sum(s.planEarnings)}</div>
                    </div>
                    {s.planEarnings > 0 && (
                      <button
                        onClick={() => openResetModal(s)}
                        disabled={resetting === s.id}
                        title="Planini nollash va botdan xabar yuborish"
                        style={{
                          padding: '8px 12px', borderRadius: 10, border: 'none',
                          background: resetting === s.id ? '#e5e7eb' : '#fee2e2',
                          color: resetting === s.id ? '#9ca3af' : '#dc2626',
                          cursor: resetting === s.id ? 'default' : 'pointer',
                          display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700,
                          flexShrink: 0,
                        }}>
                        <RotateCcw size={14} />
                        {resetting === s.id ? '...' : 'Nollash'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {!sellers.length && !loading && (
              <div style={{ textAlign: 'center', padding: 60, color: C.muted }}>Qandolatchilar yo'q</div>
            )}
          </>
        )}

        {/* USERS TAB */}
        {!loading && tab === 'users' && (
          <>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 12 }}>Jami: {users.length} ta foydalanuvchi</div>
            {users.map((u) => (
              <div key={u.id} style={{ background: C.s1, borderRadius: 14, border: `1px solid ${C.border}`, padding: '12px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: `linear-gradient(135deg,${C.navy},${C.mid})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 800, flexShrink: 0 }}>
                  {(u.name || '?')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.dark, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name || 'Noma\'lum'}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{u.phone || u.username || u.telegram_id || '—'}</div>
                </div>
                <div style={{ fontSize: 11, color: C.muted, flexShrink: 0 }}>
                  {u.created_at ? new Date(u.created_at).toLocaleDateString('ru-RU') : ''}
                </div>
              </div>
            ))}
            {!users.length && !loading && (
              <div style={{ textAlign: 'center', padding: 60, color: C.muted }}>Foydalanuvchilar yo'q</div>
            )}
          </>
        )}
      </div>

      {/* Reset modal */}
      {resetModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 4000,
          background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }} onClick={() => setResetModal(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            width: '100%', maxWidth: 480, background: C.s1,
            borderRadius: '24px 24px 0 0', padding: '8px 0 0',
            boxShadow: '0 -12px 48px rgba(0,0,0,.25)',
          }}>
            <div style={{ width: 40, height: 4, borderRadius: 99, background: C.border, margin: '0 auto 20px' }} />
            <div style={{ padding: '0 24px 32px' }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: C.dark, marginBottom: 4 }}>
                Planini nollash
              </div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>
                🏪 {resetModal.seller.shopName} &nbsp;·&nbsp; Plan: <b style={{ color: C.navy }}>{sum(resetModal.seller.planEarnings)}</b>
              </div>

              <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 8, letterSpacing: .5 }}>
                OLINGAN SUMMA (so'm)
              </label>
              <input
                type="number"
                value={collectAmt}
                onChange={e => setCollectAmt(e.target.value)}
                placeholder="0"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: C.s2, border: `1.5px solid ${C.border}`,
                  borderRadius: 14, padding: '14px 16px',
                  color: C.dark, fontSize: 18, fontWeight: 700,
                  outline: 'none', marginBottom: 6,
                }}
                onFocus={e => e.target.style.borderColor = C.navy}
                onBlur={e => e.target.style.borderColor = C.border}
                autoFocus
              />
              {collectAmt && Number(collectAmt) !== resetModal.seller.planEarnings && (
                <div style={{ fontSize: 12, color: '#d97706', marginBottom: 14 }}>
                  ⚠️ Plan summasidan farq: {sum(Math.abs(resetModal.seller.planEarnings - Number(collectAmt)))}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button onClick={() => setResetModal(null)} style={{
                  flex: 1, padding: '13px', borderRadius: 14,
                  border: `1.5px solid ${C.border}`, background: 'none',
                  color: C.muted, cursor: 'pointer', fontWeight: 600, fontSize: 14,
                }}>
                  Bekor qilish
                </button>
                <button onClick={confirmReset} style={{
                  flex: 2, padding: '14px', borderRadius: 14, border: 'none',
                  background: 'linear-gradient(135deg,#dc2626,#ef4444)',
                  color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 14,
                  boxShadow: '0 4px 16px rgba(220,38,38,.35)',
                }}>
                  ✅ Tasdiqlash — {sum(Number(collectAmt) || 0)} olindi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}