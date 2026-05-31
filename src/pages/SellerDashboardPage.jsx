import { useState, useEffect, useRef } from 'react';
import SellerCreatePage from './SellerCreatePage';
import {
  Package, LogOut, Store, Phone, X,
  MessageCircle, CheckCircle, XCircle, UserCircle2, MapPin, ClipboardList,
  Loader2, DollarSign, Star, TrendingUp, Clock, Plus, Trash2, Building2, Pencil, ArrowLeft, Check,
} from 'lucide-react';
import { sum } from '../utils/format';
import { REGIONS } from '../constants/regions.js';
import ChatModal from '../components/ChatModal';
import { useLocale } from '../locale.jsx';

const ADMIN_PHONE = '998902021051';

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

function getStatusMeta(t) {
  return {
    pending:   { label: t('orderPending'),   color: '#d97706', bg: 'rgba(217,119,6,.1)'   },
    confirmed: { label: t('orderConfirmed'), color: '#2563eb', bg: 'rgba(37,99,235,.1)'   },
    ready:     { label: t('orderReady'),     color: '#059669', bg: 'rgba(5,150,105,.12)'  },
    delivered: { label: t('orderDelivered'), color: '#7c3aed', bg: 'rgba(124,58,237,.1)'  },
    cancelled: { label: t('orderCancelled'), color: '#dc2626', bg: 'rgba(220,38,38,.1)'   },
  };
}

