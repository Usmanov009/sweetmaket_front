import { useState, useEffect, useRef, memo, useCallback } from 'react';
import {
  Sun, Moon, Bell,
  Trash, Plus, Package, Gear, SignOut,
  Heart, X, Check,
  MapPin, Clock, Star, TrendUp,
  PencilSimple, House, Gift, UserCircle, Phone,
} from '@phosphor-icons/react';
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
import TelegramAuthPage from './pages/TelegramAuthPage';
import NotificationsPage from './pages/NotificationsPage';
import HomePage from './pages/HomePage';
import SellerLoginPage from './pages/SellerLoginPage';
import SellerDashboardPage from './pages/SellerDashboardPage';
import CartPage from './pages/CartPage';



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

function BakeryPickerMap({ C, selected, onSelect, bakeries = [] }) {
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const markersRef = useRef([]);
  
  // Sellers va oddiy bakeries ni ajratish
  const sellerBakeries = bakeries.filter(b => b.isSeller);
  const regularBakeries = bakeries.filter(b => !b.isSeller);

  useEffect(() => {
    if (leafletMap.current) return;
    let cancelled = false;
    import('leaflet').then(L => {
      if (cancelled || leafletMap.current) return;
      // Clear any stale Leaflet state on the container div
      if (mapRef.current) delete mapRef.current._leaflet_id;
      const map = L.map(mapRef.current, { zoomControl: true }).setView([41.299, 69.270], 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: ' OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map);
      leafletMap.current = map;

      // Clear previous markers
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];

      // Add markers for regular bakeries only (sellers have no coordinates)
      regularBakeries.forEach(b => {
        if (!b.lat || !b.lng) return;
        const icon = L.divIcon({
          html: `<div style="background:${C.navy};color:#fff;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);">${b.emoji}</div>`,
          iconSize: [32, 32],
          className: 'custom-marker',
        });
        const marker = L.marker([b.lat, b.lng], { icon })
          .addTo(map)
          .bindPopup(`<b>${b.name}</b><br>${b.address}<br>⏰ ${b.hours}`);
        marker.on('click', () => onSelect(b));
        markersRef.current.push(marker);
      });
    });
    return () => { cancelled = true; };
  }, [regularBakeries, C.navy, onSelect]);

  return (
    <div>
      {/* Sellers section */}
      {sellerBakeries.length > 0 && (
        <div style={{marginBottom:16}}>
          <div style={{fontSize:12, fontWeight:600, color:C.navy, marginBottom:8}}>🏪 Qandolatchilar</div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {sellerBakeries.map(b => {
              const active = selected?.id === b.id;
              return (
                <div key={b.id} onClick={() => onSelect(b)}
                  style={{display:'flex',gap:12,alignItems:'center',padding:'12px 14px',borderRadius:14,
                    border:`1.5px solid ${active ? C.navy : C.border}`,
                    background: active ? 'rgba(29,78,216,.06)' : C.s1,
                    cursor:'pointer',transition:'all .15s'}}>
                  <div style={{fontSize:28,flexShrink:0}}>{b.emoji}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:700,color:active?C.navy:C.dark,marginBottom:2}}>{b.name}</div>
                    <div style={{fontSize:12,color:C.muted,marginTop:2}}>{b.address}</div>
                    <div style={{fontSize:11,color:C.muted,marginTop:2}}>⏰ {b.hours} &nbsp;·&nbsp; ⭐ {b.rating}</div>
                  </div>
                  <div style={{width:22,height:22,borderRadius:'50%',flexShrink:0,
                    background:active?C.navy:'transparent',border:`2px solid ${active?C.navy:C.border}`,
                    display:'flex',alignItems:'center',justifyContent:'center'}}>
                    {active && <span style={{color:'#fff',fontSize:12,fontWeight:700}}>✓</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{borderRadius:14,overflow:'hidden',border:`1px solid ${C.border}`,marginBottom:10}}>
        <div ref={mapRef} style={{height:230,width:'100%'}}/>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   EXPLORE PAGE
═══════════════════════════════════════════════════════ */
function ExplorePage({ C, isDesktop, toast, user }) {
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

              {/* image — tap to view details */}
              <div style={{position:'relative',cursor:'pointer'}} onClick={()=>{
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

function CreatePage({ C, isDesktop, toast, setPage, bakeries = [] }) {
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
            {/* Sellers only */}
            {bakeries.filter(b => b.isSeller).map(b => {
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
function ProfilePage({ C, isDesktop, user, orders, onLogout, isDark, setIsDark, setUser, setPage }) {
  const [activeTab, setActiveTab] = useState('orders');
  const [bdays,     setBdays]     = useState([]);
  const [bdayModal, setBdayModal] = useState(false);
  const [newBday,   setNewBday]   = useState({ emoji: '🎂', name: '', date: '' });
  const [nameModal,   setNameModal]   = useState(false);
  const [nameForm,    setNameForm]    = useState({ firstName: '', lastName: '' });
  const [nameLoading, setNameLoading] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    api.get('/api/birthdays').then(setBdays).catch(() => {});
  }, [user?.id]);

  const initials   = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'SM';
  const totalSpent = orders.reduce((s, o) => s + o.total, 0);


  const inp = {
    width: '100%', background: C.s2, border: `1.5px solid ${C.border}`,
    borderRadius: 12, padding: '13px 16px', color: C.dark, fontSize: 14,
    outline: 'none', marginBottom: 10,
  };

  const TABS = [
    { id: 'orders',   icon: <Package size={20} />, label: "Buyurtmalar" },
    { id: 'bdays',    icon: <Gift size={20} />,    label: "Tug'ilgan kun" },
    { id: 'settings', icon: <Gear size={20} />,    label: "Sozlamalar" },
  ];

  return (
    <>
      {/* Birthday Modal */}
      {bdayModal && (
        <BottomModal C={C} onClose={() => setBdayModal(false)} title="Tug'ilgan kun qo'shish">
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {['🎂','🎉','🎈','🎁','🌸','⭐'].map(e => (
              <button key={e} onClick={() => setNewBday(b => ({ ...b, emoji: e }))}
                style={{ flex:1, fontSize:22, border:'2px solid '+(newBday.emoji===e?C.navy:C.border), borderRadius:12, padding:'8px 4px', background:newBday.emoji===e?C.s2:'transparent', cursor:'pointer' }}>
                {e}
              </button>
            ))}
          </div>
          <input value={newBday.name} onChange={e => setNewBday(b => ({ ...b, name: e.target.value }))} placeholder="Ism" style={inp} />
          <input value={newBday.date} onChange={e => setNewBday(b => ({ ...b, date: e.target.value }))} placeholder="Sana (mas. 12 May)" style={{ ...inp, marginBottom: 20 }} />
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => setBdayModal(false)} style={{ flex:1, padding:14, borderRadius:12, border:'1.5px solid '+C.border, background:'none', color:C.muted, cursor:'pointer', fontWeight:600 }}>Bekor</button>
            <button disabled={!newBday.name||!newBday.date}
              onClick={async () => { if(newBday.name&&newBday.date){ try{ const b=await api.post('/api/birthdays',newBday); setBdays(p=>[...p,b]); }catch{} setBdayModal(false); setNewBday({emoji:'🎂',name:'',date:''}); } }}
              style={{ flex:2, padding:14, borderRadius:12, border:'none', background:'linear-gradient(135deg,'+C.navy+','+C.mid+')', color:'#fff', cursor:'pointer', fontWeight:700, opacity:(!newBday.name||!newBday.date)?.45:1 }}>
              Qo'shish
            </button>
          </div>
        </BottomModal>
      )}

      {/* Name Modal */}
      {nameModal && (
        <BottomModal C={C} onClose={() => setNameModal(false)} title="Ismni o'zgartirish">
          <input value={nameForm.firstName} onChange={e => setNameForm(f => ({ ...f, firstName: e.target.value }))} placeholder="Ism" style={inp} />
          <input value={nameForm.lastName} onChange={e => setNameForm(f => ({ ...f, lastName: e.target.value }))} placeholder="Familiya" style={{ ...inp, marginBottom: 20 }} />
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => setNameModal(false)} style={{ flex:1, padding:14, borderRadius:12, border:'1.5px solid '+C.border, background:'none', color:C.muted, cursor:'pointer', fontWeight:600 }}>Bekor</button>
            <button disabled={!nameForm.firstName.trim()||nameLoading}
              onClick={async () => { setNameLoading(true); try{ const res=await api.patch('/api/auth/me',{firstName:nameForm.firstName.trim(),lastName:nameForm.lastName.trim()}); setUser(res.user); setNameModal(false); }catch{}finally{ setNameLoading(false); } }}
              style={{ flex:2, padding:14, borderRadius:12, border:'none', background:'linear-gradient(135deg,'+C.navy+','+C.mid+')', color:'#fff', cursor:'pointer', fontWeight:700, opacity:(!nameForm.firstName.trim()||nameLoading)?.45:1 }}>
              {nameLoading ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </BottomModal>
      )}

      {/* HERO */}
      <div style={{ background:'linear-gradient(145deg,#1e1b4b 0%,#4f46e5 58%,#7c3aed 100%)', paddingTop:isDesktop?28:52, paddingBottom:52, position:'relative', overflow:'hidden' }}>
        <div style={{ maxWidth:600, margin:'0 auto', padding:'0 20px', position:'relative' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <button onClick={() => setPage('home')} style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(255,255,255,.12)', border:'1px solid rgba(255,255,255,.2)', borderRadius:8, padding:'6px 11px', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:600 }}>
              <House size={14} /> Bosh sahifa
            </button>
            <button onClick={() => { setNameForm({firstName:user?.firstName||'',lastName:user?.lastName||''}); setNameModal(true); }}
              style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(255,255,255,.12)', border:'1px solid rgba(255,255,255,.2)', borderRadius:8, padding:'6px 11px', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:600 }}>
              <PencilSimple size={14} /> Tahrirlash
            </button>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:68, height:68, borderRadius:'50%', background:'linear-gradient(135deg,rgba(255,255,255,.22),rgba(255,255,255,.08))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:900, color:'#fff', border:'2px solid rgba(255,255,255,.28)', flexShrink:0 }}>
              {initials}
            </div>
            <div>
              <div style={{ fontSize:18, fontWeight:900, color:'#fff', marginBottom:3 }}>{user?.name||'Foydalanuvchi'}</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,.6)', marginBottom:7, display:'flex', alignItems:'center', gap:4 }}>
                <Phone size={11} /> {user?.phone||''}
              </div>
              <div style={{ display:'inline-flex', alignItems:'center', gap:5, background:'rgba(255,255,255,.12)', border:'1px solid rgba(255,255,255,.2)', borderRadius:50, padding:'4px 12px' }}>
                <Star size={12} color="#fbbf24" weight="fill" />
                <span style={{ fontSize:11, fontWeight:700, color:'#fff' }}>Gold Member</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div style={{ maxWidth:600, margin:'-18px auto 0', padding:'0 16px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
          {[
            { icon:<Package size={16} weight="duotone"/>, color:'#4f46e5', val:orders.length,                         label:'Buyurtmalar' },
            { icon:<Star    size={16} weight="duotone"/>, color:'#f59e0b', val:(orders.length*150).toLocaleString(),   label:'Ballar' },
            { icon:<TrendUp size={16} weight="duotone"/>, color:'#059669', val:sum(totalSpent),                        label:'Sarflangan', small:totalSpent>999999 },
          ].map(s => (
            <div key={s.label} style={{ background:C.s1, borderRadius:14, padding:'12px 8px', textAlign:'center', border:'1px solid '+C.border, boxShadow:'0 2px 10px rgba(0,0,0,.06)' }}>
              <div style={{ width:30, height:30, borderRadius:9, background:s.color+'15', margin:'0 auto 6px', display:'flex', alignItems:'center', justifyContent:'center', color:s.color }}>
                {s.icon}
              </div>
              <div style={{ fontSize:s.small?9:15, fontWeight:800, color:C.dark, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.val}</div>
              <div style={{ fontSize:10, color:C.muted, marginTop:2, fontWeight:500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* TABS */}
      <div style={{ maxWidth:600, margin:'12px auto 0', padding:'0 16px' }}>
        <div style={{ display:'flex', background:C.s2, borderRadius:12, padding:3, gap:3 }}>
          {TABS.map(({ id, icon, label }) => (
            <button key={id} onClick={() => setActiveTab(id)} style={{ flex:1, padding:'8px 6px', borderRadius:10, border:'none', cursor:'pointer', background:activeTab===id?C.s1:'transparent', color:activeTab===id?'#4f46e5':C.muted, fontWeight:activeTab===id?700:500, fontSize:10, display:'flex', flexDirection:'column', alignItems:'center', gap:4, transition:'all .2s', boxShadow:activeTab===id?'0 1px 6px rgba(0,0,0,.07)':'none' }}>
              {icon}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ maxWidth:600, margin:'16px auto 0', padding:'0 16px '+(isDesktop?48:108)+'px' }}>

        {activeTab==='orders' && (
          orders.length===0 ? (
            <div style={{ textAlign:'center', padding:'64px 0', color:C.muted }}>
              <Package size={60} weight="duotone" style={{ opacity:.25, marginBottom:16 }} />
              <div style={{ fontSize:18, fontWeight:700, color:C.dark, marginBottom:8 }}>Buyurtmalar yo'q</div>
              <div style={{ fontSize:14 }}>Birinchi buyurtmangizni bering!</div>
            </div>
          ) : orders.slice().reverse().map((order,i) => (
            <div key={i} style={{ background:C.s1, borderRadius:20, marginBottom:12, border:'1px solid '+C.border, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,.04)' }}>
              <div style={{ padding:'13px 18px', borderBottom:'1px solid '+C.border, display:'flex', justifyContent:'space-between', alignItems:'center', background:C.navy+'08' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:34, height:34, borderRadius:10, background:'linear-gradient(135deg,'+C.navy+','+C.mid+')', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', flexShrink:0 }}>
                    <Package size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:800, color:C.dark }}>Buyurtma #{orders.length-i}</div>
                    <div style={{ fontSize:11, color:C.muted }}>{order.date}</div>
                  </div>
                </div>
                <span style={{ fontSize:11, color:'#16a34a', fontWeight:700, background:'rgba(22,163,74,.1)', padding:'5px 13px', borderRadius:50, display:'flex', alignItems:'center', gap:4 }}>
                  <Check size={11} weight="bold" /> Yetkazildi
                </span>
              </div>
              <div style={{ padding:'14px 18px' }}>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:14 }}>
                  {order.items.map(it => (
                    <span key={it.id} style={{ fontSize:11, color:C.muted, background:C.s2, padding:'5px 12px', borderRadius:50, border:'1px solid '+C.border }}>
                      {it.emoji} {it.name} x{it.qty}
                    </span>
                  ))}
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:12, color:C.muted }}>Jami</span>
                  <span style={{ fontSize:20, fontWeight:900, color:C.navy, letterSpacing:-.5 }}>{sum(order.total)}</span>
                </div>
              </div>
            </div>
          ))
        )}

        {activeTab==='bdays' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <div style={{ fontSize:16, fontWeight:800, color:C.dark }}>Tug'ilgan kunlar</div>
              <button onClick={() => setBdayModal(true)} style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 18px', borderRadius:50, border:'none', background:'linear-gradient(135deg,'+C.navy+','+C.mid+')', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700, boxShadow:'0 4px 14px '+C.navy+'44' }}>
                <Plus size={15} /> Qo'shish
              </button>
            </div>
            {bdays.length===0 && (
              <div style={{ textAlign:'center', padding:'48px 0' }}>
                <Gift size={56} weight="duotone" color={C.muted} style={{ opacity:.3, marginBottom:12 }} />
                <div style={{ fontSize:16, fontWeight:700, color:C.dark, marginBottom:6 }}>Tug'ilgan kunlar yo'q</div>
                <div style={{ fontSize:13, color:C.muted }}>Yaqinlaringizning tug'ilgan kunini qo'shing</div>
              </div>
            )}
            {bdays.map((b,i) => {
              const days=daysUntil(b.date), soon=days<=7, vSoon=days<=3;
              return (
                <div key={i} style={{ background:C.s1, borderRadius:20, marginBottom:12, overflow:'hidden', border:'1.5px solid '+(vSoon?'#ef4444':soon?C.navy:C.border), boxShadow:soon?'0 6px 20px '+(vSoon?'rgba(239,68,68,.15)':C.navy+'22'):'none' }}>
                  <div style={{ display:'flex', alignItems:'center' }}>
                    <div style={{ width:6, alignSelf:'stretch', background:vSoon?'linear-gradient(180deg,#ef4444,#f97316)':soon?'linear-gradient(180deg,'+C.navy+','+C.mid+')':C.border, flexShrink:0 }} />
                    <div style={{ width:64, height:72, display:'flex', alignItems:'center', justifyContent:'center', fontSize:34, flexShrink:0 }}>{b.emoji}</div>
                    <div style={{ flex:1, padding:'14px 4px 14px 0' }}>
                      <div style={{ fontSize:15, fontWeight:700, color:C.dark }}>{b.name}</div>
                      <div style={{ fontSize:12, color:C.muted, marginTop:3 }}>{b.date}</div>
                      {soon && <div style={{ fontSize:11, fontWeight:700, color:vSoon?'#ef4444':C.navy, marginTop:4 }}>{vSoon?'Yaqin qoldi!':days+' kun qoldi'}</div>}
                    </div>
                    <div style={{ textAlign:'center', padding:'0 12px 0 8px' }}>
                      <div style={{ fontSize:26, fontWeight:900, color:vSoon?'#ef4444':soon?C.navy:C.dark, lineHeight:1 }}>{days}</div>
                      <div style={{ fontSize:9, color:C.muted, fontWeight:600, marginTop:2, textTransform:'uppercase' }}>kun</div>
                    </div>
                    <button onClick={async () => { try{ await api.del('/api/birthdays/'+b.id); }catch{} setBdays(b2=>b2.filter((_,j)=>j!==i)); }}
                      style={{ padding:'0 16px', background:'none', border:'none', cursor:'pointer', color:'#ef4444', opacity:.5, display:'flex', alignItems:'center' }}>
                      <Trash size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab==='settings' && (
          <div>
            <div style={{ background:C.s1, borderRadius:20, overflow:'hidden', border:'1px solid '+C.border, marginBottom:12 }}>
              <div style={{ padding:'10px 18px', borderBottom:'1px solid '+C.border }}>
                <span style={{ fontSize:11, fontWeight:700, color:C.muted, letterSpacing:1.2, textTransform:'uppercase' }}>Ko'rinish</span>
              </div>
              <div style={{ padding:'16px 18px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:44, height:44, borderRadius:14, background:isDark?'linear-gradient(135deg,#1e293b,#334155)':'linear-gradient(135deg,#fef3c7,#fde68a)', display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid '+C.border, color:isDark?'#93c5fd':'#d97706' }}>
                    {isDark ? <Moon size={22} weight="duotone"/> : <Sun size={22} weight="duotone"/>}
                  </div>
                  <div>
                    <div style={{ fontSize:15, fontWeight:700, color:C.dark }}>{isDark?"Qorong'u tema":"Yorug' tema"}</div>
                    <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>Ko'rinishni o'zgartirish</div>
                  </div>
                </div>
                <Toggle on={isDark} onToggle={() => setIsDark(d=>!d)} C={C} />
              </div>
            </div>
            <div style={{ background:C.s1, borderRadius:20, overflow:'hidden', border:'1px solid '+C.border, marginBottom:16 }}>
              <div style={{ padding:'10px 18px', borderBottom:'1px solid '+C.border }}>
                <span style={{ fontSize:11, fontWeight:700, color:C.muted, letterSpacing:1.2, textTransform:'uppercase' }}>Hisob</span>
              </div>
              {[
                { icon:<UserCircle size={20} weight="duotone"/>, color:'#4f46e5', label:'Ism Familiya',  val:user?.name||'—' },
                { icon:<Phone size={20} weight="duotone"/>,      color:'#059669', label:'Telefon raqam', val:user?.phone||'—' },
                { icon:<Star size={20} weight="duotone"/>,       color:'#f59e0b', label:'Status',        val:'Gold Member' },
              ].map((row,i,arr) => (
                <div key={row.label} style={{ padding:'14px 18px', display:'flex', alignItems:'center', gap:12, borderBottom:i<arr.length-1?'1px solid '+C.border:'none' }}>
                  <div style={{ width:40, height:40, borderRadius:12, background:row.color+'15', display:'flex', alignItems:'center', justifyContent:'center', color:row.color, flexShrink:0 }}>
                    {row.icon}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:2 }}>{row.label}</div>
                    <div style={{ fontSize:14, fontWeight:700, color:C.dark }}>{row.val}</div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={onLogout} style={{ width:'100%', padding:16, borderRadius:18, border:'1.5px solid rgba(239,68,68,.25)', background:'rgba(239,68,68,.05)', color:'#ef4444', cursor:'pointer', fontWeight:700, fontSize:15, display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
              <SignOut size={18} /> Hisobdan chiqish
            </button>
          </div>
        )}

      </div>
    </>
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
  const [orders, setOrders] = useState([]);
  const [cards, setCards] = useState([]);
  const [cart, setCart] = useState([]);
  const [cakeCards, setCakeCards] = useState([]);
  const [bakeries, setBakeries] = useState([]);
  const [user, setUser] = useState(null);
  const [seller, setSeller] = useState(null);

  const [toastMsg, setToastMsg] = useState('');
  const [toastId, setToastId] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => { injectGlobal(C); }, [C]);

  // Fetch public data on mount
  useEffect(() => {
    api.get('/api/products').then(setCakeCards).catch(() => {});
    api.get('/api/bakeries').then(setBakeries).catch(() => {});
  }, []);

  // Restore seller session
  useEffect(() => {
    const token = localStorage.getItem('sm_seller_token');
    if (!token) return;
    const BASE = import.meta.env.VITE_API_URL || '';
    fetch(BASE + '/api/seller/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(({ seller: s }) => { setSeller(s); setPage('seller'); })
      .catch(() => localStorage.removeItem('sm_seller_token'));
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

  const handleTelegramAuth = (userData, userType) => {
    if (userType === 'seller') {
      setSeller(userData);
      setPage('seller');
    } else {
      setUser(userData);
      setPage('home');
    }
  };
  const handleLogout = () => {
    setUser(null); setOrders([]); setCards([]);
    localStorage.removeItem('sm_token');
    setPage('login');
  };
  const handleSellerLogin = (sellerData) => {
    setSeller(sellerData);
    setPage('seller');
  };
  const handleSellerLogout = () => {
    setSeller(null);
    localStorage.removeItem('sm_seller_token');
    setPage('seller-login');
  };
    const handleAddToOrder = async (items, total, bakery, paymentMode = 'cash', cardInfo = null) => {
    try {
      const order = await api.post('/api/orders', { items, total, bakery, paymentMode, cardInfo });
      setOrders(prev => [...prev, order]);
    } catch {
      setOrders(prev => [...prev, { items, total, bakery, paymentMode, cardInfo, date: new Date().toLocaleDateString('ru-RU'), status: 'pending' }]);
    }
  };


  const addToCart = (product, qty = 1) => {
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) return prev.map(i => i.productId === product.id ? { ...i, qty: i.qty + qty } : i);
      return [...prev, {
        id: Date.now() + Math.random(),
        productId: product.id,
        name: product.name,
        price: product.price,
        qty,
        emoji: product.emoji,
        category: product.category,
        bg: product.bg,
        image: product.image,
      }];
    });
  };
  const updateCartQty = (id, qty) => setCart(prev => prev.map(i => i.id === id ? { ...i, qty } : i));
  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));
  const clearCart = () => setCart([]);

  const renderPage = () => {
    if (page === 'seller-login') return <SellerLoginPage onLogin={handleSellerLogin} goUserLogin={() => setPage('login')} C={C} isDesktop={isDesktop} />;
    if (page === 'seller') return <SellerDashboardPage seller={seller} onLogout={handleSellerLogout} C={C} isDesktop={isDesktop} />;
    if (page === 'login') return <LoginPage onLogin={handleLogin} goSignup={() => setPage('signup')} goSellerLogin={() => setPage('seller-login')} C={C} isDesktop={isDesktop} setPage={setPage} />;
    if (page === 'telegram-auth') return <TelegramAuthPage onBack={() => setPage('login')} onAuthSuccess={handleTelegramAuth} C={C} isDesktop={isDesktop} />;
    if (page === 'signup') return <SignupPage onLogin={handleLogin} goLogin={() => setPage('login')} C={C} isDesktop={isDesktop} />;
        if (page === 'camera') return <CameraPage onBack={() => setPage('home')} onPhotoTaken={() => { toast('📸 Фото добавлено!'); setPage('home'); }} C={C} />;
    if (page === 'explore') return <ExplorePage C={C} isDesktop={isDesktop} toast={toast} user={user} />;
    if (page === 'create') return <CreatePage C={C} isDesktop={isDesktop} toast={toast} setPage={setPage} bakeries={bakeries} />;
    if (page === 'cart') return <CartPage C={C} isDesktop={isDesktop} cart={cart} onUpdateQty={updateCartQty} onRemove={removeFromCart} onClear={clearCart} onOrder={handleAddToOrder} toast={toast} setPage={setPage} />;
    if (page === 'profile') return <ProfilePage C={C} isDesktop={isDesktop} user={user} orders={orders} onLogout={handleLogout} isDark={isDark} setIsDark={setIsDark} setUser={setUser} setPage={setPage} />;
    return <HomePage toast={toast} user={user} C={C} cakeCards={cakeCards} setCakeCards={setCakeCards} setPage={setPage} isDesktop={isDesktop} addToCart={addToCart} isDark={isDark} setIsDark={setIsDark} />;
  };

  const showNav = user && !['login','signup','seller-login','seller','telegram-auth'].includes(page);

  return (
    <div style={{ minHeight:'100vh', background:C.bg, color:C.text, transition:'background .3s,color .3s', display: showNav && isDesktop ? 'flex' : 'block' }}>
      <Toast msg={toastMsg} id={toastId} C={C} isDesktop={isDesktop}/>

      {showNotifs && (
        <div style={{ position:'fixed', inset:0, zIndex:2000, background:C.bg, overflowY:'auto' }}>
          <NotificationsPage onClose={() => setShowNotifs(false)} C={C} isDesktop={isDesktop}/>
        </div>
      )}

      {showNav && isDesktop && (
        <SidebarNav page={page} setPage={setPage} C={C} isDark={isDark} setIsDark={setIsDark} user={user} onLogout={handleLogout} cartCount={cart.reduce((s,i)=>s+i.qty,0)}/>
      )}

      <div style={{ flex:1, minWidth:0 }}>
        <div key={page}>
          {renderPage()}
        </div>
      </div>

      {showNav && !isDesktop && (
        <BottomNav page={page} setPage={setPage} C={C} cartCount={cart.reduce((s,i)=>s+i.qty,0)}/>
      )}
    </div>
  );
}