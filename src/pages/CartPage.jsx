import { useState, useEffect } from 'react';
import {
  ShoppingCart, Trash, Plus, Minus, ArrowRight,
  Package, CircleNotch, CheckCircle, MapPin, Storefront,
} from '@phosphor-icons/react';
import CakeVisual from '../components/CakeVisual';
import { sum } from '../utils/format';
import api from '../api';
import { useLocale } from '../locale.jsx';

const BASE = import.meta.env.VITE_API_URL || '';

export default function CartPage({ C, isDesktop, cart, onUpdateQty, onRemove, onClear, onOrder, toast, setPage }) {
  const { t } = useLocale();
  const [ordering,  setOrdering]  = useState(false);
  const [done,      setDone]      = useState(false);
  const [sellers,   setSellers]   = useState([]);
  const [selected,  setSelected]  = useState(null); // selected bakery/seller

  const total = cart.reduce((s, item) => s + item.price * item.qty, 0);
  const topPad = isDesktop ? 16 : 60;

  useEffect(() => {
    fetch(BASE + '/api/bakeries')
      .then(r => r.json())
      .then(data => setSellers(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const handleOrder = async () => {
    if (!cart.length) return;
    if (!selected) { toast(t('selectBakery')); return; }
    setOrdering(true);
    try {
      await onOrder(cart, total, selected, '');
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
          <Trash size={14} /> {t('clear')}
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
              <Trash size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Seller selector */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Storefront size={16} color={C.navy} /> {t('selectBakery')}
        </div>
        {sellers.length === 0 ? (
          <div style={{ fontSize: 13, color: C.muted, padding: '12px 0' }}>{t('noBakeries')}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sellers.map(b => {
              const active = selected?.id === b.id;
              return (
                <div key={b.id} onClick={() => setSelected(b)} style={{
                  display: 'flex', gap: 12, alignItems: 'center',
                  padding: '12px 14px', borderRadius: 14,
                  border: `1.5px solid ${active ? C.navy : C.border}`,
                  background: active ? `${C.navy}08` : C.s1,
                  cursor: 'pointer', transition: 'all .15s',
                }}>
                  <div style={{ fontSize: 26, flexShrink: 0 }}>{b.emoji || '🎂'}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: active ? C.navy : C.dark }}>{b.name}</div>
                    {b.address && (
                      <div style={{ fontSize: 12, color: C.muted, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={11} /> {b.address}
                      </div>
                    )}
                  </div>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
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
              <Storefront size={12} color={C.navy} />
              <span style={{ color: C.navy, fontWeight: 600 }}>{selected.name}</span>
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
            {ordering ? <CircleNotch size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Package size={18} />}
            {ordering ? t('sending') : t('placeOrder')}
            {!ordering && <ArrowRight size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
