import { useState, memo } from 'react';
import { Search, Bell, ShoppingCart, X, Sun, Moon } from 'lucide-react';
import { sum } from '../utils/format';
import CakeVisual from '../components/CakeVisual';
import { useLocale } from '../locale.jsx';

function ProductDetailModal({ card, onClose, toast, C, addToCart }) {
  const { t } = useLocale();
  const [qty, setQty] = useState(1);
  if (!card) return null;
  const handleAdd = () => {
    addToCart(card, qty);
    toast(`${card.emoji || ''} ${t('addedToCart')}`);
    onClose();
  };
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.7)', zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center', padding:20, backdropFilter:'blur(4px)' }}>
      <div className="slide-up" onClick={e=>e.stopPropagation()} style={{ background:C.s1, borderRadius:28, width:'100%', maxWidth:440, overflow:'hidden', boxShadow:'0 24px 64px rgba(0,0,0,.3)' }}>
        <div style={{ height:200, position:'relative' }}>
          <CakeVisual category={card.category} bg={card.bg} height={200} badge={card.badge} badgeColor={card.badgeColor}/>
          <button onClick={onClose} style={{ position:'absolute', top:14, left:14, background:'rgba(0,0,0,.22)', border:'none', borderRadius:'50%', width:34, height:34, cursor:'pointer', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2 }}>
            <X size={16} strokeWidth={2.5}/>
          </button>
        </div>
        <div style={{ padding:'22px 24px 28px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
            <div style={{ fontSize:20, fontWeight:700, color:C.dark }}>{card.name}</div>
            <div style={{ fontSize:13, color:C.muted }}>⭐ {card.rating}</div>
          </div>
          <div style={{ fontSize:13, color:C.muted, lineHeight:1.65, marginBottom:16 }}>{card.desc}</div>
          <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
            {[t('freshTag'), t('handmadeTag'), t('deliveryTag')].map(tag=>(
              <span key={tag} style={{ background:C.s2, border:`1px solid ${C.border}`, borderRadius:50, padding:'4px 12px', fontSize:11, color:C.muted }}>{tag}</span>
            ))}
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:C.s2, borderRadius:14, padding:'12px 16px', marginBottom:16 }}>
            <div style={{ fontSize:13, color:C.muted }}>{t('qty')}</div>
            <div style={{ display:'flex', gap:10, alignItems:'center' }}>
              <button onClick={()=>setQty(q=>Math.max(1,q-1))} style={{ width:32, height:32, borderRadius:8, border:`1px solid ${C.border}`, background:C.s1, color:C.dark, cursor:'pointer', fontSize:18, fontWeight:700 }}>−</button>
              <span style={{ fontWeight:700, fontSize:16, minWidth:24, textAlign:'center', color:C.dark }}>{qty}</span>
              <button onClick={()=>setQty(q=>q+1)} style={{ width:32, height:32, borderRadius:8, border:`1px solid ${C.border}`, background:C.s1, color:C.dark, cursor:'pointer', fontSize:18, fontWeight:700 }}>+</button>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div style={{ fontSize:13, color:C.muted }}>{t('orderTotal')}</div>
            <div style={{ fontSize:22, fontWeight:700, color:C.navy, fontFamily:"'Playfair Display',serif" }}>{sum(card.price*qty)}</div>
          </div>
          <button onClick={handleAdd} style={{ width:'100%', padding:15, borderRadius:14, border:'none', background:`linear-gradient(135deg,${C.navy},${C.mid})`, color:'#fff', fontWeight:700, fontSize:15, cursor:'pointer', boxShadow:`0 4px 16px ${C.navy}40` }}>
            <ShoppingCart size={16} style={{ marginRight:8, verticalAlign:'middle' }}/>
            {t('addToCart')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HomePage({ toast, user, C, cakeCards, setPage, isDesktop, addToCart, isDark, setIsDark }) {
  const { t } = useLocale();
  const chips    = [t('chipAll'), t('chipTorts'), t('chipCupcakes')];
  const chipKeys = ['all','tort','keks'];
  const [activeChip,  setActiveChip]  = useState(0);
  const [search,      setSearch]      = useState('');
  const [searchOpen,  setSearchOpen]  = useState(false);
  const [detailCard,  setDetailCard]  = useState(null);
  const initials  = user?.name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()||'A';
  const firstName = user?.name?.split(' ')[0]||'Гость';
  const activeKey = chipKeys[activeChip];
  const filtered  = cakeCards
    .filter(c => activeKey==='all' || c.category===activeKey)
    .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()));

  const topPad = isDesktop ? 0 : 52;

  const CardItem = memo(({ card, cardWidth }) => (
    <div
      className="card-lift"
      onClick={() => setDetailCard(card)}
      style={{ flex: cardWidth ? `0 0 ${cardWidth}px` : undefined, background:C.s1, borderRadius:20, overflow:'hidden', border:`1px solid ${C.border}`, cursor:'pointer', transition:'all .25s', boxShadow:`0 2px 8px rgba(0,0,0,.05)` }}>
      <div style={{ position:'relative' }}>
        <CakeVisual category={card.category} bg={card.bg} height={120} badge={card.badge} badgeColor={card.badgeColor}/>
      </div>
      <div style={{ padding:12 }}>
        <div style={{ fontSize:13, fontWeight:600, marginBottom:4, color:C.dark, lineHeight:1.3 }}>{card.name}</div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <div style={{ color:C.navy, fontWeight:700, fontSize:13 }}>{sum(card.price)}</div>
          <div style={{ color:C.muted, fontSize:11 }}>⭐ {card.rating}</div>
        </div>
              </div>
    </div>
  ));

  return (
    <div className="fade-in" style={{ color:C.dark }}>
      {detailCard && <ProductDetailModal card={detailCard} onClose={()=>setDetailCard(null)} toast={toast} C={C} addToCart={addToCart}/>}

      {/* Header */}
      <div style={{ padding:`${topPad}px 20px 14px` }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
          <div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:isDesktop?30:24, fontWeight:900, color:C.dark }}>
              {isDesktop ? t('home') : <><span>Sweet</span><span style={{ color:C.navy }}>Market</span></>}
            </div>
            <div style={{ color:C.muted, fontSize:13, marginTop:2 }}>{t('welcomeBack')}, {firstName}! 🎉</div>
          </div>
          {!isDesktop && (
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <button onClick={()=>setSearchOpen(o=>!o)} style={{ width:38, height:38, borderRadius:12, background:C.s1, border:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:C.dark }}>
                <Search size={18}/>
              </button>
              <button onClick={()=>setIsDark(d=>!d)} style={{ width:38, height:38, borderRadius:12, background:C.s1, border:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:C.dark }}>
                {isDark ? <Sun size={18}/> : <Moon size={18}/>}
              </button>
              <div onClick={()=>setPage('profile')} style={{ width:40, height:40, borderRadius:'50%', background:`linear-gradient(135deg,${C.navy},${C.mid})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, color:'#fff', cursor:'pointer', flexShrink:0 }}>
                {initials}
              </div>
            </div>
          )}
          {isDesktop && (
            <div style={{ display:'flex', gap:10, alignItems:'center' }}>
              <div style={{ position:'relative' }}>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t('searchCake')}
                  style={{ background:C.s1, border:`1px solid ${C.border}`, borderRadius:50, padding:'9px 16px 9px 36px', color:C.dark, fontSize:13, width:220 }}/>
                <Search size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:C.muted }}/>
              </div>
              <button onClick={()=>setIsDark(d=>!d)} style={{ width:38, height:38, borderRadius:12, background:C.s1, border:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:C.dark }}>
                {isDark ? <Sun size={18}/> : <Moon size={18}/>}
              </button>
            </div>
          )}
        </div>
        {searchOpen && !isDesktop && (
          <div style={{ marginTop:10, position:'relative' }}>
            <input autoFocus value={search} onChange={e=>setSearch(e.target.value)} placeholder={t('searchCake')}
              style={{ width:'100%', background:C.s1, border:`1px solid ${C.border}`, borderRadius:50, padding:'10px 16px 10px 38px', color:C.dark, fontSize:14 }}/>
            <Search size={14} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:C.muted }}/>
            {search && <button onClick={()=>setSearch('')} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:C.muted, display:'flex' }}><X size={16}/></button>}
          </div>
        )}
      </div>

      {/* Chips */}
      <div style={{ display:'flex', gap:8, padding:'0 20px', overflowX:'auto', marginBottom:18, scrollbarWidth:'none' }}>
        {chips.map((chip,i) => (
          <button key={chip} onClick={()=>setActiveChip(i)} style={{
            padding:'8px 18px', borderRadius:50, border:`1.5px solid ${i===activeChip?C.navy:C.border}`,
            fontSize:13, fontWeight:i===activeChip?700:500, whiteSpace:'nowrap', cursor:'pointer',
            background:i===activeChip?C.navy:C.s1, color:i===activeChip?'#fff':C.muted, transition:'all .2s',
          }}>{chip}</button>
        ))}
      </div>


      {/* Products heading */}
      <div style={{ padding:'0 20px', display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <div style={{ fontSize:isDesktop?20:17, fontWeight:700, color:C.dark }}>
          {search ? `${t('searchResultsPrefix')}"${search}"` : t('topSales')}
        </div>
        {!search && <div style={{ color:C.navy, fontSize:13, fontWeight:600, cursor:'pointer' }} onClick={()=>setPage('explore')}>{t('seeAll')}</div>}
      </div>

      {/* Grid / Scroll */}
      {filtered.length === 0 && (
        <div style={{ textAlign:'center', padding:'40px', color:C.muted }}>
          <Search size={40} color={C.border} style={{ marginBottom:8 }}/>
          <div>{t('nothingFound')}</div>
        </div>
      )}
      <div style={{ display:'grid', gridTemplateColumns: isDesktop ? 'repeat(auto-fill,minmax(188px,1fr))' : 'repeat(2,1fr)', gap:isDesktop?16:12, padding:'0 20px 24px' }}>
        {filtered.map(card => <CardItem key={card.id} card={card}/>)}
      </div>

      <div style={{ height:100 }}/>
    </div>
  );
}