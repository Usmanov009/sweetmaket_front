import { useState, useEffect, useRef } from 'react';
import {
  Package, SignOut, Storefront, Phone, X,
  ChatCircle, CheckCircle, XCircle, UserCircle, MapPin, ClipboardText,
  CircleNotch, CurrencyDollar, Star, TrendUp, Clock,
} from '@phosphor-icons/react';

const ADMIN_PHONE = '998902021051';
import { sum } from '../utils/format';
import ChatModal from '../components/ChatModal';

const BASE = import.meta.env.VITE_API_URL || '';

function sellerFetch(method, path, body) {
  const token = localStorage.getItem('sm_seller_token') || '';
  return fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  }).then(async r => {
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || 'Xato');
    return data;
  });
}

const STATUS_META = {
  pending:   { label: 'Kutilmoqda',     color: '#d97706', bg: 'rgba(217,119,6,.1)'   },
  confirmed: { label: 'Tasdiqlandi',    color: '#2563eb', bg: 'rgba(37,99,235,.1)'   },
  ready:     { label: 'Tayyor',         color: '#059669', bg: 'rgba(5,150,105,.12)'  },
  delivered: { label: 'Topshirildi',   color: '#7c3aed', bg: 'rgba(124,58,237,.1)'  },
  cancelled: { label: 'Bekor qilindi', color: '#dc2626', bg: 'rgba(220,38,38,.1)'   },
};