/* ─── Order card ─────────────────────────────────────── */
function OrderCard({ order, C, onConfirm, onCancel, onReady, onDeliver, onChat, t }) {
  const STATUS_META = getStatusMeta(t);
  const meta = STATUS_META[order.status] || { label: order.status, color: '#666', bg: '#eee' };
  return (
    <div style={{
      background: C.s1, borderRadius: 20, padding: 16, marginBottom: 12,
      border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(0,0,0,.04)',
    }}>
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.dark }}>{order.user_name || t('buyer')}</div>
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
          <MapPin size={13} weight="fill" /> {t('buyerAddress')} <b>{order.address}</b>
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
            <MessageCircle size={15} /> {t('chat')}
          </button>

          {order.status === 'pending' && (
            <>
              <button onClick={() => onConfirm(order.id)} style={{
                padding: '7px 14px', borderRadius: 10, border: 'none',
                background: 'rgba(37,99,235,.12)', color: '#2563eb',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700,
              }}>
                <CheckCircle size={14} /> {t('accept')}
              </button>
              <button onClick={() => onCancel(order.id)} style={{
                padding: '7px 14px', borderRadius: 10, border: 'none',
                background: 'rgba(220,38,38,.08)', color: '#dc2626',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700,
              }}>
                <XCircle size={14} /> {t('reject')}
              </button>
            </>
          )}

          {order.status === 'confirmed' && (
            <button onClick={() => onReady(order.id)} style={{
              padding: '7px 14px', borderRadius: 10, border: 'none',
              background: 'rgba(5,150,105,.12)', color: '#059669',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700,
            }}>
              <CheckCircle size={14} /> {t('ready')}
            </button>
          )}

          {order.status === 'ready' && (
            <button onClick={() => onDeliver(order.id)} style={{
              padding: '7px 14px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
              color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700,
            }}>
              <Package size={14} /> {t('orderDelivered')}
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
export default function SellerDashboardPage({ seller, setSeller, onLogout, C, isDesktop, setPage }) {
  const { t, lang } = useLocale();
  const isAdmin = (seller?.phone || '').replace(/\D/g, '').endsWith(ADMIN_PHONE.replace(/\D/g, ''));
  const [_tapCount, setTapCount] = useState(0);
  const tapTimerRef = useRef(null);

  const handleSecretTap = () => {
    if (!isAdmin) return;
    setTapCount(n => {
      const next = n + 1;
      if (next >= 5) {
        clearTimeout(tapTimerRef.current);
        setPage('admin');
        return 0;
      }
      clearTimeout(tapTimerRef.current);
      tapTimerRef.current = setTimeout(() => setTapCount(0), 2000);
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

  // Products state
  const [products,      setProducts]      = useState([]);
  const [showCreate,    setShowCreate]    = useState(false);
  const [editProduct,   setEditProduct]   = useState(null); // { id, name, price, desc }
  const [editProductSaving, setEditProductSaving] = useState(false);

  // Address edit state
  const [editAddress,     setEditAddress]   = useState(false);
  const [addrStep,        setAddrStep]      = useState('region'); // 'region' | 'city' | 'street'
  const [addrRegion,      setAddrRegion]    = useState(null);
  const [addrCity,        setAddrCity]      = useState('');
  const [addrStreet,      setAddrStreet]    = useState('');
  const [addrSaving,      setAddrSaving]    = useState(false);

  // Branches state
  const [branches,      setBranches]      = useState([]);
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [editBranch,    setEditBranch]    = useState(null);
  const [branchForm,    setBranchForm]    = useState({ name: '', address: '', phone: '', workingHours: '' });
  const [branchLoading, setBranchLoading] = useState(false);

  const loadOrders = () => {
    setLoading(true);
    setOrdersError('');
    sellerFetch('GET', '/api/seller/orders')
      .then(data => {
        setOrders(Array.isArray(data) ? data : []);
      })
      .catch(e => {
        setOrdersError(e?.message || t('errorOccurred'));
      })
      .finally(() => setLoading(false));
  };

  const loadProducts = () => {
    sellerFetch('GET', '/api/seller/posts').then(data => setProducts(Array.isArray(data) ? data : [])).catch(() => {});
  };

  const saveAddress = async () => {
    if (!addrRegion || !addrCity) return;
    setAddrSaving(true);
    const regionName = lang === 'ru' ? (addrRegion.nameRu || addrRegion.name) : addrRegion.name;
    const fullAddress = addrStreet.trim()
      ? `${addrStreet.trim()}, ${addrCity}, ${regionName}`
      : `${addrCity}, ${regionName}`;
    try {
      await sellerFetch('PATCH', '/api/seller/location', { region: addrRegion.name, city: addrCity });
      await sellerFetch('PATCH', '/api/seller/address', { address: fullAddress });
      setSeller(s => ({ ...s, region: addrRegion.name, city: addrCity, address: fullAddress }));
      setEditAddress(false);
    } catch(e) { alert(e.message); }
    finally { setAddrSaving(false); }
  };

  const loadBranches = () => {
    sellerFetch('GET', '/api/seller/branches').then(data => setBranches(Array.isArray(data) ? data : [])).catch(() => {});
  };

  const saveBranch = async () => {
    if (!branchForm.address.trim()) return;
    setBranchLoading(true);
    try {
      if (editBranch) {
        await sellerFetch('PATCH', `/api/seller/branches/${editBranch.id}`, branchForm);
      } else {
        await sellerFetch('POST', '/api/seller/branches', branchForm);
      }
      setShowBranchForm(false);
      setEditBranch(null);
      setBranchForm({ name: '', address: '', phone: '', workingHours: '' });
      loadBranches();
    } catch(err) {
      alert(err.message);
    } finally {
      setBranchLoading(false);
    }
  };

  const deleteBranch = async (id) => {
    if (!confirm("Filialni o'chirishni tasdiqlaysizmi?")) return;
    setBranches(prev => prev.filter(b => b.id !== id));
    sellerFetch('DELETE', `/api/seller/branches/${id}`).catch(() => loadBranches());
  };

  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
  useEffect(() => {
    loadOrders();
    sellerFetch('GET', '/api/seller/plan').then(data => setPlan(data || { totalEarnings: 0, orders: [] })).catch(() => {});
    loadProducts();
    loadBranches();
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

  const deleteProduct = async (id) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    sellerFetch('DELETE', `/api/seller/publish/${id}`).catch(() => loadProducts());
  };

  const updateProduct = async () => {
    if (!editProduct) return;
    setEditProductSaving(true);
    try {
      const updated = await sellerFetch('PATCH', `/api/seller/products/${editProduct.id}`, {
        name: editProduct.name,
        price: editProduct.price,
        desc: editProduct.desc,
      });
      setProducts(prev => prev.map(p => p.id === editProduct.id ? { ...p, ...updated } : p));
      setEditProduct(null);
    } catch(e) { alert(e.message); }
    finally { setEditProductSaving(false); }
  };

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
    } catch(_) {
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
    { id: 'orders',   icon: <Package size={20} />,    label: t('tabOrders'),   badge: pendingCount },
    { id: 'products', icon: <Plus size={20} />,       label: t('tabProducts') },
    { id: 'plan',     icon: <TrendingUp size={20} />,    label: t('tabPlan') },
    { id: 'profile',  icon: <UserCircle2 size={20} />, label: t('navProfile') },
  ];

  if (showCreate) return (
    <SellerCreatePage
      C={C}
      onBack={() => setShowCreate(false)}
      onPublished={() => { setShowCreate(false); loadProducts(); }}
    />
  );

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
                {t('sellerCabinet')}
              </div>
              <div onClick={handleSecretTap} style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 2, cursor: 'default', userSelect: 'none' }}>
                {isAdmin ? t('sellerCabinet') : seller?.shopName}
              </div>
              {!isAdmin && (
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,.65)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <UserCircle2 size={13} /> {seller?.name}
                </div>
              )}
            </div>
            <button onClick={onLogout} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.18)',
              borderRadius: 12, padding: '8px 14px', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}>
              <LogOut size={15} /> {t('logout')}
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            {[
              { icon: <ClipboardList size={20} />, val: myOrders.length, label: t('totalOrders') },
              { icon: <DollarSign size={20} />, val: sum(totalRevenue), label: t('totalRevenue'), small: true },
              { icon: <Package size={20} />, val: pendingCount, label: t('orderPending') },
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
                <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', opacity: .4 }} />
              </div>
            ) : ordersError ? (
              <div style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 14, padding: '16px 18px', marginBottom: 12 }}>
                <div style={{ color: '#ef4444', fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{t('errorOccurred')}</div>
                <div style={{ color: '#ef4444', fontSize: 12 }}>{ordersError}</div>
                <button onClick={loadOrders} style={{ marginTop: 10, padding: '7px 14px', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                  {t('retry')}
                </button>
              </div>
            ) : myOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '64px 20px' }}>
                <Package size={56} weight="duotone" color={C.muted} style={{ opacity: .35 }} />
                <div style={{ fontWeight: 700, color: C.dark, marginTop: 14, marginBottom: 6 }}>{t('noOrders')}</div>
                <div style={{ color: C.muted, fontSize: 13 }}>{t('newOrdersHere')}</div>
                <div style={{ color: C.muted, fontSize: 11, marginTop: 8, opacity: 0.6 }}>Sotuvchi ID: {seller?.id}</div>
              </div>
            ) : myOrders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                C={C}
                t={t}
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
                  {t('planRevenue')}
                </div>
                <div style={{ fontSize: 36, fontWeight: 900, color: '#fff', fontFamily: "'Playfair Display',serif" }}>
                  {sum(plan.totalEarnings)}
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', marginTop: 8 }}>
                  {plan.orders?.length || 0} {t('fromDeliveredOrders')}
                </div>
              </div>

              {/* Delivered orders list */}
              {(!plan.orders || plan.orders.length === 0) ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <TrendingUp size={56} weight="duotone" color={C.muted} style={{ opacity: .35 }} />
                  <div style={{ fontWeight: 700, color: C.dark, marginTop: 14, marginBottom: 6 }}>{t('noDeliveredOrders')}</div>
                  <div style={{ color: C.muted, fontSize: 13 }}>{t('planDesc')}</div>
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

          {/* ── Products tab ── */}
          {tab === 'products' && (
            <div>
              <button onClick={() => setShowCreate(true)} style={{
                width: '100%', padding: '13px', borderRadius: 14, border: 'none', marginBottom: 16,
                background: 'linear-gradient(135deg,#059669,#047857)',
                color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                <Plus size={18} /> {t('newProductBtn')}
              </button>

              {products.length === 0 && (
                <div style={{ textAlign: 'center', padding: '48px 16px', color: C.muted }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🎂</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: C.dark, marginBottom: 6 }}>{t('noProducts')}</div>
                  <div style={{ fontSize: 13 }}>{t('addProductHint')}</div>
                </div>
              )}
              {products.map(p => (
                <div key={p.id} style={{ background: C.s1, borderRadius: 16, border: `1px solid ${C.border}`, padding: '14px 16px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: p.bg || C.s2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0, border: `1px solid ${C.border}` }}>
                    {p.emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.dark, marginBottom: 2 }}>{p.name}</div>
                    {p.desc && <div style={{ fontSize: 12, color: C.muted, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.desc}</div>}
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#059669' }}>{Number(p.price).toLocaleString('ru-RU')} so'm</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => setEditProduct({ id: p.id, name: p.name, price: p.price, desc: p.desc || '', emoji: p.emoji })}
                      style={{ background: 'rgba(5,150,105,.1)', border: 'none', borderRadius: 10, width: 36, height: 36, cursor: 'pointer', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => deleteProduct(p.id)}
                      style={{ background: 'rgba(220,38,38,.08)', border: 'none', borderRadius: 10, width: 36, height: 36, cursor: 'pointer', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}

              {/* ── Edit product modal ── */}
              {editProduct && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                  <div style={{ width: '100%', maxWidth: 560, background: C.s1, borderRadius: '24px 24px 0 0', padding: '24px 20px 40px', boxShadow: '0 -8px 40px rgba(0,0,0,.2)' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: C.dark }}>Mahsulotni tahrirlash</div>
                      <button onClick={() => setEditProduct(null)} style={{ width: 32, height: 32, borderRadius: '50%', background: C.s2, border: `1px solid ${C.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={15} color={C.muted} />
                      </button>
                    </div>
                    {/* Emoji + Name */}
                    <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                      <div style={{ width: 52, height: 52, borderRadius: 14, background: C.s2, border: `1.5px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
                        {editProduct.emoji}
                      </div>
                      <input
                        value={editProduct.name}
                        onChange={e => setEditProduct(p => ({ ...p, name: e.target.value }))}
                        placeholder="Mahsulot nomi"
                        style={{ flex: 1, background: C.s2, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: '0 14px', color: C.dark, fontSize: 14, fontWeight: 700, outline: 'none' }}
                      />
                    </div>
                    {/* Price */}
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Narx (so'm)</div>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="number"
                          value={editProduct.price}
                          onChange={e => setEditProduct(p => ({ ...p, price: e.target.value }))}
                          style={{ width: '100%', background: C.s2, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: '12px 60px 12px 14px', color: C.dark, fontSize: 15, fontWeight: 800, outline: 'none', boxSizing: 'border-box' }}
                        />
                        <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 13, fontWeight: 700, color: '#059669' }}>so'm</span>
                      </div>
                    </div>
                    {/* Desc */}
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Tavsif</div>
                      <textarea
                        value={editProduct.desc}
                        onChange={e => setEditProduct(p => ({ ...p, desc: e.target.value }))}
                        placeholder="Mahsulot haqida qisqacha..."
                        rows={2}
                        style={{ width: '100%', background: C.s2, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: '12px 14px', color: C.dark, fontSize: 13, resize: 'none', boxSizing: 'border-box', outline: 'none', lineHeight: 1.5 }}
                      />
                    </div>
                    {/* Buttons */}
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={() => setEditProduct(null)} style={{ flex: 1, padding: '13px 0', borderRadius: 14, border: `1.5px solid ${C.border}`, background: 'transparent', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: C.muted }}>
                        Bekor
                      </button>
                      <button onClick={updateProduct} disabled={editProductSaving} style={{ flex: 2, padding: '13px 0', borderRadius: 14, border: 'none', background: editProductSaving ? C.border : 'linear-gradient(135deg,#059669,#047857)', color: '#fff', cursor: editProductSaving ? 'default' : 'pointer', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        {editProductSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={16} />}
                        Saqlash
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Profile tab ── */}
          {tab === 'profile' && (
            <div>
              {/* Avatar card */}
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
                  <UserCircle2 size={40} color="#fff" weight="duotone" />
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>{seller?.shopName}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,.65)', marginTop: 4 }}>{seller?.name}</div>
              </div>

              {/* Info rows */}
              <div style={{ background: C.s1, borderRadius: 20, overflow: 'hidden', border: `1px solid ${C.border}`, marginBottom: 16 }}>
                {[
                  { icon: <Store size={18} weight="duotone" />, label: t('shopName'), val: seller?.shopName, color: '#059669' },
                  { icon: <UserCircle2 size={18} weight="duotone" />, label: t('yourName'), val: seller?.name,     color: '#4f46e5' },
                  {
                    icon: <Phone size={18} weight="duotone" />,
                    label: t('phone'),
                    val: seller?.phone?.startsWith('tg_')
                      ? <span style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <span style={{ background:'#0088cc18', color:'#0088cc', borderRadius:8, padding:'2px 8px', fontSize:12, fontWeight:700 }}>Telegram</span>
                          <span style={{ fontSize:15, fontWeight:700, color:C.dark }}>
                            {seller?.username ? `@${seller.username}` : seller?.name || '—'}
                          </span>
                        </span>
                      : seller?.phone,
                    color: '#0088cc'
                  },
                ].map((row, i, arr) => (
                  <div key={i} style={{
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
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 2 }}>{row.label}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: C.dark }}>{row.val}</div>
                    </div>
                  </div>
                ))}

                {/* Address row with edit */}
                <div style={{ padding: '16px 20px' }}>
                  {!editAddress ? (
                    <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                      <div style={{ width: 38, height: 38, borderRadius: 12, background: '#d9770618', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', flexShrink: 0 }}>
                        <MapPin size={18} weight="duotone" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 2 }}>{t('address')}</div>
                        {seller?.region || seller?.city ? (
                          <div>
                            <div style={{ fontSize: 13, color: C.navy, fontWeight: 700, marginBottom: 2 }}>
                              📍 {[seller?.region, seller?.city].filter(Boolean).join(', ')}
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: C.dark }}>
                              {seller?.address
                                ? seller.address.replace(/,?\s*(seller\.city|seller\.region).*$/i, '').split(',').slice(0, -2).join(',').trim() || seller.address
                                : '—'}
                            </div>
                          </div>
                        ) : (
                          <div style={{ fontSize: 14, fontWeight: 700, color: C.dark }}>{seller?.address || '—'}</div>
                        )}
                      </div>
                      <button onClick={() => {
                        setEditAddress(true);
                        setAddrStep('region');
                        setAddrRegion(null);
                        setAddrCity('');
                        setAddrStreet('');
                      }} style={{ background: '#d9770618', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Pencil size={14} />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: 12, color: C.muted, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <MapPin size={13} color="#d97706" />
                          {addrStep === 'region' ? (lang === 'ru' ? 'Выберите регион' : "Viloyatni tanlang") :
                           addrStep === 'city'   ? (lang === 'ru' ? 'Выберите город' : "Shaharni tanlang") :
                                                   (lang === 'ru' ? 'Введите улицу' : "Ko'chani kiriting")}
                        </span>
                        {addrStep !== 'region' && (
                          <button onClick={() => setAddrStep(addrStep === 'street' ? 'city' : 'region')}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, display: 'flex', alignItems: 'center', gap: 3, fontSize: 11 }}>
                            <ArrowLeft size={12} /> {lang === 'ru' ? 'Назад' : 'Orqaga'}
                          </button>
                        )}
                      </div>

                      {/* Step: region */}
                      {addrStep === 'region' && (
                        <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {REGIONS.map(r => (
                            <button key={r.id} onClick={() => {
                              setAddrRegion(r);
                              if (r.cities.length === 1) { setAddrCity(r.cities[0]); setAddrStep('street'); }
                              else setAddrStep('city');
                            }} style={{
                              padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`,
                              background: C.s2, cursor: 'pointer', textAlign: 'left',
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>
                                {lang === 'ru' ? r.nameRu : r.name}
                              </span>
                              <span style={{ color: C.muted }}>›</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Step: city */}
                      {addrStep === 'city' && addrRegion && (
                        <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {addrRegion.cities.map((c, i) => (
                            <button key={c} onClick={() => { setAddrCity(c); setAddrStep('street'); }} style={{
                              padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`,
                              background: C.s2, cursor: 'pointer', textAlign: 'left',
                              display: 'flex', alignItems: 'center', gap: 8,
                            }}>
                              <MapPin size={14} color="#d97706" weight="fill" />
                              <span style={{ fontSize: 13, fontWeight: 600, color: C.dark }}>
                                {lang === 'ru' ? addrRegion.citiesRu?.[i] : c}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Step: street */}
                      {addrStep === 'street' && (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, padding: '8px 12px', borderRadius: 10, background: '#d9770610', border: '1px solid #d9770630' }}>
                            <MapPin size={13} color="#d97706" weight="fill" />
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#d97706' }}>
                              {lang === 'ru' ? addrRegion?.nameRu : addrRegion?.name}, {addrCity}
                            </span>
                          </div>
                          <input
                            value={addrStreet}
                            onChange={e => setAddrStreet(e.target.value)}
                            placeholder={lang === 'ru' ? "Улица, дом (необязательно)" : "Ko'cha, uy (ixtiyoriy)"}
                            style={{
                              width: '100%', boxSizing: 'border-box', padding: '10px 14px',
                              borderRadius: 10, border: `1.5px solid ${C.border}`,
                              background: C.s2, color: C.dark, fontSize: 14, outline: 'none', marginBottom: 10,
                            }}
                          />
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={saveAddress} disabled={addrSaving} style={{
                              flex: 1, padding: '10px', borderRadius: 10, border: 'none',
                              background: 'linear-gradient(135deg,#d97706,#b45309)',
                              color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                            }}>
                              {addrSaving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={14} />}
                              {lang === 'ru' ? 'Сохранить' : 'Saqlash'}
                            </button>
                            <button onClick={() => setEditAddress(false)} style={{
                              padding: '10px 16px', borderRadius: 10, border: `1.5px solid ${C.border}`,
                              background: 'none', color: C.muted, fontWeight: 600, fontSize: 13, cursor: 'pointer',
                            }}>
                              {lang === 'ru' ? 'Отмена' : 'Bekor'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Filiallar bo'limi ── */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <Building2 size={20} color="#d97706" weight="duotone" />
                    <span style={{ fontSize: 15, fontWeight: 800, color: C.dark }}>Filiallar</span>
                    {branches.length > 0 && (
                      <span style={{ background: '#d9770618', color: '#d97706', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                        {branches.length}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => { setEditBranch(null); setBranchForm({ name:'', address:'', phone:'', workingHours:'' }); setShowBranchForm(true); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      background: 'linear-gradient(135deg,#d97706,#b45309)',
                      border: 'none', borderRadius: 10, padding: '8px 14px',
                      color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                    }}
                  >
                    <Plus size={14} /> Filial qo'shish
                  </button>
                </div>

                {/* Branch form */}
                {showBranchForm && (
                  <div style={{
                    background: C.s1, border: `1.5px solid #d97706`, borderRadius: 18,
                    padding: '18px 16px', marginBottom: 12,
                    boxShadow: '0 4px 20px rgba(217,119,6,.12)',
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 12 }}>
                      {editBranch ? 'Filialni tahrirlash' : 'Yangi filial'}
                    </div>
                    {[
                      { key: 'name',         placeholder: 'Filial nomi (ixtiyoriy)',  label: 'Nomi' },
                      { key: 'address',      placeholder: 'Manzil *',                label: 'Manzil' },
                      { key: 'phone',        placeholder: '+998 XX XXX XX XX',        label: 'Telefon' },
                      { key: 'workingHours', placeholder: '09:00 – 21:00',            label: 'Ish vaqti' },
                    ].map(f => (
                      <div key={f.key} style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 4 }}>{f.label}</div>
                        <input
                          value={branchForm[f.key]}
                          onChange={e => setBranchForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                          placeholder={f.placeholder}
                          style={{
                            width: '100%', padding: '10px 14px', borderRadius: 10, boxSizing: 'border-box',
                            border: `1.5px solid ${f.key === 'address' && !branchForm.address ? '#ef4444' : C.border}`,
                            background: C.bg, color: C.dark, fontSize: 14, outline: 'none',
                          }}
                        />
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                      <button
                        onClick={saveBranch}
                        disabled={branchLoading || !branchForm.address.trim()}
                        style={{
                          flex: 1, padding: '11px', borderRadius: 10, border: 'none',
                          background: branchForm.address.trim() ? 'linear-gradient(135deg,#d97706,#b45309)' : '#ccc',
                          color: '#fff', fontWeight: 700, fontSize: 13, cursor: branchForm.address.trim() ? 'pointer' : 'not-allowed',
                        }}
                      >
                        {branchLoading ? '...' : editBranch ? 'Saqlash' : "Qo'shish"}
                      </button>
                      <button
                        onClick={() => { setShowBranchForm(false); setEditBranch(null); }}
                        style={{
                          padding: '11px 18px', borderRadius: 10, border: `1.5px solid ${C.border}`,
                          background: 'none', color: C.muted, fontWeight: 600, fontSize: 13, cursor: 'pointer',
                        }}
                      >
                        Bekor
                      </button>
                    </div>
                  </div>
                )}

                {/* Branch list */}
                {branches.length === 0 && !showBranchForm && (
                  <div style={{
                    textAlign: 'center', padding: '28px 16px',
                    background: C.s1, borderRadius: 16, border: `1px dashed ${C.border}`,
                  }}>
                    <Building2 size={40} color={C.muted} weight="duotone" style={{ opacity: .4, marginBottom: 8 }} />
                    <div style={{ fontSize: 13, color: C.muted }}>Hali filial qo'shilmagan</div>
                  </div>
                )}

                {branches.map((branch, i) => (
                  <div key={branch.id} style={{
                    background: C.s1, border: `1px solid ${C.border}`, borderRadius: 16,
                    padding: '14px 16px', marginBottom: 8,
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, background: '#d9770618',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2,
                    }}>
                      <Building2 size={18} color="#d97706" weight="duotone" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.dark, marginBottom: 3 }}>
                        {branch.name || `Filial ${i + 1}`}
                      </div>
                      <div style={{ fontSize: 12, color: C.muted, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                        <MapPin size={11} weight="fill" color="#d97706" /> {branch.address}
                      </div>
                      {branch.phone && (
                        <div style={{ fontSize: 12, color: C.muted, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                          <Phone size={11} color="#0088cc" /> {branch.phone}
                        </div>
                      )}
                      {branch.working_hours && (
                        <div style={{ fontSize: 11, color: '#059669', marginTop: 2, fontWeight: 600 }}>
                          🕐 {branch.working_hours}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button
                        onClick={() => {
                          setEditBranch(branch);
                          setBranchForm({ name: branch.name||'', address: branch.address||'', phone: branch.phone||'', workingHours: branch.working_hours||'' });
                          setShowBranchForm(true);
                        }}
                        style={{ background: '#4f46e518', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => deleteBranch(branch.id)}
                        style={{ background: 'rgba(220,38,38,.08)', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Logout */}
              <button onClick={onLogout} style={{
                width: '100%', marginTop: 4, padding: 14, borderRadius: 14,
                border: '1.5px solid rgba(220,38,38,.25)', background: 'rgba(220,38,38,.05)',
                color: '#dc2626', cursor: 'pointer', fontWeight: 700, fontSize: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                <LogOut size={16} /> {t('logoutFromCabinet')}
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