import { useState, useEffect, useMemo } from 'react';
import {
  ShoppingCart, Trash2, Plus, Minus, ArrowRight,
  Package, Loader2, CheckCircle, MapPin, Store,
  Building2, Phone, Clock,
} from 'lucide-react';
import CakeVisual from '../components/CakeVisual';
import { sum, translateAddress } from '../utils/format';
import api from '../api';
import { useLocale } from '../locale.jsx';
import { REGIONS } from '../constants/regions.js';

const BASE = import.meta.env.VITE_API_URL || '';

export default function CartPage({ C, isDesktop, cart, onUpdateQty, onRemove, onClear, onOrder, toast, setPage, user }) {
  const { t, lang } = useLocale();
  const [ordering,  setOrdering]  = useState(false);
  const [done,      setDone]      = useState(false);
  const [sellers,   setSellers]   = useState([]);
  const [sellersLoading, setSellersLoading] = useState(true);
  const [selected,  setSelected]  = useState(null); // selected branch

  const total = cart.reduce((s, item) => s + item.price * item.qty, 0);
  const topPad = isDesktop ? 16 : 60;

  useEffect(() => {
    setSellersLoading(true);
    fetch(BASE + '/api/bakeries')
      .then(r => r.json())
      .then(data => { setSellers(Array.isArray(data) ? data : []); setSellersLoading(false); })
      .catch(() => setSellersLoading(false));
  }, []);

  // If all cart items belong to same bakery — auto-filter to that bakery's branches
  const cartBakeryId = useMemo(() => {
    const ids = [...new Set(cart.map(i => i.bakeryId).filter(Boolean))];
    return ids.length === 1 ? ids[0] : null;
  }, [cart]);

  const cartBakery = useMemo(() => {
    if (!cartBakeryId) return null;
    return sellers.find(s => s.id === cartBakeryId) || null;
  }, [cartBakeryId, sellers]);

  // Branches to show: if cart has a specific bakery => show only its branches, else show all sellers
  const displayBranches = useMemo(() => {
    if (cartBakery) {
      return cartBakery.branches || [];
    }
    // Filter by user city, fallback to ALL sellers if nothing matches
    const filtered = (user?.region && user?.city)
      ? sellers.filter(b => b.region === user.region && b.city === user.city)
      : sellers;
    return filtered.length > 0 ? filtered : sellers;
  }, [cartBakery, sellers, user]);

  const handleOrder = async () => {
    if (!cart.length) return;
    if (!selected) { toast(t('selectBakery')); return; }
    setOrdering(true);
    try {
      // Pass bakery info along with selected branch
      const bakeryInfo = cartBakery || selected;
      await onOrder(cart, total, { ...bakeryInfo, selectedBranch: selected }, '');
      setDone(true);
      setTimeout(() => {
        onClear();
        setDone(false);
        setPage('profile');
      }, 2200);
    } catch (e) {
      const msg = e?.message === 'Failed to fetch'
        ? t('serverError')
        : (e?.message || t('genericError'));
      toast(msg);
    } finally {
      setOrdering(false);
    }
  };

  /* ── Empty state ── */
  if (!cart.length) return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: `${topPad}px 20px 120px`, textAlign: 'center' }}>
      <div style={{ paddingTop: 80 }}>
        <div style={{
          width: 96, height: 96, borderRadius: '50%', margin: '0 auto 24px',
          background: C.s2, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ShoppingCart size={44} color={C.border} weight="duotone" />
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.dark, marginBottom: 8 }}>
          {t('cartEmpty')}
        </div>
        <div style={{ fontSize: 14, color: C.muted, marginBottom: 32, lineHeight: 1.6 }}>
          {t('addProducts')}
        </div>
        <button onClick={() => setPage('home')} style={{
          padding: '13px 28px', borderRadius: 14, border: 'none', cursor: 'pointer',
          background: `linear-gradient(135deg,${C.navy},${C.mid})`,
          color: '#fff', fontWeight: 700, fontSize: 14,
          display: 'inline-flex', alignItems: 'center', gap: 8,
        }}>
          {t('returnToProducts')} <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );

  /* ── Success overlay ── */
  if (done) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CheckCircle size={44} color="#059669" weight="fill" />
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: C.dark }}>{t('orderAccepted')}</div>
      <div style={{ fontSize: 13, color: C.muted }}>{t('trackProfile')}</div>
    </div>
  );

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: `${topPad}px 0 200px` }}>

      {/* Header */}
      <div style={{ padding: '0 20px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 900, color: C.dark }}>
            {t('navCart')}
          </div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>
            {cart.length} {t('itemsCount')}
          </div>
        </div>
        <button onClick={onClear} style={{
          padding: '8px 14px', borderRadius: 10, border: `1px solid ${C.border}`,
          background: 'transparent', cursor: 'pointer', color: '#ef4444',
          fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Trash2 size={14} /> {t('clear')}
        </button>
      </div>

      {/* Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 20px' }}>
        {cart.map(item => (
          <div key={item.id} style={{
            background: C.s1, borderRadius: 20, border: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', overflow: 'hidden',
          }}>
            <div style={{ width: 88, height: 88, flexShrink: 0 }}>
              {item.image
                ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <CakeVisual category={item.category} bg={item.bg} height={88} />
              }
            </div>
            <div style={{ flex: 1, padding: '10px 12px', minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.emoji && <span style={{ marginRight: 4 }}>{item.emoji}</span>}{item.name}
              </div>
              {item.bakeryName && (
                <div style={{ fontSize: 11, color: C.navy, fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Store size={10} /> {item.bakeryName}
                </div>
              )}
              <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 8 }}>
                {sum(item.price * item.qty)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={() => item.qty <= 1 ? onRemove(item.id) : onUpdateQty(item.id, item.qty - 1)}
                  style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${C.border}`, background: C.s2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.dark }}>
                  <Minus size={13} weight="bold" />
                </button>
                <span style={{ fontSize: 14, fontWeight: 700, minWidth: 20, textAlign: 'center', color: C.dark }}>{item.qty}</span>
                <button onClick={() => onUpdateQty(item.id, item.qty + 1)}
                  style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${C.border}`, background: C.s2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.dark }}>
                  <Plus size={13} weight="bold" />
                </button>
              </div>
            </div>
            <button onClick={() => onRemove(item.id)}
              style={{ padding: '0 14px', height: '100%', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center' }}>
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Seller / Branch selector */}
      <div style={{ padding: '20px 20px 0' }}>

        {/* If cart has specific bakery — show bakery header */}
        {cartBakery && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: `${C.navy}08`, border: `1.5px solid ${C.navy}30`,
            borderRadius: 16, padding: '12px 14px', marginBottom: 14,
          }}>
            <div style={{ fontSize: 28 }}>{cartBakery.emoji || '🎂'}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.navy }}>{cartBakery.name}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                {lang === 'ru' ? 'Выберите филиал для получения' : 'Olib ketish filialini tanlang'}
              </div>
            </div>
          </div>
        )}

        <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          {cartBakery
            ? <><Building2 size={16} color={C.navy} /> {lang === 'ru' ? 'Филиалы' : 'Filiallar'}</>
            : <><Store size={16} color={C.navy} /> {t('selectBakery')}</>
          }
        </div>

        {sellersLoading ? (
          <div style={{ fontSize: 13, color: C.muted, padding: '12px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
            {lang === 'ru' ? 'Загрузка...' : 'Yuklanmoqda...'}
          </div>
        ) : displayBranches.length === 0 ? (
          <div style={{ fontSize: 13, color: C.muted, padding: '12px 0' }}>
            {sellers.length === 0
              ? t('noBakeries')
              : (lang === 'ru'
                  ? `В ${user?.city || user?.region} кондитеры не найдены`
                  : `${user?.city || user?.region} da qandolatchilar topilmadi`)}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {displayBranches.map(b => {
              const active = selected?.id === b.id;
              // b can be a branch or a full seller
              const branchName = b.name && b.name !== 'main' ? b.name : (b.shopName || b.name || '');
              const branchAddr = b.address || '';
              const branchPhone = b.phone || '';
              const branchHours = b.hours || b.working_hours || '';
              return (
                <div key={b.id} onClick={() => setSelected(b)} style={{
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                  padding: '12px 14px', borderRadius: 14,
                  border: `1.5px solid ${active ? C.navy : C.border}`,
                  background: active ? `${C.navy}08` : C.s1,
                  cursor: 'pointer', transition: 'all .15s',
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                    background: active ? `${C.navy}18` : C.s2,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                  }}>
                    {cartBakery ? <Building2 size={18} color={active ? C.navy : C.muted} weight="duotone" /> : (b.emoji || '🎂')}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {branchName && (
                      <div style={{ fontSize: 13, fontWeight: 700, color: active ? C.navy : C.dark, marginBottom: 3 }}>
                        {branchName}
                      </div>
                    )}
                    {branchAddr && (
                      <div style={{ fontSize: 12, color: C.muted, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                        <MapPin size={11} weight="fill" color={active ? C.navy : C.muted} />
                        {cartBakery ? branchAddr : translateAddress(b, lang, REGIONS)}
                      </div>
                    )}
                    {branchPhone && (
                      <div style={{ fontSize: 12, color: C.muted, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                        <Phone size={11} color="#0088cc" /> {branchPhone}
                      </div>
                    )}
                    {branchHours && (
                      <div style={{ fontSize: 11, color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Clock size={10} /> {branchHours}
                      </div>
                    )}
                  </div>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                    background: active ? C.navy : 'transparent',
                    border: `2px solid ${active ? C.navy : C.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {active && <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>✓</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sticky bottom */}
      <div style={{
        position: 'fixed', bottom: isDesktop ? 20 : 72, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 520, padding: '0 20px', zIndex: 100,
      }}>
        <div style={{
          background: C.s1, borderRadius: 24, border: `1px solid ${C.border}`,
          padding: '18px 20px', boxShadow: '0 8px 32px rgba(0,0,0,.12)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 14, color: C.muted, fontWeight: 500 }}>{t('orderSummary')}</span>
            <span style={{ fontSize: 22, fontWeight: 900, color: C.dark, fontFamily: "'Playfair Display',serif" }}>
              {sum(total)}
            </span>
          </div>
          {selected && (
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Store size={12} color={C.navy} />
              {cartBakery && <span style={{ color: C.navy, fontWeight: 600 }}>{cartBakery.name}</span>}
              {selected.name && selected.name !== 'main' && (
                <span style={{ color: C.dark, fontWeight: 600 }}>
                  {cartBakery ? ` · ${selected.name}` : selected.name}
                </span>
              )}
              {selected.address && <span>· {selected.address}</span>}
            </div>
          )}
          <button onClick={handleOrder} disabled={ordering} style={{
            width: '100%', padding: '15px 20px', borderRadius: 14, border: 'none',
            cursor: ordering ? 'default' : 'pointer', fontWeight: 700, fontSize: 15,
            color: '#fff', background: ordering ? C.navy : `linear-gradient(135deg,${C.navy},${C.mid})`,
            boxShadow: `0 4px 20px ${C.navy}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            opacity: ordering ? 0.75 : 1, transition: 'all .25s',
          }}>
            {ordering ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Package size={18} />}
            {ordering ? t('sending') : t('placeOrder')}
            {!ordering && <ArrowRight size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}