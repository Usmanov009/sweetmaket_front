import { useState, useEffect, useRef, memo, useCallback } from 'react';
import {
  Sun, Moon, Bell,
  Trash2, Plus, Package, CreditCard, Settings,
  Heart, X, Check,
  MapPin, Clock, Star,
} from 'lucide-react';
import api from './api';
import { THEMES, injectGlobal } from './constants/themes';
import { useBreakpoint } from './hooks/useBreakpoint';
import { sum, pluralRu, daysUntil, formatPhone, rawDigits, isValidPhone } from './utils/format';
import Toast from './components/Toast';
import CakeVisual from './components/CakeVisual';
import BottomNav from './components/BottomNav';
import SidebarNav from './components/SidebarNav';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import NotificationsPage from './pages/NotificationsPage';
import HomePage from './pages/HomePage';
import CameraPage from './pages/CameraPage';



/* Toggle switch component */
function Toggle({ on, onToggle, C }) {
  return (
    <button onClick={onToggle} style={{
      width:48, height:28, borderRadius:50, border:'none', cursor:'pointer',
      background: on ? `linear-gradient(135deg,${C.navy},${C.mid})` : C.border,
      position:'relative', transition:'background .25s', flexShrink:0,
    }}>
      <div style={{
        position:'absolute', top:3, left: on?22:3, width:22, height:22,
        borderRadius:'50%', background:'#fff', transition:'left .2s',
        boxShadow:'0 1px 4px rgba(0,0,0,.25)',
      }}/>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════
   CART PAGE (fixed pluralization + promo codes)
═══════════════════════════════════════════════════════ */
function TrashIcon(){ return <Trash2 size={15} strokeWidth={2.5}/>; }

function CartPage({ toast, cartItems, setCartItems, C, onAddToOrder, isDesktop, cards, setCards, bakeries, setPage }) {
  const [payMethod,    setPay]          =useState(0);
  const [confirmId,    setConfirmId]    =useState(null);
  const [removing,     setRemoving]     =useState(null);
  const [selectedBakery, setSelectedBakery] = useState(null);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [cardModal,    setCardModal]    =useState(false);
  const [newCard, setNewCard] =useState({cardNumber:'',brand:'UzCard',expiry:'',holderName:'',linkedPhone:'+998'});
  const [cardLoading, setCardLoading]  =useState(false);
  const formatCardNum = (v) => v.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim();
  const formatExpiry  = (v) => { const d=v.replace(/\D/g,'').slice(0,4); return d.length>2?d.slice(0,2)+'/'+d.slice(2):d; };
  const inp = {width:'100%',background:C.s2,border:`1.5px solid ${C.border}`,borderRadius:14,padding:'13px 16px',color:C.dark,fontSize:14,outline:'none',marginBottom:10};

  const methods=[{icon:'🏦',label:'Karta',mode:'card'},{icon:'💵',label:'Naqd',mode:'cash'}];
  const safeIdx = payMethod < methods.length ? payMethod : 0;
  const subtotal=cartItems.reduce((s,c)=>s+c.price*c.qty,0);
  const disc10=Math.round(subtotal*0.1);
  const total=subtotal-disc10;
  const n=cartItems.length;
  const itemWord=pluralRu(n,'товар','товара','товаров');
  const changeQty=(id,delta)=>setCartItems(prev=>prev.map(it=>it.id===id?{...it,qty:Math.max(1,it.qty+delta)}:it));
  const confirmRemove=(id)=>{setConfirmId(null);setRemoving(id);setTimeout(()=>{setCartItems(prev=>prev.filter(it=>it.id!==id));setRemoving(null);toast('🗑 Товар удалён');},320);};
  const clearAll=()=>{setCartItems([]);toast('🗑 Корзина очищена');};
  const handleCheckout=()=>{
    if(cartItems.length===0) return;
    if(!selectedBakery){ toast('🏪 Выберите точку самовывоза'); return; }
    const mode=methods[safeIdx].mode;
    if(mode==='card'&&cards?.length>0&&!selectedCardId){ toast('💳 Выберите карту для оплаты'); return; }
    const chosenCard=mode==='card'?(cards||[]).find(c=>c.id===selectedCardId)||(cards||[])[0]||null:null;
    const cardInfo=chosenCard?{last4:chosenCard.last4,brand:chosenCard.brand,expiry:chosenCard.expiry}:null;
    onAddToOrder(cartItems,total,selectedBakery,mode,cardInfo);
    toast('✅ Оплата прошла успешно! +150 баллов');
    setTimeout(()=>{setCartItems([]);setSelectedCardId(null);},1500);
  };

  const topPad=isDesktop?32:52;

  const bakeryBlock=(
    <div style={{marginBottom:16}}>
      <div style={{fontSize:13,color:C.muted,fontWeight:600,marginBottom:10}}>🏪 Точка самовывоза</div>
      <BakeryPickerMap C={C} selected={selectedBakery} onSelect={setSelectedBakery} bakeries={bakeries}/>
    </div>
  );


  const itemsList=(
    <>
      {cartItems.length>0&&(
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
          <div style={{fontSize:13,color:C.muted,fontWeight:600}}>🛒 {n} {itemWord}</div>
          <button onClick={clearAll} style={{padding:'5px 12px',borderRadius:50,border:'1px solid rgba(176,48,48,.3)',background:'rgba(176,48,48,.06)',color:'#b03030',cursor:'pointer',fontSize:11,fontWeight:600}}>Очистить</button>
        </div>
      )}
      {cartItems.length===0&&(
        <div style={{textAlign:'center',padding:'60px 20px'}}>
          <div style={{fontSize:72,marginBottom:16,opacity:.4}}>🛒</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,marginBottom:8,color:C.dark}}>Корзина пуста</div>
          <div style={{color:C.muted,fontSize:14}}>Добавьте торты из магазина</div>
        </div>
      )}
      {cartItems.map(item=>{
        const isRemoving=removing===item.id, isConfirm=confirmId===item.id;
        return (
          <div key={item.id} style={{margin:'0 0 12px',background:isConfirm?'rgba(176,48,48,.04)':C.s1,borderRadius:20,
            padding:16,border:`1px solid ${isConfirm?'rgba(176,48,48,.3)':C.border}`,
            opacity:isRemoving?0:1,transform:isRemoving?'translateX(60px) scale(0.95)':'none',transition:'all .32s ease'}}>
            <div style={{display:'flex',gap:14,alignItems:'center'}}>
              <div style={{flexShrink:0,borderRadius:16,overflow:'hidden',width:72,height:72}}>
                <CakeVisual category={item.category} bg={item.bg} height={72}/>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:15,fontWeight:700,marginBottom:4,color:C.dark}}>{item.name}</div>
                <div style={{fontSize:12,color:C.muted,marginBottom:8}}>{item.detail}</div>
                <div style={{color:C.navy,fontSize:18,fontWeight:700}}>{sum(item.price*item.qty)}</div>
              </div>
              <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:8}}>
                <button onClick={()=>setConfirmId(item.id)} style={{display:'flex',alignItems:'center',justifyContent:'center',width:30,height:30,borderRadius:8,border:'1px solid rgba(176,48,48,.25)',background:'rgba(176,48,48,.07)',color:'#b03030',cursor:'pointer'}}><TrashIcon/></button>
                <div style={{display:'flex',gap:6,alignItems:'center'}}>
                  <button onClick={()=>changeQty(item.id,-1)} style={{width:28,height:28,borderRadius:8,border:`1px solid ${C.border}`,background:C.s2,color:C.dark,cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700}}>−</button>
                  <span style={{fontWeight:700,fontSize:14,minWidth:22,textAlign:'center',color:C.dark}}>{item.qty}</span>
                  <button onClick={()=>changeQty(item.id,1)} style={{width:28,height:28,borderRadius:8,border:`1px solid ${C.border}`,background:C.s2,color:C.dark,cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700}}>+</button>
                </div>
              </div>
            </div>
            {isConfirm&&(
              <div style={{marginTop:10,display:'flex',gap:8,alignItems:'center',justifyContent:'flex-end'}}>
                <span style={{fontSize:12,color:'#b03030',flex:1}}>Удалить из корзины?</span>
                <button onClick={()=>setConfirmId(null)} style={{padding:'4px 12px',borderRadius:8,border:`1px solid ${C.border}`,background:C.s2,color:C.dark,cursor:'pointer',fontSize:12}}>Нет</button>
                <button onClick={()=>{confirmRemove(item.id);}} style={{padding:'4px 12px',borderRadius:8,border:'none',background:'#b03030',color:'#fff',cursor:'pointer',fontSize:12,fontWeight:600}}>Да</button>
              </div>
            )}
          </div>
        );
      })}
    </>
  );

  const totalBlock=(
    <div style={{background:C.s1,borderRadius:20,padding:20,border:`1px solid ${C.border}`,marginBottom:16}}>
      <div style={{fontSize:13,color:C.muted,fontWeight:600,marginBottom:12}}>💳 Итого</div>
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:13,color:C.muted}}>
          <span>Сумма ({pluralRu(n,'товар','товара','товаров')})</span><span>{sum(subtotal)}</span>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:13,color:'#1a7a3a'}}>
          <span>Скидка 10%</span><span>−{sum(disc10)}</span>
        </div>
        <div style={{height:1,background:C.border,margin:'4px 0'}}/>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:17,fontWeight:700,color:C.dark}}>
          <span>Итого</span><span style={{color:C.navy}}>{sum(total)}</span>
        </div>
      </div>
      <div style={{marginTop:14,marginBottom:4,fontSize:13,color:C.muted,fontWeight:600}}>Способ оплаты</div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16}}>
        {methods.map((m,i)=>(
          <button key={i} onClick={()=>setPay(i)}
            style={{flex:1,padding:'10px 8px',borderRadius:12,border:`1.5px solid ${safeIdx===i?C.navy:C.border}`,
              background:safeIdx===i?'rgba(29,78,216,.07)':C.s2,color:safeIdx===i?C.navy:C.muted,
              cursor:'pointer',fontWeight:safeIdx===i?700:500,fontSize:13,display:'flex',
              alignItems:'center',justifyContent:'center',gap:6,transition:'all .15s'}}>
            {m.icon} {m.label}
          </button>
        ))}
      </div>
      {methods[safeIdx].mode==='card'&&(
        <div style={{marginBottom:14}}>
          {(cards||[]).length===0 ? (
            /* ── No cards: prompt to add ── */
            <div style={{borderRadius:16,border:`1.5px dashed ${C.border}`,padding:'18px 16px',
              textAlign:'center',background:C.s2}}>
              <div style={{fontSize:32,marginBottom:8}}>💳</div>
              <div style={{fontSize:14,fontWeight:700,color:C.dark,marginBottom:4}}>
                Kartangiz yo'q
              </div>
              <div style={{fontSize:12,color:C.muted,marginBottom:14,lineHeight:1.5}}>
                To'lov uchun UzCard yoki Humo kartangizni qo'shing
              </div>
              <button onClick={()=>setCardModal(true)}
                style={{padding:'10px 24px',borderRadius:12,border:'none',
                  background:`linear-gradient(135deg,${C.navy},${C.mid})`,
                  color:'#fff',cursor:'pointer',fontWeight:700,fontSize:13,
                  boxShadow:`0 4px 14px ${C.navy}44`}}>
                + Karta qo'shish
              </button>
            </div>
          ) : (
            /* ── Cards exist: selector ── */
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {(cards||[]).map(card => {
                const isUz   = card.brand==='UzCard';
                const isHumo = card.brand==='Humo';
                const grad   = isUz   ? 'linear-gradient(135deg,#1d4ed8,#2563eb)'
                             : isHumo ? 'linear-gradient(135deg,#059669,#10b981)'
                             :          'linear-gradient(135deg,#374151,#6b7280)';
                const active = selectedCardId===card.id || (!selectedCardId && card.isDefault);
                return (
                  <button key={card.id} onClick={()=>setSelectedCardId(card.id)}
                    style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',
                      borderRadius:16,border:`2px solid ${active?C.navy:C.border}`,
                      background:active?`rgba(37,99,235,.05)`:C.s1,
                      cursor:'pointer',textAlign:'left',transition:'all .15s',
                      boxShadow:active?`0 4px 16px ${C.navy}18`:'none'}}>
                    {/* mini card chip */}
                    <div style={{width:48,height:32,borderRadius:8,background:grad,flexShrink:0,
                      display:'flex',alignItems:'center',justifyContent:'center',
                      fontSize:11,fontWeight:900,color:'rgba(255,255,255,.9)',letterSpacing:.5}}>
                      {card.brand==='UzCard'?'UZ':card.brand==='Humo'?'HU':'💳'}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:14,fontWeight:700,color:active?C.navy:C.dark}}>
                        {card.brand} •••• {card.last4}
                      </div>
                      <div style={{fontSize:11,color:C.muted,marginTop:2}}>
                        {card.expiry}{card.holderName?` · ${card.holderName}`:''}
                        {card.isDefault&&<span style={{marginLeft:8,color:C.navy,fontWeight:700}}>✓ Asosiy</span>}
                      </div>
                    </div>
                    <div style={{width:20,height:20,borderRadius:'50%',flexShrink:0,
                      border:`2px solid ${active?C.navy:C.border}`,
                      background:active?C.navy:'transparent',
                      display:'flex',alignItems:'center',justifyContent:'center',transition:'all .15s'}}>
                      {active&&<div style={{width:8,height:8,borderRadius:'50%',background:'#fff'}}/>}
                    </div>
                  </button>
                );
              })}
              {/* add another card shortcut */}
              <button onClick={()=>setCardModal(true)}
                style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',
                  borderRadius:14,border:`1.5px dashed ${C.border}`,background:'transparent',
                  cursor:'pointer',color:C.muted,fontSize:13,fontWeight:600,transition:'all .15s'}}
                onMouseEnter={e=>e.currentTarget.style.borderColor=C.navy}
                onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                <div style={{width:28,height:28,borderRadius:8,background:C.s2,
                  display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>+</div>
                Boshqa karta qo'shish
              </button>
            </div>
          )}
        </div>
      )}
      {methods[safeIdx].mode==='cash'&&(
        <div style={{fontSize:12,color:C.muted,padding:'8px 0',marginBottom:6}}>💵 Оплата наличными при получении</div>
      )}
      <button onClick={handleCheckout} disabled={cartItems.length===0}
        style={{width:'100%',padding:'14px',borderRadius:14,border:'none',
          background:cartItems.length===0?C.border:`linear-gradient(135deg,${C.navy},${C.mid})`,
          color:cartItems.length===0?C.muted:'#fff',cursor:cartItems.length===0?'default':'pointer',
          fontWeight:700,fontSize:15,letterSpacing:.3}}>
        {cartItems.length===0?'Корзина пуста':'Оформить заказ →'}
      </button>
    </div>
  );

  return (
    <>
      
      {cardModal&&(
        <BottomModal C={C} onClose={()=>setCardModal(false)} title="💳 Добавить карту">
          <div style={{display:'flex',gap:8,marginBottom:16}}>
            {[
              {id:'UzCard',label:'🟦 UzCard',grad:'linear-gradient(135deg,#1d4ed8,#2563eb)'},
              {id:'Humo',  label:'🟩 Humo',  grad:'linear-gradient(135deg,#059669,#10b981)'},
            ].map(b=>(
              <button key={b.id} onClick={()=>setNewCard(c=>({...c,brand:b.id}))}
                style={{flex:1,padding:'12px 6px',borderRadius:14,border:`2px solid ${newCard.brand===b.id?'transparent':C.border}`,
                  background:newCard.brand===b.id?b.grad:'transparent',color:newCard.brand===b.id?'#fff':C.muted,
                  cursor:'pointer',fontWeight:700,fontSize:13,transition:'all .15s',
                  boxShadow:newCard.brand===b.id?'0 4px 14px rgba(0,0,0,.2)':'none'}}>
                {b.label}
              </button>
            ))}
          </div>
          <div style={{marginBottom:12}}>
            <label style={{fontSize:12,fontWeight:600,color:C.navy,display:'block',marginBottom:6}}>Номер карты</label>
            <input value={newCard.cardNumber} onChange={e=>setNewCard(c=>({...c,cardNumber:formatCardNum(e.target.value)}))}
              placeholder="0000 0000 0000 0000" inputMode="numeric"
              style={{...inp,fontFamily:'monospace',fontSize:17,letterSpacing:2,marginBottom:0}}/>
          </div>
          <div style={{marginBottom:12}}>
            <label style={{fontSize:12,fontWeight:600,color:C.navy,display:'block',marginBottom:6}}>Срок действия</label>
            <input value={newCard.expiry} onChange={e=>setNewCard(c=>({...c,expiry:formatExpiry(e.target.value)}))}
              placeholder="ММ/ГГ" inputMode="numeric" style={{...inp,marginBottom:0}}/>
          </div>
          <div style={{marginBottom:12}}>
            <label style={{fontSize:12,fontWeight:600,color:C.navy,display:'block',marginBottom:6}}>Имя владельца</label>
            <input value={newCard.holderName} onChange={e=>setNewCard(c=>({...c,holderName:e.target.value}))}
              placeholder="AZIZ KARIMOV" style={{...inp,textTransform:'uppercase',marginBottom:0}}/>
          </div>
          <div style={{marginBottom:20}}>
            <label style={{fontSize:12,fontWeight:600,color:C.navy,display:'block',marginBottom:6}}>Телефон, привязанный к карте</label>
            <input value={newCard.linkedPhone}
              onChange={e=>setNewCard(c=>({...c,linkedPhone:formatPhone(e.target.value)}))}
              onKeyDown={e=>{if(['Backspace','Delete'].includes(e.key)&&rawDigits(newCard.linkedPhone).length<=3)e.preventDefault();}}
              placeholder="+998 90 123 45 67" inputMode="tel" style={{...inp,marginBottom:0}}/>
          </div>
          <div style={{display:'flex',gap:10}}>
            <button onClick={()=>setCardModal(false)} style={{flex:1,padding:'14px',borderRadius:14,border:`1.5px solid ${C.border}`,background:'transparent',color:C.muted,cursor:'pointer',fontWeight:600,fontSize:14}}>Отмена</button>
            {(()=>{
              const digits=newCard.cardNumber.replace(/s/g,'');
              const valid=digits.length===16&&newCard.expiry.length===5&&isValidPhone(newCard.linkedPhone);
              return (
                <button disabled={!valid||cardLoading}
                  onClick={async()=>{
                    const d=newCard.cardNumber.replace(/s/g,'');
                    const payload={last4:d.slice(-4),brand:newCard.brand,expiry:newCard.expiry,holderName:newCard.holderName.trim().toUpperCase(),linkedPhone:newCard.linkedPhone};
                    setCardLoading(true);
                    try{const card=await api.post('/api/cards',payload);setCards(p=>[...p,card]);setSelectedCardId(card.id);setCardModal(false);setNewCard({cardNumber:'',brand:'UzCard',expiry:'',holderName:'',linkedPhone:'+998'});}
                    catch(e){toast('❌ '+e.message);}finally{setCardLoading(false);}
                  }}
                  style={{flex:2,padding:'14px',borderRadius:14,border:'none',background:`linear-gradient(135deg,${C.navy},${C.mid})`,color:'#fff',cursor:(!valid||cardLoading)?'default':'pointer',fontWeight:700,fontSize:14,opacity:(!valid||cardLoading)?.45:1,transition:'opacity .2s'}}>
                  {cardLoading?'Сохранение...':'💳 Добавить карту'}
                </button>
              );
            })()}
          </div>
        </BottomModal>
      )}
      <div style={{maxWidth:600,margin:'0 auto',padding:`${topPad}px 16px ${isDesktop?32:100}px`}}>
        {bakeryBlock}
        {itemsList}
        {totalBlock}
      </div>
    </>
  );
}

