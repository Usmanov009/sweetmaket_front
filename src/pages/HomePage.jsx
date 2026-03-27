import { useState, memo } from 'react';
import { Search, Bell, Heart, ShoppingCart, X } from 'lucide-react';
import { sum } from '../utils/format';
import CakeVisual from '../components/CakeVisual';

function ProductDetailModal({ card, onClose, onAddToCart, toast, C }) {
  const [qty, setQty] = useState(1);
  if (!card) return null;
  const handleAdd = () => {
    onAddToCart({ id:card.id, emoji:card.emoji, category:card.category, bg:card.bg, name:card.name, detail:'Круглый · 4 порции · Сливочный', price:card.price, qty });
    toast(`${card.emoji} ${qty} шт. добавлено!`);
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
            {['Свежее','Ручная работа','Доставка 2-4ч'].map(t=>(
              <span key={t} style={{ background:C.s2, border:`1px solid ${C.border}`, borderRadius:50, padding:'4px 12px', fontSize:11, color:C.muted }}>{t}</span>
            ))}
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:C.s2, borderRadius:14, padding:'12px 16px', marginBottom:16 }}>
            <div style={{ fontSize:13, color:C.muted }}>Количество</div>
            <div style={{ display:'flex', gap:10, alignItems:'center' }}>
              <button onClick={()=>setQty(q=>Math.max(1,q-1))} style={{ width:32, height:32, borderRadius:8, border:`1px solid ${C.border}`, background:C.s1, color:C.dark, cursor:'pointer', fontSize:18, fontWeight:700 }}>−</button>
              <span style={{ fontWeight:700, fontSize:16, minWidth:24, textAlign:'center', color:C.dark }}>{qty}</span>
              <button onClick={()=>setQty(q=>q+1)} style={{ width:32, height:32, borderRadius:8, border:`1px solid ${C.border}`, background:C.s1, color:C.dark, cursor:'pointer', fontSize:18, fontWeight:700 }}>+</button>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div style={{ fontSize:13, color:C.muted }}>Итого</div>
            <div style={{ fontSize:22, fontWeight:700, color:C.navy, fontFamily:"'Playfair Display',serif" }}>{sum(card.price*qty)}</div>
          </div>
          <button onClick={handleAdd} style={{ width:'100%', padding:15, borderRadius:14, border:'none', background:`linear-gradient(135deg,${C.navy},${C.mid})`, color:'#fff', fontWeight:700, fontSize:15, cursor:'pointer', boxShadow:`0 4px 16px ${C.navy}40` }}>
            <ShoppingCart size={16} style={{ marginRight:8, verticalAlign:'middle' }}/>
            Добавить в корзину
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HomePage({ toast, onAddToCart, user, C, cakeCards, setCakeCards, setPage, isDesktop }) {
  const chips    = ['Всё','Торты','Кексы'];
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

  const toggleLike = (id) => setCakeCards(prev => prev.map(c => c.id===id ? {...c,liked:!c.liked} : c));
  const topPad = isDesktop ? 0 : 52;

  const CardItem = memo(({ card, cardWidth }) => (
    <div
      className="card-lift"
      onClick={() => setDetailCard(card)}
      style={{ flex: cardWidth ? `0 0 ${cardWidth}px` : undefined, background:C.s1, borderRadius:20, overflow:'hidden', border:`1px solid ${C.border}`, cursor:'pointer', transition:'all .25s', boxShadow:`0 2px 8px rgba(0,0,0,.05)` }}>
      <div style={{ position:'relative' }}>
        <CakeVisual category={card.category} bg={card.bg} height={120} badge={card.badge} badgeColor={card.badgeColor}/>
        <button
          onClick={e=>{ e.stopPropagation(); toggleLike(card.id); toast(card.liked?'Убрано из сохранённых':'❤️ Сохранено!'); }}
          style={{ position:'absolute', top:8, left:8, background:'rgba(255,255,255,.88)', border:'none', cursor:'pointer', width:30, height:30, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color: card.liked?'#ef4444':C.muted, zIndex:2 }}>
          <Heart size={14} fill={card.liked?'currentColor':'none'}/>
        </button>
      </div>
      <div style={{ padding:12 }}>
        <div style={{ fontSize:13, fontWeight:600, marginBottom:4, color:C.dark, lineHeight:1.3 }}>{card.name}</div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <div style={{ color:C.navy, fontWeight:700, fontSize:13 }}>{sum(card.price)}</div>
          <div style={{ color:C.muted, fontSize:11 }}>⭐ {card.rating}</div>
        </div>
        <button
          onClick={e=>{ e.stopPropagation(); onAddToCart({ id:card.id, emoji:card.emoji, category:card.category, bg:card.bg, name:card.name, detail:'Круглый · 4 порции · Сливочный', price:card.price }); toast(`${card.emoji} Добавлено!`); }}
          style={{ width:'100%', padding:'8px 0', borderRadius:10, border:'none', background:`linear-gradient(135deg,${C.navy},${C.mid})`, color:'#fff', cursor:'pointer', fontSize:11, fontWeight:700 }}>
          + Добавить
        </button>
      </div>
    </div>
  ));

  return (
    <div className="fade-in" style={{ color:C.dark }}>
      {detailCard && <ProductDetailModal card={detailCard} onClose={()=>setDetailCard(null)} onAddToCart={onAddToCart} toast={toast} C={C}/>}

      {/* Header */}
      <div style={{ padding:`${topPad}px 20px 14px` }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
          <div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:isDesktop?30:24, fontWeight:900, color:C.dark }}>
              {isDesktop ? 'Главная' : <><span>Sweet</span><span style={{ color:C.navy }}>Market</span></>}
            </div>
            <div style={{ color:C.muted, fontSize:13, marginTop:2 }}>Добрый день, {firstName}! 🎉</div>
          </div>
          {!isDesktop && (
            <div style={{ display:'flex', gap:10, alignItems:'center' }}>
              <button onClick={()=>setSearchOpen(o=>!o)} style={{ width:38, height:38, borderRadius:12, background:C.s1, border:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:C.dark }}>
                <Search size={18}/>
              </button>
              <button onClick={()=>setPage('notifications')} style={{ width:38, height:38, borderRadius:12, background:C.s1, border:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:C.dark }}>
                <Bell size={18}/>
              </button>
              <div onClick={()=>setPage('profile')} style={{ width:40, height:40, borderRadius:'50%', background:`linear-gradient(135deg,${C.navy},${C.mid})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, color:'#fff', cursor:'pointer', flexShrink:0 }}>
                {initials}
              </div>
            </div>
          )}
          {isDesktop && (
            <div style={{ display:'flex', gap:10, alignItems:'center' }}>
              <div style={{ position:'relative' }}>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Поиск тортов..."
                  style={{ background:C.s1, border:`1px solid ${C.border}`, borderRadius:50, padding:'9px 16px 9px 36px', color:C.dark, fontSize:13, width:220 }}/>
                <Search size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:C.muted }}/>
              </div>
            </div>
          )}
        </div>
        {searchOpen && !isDesktop && (
          <div style={{ marginTop:10, position:'relative' }}>
            <input autoFocus value={search} onChange={e=>setSearch(e.target.value)} placeholder="Поиск тортов..."
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

      {/* Hero banner */}
      {!search && (
        <div style={{ margin:'0 20px 22px', background:`linear-gradient(135deg,${C.navy} 0%,${C.mid} 60%,${C.light} 100%)`, borderRadius:24, padding:isDesktop?'32px 36px':24, position:'relative', overflow:'hidden', minHeight:isDesktop?200:160 }}>
          <div style={{ position:'absolute', right:24, top:'50%', transform:'translateY(-50%)', fontSize:isDesktop?140:90, opacity:.12, pointerEvents:'none' }}>🎂</div>
          <div style={{ position:'absolute', bottom:-30, left:-20, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,.05)' }}/>
          <div style={{ display:'inline-block', background:'rgba(255,255,255,.18)', color:'#fff', fontSize:11, fontWeight:700, padding:'4px 12px', borderRadius:50, marginBottom:10 }}>🔥 Предложение дня</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:isDesktop?26:20, fontWeight:900, lineHeight:1.2, marginBottom:8, color:'#fff' }}>Шоколадная Фантазия</div>
          <div style={{ color:'rgba(255,255,255,.9)', fontSize:isDesktop?28:24, fontWeight:700, marginBottom:16 }}>
            79 000 сум <s style={{ color:'rgba(255,255,255,.4)', fontSize:14, fontWeight:400, marginLeft:8 }}>120 000 сум</s>
          </div>
          <button onClick={()=>{ onAddToCart({id:99,emoji:'🎂',category:'tort',bg:'linear-gradient(135deg,#011023,#052558)',name:'Шоколадная Фантазия',detail:'Специальный · 6 порций · Шоколадный',price:79000}); toast('🎂 Добавлено!'); }}
            style={{ display:'inline-flex', alignItems:'center', gap:8, background:'#fff', color:C.navy, padding:'12px 22px', borderRadius:50, border:'none', cursor:'pointer', fontWeight:700, fontSize:14, boxShadow:'0 4px 16px rgba(0,0,0,.2)' }}>
            <ShoppingCart size={16}/> Заказать
          </button>
        </div>
      )}

      {/* Products heading */}
      <div style={{ padding:'0 20px', display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <div style={{ fontSize:isDesktop?20:17, fontWeight:700, color:C.dark }}>
          {search ? `Результаты: "${search}"` : '🏆 Топ продаж'}
        </div>
        {!search && <div style={{ color:C.navy, fontSize:13, fontWeight:600, cursor:'pointer' }} onClick={()=>setPage('explore')}>Смотреть всё</div>}
      </div>

      {/* Grid / Scroll */}
      {filtered.length === 0 && (
        <div style={{ textAlign:'center', padding:'40px', color:C.muted }}>
          <Search size={40} color={C.border} style={{ marginBottom:8 }}/>
          <div>Ничего не найдено</div>
        </div>
      )}
      {isDesktop ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(188px,1fr))', gap:16, padding:'0 20px 4px' }}>
          {filtered.map(card => <CardItem key={card.id} card={card}/>)}
        </div>
      ) : (
        <div style={{ display:'flex', gap:14, padding:'0 20px 4px', overflowX:'auto', scrollbarWidth:'none' }}>
          {filtered.map(card => <CardItem key={card.id} card={card} cardWidth={162}/>)}
        </div>
      )}

      {/* Saved */}
      {cakeCards.some(c=>c.liked) && !search && (
        <div style={{ padding:'24px 20px 4px' }}>
          <div style={{ fontSize:isDesktop?18:16, fontWeight:700, color:C.dark, marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
            <Heart size={18} fill="#ef4444" color="#ef4444"/> Сохранённые
          </div>
          <div style={{ display:'flex', gap:12, overflowX:isDesktop?'unset':'auto', flexWrap:isDesktop?'wrap':'nowrap', scrollbarWidth:'none' }}>
            {cakeCards.filter(c=>c.liked).map(card=>(
              <div key={card.id} onClick={()=>setDetailCard(card)} style={{ flex:'0 0 120px', background:C.s1, borderRadius:16, overflow:'hidden', border:`1px solid ${C.border}`, cursor:'pointer' }}>
                <div style={{ position:'relative' }}>
                  <CakeVisual category={card.category} bg={card.bg} height={80}/>
                  <button onClick={e=>{ e.stopPropagation(); toggleLike(card.id); }} style={{ position:'absolute', top:4, right:4, background:'rgba(255,255,255,.8)', border:'none', cursor:'pointer', width:24, height:24, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'#ef4444', zIndex:2 }}>
                    <Heart size={11} fill="currentColor"/>
                  </button>
                </div>
                <div style={{ padding:8 }}>
                  <div style={{ fontSize:11, fontWeight:600, color:C.dark, marginBottom:3 }}>{card.name}</div>
                  <div style={{ color:C.navy, fontWeight:700, fontSize:11 }}>{sum(card.price)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={{ height:24 }}/>
    </div>
  );
}