/* ─── Add-product modal ─────────────────────────────── */
/* ─── Order card ─────────────────────────────────────── */
function OrderCard({ order, C, onConfirm, onCancel, onReady, onDeliver, onChat }) {
  const meta = STATUS_META[order.status] || { label: order.status, color: '#666', bg: '#eee' };
  return (
    <div style={{
      background: C.s1, borderRadius: 20, padding: 16, marginBottom: 12,
      border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(0,0,0,.04)',
    }}>
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.dark }}>{order.user_name || 'Xaridor'}</div>
          {order.user_phone && (
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Phone size={12} /> {order.user_phone}
            </div>
          )}
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: meta.color, background: meta.bg, padding: '4px 12px', borderRadius: 50 }}>
          {meta.label}
        </span>
      </div>

      {/* User address */}
      {order.address && (
        <div style={{
          fontSize: 12, color: '#059669', marginBottom: 10,
          display: 'flex', alignItems: 'center', gap: 5,
          background: 'rgba(5,150,105,.07)', padding: '7px 12px', borderRadius: 10,
        }}>
          <MapPin size={13} weight="fill" /> Xaridor manzili: <b>{order.address}</b>
        </div>
      )}

      {/* Items */}
      <div style={{ background: C.s2, borderRadius: 12, padding: '10px 14px', marginBottom: 12 }}>
        {(Array.isArray(order.items) ? order.items : []).map((item, i, arr) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between', fontSize: 13, color: C.dark,
            marginBottom: i < arr.length - 1 ? 6 : 0,
          }}>
            <span>{item.emoji || '🎂'} {item.name} × {item.qty || 1}</span>
            <span style={{ fontWeight: 700, color: '#059669' }}>{sum((item.price || 0) * (item.qty || 1))}</span>
          </div>
        ))}
      </div>

      {/* Bottom row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: C.dark }}>{sum(order.total)}</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {/* Chat button — always visible */}
          <button onClick={() => onChat(order)} style={{
            padding: '7px 12px', borderRadius: 10, border: 'none',
            background: 'rgba(139,92,246,.12)', color: '#7c3aed',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600,
          }}>
            <ChatCircle size={15} /> Chat
          </button>

          {order.status === 'pending' && (
            <>
              <button onClick={() => onConfirm(order.id)} style={{
                padding: '7px 14px', borderRadius: 10, border: 'none',
                background: 'rgba(37,99,235,.12)', color: '#2563eb',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700,
              }}>
                <CheckCircle size={14} /> Qabul
              </button>
              <button onClick={() => onCancel(order.id)} style={{
                padding: '7px 14px', borderRadius: 10, border: 'none',
                background: 'rgba(220,38,38,.08)', color: '#dc2626',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700,
              }}>
                <XCircle size={14} /> Rad
              </button>
            </>
          )}

          {order.status === 'confirmed' && (
            <button onClick={() => onReady(order.id)} style={{
              padding: '7px 14px', borderRadius: 10, border: 'none',
              background: 'rgba(5,150,105,.12)', color: '#059669',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700,
            }}>
              <CheckCircle size={14} /> Tayyor
            </button>
          )}

          {order.status === 'ready' && (
            <button onClick={() => onDeliver(order.id)} style={{
              padding: '7px 14px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
              color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700,
            }}>
              <Package size={14} /> Topshirildi
            </button>
          )}
        </div>
      </div>

      {order.created_at && (
        <div style={{ fontSize: 11, color: C.muted, marginTop: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Clock size={11} />
          {new Date(order.created_at).toLocaleString('uz-UZ', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </div>
      )}
    </div>
  );
}

/* ─── Main component ─────────────────────────────────── */
export default function SellerDashboardPage({ seller, onLogout, C, isDesktop, setPage }) {
  const isAdmin = (seller?.phone || '').replace(/\D/g, '').endsWith(ADMIN_PHONE.replace(/\D/g, ''));
  const [tapCount, setTapCount] = useState(0);

  const handleSecretTap = () => {
    if (!isAdmin) return;
    setTapCount(n => {
      const next = n + 1;
      if (next >= 5) { setPage('admin'); return 0; }
      setTimeout(() => setTapCount(0), 2000);
      return next;
    });
  };
  const [orders,       setOrders]       = useState([]);
  const [plan,         setPlan]         = useState({ totalEarnings: 0, orders: [] });
  const [loading,      setLoading]      = useState(true);
  const [ordersError,  setOrdersError]  = useState('');
  const [tab,          setTab]          = useState('orders');
  const [showChat,     setShowChat]     = useState(false);
  const [chatData,     setChatData]     = useState(null);

  const loadOrders = () => {
    setLoading(true);
    setOrdersError('');
    sellerFetch('GET', '/api/seller/orders')
      .then(data => {
        setOrders(Array.isArray(data) ? data : []);
      })
      .catch(e => {
        setOrdersError(e?.message || 'Buyurtmalarni yuklashda xatolik');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOrders();
    sellerFetch('GET', '/api/seller/plan')
      .then(data => setPlan(data || { totalEarnings: 0, orders: [] }))
      .catch(() => {});
  }, []);

  const updateStatus = async (orderId, status) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    try {
      await sellerFetch('PATCH', `/api/seller/orders/${orderId}/status`, { status });
      // Refresh plan on deliver
      if (status === 'delivered') {
        sellerFetch('GET', '/api/seller/plan')
          .then(data => setPlan(data || { totalEarnings: 0, orders: [] }))
          .catch(() => {});
      }
    } catch(e) {
      // Revert on error
      loadOrders();
    }
  };


  const handleChat = order => {
    setChatData({ orderId: order.id, sellerId: seller?.id, sellerMode: true });
    setShowChat(true);
  };

  // API already filters by seller — no client-side re-filter needed
  const myOrders    = orders;
  const pendingCount = myOrders.filter(o => o.status === 'pending').length;
  const totalRevenue = myOrders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + Number(o.total || 0), 0);
  const topPad = isDesktop ? 0 : 52;

  const TABS = [
    { id: 'orders',  icon: <Package size={20} />,    label: 'Buyurtmalar', badge: pendingCount },
    { id: 'plan',    icon: <TrendUp size={20} />,    label: 'Plan' },
    { id: 'profile', icon: <UserCircle size={20} />, label: 'Profil' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>

      {/* ── Header ── */}
      <div style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #059669 100%)',
        padding: `${topPad + 20}px 20px 28px`,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position:'absolute', width:300, height:300, borderRadius:'50%', background:'rgba(255,255,255,.04)', top:-100, right:-80 }} />
        <div style={{ position:'absolute', width:150, height:150, borderRadius:'50%', background:'rgba(255,255,255,.05)', bottom:-50, left:20 }} />

        <div style={{ maxWidth: 740, margin: '0 auto', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.55)', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
                Sotuvchi kabineti
              </div>
              <div onClick={handleSecretTap} style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 2, cursor: 'default', userSelect: 'none' }}>
                {isAdmin ? 'Sotuvchi kabineti' : seller?.shopName}
              </div>
              {!isAdmin && (
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,.65)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <UserCircle size={13} /> {seller?.name}
                </div>
              )}
            </div>
            <button onClick={onLogout} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.18)',
              borderRadius: 12, padding: '8px 14px', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}>
              <SignOut size={15} /> Chiqish
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            {[
              { icon: <ClipboardText size={20} />, val: myOrders.length, label: 'Jami buyurtma' },
              { icon: <CurrencyDollar size={20} />, val: sum(totalRevenue), label: 'Jami daromad', small: true },
              { icon: <Package size={20} />, val: pendingCount, label: 'Kutilmoqda' },
            ].map(s => (
              <div key={s.label} style={{
                background: 'rgba(255,255,255,.1)', backdropFilter: 'blur(10px)',
                borderRadius: 16, padding: '14px 12px', textAlign: 'center',
                border: '1px solid rgba(255,255,255,.08)',
              }}>
                <div style={{ color: 'rgba(255,255,255,.65)', marginBottom: 6, display: 'flex', justifyContent: 'center' }}>{s.icon}</div>
                <div style={{ fontSize: s.small ? 11 : 20, fontWeight: 900, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.val}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,.55)', marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div style={{ maxWidth: 740, margin: '0 auto' }}>
        <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, background: C.s1, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {TABS.map(({ id, icon, label, badge }) => (
            <button key={id} onClick={() => setTab(id)} style={{
              flex: 1, minWidth: 70, padding: '14px 8px',
              border: 'none', background: 'none', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              color: tab === id ? '#059669' : C.muted,
              borderBottom: tab === id ? '2.5px solid #059669' : '2.5px solid transparent',
              transition: 'all .2s', position: 'relative',
              fontWeight: tab === id ? 700 : 500, fontSize: 11, marginBottom: -1,
            }}>
              {icon}
              {label}
              {badge > 0 && (
                <span style={{
                  position: 'absolute', top: 8, right: '18%',
                  background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 800,
                  minWidth: 16, height: 16, borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px',
                }}>
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>

        <div style={{ padding: '16px 16px 100px' }}>

          {/* ── Orders tab ── */}
          {tab === 'orders' && (
            loading ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: C.muted }}>
                <CircleNotch size={32} style={{ animation: 'spin 1s linear infinite', opacity: .4 }} />
              </div>
            ) : ordersError ? (
              <div style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 14, padding: '16px 18px', marginBottom: 12 }}>
                <div style={{ color: '#ef4444', fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Xatolik yuz berdi</div>
                <div style={{ color: '#ef4444', fontSize: 12 }}>{ordersError}</div>
                <button onClick={loadOrders} style={{ marginTop: 10, padding: '7px 14px', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                  Qayta urinish
                </button>
              </div>
            ) : myOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '64px 20px' }}>
                <Package size={56} weight="duotone" color={C.muted} style={{ opacity: .35 }} />
                <div style={{ fontWeight: 700, color: C.dark, marginTop: 14, marginBottom: 6 }}>Buyurtmalar yo'q</div>
                <div style={{ color: C.muted, fontSize: 13 }}>Yangi buyurtmalar bu yerda ko'rinadi</div>
                <div style={{ color: C.muted, fontSize: 11, marginTop: 8, opacity: 0.6 }}>Sotuvchi ID: {seller?.id}</div>
              </div>
            ) : myOrders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                C={C}
                onConfirm={id => updateStatus(id, 'confirmed')}
                onCancel={id => updateStatus(id, 'cancelled')}
                onReady={id => updateStatus(id, 'ready')}
                onDeliver={id => updateStatus(id, 'delivered')}
                onChat={handleChat}
              />
            ))
          )}

          {tab === 'plan' && (
            <div>
              {/* Total earnings card */}
              <div style={{
                background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
                borderRadius: 20, padding: '28px 24px', marginBottom: 20, textAlign: 'center',
              }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
                  Jami Plan Daromadi (10%)
                </div>
                <div style={{ fontSize: 36, fontWeight: 900, color: '#fff', fontFamily: "'Playfair Display',serif" }}>
                  {sum(plan.totalEarnings)}
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', marginTop: 8 }}>
                  {plan.orders?.length || 0} ta topshirilgan buyurtmadan
                </div>
              </div>

              {/* Delivered orders list */}
              {(!plan.orders || plan.orders.length === 0) ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <TrendUp size={56} weight="duotone" color={C.muted} style={{ opacity: .35 }} />
                  <div style={{ fontWeight: 700, color: C.dark, marginTop: 14, marginBottom: 6 }}>Hali topshirilgan buyurtma yo'q</div>
                  <div style={{ color: C.muted, fontSize: 13 }}>Buyurtma topshirilganda 10% plan hisobiga o'tadi</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {plan.orders.map((o, i) => (
                    <div key={o.id || i} style={{
                      background: C.s1, borderRadius: 16, padding: '14px 18px',
                      border: `1px solid ${C.border}`,
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 3 }}>
                          Buyurtma #{o.id?.slice(-6)}
                        </div>
                        {o.address && (
                          <div style={{ fontSize: 12, color: C.muted, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <MapPin size={11} /> {o.address}
                          </div>
                        )}
                        {o.createdAt && (
                          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                            {new Date(o.createdAt).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' })}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 13, color: C.muted, marginBottom: 2 }}>{sum(o.total)}</div>
                        <div style={{ fontSize: 16, fontWeight: 900, color: '#7c3aed' }}>+{sum(o.commission)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Profile tab ── */}
          {tab === 'profile' && (
            <div>
              <div style={{
                background: 'linear-gradient(135deg,#064e3b,#059669)',
                borderRadius: 20, padding: '28px 24px', marginBottom: 16, textAlign: 'center',
              }}>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: 'rgba(255,255,255,.2)', margin: '0 auto 12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '3px solid rgba(255,255,255,.3)',
                }}>
                  <UserCircle size={40} color="#fff" weight="duotone" />
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>{seller?.shopName}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,.65)', marginTop: 4 }}>{seller?.name}</div>
              </div>

              <div style={{ background: C.s1, borderRadius: 20, overflow: 'hidden', border: `1px solid ${C.border}` }}>
                {[
                  { icon: <Storefront size={18} weight="duotone" />, label: "Do'kon nomi", val: seller?.shopName, color: '#059669' },
                  { icon: <UserCircle size={18} weight="duotone" />, label: 'Ism Familiya',  val: seller?.name,     color: '#4f46e5' },
                  { icon: <Phone size={18} weight="duotone" />,      label: 'Telefon',       val: seller?.phone,    color: '#0088cc' },
                  { icon: <MapPin size={18} weight="duotone" />,     label: 'Manzil',        val: seller?.address || '—', color: '#d97706' },
                ].map((row, i, arr) => (
                  <div key={row.label} style={{
                    display: 'flex', gap: 14, alignItems: 'center', padding: '16px 20px',
                    borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : 'none',
                  }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 12,
                      background: `${row.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: row.color, flexShrink: 0,
                    }}>
                      {row.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 2 }}>{row.label}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: C.dark }}>{row.val}</div>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={onLogout} style={{
                width: '100%', marginTop: 16, padding: 14, borderRadius: 14,
                border: '1.5px solid rgba(220,38,38,.25)', background: 'rgba(220,38,38,.05)',
                color: '#dc2626', cursor: 'pointer', fontWeight: 700, fontSize: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                <SignOut size={16} /> Kabinetdan chiqish
              </button>
            </div>
          )}

        </div>
      </div>


      {showChat && chatData && (
        <ChatModal
          onClose={() => setShowChat(false)}
          orderId={chatData.orderId}
          sellerId={chatData.sellerMode ? chatData.sellerId : null}
          userId={chatData.sellerMode ? null : chatData.userId}
          isSeller={chatData.sellerMode}
          C={C}
          isDesktop={isDesktop}
        />
      )}
    </div>
  );
}