function BakeryPickerMap({ C, selected, onSelect, bakeries = [] }) {
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (leafletMap.current || !bakeries.length) return;
    let cancelled = false;
    import('leaflet').then(L => {
      if (cancelled || leafletMap.current) return;
      // Clear any stale Leaflet state on the container div
      if (mapRef.current) delete mapRef.current._leaflet_id;
      const map = L.map(mapRef.current, { zoomControl: true }).setView([41.299, 69.270], 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap', maxZoom: 19,
      }).addTo(map);

      bakeries.forEach(b => {
        const icon = L.divIcon({
          html: `<div style="font-size:26px;line-height:1;filter:drop-shadow(0 2px 6px rgba(0,0,0,.5))">${b.emoji}</div>`,
          iconSize: [32, 32], iconAnchor: [16, 32], className: '',
        });
        const marker = L.marker([b.lat, b.lng], { icon })
          .addTo(map)
          .bindPopup(`<b>${b.name}</b><br>${b.address}<br>⏰ ${b.hours}`);
        marker.on('click', () => onSelect(b));
        markersRef.current.push(marker);
      });

      if (!cancelled) leafletMap.current = map;
      else { map.remove(); }
    });
    return () => {
      cancelled = true;
      if (leafletMap.current) { leafletMap.current.remove(); leafletMap.current = null; markersRef.current = []; }
    };
  }, [bakeries]);

  return (
    <div>
      <div style={{borderRadius:14,overflow:'hidden',border:`1px solid ${C.border}`,marginBottom:10}}>
        <div ref={mapRef} style={{height:230,width:'100%'}}/>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {bakeries.map(b => {
          const active = selected?.id === b.id;
          return (
            <div key={b.id} onClick={() => onSelect(b)}
              style={{display:'flex',gap:12,alignItems:'center',padding:'12px 14px',borderRadius:14,
                border:`1.5px solid ${active ? C.navy : C.border}`,
                background: active ? 'rgba(29,78,216,.06)' : C.s1,
                cursor:'pointer',transition:'all .15s'}}>
              <div style={{fontSize:28,flexShrink:0}}>{b.emoji}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:700,color:C.dark,marginBottom:2}}>{b.name}</div>
                <div style={{fontSize:11,color:C.muted}}>{b.address}</div>
                <div style={{fontSize:11,color:C.muted,marginTop:2}}>⏰ {b.hours} · ⭐ {b.rating}</div>
              </div>
              <div style={{width:20,height:20,borderRadius:'50%',flexShrink:0,
                border:`2px solid ${active ? C.navy : C.border}`,
                background: active ? C.navy : 'transparent',
                display:'flex',alignItems:'center',justifyContent:'center'}}>
                {active && <div style={{width:8,height:8,borderRadius:'50%',background:'#fff'}}/>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   EXPLORE PAGE
═══════════════════════════════════════════════════════ */
function ExplorePage({ C, isDesktop, onAddToCart, toast, user }) {
  const [search,   setSearch]   = useState('');
  const [likedIds, setLikedIds] = useState([]);
  const [allPosts, setAllPosts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const q = search.trim().toLowerCase();

  const load = () => {
    setLoading(true);
    api.get('/api/explore/posts').then(posts => {
      setAllPosts(posts);
      setLikedIds(posts.filter(p => p.likedBy?.includes(user?.id)).map(p => p.id));
      setLoading(false);
    }).catch(() => setLoading(false));
  };
  useEffect(load, []);

  const matchedPosts = q
    ? allPosts.filter(c =>
        (c.name||'').toLowerCase().includes(q) ||
        (c.desc||'').toLowerCase().includes(q) ||
        (c.userName||'').toLowerCase().includes(q)
      )
    : allPosts;

  const topPad = isDesktop ? 16 : 56;

  const toggleLike = id => {
    const isLiked = likedIds.includes(id);
    setLikedIds(prev => isLiked ? prev.filter(x => x !== id) : [...prev, id]);
    api.post(`/api/explore/posts/${id}/like`).then(res => {
      setAllPosts(prev => prev.map(p => p.id === id ? { ...p, likes: res.likes } : p));
    }).catch(() => {
      setLikedIds(prev => isLiked ? [...prev, id] : prev.filter(x => x !== id));
    });
  };

  const initials = (name='') => name.split(' ').map(w=>w[0]||'').join('').slice(0,2).toUpperCase() || '👤';
  const avatarColor = (name='') => { const h = name.split('').reduce((a,c)=>a+c.charCodeAt(0),0)%360; return `hsl(${h},55%,62%)`; };

  return (
    <div style={{maxWidth:560,margin:'0 auto',padding:`${topPad}px 0 ${isDesktop?32:100}px`}}>

      {/* header + search */}
      <div style={{padding:'0 16px 14px'}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:900,color:C.dark,marginBottom:4}}>Qidiruv</div>
        <div style={{fontSize:13,color:C.muted,marginBottom:14}}>Foydalanuvchilar tomonidan joylashtirilgan shirinliklar</div>
        <div style={{position:'relative'}}>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Tort, keks, ism..."
            style={{width:'100%',background:C.s2,border:`1.5px solid ${search?C.navy:C.border}`,borderRadius:14,
              padding:'11px 40px 11px 42px',color:C.dark,fontSize:14,boxSizing:'border-box'}}/>
          <span style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',fontSize:18,pointerEvents:'none'}}>🔍</span>
          {search && (
            <button onClick={()=>setSearch('')}
              style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',
                background:'none',border:'none',cursor:'pointer',color:C.muted,fontSize:18,lineHeight:1,padding:0}}>
              ✕
            </button>
          )}
        </div>
      </div>

      {/* section label */}
      <div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:'uppercase',letterSpacing:.6,padding:'0 16px 12px'}}>
        {q ? `"${search}" bo'yicha natijalar` : 'Barcha e\'lonlar'}
      </div>

      {/* loading */}
      {loading && (
        <div style={{textAlign:'center',padding:'60px 16px',color:C.muted}}>
          <div style={{fontSize:32,marginBottom:12,opacity:.4}}>🔄</div>
          <div style={{fontSize:14}}>Yuklanmoqda...</div>
        </div>
      )}

      {/* empty states */}
      {!loading && allPosts.length === 0 && (
        <div style={{textAlign:'center',padding:'70px 24px',color:C.muted}}>
          <div style={{fontSize:64,marginBottom:16}}>🎂</div>
          <div style={{fontSize:17,fontWeight:700,color:C.dark,marginBottom:8}}>Hali e'lon yo'q</div>
          <div style={{fontSize:13,lineHeight:1.7}}>
            Birinchi bo'ling! Shirinlik yarating va uni «Ha, e'lon qilish» tugmasi orqali joylashtiring.
          </div>
        </div>
      )}
      {!loading && allPosts.length > 0 && matchedPosts.length === 0 && (
        <div style={{textAlign:'center',padding:'60px 16px',color:C.muted}}>
          <div style={{fontSize:48,marginBottom:12}}>😔</div>
          <div style={{fontSize:16,fontWeight:600,color:C.dark}}>Hech narsa topilmadi</div>
          <div style={{fontSize:13,marginTop:6}}>Boshqa so'rov bilan urinib ko'ring</div>
        </div>
      )}

      {/* posts feed */}
      <div style={{display:'flex',flexDirection:'column',gap:0}}>
        {matchedPosts.map(card => {
          const liked = likedIds.includes(card.id);
          const likeCount = card.likes||0;
          const authorName = card.userName || 'Foydalanuvchi';
          const ts = card.createdAt ? new Date(card.createdAt).toLocaleDateString('ru-RU',{day:'numeric',month:'long'}) : '';
          return (
            <div key={card.id} style={{borderBottom:`1px solid ${C.border}`}}>

              {/* post header */}
              <div style={{display:'flex',alignItems:'center',gap:10,padding:'12px 16px 10px'}}>
                <div style={{width:40,height:40,borderRadius:'50%',background:avatarColor(authorName),
                  display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:800,
                  color:'#fff',flexShrink:0,border:`1.5px solid ${C.border}`}}>
                  {initials(authorName)}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,color:C.dark,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                    {authorName}
                  </div>
                  {ts && <div style={{fontSize:11,color:C.muted}}>{ts}</div>}
                </div>
                <span style={{fontSize:10,fontWeight:700,color:C.navy,background:C.s2,
                  padding:'3px 8px',borderRadius:20,border:`1px solid ${C.border}`,flexShrink:0}}>
                  ✅ Tekshirilgan
                </span>
              </div>

              {/* image — tap to add to cart */}
              <div style={{position:'relative',cursor:'pointer'}} onClick={()=>{
                onAddToCart?.({id:'explore_'+card.id+'_'+Date.now(),emoji:card.emoji||'🎂',category:card.tags?.[0]||'tort',bg:card.bg||'#fce4ec',name:card.name,detail:card.desc||card.userName||'',price:card.price||89000,qty:1});
                toast?.('🛒 Savatchaga qo\'shildi!');
              }}>
                <CakeVisual category={card.tags?.[0]} bg={card.bg||'#fce4ec'} height={220}/>
                <div style={{position:'absolute',bottom:10,right:12,background:'rgba(0,0,0,.45)',
                  borderRadius:20,padding:'5px 12px',color:'#fff',fontSize:12,fontWeight:700,
                  backdropFilter:'blur(4px)',pointerEvents:'none'}}>
                  🛒 Savatchaga
                </div>
              </div>

              {/* actions */}
              <div style={{padding:'10px 16px 4px',display:'flex',alignItems:'center',gap:14}}>
                <button onClick={()=>toggleLike(card.id)}
                  style={{background:'none',border:'none',cursor:'pointer',padding:0,lineHeight:1,display:'flex',
                    transform:liked?'scale(1.2)':'scale(1)',transition:'transform .15s',color:liked?'#ef4444':C.muted}}>
                  <Heart size={22} fill={liked?'currentColor':'none'}/>
                </button>
                <span style={{fontSize:13,fontWeight:600,color:C.dark}}>{likeCount.toLocaleString('ru-RU')}</span>
                <div style={{flex:1}}/>
              </div>

              {/* caption */}
              <div style={{padding:'2px 16px 14px'}}>
                <span style={{fontSize:13,fontWeight:700,color:C.dark}}>{authorName.split(' ')[0]} </span>
                <span style={{fontSize:13,color:C.dark}}>{card.name}</span>
                {card.desc && <span style={{fontSize:13,color:C.muted}}> — {card.desc}</span>}
                <div style={{marginTop:4}}>
                  {(card.tags||[]).map(t=>(
                    <span key={t} style={{fontSize:12,color:C.navy,marginRight:6}}>#{t}</span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   CREATE PAGE
═══════════════════════════════════════════════════════ */
const CREATE_OPTIONS = {
  type: [
    {id:'tort',  category:'tort', emoji:'🎂', label:'Oddiy tort',  desc:'Klassik ko\'p qavatli tort', basePrice:89000, color:'#fce4ec'},
    {id:'bento', category:'tort', emoji:'🎁', label:'Bento tort',  desc:'Kichik, bezakli mini tort',  basePrice:69000, color:'#e8f5e9'},
  ],
  size: [
    {id:'mini', emoji:'🫐', label:'Мини',     sub:'1 кг',  desc:'до 6 порций',   priceAdd:0,     color:'#e3f2fd'},
    {id:'std',  emoji:'🍓', label:'Стандарт', sub:'2 кг',  desc:'до 12 порций',  priceAdd:20000, color:'#fff8e1'},
    {id:'big',  emoji:'🍒', label:'Большой',  sub:'3 кг',  desc:'до 20 порций',  priceAdd:40000, color:'#fce4ec'},
    {id:'xl',   emoji:'🎉', label:'Юбилейный',sub:'4+ кг', desc:'до 35 порций',  priceAdd:80000, color:'#f9fbe7'},
  ],
  flavor: [
    {id:'velvet', emoji:'🍷', label:'Красный Вельвет', desc:'Бархат + маскарпоне', priceAdd:10000, color:'#fce4ec'},
    {id:'choco',  emoji:'🍫', label:'Шоколадный',      desc:'Тёмный шоколад 72%',  priceAdd:5000,  color:'#efebe9'},
    {id:'pista',  emoji:'🌿', label:'Фисташковый',     desc:'Натуральный крем',     priceAdd:15000, color:'#e8f5e9'},
    {id:'rasp',   emoji:'🍓', label:'Малиновый',       desc:'Свежая малина, мусс',  priceAdd:10000, color:'#fce4ec'},
    {id:'lemon',  emoji:'🍋', label:'Лимонный',        desc:'Лимонный курд',        priceAdd:5000,  color:'#fffde7'},
  ],
  decoration: [
    {id:'flower',   emoji:'🌸', label:'Цветочный',    desc:'Съедобные цветы',       priceAdd:15000, color:'#fce4ec'},
    {id:'chocoDec', emoji:'🍫', label:'Шоколадный',   desc:'Бельгийский шоколад',   priceAdd:10000, color:'#efebe9'},
    {id:'fruit',    emoji:'🍇', label:'Фруктовый',    desc:'Свежие ягоды',          priceAdd:12000, color:'#e8f5e9'},
    {id:'minimal',  emoji:'✨', label:'Минимализм',   desc:'Гладкий крем',          priceAdd:0,     color:'#f5f5f5'},
    {id:'kids',     emoji:'🎠', label:'Детский',      desc:'Яркие фигурки',         priceAdd:20000, color:'#fffde7'},
  ],
};

const CREATE_STEPS = [
  {key:'type',       question:'Что хотите заказать?',   hint:'Выберите вид выпечки'},
  {key:'size',       question:'Какой размер нужен?',    hint:'Зависит от числа гостей'},
  {key:'flavor',     question:'Какой вкус предпочитаете?', hint:'Самые популярные вкусы'},
  {key:'decoration', question:'Как украсить?',          hint:'Выберите стиль декора'},
];

function CreatePage({ C, isDesktop, toast, setPage, bakeries = [], onAddToCart }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({type:null,size:null,flavor:null,decoration:null,bakery:null,note:''});
  const [publishing, setPublishing] = useState(false);
  const setF = (k,v) => setForm(f=>({...f,[k]:v}));

  const currentStepCfg = CREATE_STEPS[step];
  const currentVal     = currentStepCfg ? form[currentStepCfg.key] : null;
  const selections     = [form.type,form.size,form.flavor,form.decoration].filter(Boolean);
  const progress       = step / (CREATE_STEPS.length + 1); // 0→1

  const totalPrice = (form.type?.basePrice||0)+(form.size?.priceAdd||0)+(form.flavor?.priceAdd||0)+(form.decoration?.priceAdd||0);

  const goNext = () => setStep(s => s + 1);
  const goBack = () => setStep(s => Math.max(0, s - 1));

  const handleOrder = () => {
    const name   = [form.type?.label, form.flavor?.label].filter(Boolean).join(' · ') || 'Buyurtma tort';
    const detail = [form.size?.label, form.decoration?.label, form.bakery?.name].filter(Boolean).join(' · ');
    onAddToCart?.({ id:'custom_'+Date.now(), emoji:form.type?.emoji||'🎂', category:form.type?.category||'tort', bg:form.type?.color||'#fce4ec', name, detail, price:totalPrice, qty:1 });
    toast('🛒 Buyurtma savatchaga qo\'shildi!');
    setStep(5);
  };

  const handlePublish = async (publish) => {
    if (publish) {
      setPublishing(true);
      try {
        await api.post('/api/explore/posts', {
          name: form.type?.label||'Mening shirinligim',
          desc: [form.size?.label,form.flavor?.label,form.decoration?.label].filter(Boolean).join(' · ')+(form.note?' — '+form.note:''),
          emoji: form.type?.emoji||'🎂',
          bg: form.type?.color||'#fce4ec',
          price: totalPrice,
          tags: [form.type?.id,form.flavor?.id].filter(Boolean),
        });
        toast('🌟 Shirinligingiz e\'lon qilindi!');
      } catch { toast('Xatolik yuz berdi'); }
      finally { setPublishing(false); }
    }
    setStep(6);
  };

  const resetAndHome = () => {
    setStep(0);
    setForm({type:null,size:null,flavor:null,decoration:null,bakery:null,note:''});
    setPage('home');
  };

  /* shared header with progress bar */
  const Header = ({onBack, backHidden}) => (
    <div style={{position:'sticky',top:0,zIndex:10,background:C.bg,
      borderBottom:`1px solid ${C.border}`,padding:'0 20px'}}>
      <div style={{display:'flex',alignItems:'center',gap:12,height:54}}>
        <button onClick={onBack} style={{background:'none',border:'none',cursor:'pointer',
          padding:6,color:backHidden?'transparent':C.dark,pointerEvents:backHidden?'none':'auto',
          display:'flex',alignItems:'center',borderRadius:10,transition:'background .15s'}}
          onMouseEnter={e=>e.currentTarget.style.background=C.s2}
          onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        {/* progress bar */}
        <div style={{flex:1,height:4,background:C.s2,borderRadius:99,overflow:'hidden'}}>
          <div style={{height:'100%',borderRadius:99,
            background:`linear-gradient(90deg,${C.navy},${C.mid})`,
            width:`${Math.max(progress*100,4)}%`,transition:'width .4s cubic-bezier(.4,0,.2,1)'}}/>
        </div>
        <div style={{fontSize:12,fontWeight:700,color:C.muted,minWidth:36,textAlign:'right'}}>
          {step < 4 ? `${step+1} / 4` : ''}
        </div>
      </div>
    </div>
  );

  /* ── STEP 5: PUBLISH PROMPT ── */
  if (step === 5) return (
    <div style={{minHeight:'100vh',background:C.bg}}>
      <Header onBack={()=>setStep(4)}/>
      <div style={{maxWidth:440,margin:'0 auto',padding:'40px 24px 100px',textAlign:'center'}}>
        {/* big cake visual */}
        <div style={{width:140,height:140,borderRadius:40,margin:'0 auto 28px',overflow:'hidden',
          boxShadow:`0 12px 40px ${C.navy}22`,border:`2px solid ${C.border}`}}>
          <CakeVisual category={form.type?.category} bg={form.type?.color||'#fce4ec'} height={140}/>
        </div>

        <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:900,color:C.dark,marginBottom:10,lineHeight:1.2}}>
          Shirinligingizni boshqalar bilan ulashing?
        </div>
        <div style={{color:C.muted,fontSize:14,lineHeight:1.8,marginBottom:32}}>
          Qidiruv bo'limida e'lon qilinsa, boshqa foydalanuvchilar ham ko'rishi mumkin.
        </div>

        {/* selection chips */}
        <div style={{display:'flex',flexWrap:'wrap',gap:8,justifyContent:'center',marginBottom:32}}>
          {selections.map(o=>(
            <div key={o.id} style={{display:'flex',alignItems:'center',gap:6,padding:'7px 14px',
              borderRadius:50,background:o.color,border:`1px solid ${C.border}`,fontSize:13,fontWeight:600,color:C.dark}}>
              <span>{o.emoji}</span><span>{o.label}</span>
            </div>
          ))}
          <div style={{display:'flex',alignItems:'center',gap:6,padding:'7px 14px',
            borderRadius:50,background:`linear-gradient(135deg,${C.navy},${C.mid})`,
            fontSize:13,fontWeight:700,color:'#fff'}}>
            {totalPrice.toLocaleString('ru-RU')} so'm
          </div>
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <button onClick={()=>handlePublish(true)} disabled={publishing}
            style={{width:'100%',padding:'16px',borderRadius:16,border:'none',
              background:`linear-gradient(135deg,${C.navy},${C.mid})`,
              color:'#fff',cursor:publishing?'default':'pointer',fontWeight:700,fontSize:15,
              boxShadow:`0 6px 20px ${C.navy}44`,opacity:publishing?.6:1,transition:'opacity .2s'}}>
            {publishing?'Joylashtirilmoqda...':'🌟 Ha, e\'lon qilish'}
          </button>
          <button onClick={()=>handlePublish(false)} disabled={publishing}
            style={{width:'100%',padding:'15px',borderRadius:16,
              border:`1.5px solid ${C.border}`,background:'transparent',
              color:C.muted,cursor:'pointer',fontWeight:600,fontSize:15}}>
            Yo'q, faqat savatga
          </button>
        </div>
      </div>
    </div>
  );

  /* ── STEP 6: DONE ── */
  if (step === 6) return (
    <div style={{minHeight:'100vh',background:C.bg,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'24px 24px 100px',textAlign:'center'}}>
      {/* success ring */}
      <div style={{position:'relative',marginBottom:28}}>
        <div style={{width:130,height:130,borderRadius:'50%',overflow:'hidden',
          boxShadow:'0 12px 40px rgba(16,185,129,.25)'}}>
          <CakeVisual category={form.type?.category} bg={form.type?.color||'#fce4ec'} height={130}/>
        </div>
        <div style={{position:'absolute',bottom:4,right:4,width:36,height:36,borderRadius:'50%',
          background:'#10b981',display:'flex',alignItems:'center',justifyContent:'center',
          boxShadow:'0 4px 12px rgba(16,185,129,.4)'}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
      </div>

      <div style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:900,color:C.dark,marginBottom:8}}>
        Buyurtma qabul qilindi!
      </div>
      <div style={{color:C.muted,fontSize:14,lineHeight:1.8,marginBottom:28,maxWidth:300}}>
        Konditer <b style={{color:C.dark}}>30 daqiqa</b> ichida siz bilan bog'lanadi.
      </div>

      {/* summary card */}
      <div style={{width:'100%',maxWidth:360,background:C.s1,borderRadius:24,border:`1px solid ${C.border}`,
        overflow:'hidden',marginBottom:28,boxShadow:`0 4px 20px rgba(0,0,0,.06)`}}>
        <div style={{background:`linear-gradient(135deg,${C.navy},${C.mid})`,padding:'16px 20px',
          display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <span style={{color:'rgba(255,255,255,.8)',fontSize:13,fontWeight:600}}>Jami summa</span>
          <span style={{color:'#fff',fontSize:20,fontWeight:900}}>{totalPrice.toLocaleString('ru-RU')} so'm</span>
        </div>
        <div style={{padding:'16px 20px',display:'flex',flexWrap:'wrap',gap:8}}>
          {selections.map(o=>(
            <div key={o.id} style={{display:'flex',alignItems:'center',gap:5,padding:'5px 11px',
              borderRadius:50,background:o.color,fontSize:12,fontWeight:600,color:C.dark}}>
              {o.emoji} {o.label}
            </div>
          ))}
        </div>
        {form.bakery && (
          <div style={{borderTop:`1px solid ${C.border}`,padding:'12px 20px',
            display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:22}}>{form.bakery.emoji}</span>
            <div style={{textAlign:'left'}}>
              <div style={{fontSize:13,fontWeight:700,color:C.dark}}>{form.bakery.name}</div>
              <div style={{fontSize:11,color:C.muted}}>⏰ {form.bakery.hours}</div>
            </div>
          </div>
        )}
      </div>

      <button onClick={resetAndHome}
        style={{width:'100%',maxWidth:360,padding:'16px',borderRadius:16,border:'none',
          background:`linear-gradient(135deg,${C.navy},${C.mid})`,
          color:'#fff',cursor:'pointer',fontWeight:700,fontSize:15,
          boxShadow:`0 6px 20px ${C.navy}44`}}>
        Bosh sahifaga →
      </button>
    </div>
  );

  /* ── STEP 4: DETAILS (bakery + note + price) ── */
  if (step === 4) return (
    <div style={{minHeight:'100vh',background:C.bg}}>
      <Header onBack={goBack}/>
      <div style={{maxWidth:520,margin:'0 auto',padding:'24px 20px 120px'}}>

        <div style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:900,color:C.dark,marginBottom:4}}>
          Buyurtmangiz
        </div>
        <div style={{color:C.muted,fontSize:13,marginBottom:24}}>Filial tanlang va izoh qoldiring</div>

        {/* selection chips */}
        <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:28}}>
          {selections.map(o=>(
            <div key={o.id} style={{display:'flex',alignItems:'center',gap:6,padding:'7px 14px',
              borderRadius:50,background:o.color,border:`1px solid ${C.border}`,fontSize:13,fontWeight:600,color:C.dark}}>
              {o.emoji} {o.label}
            </div>
          ))}
        </div>

        {/* Bakery picker */}
        <div style={{marginBottom:20}}>
          <div style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:1.2,textTransform:'uppercase',marginBottom:12}}>
            Filial tanlang
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {bakeries.map(b => {
              const active = form.bakery?.id === b.id;
              return (
                <div key={b.id} onClick={()=>setF('bakery',b)}
                  style={{display:'flex',gap:14,alignItems:'center',padding:'14px 16px',borderRadius:18,
                    border:`2px solid ${active?C.navy:C.border}`,
                    background: active ? `rgba(37,99,235,.05)` : C.s1,
                    cursor:'pointer',transition:'all .18s',
                    boxShadow: active ? `0 4px 16px ${C.navy}18` : 'none'}}>
                  <div style={{width:46,height:46,borderRadius:14,flexShrink:0,
                    background: active ? `linear-gradient(135deg,${C.navy},${C.mid})` : C.s2,
                    display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,
                    transition:'background .18s'}}>
                    {b.emoji}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:700,color:active?C.navy:C.dark}}>{b.name}</div>
                    <div style={{fontSize:12,color:C.muted,marginTop:2}}>{b.address}</div>
                    <div style={{fontSize:11,color:C.muted,marginTop:2}}>⏰ {b.hours} &nbsp;·&nbsp; ⭐ {b.rating}</div>
                  </div>
                  <div style={{width:22,height:22,borderRadius:'50%',flexShrink:0,
                    border:`2.5px solid ${active?C.navy:C.border}`,
                    background:active?C.navy:'transparent',transition:'all .18s',
                    display:'flex',alignItems:'center',justifyContent:'center'}}>
                    {active && <svg width="11" height="11" viewBox="0 0 12 12"><polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Note */}
        <div style={{marginBottom:20}}>
          <div style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:1.2,textTransform:'uppercase',marginBottom:12}}>
            Izoh (ixtiyoriy)
          </div>
          <textarea value={form.note} onChange={e=>setF('note',e.target.value)}
            placeholder="Tortga yozuv, allergiya yoki maxsus xohishlarni yozing..."
            rows={3} style={{width:'100%',background:C.s1,border:`1.5px solid ${C.border}`,borderRadius:16,
              padding:'14px 16px',color:C.dark,fontSize:14,resize:'none',lineHeight:1.6,
              boxSizing:'border-box',outline:'none',transition:'border-color .2s'}}
            onFocus={e=>e.target.style.borderColor=C.navy}
            onBlur={e=>e.target.style.borderColor=C.border}/>
        </div>

        {/* Price breakdown */}
        <div style={{background:C.s1,borderRadius:20,border:`1px solid ${C.border}`,
          overflow:'hidden',marginBottom:20,boxShadow:`0 2px 12px rgba(0,0,0,.04)`}}>
          <div style={{padding:'12px 18px',borderBottom:`1px solid ${C.border}`,
            fontSize:11,fontWeight:700,color:C.muted,letterSpacing:1.2,textTransform:'uppercase'}}>
            Narx tafsiloti
          </div>
          {[
            {label:form.type?.label,      price:form.type?.basePrice,      emoji:form.type?.emoji,      base:true},
            {label:form.size?.label,      price:form.size?.priceAdd,       emoji:form.size?.emoji},
            {label:form.flavor?.label,    price:form.flavor?.priceAdd,     emoji:form.flavor?.emoji},
            {label:form.decoration?.label,price:form.decoration?.priceAdd, emoji:form.decoration?.emoji},
          ].filter(r=>r.label).map((row,i)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',
              padding:'11px 18px',borderBottom:`1px solid ${C.border}`}}>
              <span style={{fontSize:13,color:C.dark}}>{row.emoji} {row.label}</span>
              <span style={{fontSize:13,fontWeight:600,color:row.price>0?C.dark:C.muted}}>
                {row.base ? row.price?.toLocaleString('ru-RU')+' so\'m' : row.price>0 ? '+'+row.price.toLocaleString('ru-RU') : '—'}
              </span>
            </div>
          ))}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
            padding:'14px 18px',background:`linear-gradient(135deg,${C.navy}08,${C.mid}08)`}}>
            <span style={{fontSize:15,fontWeight:800,color:C.dark}}>Jami</span>
            <span style={{fontSize:18,fontWeight:900,color:C.navy}}>{totalPrice.toLocaleString('ru-RU')} so'm</span>
          </div>
        </div>

        <button onClick={handleOrder} disabled={!form.bakery}
          style={{width:'100%',padding:'17px',borderRadius:16,border:'none',
            background: form.bakery ? `linear-gradient(135deg,${C.navy},${C.mid})` : C.border,
            color: form.bakery ? '#fff' : C.muted,
            cursor: form.bakery ? 'pointer' : 'default',
            fontWeight:700,fontSize:16,
            boxShadow: form.bakery ? `0 6px 24px ${C.navy}44` : 'none',
            transition:'all .25s'}}>
          {form.bakery ? `Savatga qo'shish — ${totalPrice.toLocaleString('ru-RU')} so'm` : 'Avval filial tanlang'}
        </button>
      </div>
    </div>
  );

  /* ── STEPS 0–3: CHOICE ── */
  let opts = CREATE_OPTIONS[currentStepCfg.key];
  if (currentStepCfg.key === 'size' && form.type?.id === 'bento') {
    opts = opts.filter(o => o.id === 'mini' || o.id === 'std');
  }

  return (
    <div style={{minHeight:'100vh',background:C.bg}}>
      <Header onBack={goBack} backHidden={step===0}/>

      <div style={{maxWidth:560,margin:'0 auto',padding:'28px 20px 120px'}}>

        {/* question */}
        <div style={{marginBottom:28}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:900,color:C.dark,marginBottom:6,lineHeight:1.2}}>
            {currentStepCfg.question}
          </div>
          <div style={{fontSize:14,color:C.muted}}>{currentStepCfg.hint}</div>
        </div>

        {/* options grid */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:24}}>
          {opts.map(opt => {
            const active = currentVal?.id === opt.id;
            const addPrice = opt.basePrice ?? opt.priceAdd;
            return (
              <button key={opt.id} onClick={()=>{ setF(currentStepCfg.key,opt); goNext(); }}
                style={{borderRadius:22,border:`2px solid ${active?C.navy:C.border}`,
                  background: active ? opt.color : C.s1,
                  cursor:'pointer',textAlign:'left',outline:'none',overflow:'hidden',
                  position:'relative',transition:'all .2s',
                  boxShadow: active ? `0 8px 28px ${C.navy}28` : `0 2px 8px rgba(0,0,0,.04)`,
                  transform: active ? 'translateY(-2px)' : 'none'}}>

                {/* check badge */}
                {active && (
                  <div style={{position:'absolute',top:12,right:12,width:26,height:26,borderRadius:'50%',
                    background:C.navy,display:'flex',alignItems:'center',justifyContent:'center',zIndex:1,
                    boxShadow:`0 2px 8px ${C.navy}66`}}>
                    <svg width="12" height="12" viewBox="0 0 14 14"><polyline points="2,7 6,11 12,3" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                )}

                {/* image area */}
                <CakeVisual
                  category={currentStepCfg.key === 'type' ? opt.category : form.type?.category}
                  bg={opt.color}
                  height={110}
                />

                {/* text */}
                <div style={{padding:'12px 14px 14px'}}>
                  <div style={{fontSize:14,fontWeight:800,color:active?C.navy:C.dark,marginBottom:4}}>{opt.label}</div>
                  {opt.sub && <div style={{fontSize:11,color:C.navy,fontWeight:700,marginBottom:3}}>{opt.sub}</div>}
                  <div style={{fontSize:12,color:C.muted,lineHeight:1.4}}>{opt.desc}</div>
                  {addPrice != null && (
                    <div style={{marginTop:8,display:'inline-block',background:active?`${C.navy}18`:C.s2,
                      borderRadius:50,padding:'3px 10px',fontSize:11,fontWeight:700,color:active?C.navy:C.muted}}>
                      {opt.basePrice ? opt.basePrice.toLocaleString('ru-RU')+' so\'m' : addPrice>0?'+'+addPrice.toLocaleString('ru-RU')+' so\'m':'Bepul'}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* live price bar */}
        {totalPrice > 0 && (
          <div style={{background:C.s1,borderRadius:16,padding:'14px 18px',border:`1px solid ${C.border}`,
            display:'flex',alignItems:'center',justifyContent:'space-between',
            boxShadow:`0 2px 12px rgba(0,0,0,.04)`}}>
            <div style={{display:'flex',gap:8}}>
              {selections.map(o=>(
                <div key={o.id} style={{width:32,height:32,borderRadius:10,background:o.color,
                  display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,
                  border:`1px solid ${C.border}`}}>{o.emoji}</div>
              ))}
            </div>
            <div style={{fontSize:16,fontWeight:900,color:C.navy}}>
              {totalPrice.toLocaleString('ru-RU')} so'm
            </div>
          </div>
        )}

        {/* continue button if already chose this step */}
        {currentVal && (
          <button onClick={goNext}
            style={{width:'100%',marginTop:14,padding:'15px',borderRadius:16,
              border:'none',background:`linear-gradient(135deg,${C.navy},${C.mid})`,
              color:'#fff',cursor:'pointer',fontWeight:700,fontSize:15,
              boxShadow:`0 6px 20px ${C.navy}44`}}>
            Davom etish →
          </button>
        )}
      </div>
    </div>
  );
}

/* Shared bottom-sheet modal — defined OUTSIDE any page to keep a stable reference */
function BottomModal({ onClose, title, children, C }) {
  return (
    <div style={{position:'fixed',inset:0,zIndex:3000,display:'flex',alignItems:'flex-end',justifyContent:'center',
      background:'rgba(0,0,0,.6)',backdropFilter:'blur(6px)'}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} className="slide-up"
        style={{width:'100%',maxWidth:520,background:C.s1,borderRadius:'28px 28px 0 0',padding:'8px 0 0',
          boxShadow:'0 -12px 48px rgba(0,0,0,.25)',maxHeight:'90vh',overflowY:'auto'}}>
        <div style={{width:40,height:4,borderRadius:99,background:C.border,margin:'0 auto 20px'}}/>
        <div style={{padding:'0 24px 32px'}}>
          <div style={{fontSize:18,fontWeight:800,color:C.dark,marginBottom:22}}>{title}</div>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PROFILE PAGE
═══════════════════════════════════════════════════════ */
function ProfilePage({ C, isDesktop, user, orders, onLogout, isDark, setIsDark, cards, setCards }) {
  const [activeTab, setActiveTab] = useState('orders');
  const [bdays, setBdays] = useState([]);

  useEffect(() => {
    if (!user?.id) return;
    api.get('/api/birthdays').then(setBdays).catch(() => {});
  }, [user?.id]);
  const [bdayModal, setBdayModal] = useState(false);
  const [newBday, setNewBday] = useState({emoji:'🎂',name:'',date:''});
  const [cardModal, setCardModal] = useState(false);
  const [newCard, setNewCard] = useState({cardNumber:'',brand:'UzCard',expiry:'',holderName:'',linkedPhone:'+998'});
  const [cardLoading, setCardLoading] = useState(false);
  const formatCardNum = (v) => v.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim();
  const formatExpiry = (v) => { const d=v.replace(/\D/g,'').slice(0,4); return d.length>2?d.slice(0,2)+'/'+d.slice(2):d; };
  const initials = user?.name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()||'SM';
  const totalSpent = orders.reduce((s,o)=>s+o.total,0);


  /* ── input style for modals */
  const inp = {width:'100%',background:C.s2,border:`1.5px solid ${C.border}`,borderRadius:14,
    padding:'13px 16px',color:C.dark,fontSize:14,outline:'none',marginBottom:10};

  return (
    <div style={{minHeight:'100vh',background:C.bg}}>

      {/* ═══ BIRTHDAY MODAL ═══ */}
      {bdayModal&&(
        <BottomModal C={C} onClose={()=>setBdayModal(false)} title="🎉 День рождения">
          <div style={{display:'flex',gap:8,marginBottom:16}}>
            {['🎂','🎉','🎈','🎁','🌸','⭐'].map(e=>(
              <button key={e} onClick={()=>setNewBday(b=>({...b,emoji:e}))}
                style={{flex:1,fontSize:22,border:`2px solid ${newBday.emoji===e?C.navy:C.border}`,borderRadius:14,
                  padding:'8px 4px',background:newBday.emoji===e?C.s2:'transparent',cursor:'pointer',transition:'all .15s'}}>
                {e}
              </button>
            ))}
          </div>
          <input value={newBday.name} onChange={e=>setNewBday(b=>({...b,name:e.target.value}))} placeholder="Имя" style={inp}/>
          <input value={newBday.date} onChange={e=>setNewBday(b=>({...b,date:e.target.value}))} placeholder="Дата (напр. 12 Мая)" style={{...inp,marginBottom:20}}/>
          <div style={{display:'flex',gap:10}}>
            <button onClick={()=>setBdayModal(false)} style={{flex:1,padding:'14px',borderRadius:14,border:`1.5px solid ${C.border}`,background:'transparent',color:C.muted,cursor:'pointer',fontWeight:600,fontSize:14}}>Отмена</button>
            <button onClick={async()=>{if(newBday.name&&newBday.date){try{const b=await api.post('/api/birthdays',newBday);setBdays(p=>[...p,b]);}catch{}setBdayModal(false);setNewBday({emoji:'🎂',name:'',date:''});}}}
              disabled={!newBday.name||!newBday.date}
              style={{flex:2,padding:'14px',borderRadius:14,border:'none',background:`linear-gradient(135deg,${C.navy},${C.mid})`,color:'#fff',cursor:'pointer',fontWeight:700,fontSize:14,opacity:(!newBday.name||!newBday.date)?.45:1}}>
              Добавить
            </button>
          </div>
        </BottomModal>
      )}

      {/* ═══ CARD MODAL ═══ */}
      {cardModal&&(
        <BottomModal C={C} onClose={()=>setCardModal(false)} title="💳 Добавить карту">
          {/* Brand selector — only UzCard / Humo */}
          <div style={{display:'flex',gap:8,marginBottom:16}}>
            {[
              {id:'UzCard', label:'🟦 UzCard', grad:'linear-gradient(135deg,#1d4ed8,#2563eb)'},
              {id:'Humo',   label:'🟩 Humo',   grad:'linear-gradient(135deg,#059669,#10b981)'},
            ].map(b=>(
              <button key={b.id} onClick={()=>setNewCard(c=>({...c,brand:b.id}))}
                style={{flex:1,padding:'12px 6px',borderRadius:14,border:`2px solid ${newCard.brand===b.id?'transparent':C.border}`,
                  background:newCard.brand===b.id?b.grad:'transparent',color:newCard.brand===b.id?'#fff':C.muted,
                  cursor:'pointer',fontWeight:700,fontSize:13,transition:'all .15s',boxShadow:newCard.brand===b.id?`0 4px 14px rgba(0,0,0,.2)`:'none'}}>
                {b.label}
              </button>
            ))}
          </div>

          {/* Full card number */}
          <div style={{marginBottom:12}}>
            <label style={{fontSize:12,fontWeight:600,color:C.navy,display:'block',marginBottom:6}}>Номер карты</label>
            <input
              value={newCard.cardNumber}
              onChange={e=>setNewCard(c=>({...c,cardNumber:formatCardNum(e.target.value)}))}
              placeholder="0000 0000 0000 0000"
              inputMode="numeric"
              style={{...inp,fontFamily:'monospace',fontSize:17,letterSpacing:2,marginBottom:0}}
            />
          </div>

          {/* Expiry */}
          <div style={{marginBottom:12}}>
            <label style={{fontSize:12,fontWeight:600,color:C.navy,display:'block',marginBottom:6}}>Срок действия</label>
            <input
              value={newCard.expiry}
              onChange={e=>setNewCard(c=>({...c,expiry:formatExpiry(e.target.value)}))}
              placeholder="ММ/ГГ"
              inputMode="numeric"
              style={{...inp,marginBottom:0}}
            />
          </div>

          {/* Holder name */}
          <div style={{marginBottom:12}}>
            <label style={{fontSize:12,fontWeight:600,color:C.navy,display:'block',marginBottom:6}}>Имя владельца</label>
            <input
              value={newCard.holderName}
              onChange={e=>setNewCard(c=>({...c,holderName:e.target.value}))}
              placeholder="AZIZ KARIMOV"
              style={{...inp,textTransform:'uppercase',marginBottom:0}}
            />
          </div>

          {/* Linked phone */}
          <div style={{marginBottom:20}}>
            <label style={{fontSize:12,fontWeight:600,color:C.navy,display:'block',marginBottom:6}}>Телефон, привязанный к карте</label>
            <input
              value={newCard.linkedPhone}
              onChange={e=>setNewCard(c=>({...c,linkedPhone:formatPhone(e.target.value)}))}
              onKeyDown={e=>{if(['Backspace','Delete'].includes(e.key)&&rawDigits(newCard.linkedPhone).length<=3)e.preventDefault();}}
              placeholder="+998 90 123 45 67"
              inputMode="tel"
              style={{...inp,marginBottom:0}}
            />
          </div>

          <div style={{display:'flex',gap:10}}>
            <button onClick={()=>setCardModal(false)} style={{flex:1,padding:'14px',borderRadius:14,border:`1.5px solid ${C.border}`,background:'transparent',color:C.muted,cursor:'pointer',fontWeight:600,fontSize:14}}>Отмена</button>
            {(()=>{
              const digits = newCard.cardNumber.replace(/\s/g,'');
              const valid = digits.length===16 && newCard.expiry.length===5 && isValidPhone(newCard.linkedPhone);
              return (
                <button disabled={!valid||cardLoading}
                  onClick={async()=>{
                    const digits16 = newCard.cardNumber.replace(/\s/g,'');
                    const payload = { last4:digits16.slice(-4), brand:newCard.brand, expiry:newCard.expiry, holderName:newCard.holderName.trim().toUpperCase(), linkedPhone:newCard.linkedPhone };
                    setCardLoading(true);
                    try { const card=await api.post('/api/cards',payload); setCards(p=>[...p,card]); setCardModal(false); setNewCard({cardNumber:'',brand:'UzCard',expiry:'',holderName:'',linkedPhone:'+998'}); }
                    catch(e){} finally{setCardLoading(false);}
                  }}
                  style={{flex:2,padding:'14px',borderRadius:14,border:'none',background:`linear-gradient(135deg,${C.navy},${C.mid})`,color:'#fff',cursor:(!valid||cardLoading)?'default':'pointer',fontWeight:700,fontSize:14,opacity:(!valid||cardLoading)?.45:1,transition:'opacity .2s'}}>
                  {cardLoading?'Сохранение...':'💳 Добавить карту'}
                </button>
              );
            })()}
          </div>
        </BottomModal>
      )}

      {/* ═══ HERO HEADER ═══ */}
      <div style={{position:'relative',background:'linear-gradient(160deg,#060d1a 0%,#0f2259 45%,#1d4ed8 80%,#3b82f6 100%)',paddingTop:isDesktop?32:64,paddingBottom:80,overflow:'hidden'}}>
        {/* Decorative circles */}
        <div style={{position:'absolute',top:-60,right:-60,width:240,height:240,borderRadius:'50%',background:'rgba(255,255,255,.04)',pointerEvents:'none'}}/>
        <div style={{position:'absolute',bottom:-80,left:-40,width:200,height:200,borderRadius:'50%',background:'rgba(59,130,246,.15)',pointerEvents:'none'}}/>
        <div style={{position:'absolute',top:40,left:'50%',transform:'translateX(-50%)',width:320,height:320,borderRadius:'50%',background:'rgba(29,78,216,.08)',pointerEvents:'none'}}/>

        <div style={{maxWidth:600,margin:'0 auto',padding:'0 24px',textAlign:'center',position:'relative'}}>
          {/* Avatar */}
          <div style={{position:'relative',display:'inline-block',marginBottom:16}}>
            <div style={{width:96,height:96,borderRadius:'50%',background:'linear-gradient(135deg,#fff 0%,#e0e7ff 100%)',
              display:'flex',alignItems:'center',justifyContent:'center',fontSize:34,fontWeight:900,
              color:'#1d4ed8',border:'4px solid rgba(255,255,255,.3)',
              boxShadow:'0 0 0 8px rgba(255,255,255,.08),0 12px 32px rgba(0,0,0,.3)',
              letterSpacing:-1}}>
              {initials}
            </div>
            {/* Online dot */}
            <div style={{position:'absolute',bottom:4,right:4,width:20,height:20,borderRadius:'50%',background:'#22c55e',border:'3px solid #0f2259',boxShadow:'0 2px 8px rgba(34,197,94,.5)'}}/>
          </div>

          {/* Name & phone */}
          <div style={{fontSize:26,fontWeight:900,color:'#fff',letterSpacing:-.6,lineHeight:1.1,marginBottom:6}}>{user?.name||'Гость'}</div>
          <div style={{fontSize:13,color:'rgba(255,255,255,.6)',marginBottom:20,letterSpacing:.2}}>{user?.phone||'Номер не указан'}</div>

          {/* Member badge */}
          <div style={{display:'inline-flex',alignItems:'center',gap:6,background:'rgba(255,255,255,.12)',backdropFilter:'blur(12px)',
            border:'1px solid rgba(255,255,255,.2)',borderRadius:50,padding:'6px 18px',marginBottom:0}}>
            <span style={{fontSize:14}}>🥇</span>
            <span style={{fontSize:12,fontWeight:700,color:'#fff',letterSpacing:.5}}>Gold Member</span>
          </div>
        </div>
      </div>

      {/* ═══ STATS STRIP (overlaps hero) ═══ */}
      <div style={{maxWidth:600,margin:'-44px auto 0',padding:'0 16px',position:'relative',zIndex:10}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
          {[
            {icon:<Package size={18} color="#2563eb"/>,val:orders.length,label:'Заказов',color:'#2563eb'},
            {icon:<Star size={18} color="#7c3aed"/>,val:(orders.length*150).toLocaleString(),label:'Баллов',color:'#7c3aed'},
            {icon:<CreditCard size={18} color="#0891b2"/>,val:orders.length>0?sum(totalSpent):'0 сум',label:'Потрачено',color:'#0891b2'},
          ].map(s=>(
            <div key={s.label} style={{background:C.s1,borderRadius:20,padding:'18px 10px',textAlign:'center',
              border:`1px solid ${C.border}`,boxShadow:`0 4px 24px rgba(0,0,0,${isDark?.12:.08})`}}>
              <div style={{width:36,height:36,borderRadius:12,background:`${s.color}15`,margin:'0 auto 10px',
                display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>
                {s.icon}
              </div>
              <div style={{fontSize:s.label==='Потрачено'?10:18,fontWeight:900,color:C.dark,lineHeight:1.1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.val}</div>
              <div style={{fontSize:10,color:C.muted,marginTop:4,fontWeight:500}}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ QUICK ACTIONS ═══ */}
      <div style={{maxWidth:600,margin:'16px auto 0',padding:'0 16px'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:10}}>
          {[
            {icon:<Package size={22}/>,label:'Заказы',tab:'orders'},
            {icon:<span style={{fontSize:20}}>🎂</span>,label:'Дни рожд.',tab:'bdays'},
            {icon:<CreditCard size={22}/>,label:'Карты',tab:'cards'},
            {icon:<Settings size={22}/>,label:'Настройки',tab:'settings'},
          ].map(a=>(
            <button key={a.tab} onClick={()=>setActiveTab(a.tab)}
              style={{background:activeTab===a.tab?C.navy:C.s1,borderRadius:18,padding:'16px 8px',border:`1px solid ${activeTab===a.tab?C.navy:C.border}`,
                cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:7,
                boxShadow:activeTab===a.tab?`0 6px 20px ${C.navy}44`:`0 2px 8px rgba(0,0,0,${isDark?.06:.03})`,
                transition:'all .2s'}}>
              <span style={{fontSize:22}}>{a.icon}</span>
              <span style={{fontSize:10,fontWeight:700,color:activeTab===a.tab?'#fff':C.muted,lineHeight:1,textAlign:'center'}}>{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ═══ TAB CONTENT ═══ */}
      <div style={{maxWidth:600,margin:'20px auto 0',padding:`0 16px ${isDesktop?48:108}px`}}>

        {/* ── ORDERS */}
        {activeTab==='orders'&&(
          <div>
            <div style={{fontSize:16,fontWeight:800,color:C.dark,marginBottom:14,letterSpacing:-.3}}>История заказов</div>
            {orders.length===0?(
              <div style={{textAlign:'center',padding:'64px 0',color:C.muted}}>
                <div style={{fontSize:64,marginBottom:16,opacity:.2}}>📦</div>
                <div style={{fontSize:18,fontWeight:700,color:C.dark,marginBottom:8}}>Заказов пока нет</div>
                <div style={{fontSize:14}}>Сделайте первый заказ!</div>
              </div>
            ):(
              orders.slice().reverse().map((order,i)=>(
                <div key={i} style={{background:C.s1,borderRadius:22,marginBottom:12,overflow:'hidden',
                  border:`1px solid ${C.border}`,boxShadow:`0 2px 16px rgba(0,0,0,${isDark?.07:.03})`}}>
                  {/* Order header stripe */}
                  <div style={{background:`linear-gradient(90deg,${C.navy}12,transparent)`,padding:'14px 18px',
                    borderBottom:`1px solid ${C.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <div style={{width:34,height:34,borderRadius:10,background:`linear-gradient(135deg,${C.navy},${C.mid})`,
                        display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,color:'#fff',flexShrink:0}}>📦</div>
                      <div>
                        <div style={{fontSize:13,fontWeight:800,color:C.dark}}>Заказ #{orders.length-i}</div>
                        <div style={{fontSize:11,color:C.muted}}>{order.date}</div>
                      </div>
                    </div>
                    <span style={{fontSize:11,color:'#16a34a',fontWeight:700,background:'rgba(22,163,74,.12)',padding:'5px 13px',borderRadius:50,border:'1px solid rgba(22,163,74,.2)'}}>✅ Доставлен</span>
                  </div>
                  <div style={{padding:'14px 18px'}}>
                    <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:14}}>
                      {order.items.map(it=>(
                        <span key={it.id} style={{fontSize:11,color:C.muted,background:C.s2,padding:'5px 12px',borderRadius:50,border:`1px solid ${C.border}`}}>
                          {it.emoji} {it.name} ×{it.qty}
                        </span>
                      ))}
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <span style={{fontSize:12,color:C.muted,fontWeight:500}}>Итого</span>
                      <span style={{fontSize:20,fontWeight:900,color:C.navy,letterSpacing:-.5}}>{sum(order.total)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── BIRTHDAYS */}
        {activeTab==='bdays'&&(
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <div style={{fontSize:16,fontWeight:800,color:C.dark,letterSpacing:-.3}}>Дни рождения</div>
              <button onClick={()=>setBdayModal(true)}
                style={{display:'flex',alignItems:'center',gap:6,padding:'9px 18px',borderRadius:50,border:'none',
                  background:`linear-gradient(135deg,${C.navy},${C.mid})`,color:'#fff',cursor:'pointer',fontSize:13,fontWeight:700,
                  boxShadow:`0 4px 14px ${C.navy}44`}}>
                <span style={{fontSize:16}}>+</span> Добавить
              </button>
            </div>
            {bdays.map((b,i)=>{
              const days=daysUntil(b.date), soon=days<=7, vSoon=days<=3;
              return (
                <div key={i} style={{background:C.s1,borderRadius:22,padding:0,marginBottom:12,overflow:'hidden',
                  border:`1.5px solid ${vSoon?'#ef4444':soon?C.navy:C.border}`,
                  boxShadow:soon?`0 6px 20px ${vSoon?'rgba(239,68,68,.15)':C.navy+'22'}`:'none',transition:'all .2s'}}>
                  <div style={{display:'flex',alignItems:'center',gap:0}}>
                    {/* Left color strip */}
                    <div style={{width:6,alignSelf:'stretch',background:vSoon?'linear-gradient(180deg,#ef4444,#f97316)':soon?`linear-gradient(180deg,${C.navy},${C.mid})`:`linear-gradient(180deg,${C.border},${C.border})`,flexShrink:0,borderRadius:'0 0 0 0'}}/>
                    <div style={{width:64,height:72,display:'flex',alignItems:'center',justifyContent:'center',fontSize:34,flexShrink:0}}>{b.emoji}</div>
                    <div style={{flex:1,padding:'14px 4px 14px 0'}}>
                      <div style={{fontSize:15,fontWeight:700,color:C.dark}}>{b.name}</div>
                      <div style={{fontSize:12,color:C.muted,marginTop:3}}>{b.date}</div>
                      {soon&&<div style={{fontSize:11,fontWeight:700,color:vSoon?'#ef4444':C.navy,marginTop:4}}>{vSoon?'🔥 Скоро!':`⏰ Через ${days} дн.`}</div>}
                    </div>
                    <div style={{textAlign:'center',padding:'0 16px 0 8px'}}>
                      <div style={{fontSize:26,fontWeight:900,color:vSoon?'#ef4444':soon?C.navy:C.dark,lineHeight:1,letterSpacing:-1}}>{days}</div>
                      <div style={{fontSize:9,color:C.muted,fontWeight:600,marginTop:2,textTransform:'uppercase',letterSpacing:.5}}>дней</div>
                    </div>
                    <button onClick={async()=>{try{await api.del(`/api/birthdays/${b.id}`);}catch{}setBdays(b2=>b2.filter((_,j)=>j!==i));}}
                      style={{padding:'0 16px 0 0',background:'none',border:'none',cursor:'pointer',color:'#ef4444',opacity:.5,lineHeight:1,alignSelf:'center',display:'flex',alignItems:'center'}}><X size={16}/></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── CARDS */}
        {activeTab==='cards'&&(
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <div style={{fontSize:16,fontWeight:800,color:C.dark,letterSpacing:-.3}}>Мои карты</div>
              <button onClick={()=>setCardModal(true)}
                style={{display:'flex',alignItems:'center',gap:6,padding:'9px 18px',borderRadius:50,border:'none',
                  background:`linear-gradient(135deg,${C.navy},${C.mid})`,color:'#fff',cursor:'pointer',fontSize:13,fontWeight:700,
                  boxShadow:`0 4px 14px ${C.navy}44`}}>
                <span style={{fontSize:16}}>+</span> Добавить
              </button>
            </div>
            {cards.length===0?(
              <div style={{textAlign:'center',padding:'64px 0',color:C.muted}}>
                <div style={{fontSize:64,marginBottom:16,opacity:.2}}>💳</div>
                <div style={{fontSize:18,fontWeight:700,color:C.dark,marginBottom:8}}>Карт пока нет</div>
                <div style={{fontSize:14}}>Добавьте карту для быстрой оплаты</div>
              </div>
            ):(
              cards.map((card)=>(
                <div key={card.id} style={{marginBottom:16,borderRadius:24,overflow:'hidden',
                  boxShadow:`0 8px 32px rgba(0,0,0,${isDark?.2:.1})`,
                  border:`2px solid ${card.isDefault?C.navy:'transparent'}`}}>
                  {/* Credit card face */}
                  <div style={{background:'linear-gradient(145deg,#060d1a,#0f2259 40%,#1d4ed8 75%,#2563eb)',padding:'24px 24px 20px',position:'relative',overflow:'hidden',minHeight:170}}>
                    {/* Decorative circles */}
                    <div style={{position:'absolute',top:-40,right:-40,width:160,height:160,borderRadius:'50%',background:'rgba(255,255,255,.05)'}}/>
                    <div style={{position:'absolute',bottom:-60,right:60,width:130,height:130,borderRadius:'50%',background:'rgba(59,130,246,.12)'}}/>
                    <div style={{position:'absolute',top:20,left:'35%',width:80,height:80,borderRadius:'50%',background:'rgba(255,255,255,.03)'}}/>
                    {/* Chip */}
                    <div style={{position:'relative',display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:24}}>
                      <div style={{width:36,height:28,borderRadius:6,background:'linear-gradient(135deg,#fde68a,#f59e0b)',
                        display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
                        <div style={{width:28,height:20,borderRadius:4,border:'1.5px solid rgba(0,0,0,.2)',background:'linear-gradient(135deg,#fde68a,#d97706)'}}/>
                      </div>
                      <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4}}>
                        <span style={{fontSize:13,fontWeight:900,color:'rgba(255,255,255,.9)',letterSpacing:1.5}}>{card.brand}</span>
                        {card.isDefault&&<span style={{fontSize:10,fontWeight:700,color:'#fff',background:'rgba(255,255,255,.18)',backdropFilter:'blur(8px)',padding:'3px 10px',borderRadius:50,border:'1px solid rgba(255,255,255,.2)'}}>✓ Основная</span>}
                      </div>
                    </div>
                    {/* Card number */}
                    <div style={{fontSize:19,fontWeight:700,color:'rgba(255,255,255,.95)',letterSpacing:4,marginBottom:20,position:'relative',fontFamily:'monospace'}}>
                      •••• &nbsp;•••• &nbsp;•••• &nbsp;{card.last4}
                    </div>
                    {/* Footer */}
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',position:'relative'}}>
                      <div>
                        <div style={{fontSize:9,color:'rgba(255,255,255,.45)',fontWeight:700,letterSpacing:1.8,marginBottom:4,textTransform:'uppercase'}}>Владелец</div>
                        <div style={{fontSize:14,color:'rgba(255,255,255,.9)',fontWeight:600,letterSpacing:.5}}>{(card.holderName||'—').toUpperCase()}</div>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontSize:9,color:'rgba(255,255,255,.45)',fontWeight:700,letterSpacing:1.8,marginBottom:4,textTransform:'uppercase'}}>Срок</div>
                        <div style={{fontSize:14,color:'rgba(255,255,255,.9)',fontWeight:600}}>{card.expiry}</div>
                      </div>
                    </div>
                  </div>
                  {/* Action bar */}
                  <div style={{background:C.s1,padding:'12px 16px',display:'flex',justifyContent:'space-between',alignItems:'center',borderTop:`1px solid ${C.border}`}}>
                    {!card.isDefault?(
                      <button onClick={async()=>{
                        try{const u=await api.patch(`/api/cards/${card.id}/default`,{});setCards(u);}
                        catch{setCards(p=>p.map(c=>({...c,isDefault:c.id===card.id})));}
                      }} style={{display:'flex',alignItems:'center',gap:6,padding:'8px 16px',borderRadius:12,border:`1.5px solid ${C.navy}`,
                        background:'transparent',color:C.navy,cursor:'pointer',fontSize:12,fontWeight:700}}>
                        <span>✓</span> Сделать основной
                      </button>
                    ):(
                      <span style={{fontSize:12,color:C.muted,fontStyle:'italic'}}>Используется по умолчанию</span>
                    )}
                    <button onClick={async()=>{
                      try{await api.del(`/api/cards/${card.id}`);}catch{}finally{
                        setCards(p=>{const n=p.filter(c=>c.id!==card.id);if(card.isDefault&&n.length>0)n[0]={...n[0],isDefault:true};return n;});
                      }
                    }} style={{width:38,height:38,borderRadius:12,border:'1px solid rgba(239,68,68,.3)',background:'rgba(239,68,68,.07)',
                      color:'#ef4444',cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>🗑</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── SETTINGS */}
        {activeTab==='settings'&&(
          <div>
            <div style={{fontSize:16,fontWeight:800,color:C.dark,marginBottom:16,letterSpacing:-.3}}>Настройки</div>

            {/* Appearance group */}
            <div style={{background:C.s1,borderRadius:22,overflow:'hidden',border:`1px solid ${C.border}`,marginBottom:12,boxShadow:`0 2px 12px rgba(0,0,0,${isDark?.05:.02})`}}>
              <div style={{padding:'12px 18px',borderBottom:`1px solid ${C.border}`}}>
                <span style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:1.4,textTransform:'uppercase'}}>Оформление</span>
              </div>
              <div style={{padding:'16px 18px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{display:'flex',alignItems:'center',gap:14}}>
                  <div style={{width:44,height:44,borderRadius:14,background:isDark?'linear-gradient(135deg,#1e293b,#334155)':'linear-gradient(135deg,#fef9c3,#fde68a)',
                    display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,border:`1px solid ${C.border}`}}>
                    {isDark?'🌙':'☀️'}
                  </div>
                  <div>
                    <div style={{fontSize:15,fontWeight:700,color:C.dark}}>{isDark?'Тёмная тема':'Светлая тема'}</div>
                    <div style={{fontSize:12,color:C.muted,marginTop:2}}>Изменить внешний вид</div>
                  </div>
                </div>
                <Toggle on={isDark} onToggle={()=>setIsDark(d=>!d)} C={C}/>
              </div>
            </div>

            {/* Account group */}
            <div style={{background:C.s1,borderRadius:22,overflow:'hidden',border:`1px solid ${C.border}`,marginBottom:20,boxShadow:`0 2px 12px rgba(0,0,0,${isDark?.05:.02})`}}>
              <div style={{padding:'12px 18px',borderBottom:`1px solid ${C.border}`}}>
                <span style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:1.4,textTransform:'uppercase'}}>Аккаунт</span>
              </div>
              <div style={{padding:'15px 18px',display:'flex',alignItems:'center',gap:14}}>
                <div style={{width:44,height:44,borderRadius:14,background:'linear-gradient(135deg,#1d4ed8,#3b82f6)',
                  display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,color:'#fff',border:`1px solid ${C.border}`}}>👤</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:15,fontWeight:700,color:C.dark}}>{user?.name||'Гость'}</div>
                  <div style={{fontSize:12,color:C.muted,marginTop:2}}>{user?.phone||''}</div>
                </div>
                <div style={{fontSize:11,fontWeight:700,color:C.navy,background:C.s2,padding:'4px 12px',borderRadius:50,border:`1px solid ${C.border}`}}>🥇 Gold</div>
              </div>
            </div>

            {/* Logout */}
            <button onClick={onLogout}
              style={{width:'100%',padding:'17px',borderRadius:22,border:'1.5px solid rgba(239,68,68,.25)',background:'rgba(239,68,68,.06)',
                color:'#ef4444',cursor:'pointer',fontWeight:800,fontSize:15,display:'flex',alignItems:'center',justifyContent:'center',gap:10,
                boxShadow:'0 2px 12px rgba(239,68,68,.08)'}}>
              <span style={{fontSize:18}}>🚪</span><span>Выйти из аккаунта</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   APP ROOT
═══════════════════════════════════════════════════════ */
export default function App() {
  const { isDesktop } = useBreakpoint();
  const [isDark, setIsDark] = useState(false);
  const C = isDark ? THEMES.dark : THEMES.light;

  const [page, setPage] = useState('login');
  const [user, setUser] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cakeCards, setCakeCards] = useState([]);
  const [bakeries, setBakeries] = useState([]);
  const [cards, setCards] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastId, setToastId] = useState(0);

  useEffect(() => { injectGlobal(C); }, [C]);

  // Fetch public data on mount
  useEffect(() => {
    api.get('/api/products').then(setCakeCards).catch(() => {});
    api.get('/api/bakeries').then(setBakeries).catch(() => {});
  }, []);

  // Restore session from localStorage on mount, or Telegram auto-login
  useEffect(() => {
    const token = localStorage.getItem('sm_token');
    if (token) {
      api.get('/api/auth/me').then(({ user: fresh }) => {
        setUser(fresh);
        setPage('home');
      }).catch(() => {
        localStorage.removeItem('sm_token');
        // Try Telegram auth if inside Mini App
        const tg = window.Telegram?.WebApp;
        if (tg?.initData) {
          tg.ready(); tg.expand();
          api.post('/api/auth/telegram', { initData: tg.initData })
            .then(({ token: t, user: u }) => { localStorage.setItem('sm_token', t); setUser(u); setPage('home'); })
            .catch(() => setPage('login'));
        } else {
          setUser(null); setPage('login');
        }
      });
      return;
    }
    // No token — check Telegram
    const tg = window.Telegram?.WebApp;
    if (tg?.initData) {
      tg.ready(); tg.expand();
      api.post('/api/auth/telegram', { initData: tg.initData })
        .then(({ token: t, user: u }) => { localStorage.setItem('sm_token', t); setUser(u); setPage('home'); })
        .catch(() => setPage('login'));
    }
  }, []);

  // Fetch user-specific data when user changes
  useEffect(() => {
    if (!user?.id) return;
    api.get('/api/orders').then(setOrders).catch(() => {});
    api.get('/api/cards').then(setCards).catch(() => {});
  }, [user?.id]);

  const toast = (msg) => { setToastMsg(msg); setToastId(id => id + 1); setTimeout(() => setToastMsg(''), 2600); };

  const handleLogin = (userData) => {
    setUser(userData);
    setPage('home');
  };
  const handleLogout = () => {
    setUser(null); setOrders([]); setCards([]);
    localStorage.removeItem('sm_token');
    setPage('login');
  };
  const handleAddToCart = (item) => {
    setCartItems(prev => {
      const ex = prev.find(i => i.id === item.id);
      if (ex) return prev.map(i => i.id === item.id ? {...i, qty: i.qty + 1} : i);
      return [...prev, {...item, qty: 1}];
    });
    toast(`🛒 ${item.name} добавлен`);
  };
  const handleAddToOrder = async (items, total, bakery, paymentMode = 'cash', cardInfo = null) => {
    try {
      const order = await api.post('/api/orders', { items, total, bakery, paymentMode, cardInfo });
      setOrders(prev => [...prev, order]);
    } catch {
      setOrders(prev => [...prev, { items, total, bakery, paymentMode, cardInfo, date: new Date().toLocaleDateString('ru-RU'), status: 'pending' }]);
    }
  };

  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);

  const renderPage = () => {
    if (page === 'login') return <LoginPage onLogin={handleLogin} goSignup={() => setPage('signup')} C={C} isDesktop={isDesktop} />;
    if (page === 'signup') return <SignupPage onLogin={handleLogin} goLogin={() => setPage('login')} C={C} isDesktop={isDesktop} />;
    if (page === 'cart') return <CartPage toast={toast} cartItems={cartItems} setCartItems={setCartItems} C={C} onAddToOrder={handleAddToOrder} isDesktop={isDesktop} cards={cards} setCards={setCards} bakeries={bakeries} setPage={setPage} />;
    if (page === 'camera') return <CameraPage onBack={() => setPage('home')} onPhotoTaken={() => { toast('📸 Фото добавлено!'); setPage('home'); }} C={C} />;
    if (page === 'explore') return <ExplorePage C={C} isDesktop={isDesktop} onAddToCart={handleAddToCart} toast={toast} user={user} />;
    if (page === 'create') return <CreatePage C={C} isDesktop={isDesktop} toast={toast} setPage={setPage} bakeries={bakeries} onAddToCart={handleAddToCart} />;
    if (page === 'profile') return <ProfilePage C={C} isDesktop={isDesktop} user={user} orders={orders} onLogout={handleLogout} isDark={isDark} setIsDark={setIsDark} cards={cards} setCards={setCards} />;
    return <HomePage toast={toast} onAddToCart={handleAddToCart} user={user} C={C} cakeCards={cakeCards} setCakeCards={setCakeCards} setPage={setPage} isDesktop={isDesktop} />;
  };

  const showNav = user && page !== 'login' && page !== 'signup';

  return (
    <div style={{ minHeight:'100vh', background:C.bg, color:C.text, transition:'background .3s,color .3s', display: showNav && isDesktop ? 'flex' : 'block' }}>
      <Toast msg={toastMsg} id={toastId} C={C} isDesktop={isDesktop}/>

      {showNotifs && (
        <div style={{ position:'fixed', inset:0, zIndex:2000, background:C.bg, overflowY:'auto' }}>
          <NotificationsPage onClose={() => setShowNotifs(false)} C={C} isDesktop={isDesktop}/>
        </div>
      )}

      {showNav && isDesktop && (
        <SidebarNav page={page} setPage={setPage} cartCount={cartCount} C={C} isDark={isDark} user={user} onLogout={handleLogout}/>
      )}

      <div style={{ flex:1, minWidth:0 }}>
        {/* Top bar */}
        <div style={{ display:'flex', justifyContent:'flex-end', padding:'14px 20px 0', gap:8, alignItems:'center' }}>
          {showNav && (
            <button onClick={() => setShowNotifs(true)}
              className="icon-btn"
              style={{ width:38, height:38, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', background:'transparent', border:'none', cursor:'pointer', color:C.dark, transition:'all .2s' }}>
              <Bell size={20}/>
            </button>
          )}
          <button onClick={() => setIsDark(d => !d)}
            className="icon-btn"
            style={{ width:38, height:38, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', background:'transparent', border:'none', cursor:'pointer', color:C.dark, transition:'all .2s' }}>
            {isDark ? <Sun size={20}/> : <Moon size={20}/>}
          </button>
        </div>
        {renderPage()}
      </div>

      {showNav && !isDesktop && (
        <BottomNav page={page} setPage={setPage} cartCount={cartCount} C={C}/>
      )}
    </div>
  );
}