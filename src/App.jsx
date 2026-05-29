import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Sun, Moon, Bell,
  Trash2, Plus, Package, Settings, LogOut,
  X, Check,
  MapPin, Clock, Star, TrendingUp,
  Pencil, Home, Gift, UserCircle2, Phone,
} from 'lucide-react';
import api from './api';
import { useLocale } from './locale.jsx';
import { THEMES, injectGlobal } from './constants/themes';
import { REGIONS } from './constants/regions.js';
import { useBreakpoint } from './hooks/useBreakpoint';
import { sum, daysUntil, translateAddress } from './utils/format';
import Toast from './components/Toast';
import CakeVisual from './components/CakeVisual';
import BottomNav from './components/BottomNav';
import SidebarNav from './components/SidebarNav';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import NotificationsPage from './pages/NotificationsPage';
import HomePage from './pages/HomePage';
import SellerLoginPage from './pages/SellerLoginPage';
import SellerDashboardPage from './pages/SellerDashboardPage';
import CartPage from './pages/CartPage';
import ChatModal from './components/ChatModal';
import TelegramAuthPage from './pages/TelegramAuthPage';
import CameraPage from './pages/CameraPage';
import UserOrdersPage from './pages/UserOrdersPage';
import AdminPage from './pages/AdminPage';
import RegionPicker from './components/RegionPicker';



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
function ExplorePage({ C, isDesktop, toast, addToCart }) {
  const { t } = useLocale();
  const [search,   setSearch]   = useState('');
  const [allPosts, setAllPosts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const q = search.trim().toLowerCase();

  const load = () => {
    setLoading(true);
    api.get('/api/explore/posts').then(posts => {
      setAllPosts(posts);
      setLoading(false);
    }).catch(() => setLoading(false));
  };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/set-state-in-effect

  const matchedPosts = q
    ? allPosts.filter(c =>
        (c.name||'').toLowerCase().includes(q) ||
        (c.desc||'').toLowerCase().includes(q) ||
        (c.userName||'').toLowerCase().includes(q)
      )
    : allPosts;

  const topPad = isDesktop ? 16 : 56;

  const initials = (name='') => name.split(' ').map(w=>w[0]||'').join('').slice(0,2).toUpperCase() || '👤';
  const avatarColor = (name='') => { const h = name.split('').reduce((a,c)=>a+c.charCodeAt(0),0)%360; return `hsl(${h},55%,62%)`; };

  return (
    <div style={{maxWidth:560,margin:'0 auto',padding:`${topPad}px 0 ${isDesktop?32:100}px`}}>

      {/* header + search */}
      <div style={{padding:'0 16px 14px'}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:900,color:C.dark,marginBottom:4}}>{t('navExplore')}</div>
        <div style={{fontSize:13,color:C.muted,marginBottom:14}}>{t('exploreSubtitle')}</div>
        <div style={{position:'relative'}}>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
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
        {q ? `"${search}" ${t('searchByQuery')}` : t('allPosts')}
      </div>

      {/* loading */}
      {loading && (
        <div style={{textAlign:'center',padding:'60px 16px',color:C.muted}}>
          <div style={{fontSize:32,marginBottom:12,opacity:.4}}>🔄</div>
          <div style={{fontSize:14}}>{t('loadingText')}</div>
        </div>
      )}

      {/* empty states */}
      {!loading && allPosts.length === 0 && (
        <div style={{textAlign:'center',padding:'70px 24px',color:C.muted}}>
          <div style={{fontSize:64,marginBottom:16}}>🎂</div>
          <div style={{fontSize:17,fontWeight:700,color:C.dark,marginBottom:8}}>{t('noPosts')}</div>
          <div style={{fontSize:13,lineHeight:1.7}}>{t('noPostsHint')}</div>
        </div>
      )}
      {!loading && allPosts.length > 0 && matchedPosts.length === 0 && (
        <div style={{textAlign:'center',padding:'60px 16px',color:C.muted}}>
          <div style={{fontSize:48,marginBottom:12}}>😔</div>
          <div style={{fontSize:16,fontWeight:600,color:C.dark}}>{t('nothingFound')}</div>
          <div style={{fontSize:13,marginTop:6}}>{t('tryOtherQuery')}</div>
        </div>
      )}

      {/* posts feed */}
      <div style={{display:'flex',flexDirection:'column',gap:0}}>
        {matchedPosts.map(card => {
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
                  {t('verified')}
                </span>
              </div>

              {/* image — tap to add to cart */}
              <div style={{position:'relative',cursor:'pointer'}} onClick={()=>{
                if (addToCart) {
                  addToCart({
                    id: card.id,
                    name: card.name,
                    price: card.price || 0,
                    emoji: card.emoji || '🎂',
                    category: card.tags?.[0] || 'tort',
                    bg: card.bg || '#fce4ec',
                  }, 1);
                }
                toast?.('🛒 Savatchaga qo\'shildi!');
              }}>
                <CakeVisual category={card.tags?.[0]} bg={card.bg||'#fce4ec'} height={220}/>
                <div style={{position:'absolute',bottom:10,right:12,background:'rgba(0,0,0,.45)',
                  borderRadius:20,padding:'5px 12px',color:'#fff',fontSize:12,fontWeight:700,
                  backdropFilter:'blur(4px)',pointerEvents:'none'}}>
                  {t('addToCartShort')}
                </div>
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
function confectionerNumericId(b) {
  if (!b?.isSeller || b.id == null) return null;
  const m = String(b.id).match(/^seller_(\d+)$/);
  return m ? Number(m[1]) : null;
}

/* shared header with progress bar - defined outside to avoid re-creating on render */
function CreatePageHeader({onBack, backHidden, C, progress, step, activeSteps}) {
  return (
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
        <div style={{flex:1,height:4,background:C.s2,borderRadius:99,overflow:'hidden'}}>
          <div style={{height:'100%',borderRadius:99,
            background:`linear-gradient(90deg,${C.navy},${C.mid})`,
            width:`${Math.max(progress*100,4)}%`,transition:'width .4s cubic-bezier(.4,0,.2,1)'}}/>
        </div>
        <div style={{fontSize:12,fontWeight:700,color:C.muted,minWidth:36,textAlign:'right'}}>
          {step >= 1 && step <= activeSteps.length ? `${step} / ${activeSteps.length}` : ''}
        </div>
      </div>
    </div>
  );
}

function CreatePage({ C, toast, setPage, bakeries = [], cakeCards = [], addToCart }) {
  const { t, lang } = useLocale();

  const DETAILS = 50; const PUBLISH = 51; const DONE = 52;

  const CREATE_OPTIONS = {
    type: [
      {id:'tort',  category:'tort', emoji:'🎂', label:t('oTortLabel2'),  desc:t('oTortDesc'),  basePrice:89000, color:'#fce4ec'},
      {id:'bento', category:'tort', emoji:'🎁', label:t('oBentoLabel2'), desc:t('oBentoDesc'), basePrice:69000, color:'#e8f5e9'},
    ],
    shape: [
      {id:'round',  emoji:'⭕', label:t('oRoundLabel'),  desc:t('oRoundDesc'),  color:'#fce4ec'},
      {id:'square', emoji:'◼️', label:t('oSquareLabel'), desc:t('oSquareDesc'), color:'#e8f5e9'},
    ],
    layers: [
      {id:'1', emoji:'1️⃣', label:t('oLayer1Label'), desc:t('oLayer1Desc'), priceAdd:0,     color:'#e3f2fd'},
      {id:'2', emoji:'2️⃣', label:t('oLayer2Label'), desc:t('oLayer2Desc'), priceAdd:20000, color:'#fce4ec'},
      {id:'3', emoji:'3️⃣', label:t('oLayer3Label'), desc:t('oLayer3Desc'), priceAdd:40000, color:'#e8f5e9'},
      {id:'4', emoji:'4️⃣', label:t('oLayer4Label'), desc:t('oLayer4Desc'), priceAdd:70000, color:'#fff8e1'},
    ],
    size: [
      {id:'mini', emoji:'🫐', label:t('cMiniLabel'), sub:'1–3 kishi',  desc:t('oMiniDesc'), priceAdd:0,     color:'#e3f2fd'},
      {id:'std',  emoji:'🍓', label:t('cStdLabel'),  sub:'4–8 kishi',  desc:t('oStdDesc'),  priceAdd:20000, color:'#fff8e1'},
      {id:'big',  emoji:'🍒', label:t('cBigLabel'),  sub:'9–15 kishi', desc:t('oBigDesc'),  priceAdd:40000, color:'#fce4ec'},
      {id:'xl',   emoji:'🎉', label:t('cXlLabel'),   sub:'16+ kishi',  desc:t('oXlDesc'),   priceAdd:80000, color:'#f9fbe7'},
    ],
    biscuit: [
      {id:'klassik',  emoji:'🍞', label:t('oBiscKlassikLabel'), desc:t('oBiscKlassikDesc'),  priceAdd:0,     color:'#fff8e1'},
      {id:'shokolad', emoji:'🍫', label:t('cChocoLabel'),      desc:t('oBiscShokoladDesc'), priceAdd:5000,  color:'#efebe9'},
      {id:'limon',    emoji:'🍋', label:t('cLemonLabel'),      desc:t('oBiscLimonDesc'),    priceAdd:5000,  color:'#fffde7'},
      {id:'kadifa',   emoji:'🌹', label:t('oBiscKadifaLabel'), desc:t('oBiscKadifaDesc'), priceAdd:10000, color:'#fce4ec'},
    ],
    propitka: [
      {id:'shakar', emoji:'🍬', label:t('oPropShakarLabel'), desc:t('oPropShakarDesc'), priceAdd:0,    color:'#fff8e1'},
      {id:'limonp', emoji:'🍋', label:t('oPropLimonLabel'),  desc:t('oPropLimonDesc'),  priceAdd:3000, color:'#fffde7'},
      {id:'kofe',   emoji:'☕', label:t('oPropKofeLabel'),   desc:t('oPropKofeDesc'),   priceAdd:5000, color:'#efebe9'},
      {id:'mevap',  emoji:'🍓', label:t('oPropMevaLabel'),   desc:t('oPropMevaDesc'),   priceAdd:5000, color:'#fce4ec'},
    ],
    fillingType: [
      {id:'mevali',   emoji:'🍓', label:t('oFillMevaliLabel'),   desc:t('oFillMevaliDesc'),   priceAdd:15000, color:'#fce4ec'},
      {id:'yongoqli', emoji:'🥜', label:t('oFillYongoqliLabel'), desc:t('oFillYongoqliDesc'), priceAdd:20000, color:'#fff8e1'},
      {id:'oddiy',    emoji:'🍦', label:t('oFillOddiyLabel'),    desc:t('oFillOddiyDesc'),    priceAdd:0,     color:'#e8f5e9'},
    ],
    fillingDetail_mevali: [
      {id:'qulupnay', emoji:'🍓', label:t('oQulupnayLabel'), desc:t('oQulupnayDesc'), priceAdd:5000, color:'#fce4ec'},
      {id:'shaftoli', emoji:'🍑', label:t('oShaftoliLabel'), desc:t('oShaftoliDesc'), priceAdd:5000, color:'#fff8e1'},
      {id:'gilos',    emoji:'🍒', label:t('oGilosLabel'),    desc:t('oGilosDesc'),    priceAdd:5000, color:'#fce4ec'},
      {id:'kivi',     emoji:'🥝', label:t('oKiviLabel'),     desc:t('oKiviDesc'),     priceAdd:7000, color:'#e8f5e9'},
      {id:'ananas',   emoji:'🍍', label:t('oAnanasLabel'),   desc:t('oAnanasDesc'),   priceAdd:8000, color:'#fffde7'},
      {id:'banan',    emoji:'🍌', label:t('oBananLabel'),    desc:t('oBananDesc'),    priceAdd:5000, color:'#fffde7'},
    ],
    fillingDetail_yongoqli: [
      {id:'yongoq', emoji:'🌰', label:t('oYongoqLabel'),  desc:t('oYongoqDesc'),  priceAdd:10000, color:'#efebe9'},
      {id:'bodom',  emoji:'🥜', label:t('oBodomLabel'),   desc:t('oBodomDesc'),   priceAdd:12000, color:'#fff8e1'},
      {id:'pista',  emoji:'🌿', label:t('oPistaLabel2'),  desc:t('oPistaDesc2'),  priceAdd:15000, color:'#e8f5e9'},
      {id:'findiq', emoji:'🍂', label:t('oFindiqLabel'),  desc:t('oFindiqDesc'),  priceAdd:12000, color:'#fffde7'},
    ],
    fillingDetail_oddiy: [
      {id:'qaymoq',    emoji:'🥛', label:t('oQaymoqLabel'),    desc:t('oQaymoqDesc'),    priceAdd:0,    color:'#e3f2fd'},
      {id:'sgushonka', emoji:'🥫', label:t('oSgushonkaLabel'), desc:t('oSgushonkaDesc'), priceAdd:3000, color:'#fff8e1'},
      {id:'margarin',  emoji:'🧈', label:t('oMargarinLabel'),  desc:t('oMargarinDesc'),  priceAdd:0,    color:'#fffde7'},
    ],
    decoration: [
      {id:'flower',   emoji:'🌸', label:t('cFlowerLabel'),    desc:t('oFlowerDesc2'),   priceAdd:15000, color:'#fce4ec'},
      {id:'chocoDec', emoji:'🍫', label:t('cChocoDecLabel'),  desc:t('oChocoDecDesc2'), priceAdd:10000, color:'#efebe9'},
      {id:'macaroon', emoji:'🧁', label:t('oMacaroonLabel'),  desc:t('oMacaroonDesc'),  priceAdd:18000, color:'#e8f5e9'},
      {id:'fondant',  emoji:'🎨', label:t('oFondantLabel'),   desc:t('oFondantDesc'),   priceAdd:25000, color:'#f3e5f5'},
      {id:'minimal',  emoji:'✨', label:t('oMinimalLabel2'),  desc:t('oMinimalDesc2'),  priceAdd:0,     color:'#f5f5f5'},
      {id:'kids',     emoji:'🎠', label:t('cKidsLabel'),      desc:t('oKidsDesc2'),     priceAdd:20000, color:'#fffde7'},
      {id:'letters',  emoji:'✍️', label:t('oLettersLabel'),   desc:t('oLettersDesc'),   priceAdd:8000,  color:'#e3f2fd'},
    ],
  };

  const CREATE_STEPS = [
    {key:'type',         question:t('csTypeQ'),        hint:t('csTypeH')},
    {key:'shape',        question:t('csShapeQ'),       hint:t('csShapeH')},
    {key:'layers',       question:t('csLayersQ'),      hint:t('csLayersH')},
    {key:'size',         question:t('csSizeQ'),        hint:t('csSizeH')},
    {key:'biscuit',      question:t('csBiscuitQ'),     hint:t('csBiscuitH')},
    {key:'propitka',     question:t('csPropitkaQ'),    hint:t('csPropitkaH')},
    {key:'fillingType',  question:t('csFillingTypeQ'), hint:t('csFillingTypeH')},
    {key:'fillingDetail',question:'',                   hint:''},
    {key:'decoration',   question:t('csDecoQ'),        hint:t('csDecoH')},
  ];

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({type:null,shape:null,layers:null,size:null,biscuit:null,propitka:null,fillingType:null,fillingDetail:null,decoration:null,bakery:null,sellerBranch:null,pickupBranch:null,note:'',image:null});
  const [publishing, setPublishing] = useState(false);
  const [imgDrag, setImgDrag] = useState(false);
  const setF = (k,v) => setForm(f=>({...f,[k]:v}));

  const sellerProducts = useMemo(() => {
    const sid = confectionerNumericId(form.bakery);
    if (sid == null) return [];
    return cakeCards.filter(p => p.isSeller && Number(p.sellerId) === sid);
  }, [cakeCards, form.bakery]);


  const branchLabel = (br) => {
    if (!br) return '';
    if (br.kind === 'main') return t('sellerBranchMain');
    return br.name && br.name !== 'main' ? br.name : t('sellerBranchMain');
  };

  const handleImageFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = e => setF('image', e.target.result);
    reader.readAsDataURL(file);
  };

  const activeSteps = form.type?.id === 'tort'
    ? CREATE_STEPS
    : CREATE_STEPS.filter(s => s.key !== 'shape' && s.key !== 'layers');
  const currentStepCfg = step >= 1 && step <= activeSteps.length ? activeSteps[step - 1] : null;
  const currentVal     = currentStepCfg ? form[currentStepCfg.key] : null;
  const selections     = [form.type,form.shape,form.layers,form.size,form.biscuit,form.propitka,form.fillingType,form.fillingDetail,form.decoration].filter(Boolean);
  const progress       = step >= DETAILS ? 1 : (step + 1) / (activeSteps.length + 2);

  const totalPrice = (form.type?.basePrice||0)+(form.shape?.priceAdd||0)+(form.layers?.priceAdd||0)+(form.size?.priceAdd||0)+(form.biscuit?.priceAdd||0)+(form.propitka?.priceAdd||0)+(form.fillingType?.priceAdd||0)+(form.fillingDetail?.priceAdd||0)+(form.decoration?.priceAdd||0);

  const handleOrder = () => {
    const name = [form.type?.label, form.shape?.label, form.layers?.label, form.biscuit?.label].filter(Boolean).join(' · ') || 'Buyurtma tort';
    if (addToCart) {
      addToCart({
        id: 'custom_' + Date.now(),
        name,
        price: totalPrice,
        emoji: form.type?.emoji || '🎂',
        category: form.type?.category || 'tort',
        bg: form.type?.color || '#fce4ec',
        image: form.image || null,
        bakeryId: form.bakery?.id || null,
        bakeryName: form.bakery?.name || null,
      }, 1);
    }
    toast('Savatga qo\'shildi!');
    setStep(PUBLISH);
  };

  const handlePublish = async (publish) => {
    if (publish) {
      setPublishing(true);
      try {
        await api.post('/api/explore/posts', {
          name: form.type?.label||'Mening shirinligim',
          desc: [form.layers?.label,form.biscuit?.label,form.fillingType?.label,form.fillingDetail?.label,form.decoration?.label].filter(Boolean).join(' · ')+(form.note?' — '+form.note:''),
          emoji: form.type?.emoji||'🎂',
          bg: form.type?.color||'#fce4ec',
          price: totalPrice,
          tags: [form.type?.id,form.fillingType?.id].filter(Boolean),
        });
        toast('🌟 Shirinligingiz e\'lon qilindi!');
      } catch { toast('Xatolik yuz berdi'); }
      finally { setPublishing(false); }
    }
    setStep(DONE);
  };

  const resetAndHome = () => {
    setStep(0);
    setForm({type:null,shape:null,layers:null,size:null,biscuit:null,propitka:null,fillingType:null,fillingDetail:null,decoration:null,bakery:null,sellerBranch:null,pickupBranch:null,note:'',image:null});
    setPage('home');
  };

  const goBack = () => setStep(s => {
    if (s === DETAILS) return activeSteps.length;
    return Math.max(0, s - 1);
  });
  const goNext = () => setStep(s => {
    if (s === 0) return (form.bakery && form.sellerBranch) ? 1 : 0;
    if (s === activeSteps.length) return DETAILS;
    return Math.min(activeSteps.length, s + 1);
  });

  /* ── DETAILS ── */
  if (step === DETAILS) return (
    <div style={{minHeight:'100vh',background:C.bg}}>
      <CreatePageHeader onBack={goBack} C={C} progress={progress} step={step} activeSteps={activeSteps}/>
      <div style={{maxWidth:520,margin:'0 auto',padding:'24px 20px 120px'}}>

        <div style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:900,color:C.dark,marginBottom:4}}>
          {t('orderHeader')}
        </div>
        <div style={{color:C.muted,fontSize:13,marginBottom:24}}>{t('chooseBranch')}</div>

        {/* selection chips */}
        <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:28}}>
          {selections.map(o=>(
            <div key={o.id} style={{display:'flex',alignItems:'center',gap:6,padding:'7px 14px',
              borderRadius:50,background:o.color,border:`1px solid ${C.border}`,fontSize:13,fontWeight:600,color:C.dark}}>
              {o.emoji} {o.label}
            </div>
          ))}
        </div>

        {form.bakery && (
          <div style={{marginBottom:20,padding:'14px 16px',borderRadius:18,border:`1px solid ${C.border}`,background:C.s1}}>
            <div style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:1.2,textTransform:'uppercase',marginBottom:8}}>
              {t('createPickSellerQ')}
            </div>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <span style={{fontSize:26}}>{form.bakery.emoji}</span>
              <div>
                <div style={{fontSize:15,fontWeight:800,color:C.dark}}>{form.bakery.name}</div>
                <div style={{fontSize:12,color:C.muted,marginTop:2}}>{translateAddress(form.bakery, lang, REGIONS)}</div>
              </div>
            </div>
          </div>
        )}

        {form.sellerBranch && (
          <div style={{marginBottom:20,padding:'14px 16px',borderRadius:18,border:`1px solid ${C.border}`,background:C.s1}}>
            <div style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:1.2,textTransform:'uppercase',marginBottom:8}}>
              {t('createSelectSellerBranch')}
            </div>
            <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
              <span style={{fontSize:26}}>{form.sellerBranch.emoji || form.bakery?.emoji}</span>
              <div>
                <div style={{fontSize:15,fontWeight:800,color:C.dark}}>{branchLabel(form.sellerBranch)}</div>
                <div style={{fontSize:12,color:C.muted,marginTop:2}}>{form.sellerBranch.address}</div>
                <div style={{fontSize:11,color:C.muted,marginTop:4}}>⏰ {form.sellerBranch.hours} · ⭐ {form.sellerBranch.rating}</div>
              </div>
            </div>
          </div>
        )}

        {/* Restoran / filial */}
        <div style={{marginBottom:20}}>
          <div style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:1.2,textTransform:'uppercase',marginBottom:12}}>
            {t('selectPickupBranch')}
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {bakeries.filter(b => !b.isSeller).map(b => {
              const active = form.pickupBranch?.id === b.id;
              return (
                <div key={b.id} onClick={()=>setF('pickupBranch',b)}
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
                    <div style={{fontSize:12,color:C.muted,marginTop:2}}>{translateAddress(b, lang, REGIONS)}</div>
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

        {/* Image upload */}
        <div style={{marginBottom:20}}>
          <div style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:1.2,textTransform:'uppercase',marginBottom:12}}>
            {t('photoLabel')}
          </div>
          <div
            onDragOver={e=>{e.preventDefault();setImgDrag(true);}}
            onDragLeave={()=>setImgDrag(false)}
            onDrop={e=>{e.preventDefault();setImgDrag(false);handleImageFile(e.dataTransfer.files[0]);}}
            onClick={()=>document.getElementById('create-img-input').click()}
            style={{
              position:'relative', borderRadius:16, overflow:'hidden', cursor:'pointer',
              border:`2px dashed ${imgDrag?C.navy:C.border}`,
              background: imgDrag ? C.navy+'0a' : C.s1,
              height: form.image ? 160 : 100,
              display:'flex', alignItems:'center', justifyContent:'center',
              transition:'all .2s',
            }}>
            <input id="create-img-input" type="file" accept="image/*" style={{display:'none'}}
              onChange={e=>handleImageFile(e.target.files[0])}/>
            {form.image ? (
              <>
                <img src={form.image} alt="upload" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                <button onClick={e=>{e.stopPropagation();setF('image',null);}}
                  style={{position:'absolute',top:8,right:8,width:28,height:28,borderRadius:'50%',
                    background:'rgba(0,0,0,.5)',border:'none',cursor:'pointer',color:'#fff',
                    display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700}}>
                  ✕
                </button>
              </>
            ) : (
              <div style={{textAlign:'center',color:C.muted}}>
                <div style={{fontSize:28,marginBottom:6}}>📸</div>
                <div style={{fontSize:13,fontWeight:600}}>{t('uploadPhoto')}</div>
                <div style={{fontSize:11,marginTop:2}}>{t('uploadHint')}</div>
              </div>
            )}
          </div>
        </div>

        {/* Note */}
        <div style={{marginBottom:20}}>
          <div style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:1.2,textTransform:'uppercase',marginBottom:12}}>
            {t('noteLabel')}
          </div>
          <textarea value={form.note} onChange={e=>setF('note',e.target.value)}
            placeholder={t('notePlaceholder')}
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
            {t('priceDetails')}
          </div>
          {[
            {label:form.type?.label,         price:form.type?.basePrice,         emoji:form.type?.emoji,         base:true},
            {label:form.shape?.label,        price:form.shape?.priceAdd,         emoji:form.shape?.emoji},
            {label:form.layers?.label,       price:form.layers?.priceAdd,        emoji:form.layers?.emoji},
            {label:form.size?.label,         price:form.size?.priceAdd,          emoji:form.size?.emoji},
            {label:form.biscuit?.label,      price:form.biscuit?.priceAdd,       emoji:form.biscuit?.emoji},
            {label:form.propitka?.label,     price:form.propitka?.priceAdd,      emoji:form.propitka?.emoji},
            {label:form.fillingType?.label,  price:form.fillingType?.priceAdd,   emoji:form.fillingType?.emoji},
            {label:form.fillingDetail?.label,price:form.fillingDetail?.priceAdd, emoji:form.fillingDetail?.emoji},
            {label:form.decoration?.label,   price:form.decoration?.priceAdd,    emoji:form.decoration?.emoji},
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
            <span style={{fontSize:15,fontWeight:800,color:C.dark}}>{t('orderTotal')}</span>
            <span style={{fontSize:18,fontWeight:900,color:C.navy}}>{totalPrice.toLocaleString('ru-RU')} so'm</span>
          </div>
        </div>

        <button onClick={handleOrder} disabled={!form.pickupBranch}
          style={{width:'100%',padding:'17px',borderRadius:16,border:'none',
            background: form.pickupBranch ? `linear-gradient(135deg,${C.navy},${C.mid})` : C.border,
            color: form.pickupBranch ? '#fff' : C.muted,
            cursor: form.pickupBranch ? 'pointer' : 'default',
            fontWeight:700,fontSize:16,
            boxShadow: form.pickupBranch ? `0 6px 24px ${C.navy}44` : 'none',
            transition:'all .25s'}}>
          {form.pickupBranch ? `${t('addToCart')} — ${totalPrice.toLocaleString('ru-RU')} so'm` : t('selectPickupFirst')}
        </button>
      </div>
    </div>
  );

  /* ── PUBLISH PROMPT ── */
  if (step === PUBLISH) return (
    <div style={{minHeight:'100vh',background:C.bg}}>
      <CreatePageHeader onBack={()=>setStep(DETAILS)} C={C} progress={progress} step={step} activeSteps={activeSteps}/>
      <div style={{maxWidth:440,margin:'0 auto',padding:'40px 24px 100px',textAlign:'center'}}>
        <div style={{width:140,height:140,borderRadius:40,margin:'0 auto 28px',overflow:'hidden',
          boxShadow:`0 12px 40px ${C.navy}22`,border:`2px solid ${C.border}`}}>
          <CakeVisual category={form.type?.category} shape={form.shape?.id} bg={form.type?.color||'#fce4ec'} height={140}/>
        </div>

        <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:900,color:C.dark,marginBottom:10,lineHeight:1.2}}>
          {t('publishPrompt')}
        </div>
        <div style={{color:C.muted,fontSize:14,lineHeight:1.8,marginBottom:32}}>
          {t('publishHint')}
        </div>

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
            {publishing ? t('publishing') : t('publishYes')}
          </button>
          <button onClick={()=>handlePublish(false)} disabled={publishing}
            style={{width:'100%',padding:'15px',borderRadius:16,
              border:`1.5px solid ${C.border}`,background:'transparent',
              color:C.muted,cursor:'pointer',fontWeight:600,fontSize:15}}>
            {t('publishNo')}
          </button>
        </div>
      </div>
    </div>
  );

  /* ── DONE ── */
  if (step === DONE) return (
    <div style={{minHeight:'100vh',background:C.bg,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'24px 24px 100px',textAlign:'center'}}>
      <div style={{position:'relative',marginBottom:28}}>
        <div style={{width:130,height:130,borderRadius:'50%',overflow:'hidden',
          boxShadow:'0 12px 40px rgba(16,185,129,.25)'}}>
          <CakeVisual category={form.type?.category} shape={form.shape?.id} bg={form.type?.color||'#fce4ec'} height={130}/>
        </div>
        <div style={{position:'absolute',bottom:4,right:4,width:36,height:36,borderRadius:'50%',
          background:'#10b981',display:'flex',alignItems:'center',justifyContent:'center',
          boxShadow:'0 4px 12px rgba(16,185,129,.4)'}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
      </div>

      <div style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:900,color:C.dark,marginBottom:8}}>
        {t('orderAccepted')}
      </div>
      <div style={{color:C.muted,fontSize:14,lineHeight:1.8,marginBottom:28,maxWidth:300}}>
        {t('orderDoneDesc')}
      </div>

      <div style={{width:'100%',maxWidth:360,background:C.s1,borderRadius:24,border:`1px solid ${C.border}`,
        overflow:'hidden',marginBottom:28,boxShadow:`0 4px 20px rgba(0,0,0,.06)`}}>
        <div style={{background:`linear-gradient(135deg,${C.navy},${C.mid})`,padding:'16px 20px',
          display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <span style={{color:'rgba(255,255,255,.8)',fontSize:13,fontWeight:600}}>{t('orderSummary')}</span>
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
        {form.sellerBranch && (
          <div style={{borderTop:`1px solid ${C.border}`,padding:'12px 20px',
            display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:22}}>{form.sellerBranch.emoji || form.bakery?.emoji}</span>
            <div style={{textAlign:'left'}}>
              <div style={{fontSize:13,fontWeight:700,color:C.dark}}>{branchLabel(form.sellerBranch)}</div>
              <div style={{fontSize:11,color:C.muted}}>{form.sellerBranch.address}</div>
            </div>
          </div>
        )}
        {form.pickupBranch && (
          <div style={{borderTop:`1px solid ${C.border}`,padding:'12px 20px',
            display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:22}}>{form.pickupBranch.emoji}</span>
            <div style={{textAlign:'left'}}>
              <div style={{fontSize:13,fontWeight:700,color:C.dark}}>{form.pickupBranch.name}</div>
              <div style={{fontSize:11,color:C.muted}}>{translateAddress(form.pickupBranch, lang, REGIONS)}</div>
            </div>
          </div>
        )}
      </div>

      <button onClick={resetAndHome}
        style={{width:'100%',maxWidth:360,padding:'16px',borderRadius:16,border:'none',
          background:`linear-gradient(135deg,${C.navy},${C.mid})`,
          color:'#fff',cursor:'pointer',fontWeight:700,fontSize:15,
          boxShadow:`0 6px 20px ${C.navy}44`}}>
        {t('backToHome')}
      </button>
    </div>
  );

  /* ── STEP 0: qandolatchi, mahsulotlar, restoranlar ── */
  if (step === 0) return (
    <div style={{minHeight:'100vh',background:C.bg}}>
      <CreatePageHeader onBack={() => setPage('home')} backHidden={false} C={C} progress={progress} step={step} activeSteps={activeSteps}/>
      <div style={{maxWidth:560,margin:'0 auto',padding:'28px 20px 120px'}}>
        <div style={{marginBottom:24}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:900,color:C.dark,marginBottom:6,lineHeight:1.2}}>
            {t('createPickSellerQ')}
          </div>
          <div style={{fontSize:14,color:C.muted}}>{t('createPickSellerH')}</div>
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:8}}>
          {bakeries.filter(b => b.isSeller).map(b => {
            const active = form.bakery?.id === b.id;
            return (
              <div key={b.id} onClick={() => {
                const branchList = (b.branches && b.branches.length)
                  ? b.branches
                  : [{
                      id: `seller_br_${String(b.id).replace(/^seller_/, '')}_main`,
                      kind: 'main',
                      name: 'main',
                      address: (b.address && String(b.address).trim()) || [b.region, b.city].filter(Boolean).join(', ') || '—',
                      hours: b.hours,
                      rating: b.rating,
                      emoji: b.emoji,
                      region: b.region || '',
                      city: b.city || '',
                      isSellerBranch: true,
                    }];
                setForm(f => ({
                  ...f,
                  bakery: { ...b, branches: branchList },
                  sellerBranch: branchList.length === 1 ? branchList[0] : null,
                }));
              }}
                style={{display:'flex',gap:14,alignItems:'center',padding:'14px 16px',borderRadius:18,
                  border:`2px solid ${active ? C.navy : C.border}`,
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
                  <div style={{fontSize:14,fontWeight:700,color:active ? C.navy : C.dark}}>{b.name}</div>
                  <div style={{fontSize:12,color:C.muted,marginTop:2}}>{translateAddress(b, lang, REGIONS)}</div>
                  <div style={{fontSize:11,color:C.muted,marginTop:2}}>⏰ {b.hours} &nbsp;·&nbsp; ⭐ {b.rating}</div>
                </div>
                <div style={{width:22,height:22,borderRadius:'50%',flexShrink:0,
                  border:`2.5px solid ${active ? C.navy : C.border}`,
                  background:active ? C.navy : 'transparent',transition:'all .18s',
                  display:'flex',alignItems:'center',justifyContent:'center'}}>
                  {active && <svg width="11" height="11" viewBox="0 0 12 12"><polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
              </div>
            );
          })}
        </div>

        {form.bakery && (
          <>
            <div style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:1.2,textTransform:'uppercase',margin:'20px 0 12px'}}>
              {t('createSelectSellerBranch')}
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:20}}>
              {(form.bakery.branches || []).map(br => {
                const active = form.sellerBranch?.id === br.id;
                return (
                  <div key={br.id} onClick={() => setF('sellerBranch', br)}
                    style={{display:'flex',gap:14,alignItems:'center',padding:'12px 14px',borderRadius:16,
                      border:`2px solid ${active ? C.navy : C.border}`,
                      background: active ? `rgba(37,99,235,.05)` : C.s1,
                      cursor:'pointer',transition:'all .18s',
                      boxShadow: active ? `0 4px 16px ${C.navy}18` : 'none'}}>
                    <div style={{width:42,height:42,borderRadius:12,flexShrink:0,
                      background: active ? `linear-gradient(135deg,${C.navy},${C.mid})` : C.s2,
                      display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>
                      {br.emoji || form.bakery.emoji}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:14,fontWeight:700,color:active ? C.navy : C.dark}}>{branchLabel(br)}</div>
                      <div style={{fontSize:12,color:C.muted,marginTop:2}}>{br.address}</div>
                      <div style={{fontSize:11,color:C.muted,marginTop:2}}>⏰ {br.hours} · ⭐ {br.rating}</div>
                    </div>
                    <div style={{width:22,height:22,borderRadius:'50%',flexShrink:0,
                      border:`2.5px solid ${active ? C.navy : C.border}`,
                      background:active ? C.navy : 'transparent',transition:'all .18s',
                      display:'flex',alignItems:'center',justifyContent:'center'}}>
                      {active && <svg width="11" height="11" viewBox="0 0 12 12"><polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:1.2,textTransform:'uppercase',margin:'20px 0 12px'}}>
              {t('createSellerProducts')}
            </div>
            {sellerProducts.length === 0 ? (
              <div style={{fontSize:13,color:C.muted,marginBottom:24,lineHeight:1.55}}>{t('createNoSellerProducts')}</div>
            ) : (
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:24}}>
                {sellerProducts.map(p => (
                  <div key={p.id} style={{
                    borderRadius:18,border:`1px solid ${C.border}`,overflow:'hidden',background:C.s1,
                    display:'flex',flexDirection:'column',
                  }}>
                    <div style={{
                      height:88,background:typeof p.bg === 'string' && p.bg.includes('gradient') ? p.bg : p.bg || '#fce4ec',
                      display:'flex',alignItems:'center',justifyContent:'center',fontSize:36,
                    }}>{p.emoji}</div>
                    <div style={{padding:'10px 12px 12px',flex:1,display:'flex',flexDirection:'column'}}>
                      <div style={{fontSize:13,fontWeight:700,color:C.dark,lineHeight:1.3,marginBottom:4}}>{p.name}</div>
                      <div style={{fontSize:12,fontWeight:800,color:C.navy,marginBottom:8}}>{Number(p.price).toLocaleString('ru-RU')} so'm</div>
                      <button type="button" onClick={() => { addToCart(p); toast(t('addedToCart')); }}
                        style={{
                          marginTop:'auto',width:'100%',padding:'8px 10px',borderRadius:12,border:'none',
                          background:`linear-gradient(135deg,${C.navy},${C.mid})`,color:'#fff',
                          fontSize:12,fontWeight:700,cursor:'pointer',
                        }}>
                        {t('addToCartShort')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}


          </>
        )}

        <button type="button" onClick={goNext} disabled={!form.bakery || !form.sellerBranch}
          style={{
            width:'100%',padding:'16px',borderRadius:16,border:'none',
            background: (form.bakery && form.sellerBranch) ? `linear-gradient(135deg,${C.navy},${C.mid})` : C.border,
            color: (form.bakery && form.sellerBranch) ? '#fff' : C.muted,
            cursor: (form.bakery && form.sellerBranch) ? 'pointer' : 'default',
            fontWeight:700,fontSize:15,
            boxShadow: (form.bakery && form.sellerBranch) ? `0 6px 20px ${C.navy}44` : 'none',
            transition:'all .2s',
          }}>
          {form.bakery && !form.sellerBranch ? t('selectSellerBranchFirst') : t('continueBtn')}
        </button>
      </div>
    </div>
  );

  /* ── CHOICE STEPS ── */
  let opts = CREATE_OPTIONS[currentStepCfg.key] || [];
  if (currentStepCfg.key === 'fillingDetail') {
    const ft = form.fillingType?.id;
    opts = ft === 'mevali'   ? CREATE_OPTIONS.fillingDetail_mevali
         : ft === 'yongoqli' ? CREATE_OPTIONS.fillingDetail_yongoqli
         : CREATE_OPTIONS.fillingDetail_oddiy;
  }
  if (currentStepCfg.key === 'size' && form.type?.id === 'bento') {
    opts = opts.filter(o => o.id === 'mini' || o.id === 'std');
  }
  const fillingDetailQ = form.fillingType?.id === 'mevali' ? 'Qaysi meva bo\'lsin?'
    : form.fillingType?.id === 'yongoqli' ? 'Qaysi yong\'oq bo\'lsin?'
    : 'Krem turi qanday bo\'lsin?';
  const fillingDetailH = form.fillingType?.id === 'mevali' ? 'Eng yoqtirgan mevaingizni tanlang'
    : form.fillingType?.id === 'yongoqli' ? 'Yong\'oq turini tanlang'
    : 'Ichki krem turini tanlang';
  const displayQ = currentStepCfg.key === 'fillingDetail' ? fillingDetailQ : currentStepCfg.question;
  const displayH = currentStepCfg.key === 'fillingDetail' ? fillingDetailH : currentStepCfg.hint;

  return (
    <div style={{minHeight:'100vh',background:C.bg}}>
      <CreatePageHeader onBack={() => (step === 0 ? setPage('home') : goBack())} backHidden={false} C={C} progress={progress} step={step} activeSteps={activeSteps}/>
      <div style={{maxWidth:560,margin:'0 auto',padding:'28px 20px 120px'}}>

        {/* question */}
        <div style={{marginBottom:28}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:900,color:C.dark,marginBottom:6,lineHeight:1.2}}>
            {displayQ}
          </div>
          <div style={{fontSize:14,color:C.muted}}>{displayH}</div>
        </div>

        {/* options grid */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:24}}>
          {opts.map(opt => {
            const active = currentVal?.id === opt.id;
            const addPrice = opt.basePrice ?? opt.priceAdd;
            return (
              <button key={opt.id} onClick={()=>{
                  setF(currentStepCfg.key,opt);
                  if (currentStepCfg.key === 'type' && opt.id !== 'tort') { setF('shape', null); setF('layers', null); }
                  if (currentStepCfg.key === 'fillingType') setF('fillingDetail', null);
                  goNext();
                }}
                style={{borderRadius:22,border:`2px solid ${active?C.navy:C.border}`,
                  background: active ? opt.color : C.s1,
                  cursor:'pointer',textAlign:'left',outline:'none',overflow:'hidden',
                  position:'relative',transition:'all .2s',
                  boxShadow: active ? `0 8px 28px ${C.navy}28` : `0 2px 8px rgba(0,0,0,.04)`,
                  transform: active ? 'translateY(-2px)' : 'none'}}>

                {active && (
                  <div style={{position:'absolute',top:12,right:12,width:26,height:26,borderRadius:'50%',
                    background:C.navy,display:'flex',alignItems:'center',justifyContent:'center',zIndex:1,
                    boxShadow:`0 2px 8px ${C.navy}66`}}>
                    <svg width="12" height="12" viewBox="0 0 14 14"><polyline points="2,7 6,11 12,3" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                )}

                <CakeVisual
                  category={currentStepCfg.key === 'type' ? opt.category : form.type?.category}
                  shape={currentStepCfg.key === 'shape' ? opt.id : form.shape?.id}
                  bg={opt.color}
                  height={110}
                />

                <div style={{padding:'12px 14px 14px'}}>
                  <div style={{fontSize:14,fontWeight:800,color:active?C.navy:C.dark,marginBottom:4}}>{opt.label}</div>
                  {opt.sub && <div style={{fontSize:11,color:C.navy,fontWeight:700,marginBottom:3}}>{opt.sub}</div>}
                  <div style={{fontSize:12,color:C.muted,lineHeight:1.4}}>{opt.desc}</div>
                  {addPrice != null && (
                    <div style={{marginTop:8,display:'inline-block',background:active?`${C.navy}18`:C.s2,
                      borderRadius:50,padding:'3px 10px',fontSize:11,fontWeight:700,color:active?C.navy:C.muted}}>
                      {opt.basePrice ? opt.basePrice.toLocaleString('ru-RU')+' so\'m' : addPrice>0?'+'+addPrice.toLocaleString('ru-RU')+' so\'m':t('cFree')}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

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

        {currentVal && (
          <button onClick={goNext}
            style={{width:'100%',marginTop:14,padding:'15px',borderRadius:16,
              border:'none',background:`linear-gradient(135deg,${C.navy},${C.mid})`,
              color:'#fff',cursor:'pointer',fontWeight:700,fontSize:15,
              boxShadow:`0 6px 20px ${C.navy}44`}}>
            {t('continueBtn')}
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
function ProfilePage({ C, isDesktop, user, orders, onLogout, isDark, setIsDark, setUser, setPage, onChangeLocation }) {
  const { t, lang, setLang } = useLocale();

  const ORDER_STATUS = {
    pending:   { label: t('orderPending'),   color: '#d97706', bg: 'rgba(217,119,6,.1)'   },
    confirmed: { label: t('orderConfirmed'), color: '#2563eb', bg: 'rgba(37,99,235,.1)'   },
    ready:     { label: t('orderReady'),     color: '#059669', bg: 'rgba(5,150,105,.12)'  },
    delivered: { label: t('orderDelivered'), color: '#7c3aed', bg: 'rgba(124,58,237,.1)'  },
    cancelled: { label: t('orderCancelled'), color: '#dc2626', bg: 'rgba(220,38,38,.1)'   },
  };
  const [activeTab, setActiveTab] = useState('orders');
  const [bdays,     setBdays]     = useState([]);
  const [bdayModal, setBdayModal] = useState(false);
  const [newBday,   setNewBday]   = useState({ emoji: '🎂', name: '', date: '' });
  const [nameModal,   setNameModal]   = useState(false);
  const [nameForm,    setNameForm]    = useState({ firstName: '', lastName: '' });
  const [nameLoading, setNameLoading] = useState(false);
  const [showChat,   setShowChat]   = useState(false);
  const [chatData,   setChatData]   = useState(null);

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
    { id: 'orders',   icon: <Package size={20} />, label: t('tabOrders') },
    { id: 'bdays',    icon: <Gift size={20} />,    label: t('tabBirthdays') },
    { id: 'settings', icon: <Settings size={20} />,    label: t('tabSettings') },
  ];

  return (
    <>
      {/* Birthday Modal */}
      {bdayModal && (
        <BottomModal C={C} onClose={() => setBdayModal(false)} title={t('addBirthdayTitle')}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {['🎂','🎉','🎈','🎁','🌸','⭐'].map(e => (
              <button key={e} onClick={() => setNewBday(b => ({ ...b, emoji: e }))}
                style={{ flex:1, fontSize:22, border:'2px solid '+(newBday.emoji===e?C.navy:C.border), borderRadius:12, padding:'8px 4px', background:newBday.emoji===e?C.s2:'transparent', cursor:'pointer' }}>
                {e}
              </button>
            ))}
          </div>
          <input value={newBday.name} onChange={e => setNewBday(b => ({ ...b, name: e.target.value }))} placeholder={t('firstName')} style={inp} />
          <input value={newBday.date} onChange={e => setNewBday(b => ({ ...b, date: e.target.value }))} placeholder={t('dateExample')} style={{ ...inp, marginBottom: 20 }} />
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => setBdayModal(false)} style={{ flex:1, padding:14, borderRadius:12, border:'1.5px solid '+C.border, background:'none', color:C.muted, cursor:'pointer', fontWeight:600 }}>{t('cancel')}</button>
            <button disabled={!newBday.name||!newBday.date}
              onClick={async () => { if(newBday.name&&newBday.date){ try{ const b=await api.post('/api/birthdays',newBday); setBdays(p=>[...p,b]); }catch(_){} setBdayModal(false); setNewBday({emoji:'🎂',name:'',date:''}); } }}
              style={{ flex:2, padding:14, borderRadius:12, border:'none', background:'linear-gradient(135deg,'+C.navy+','+C.mid+')', color:'#fff', cursor:'pointer', fontWeight:700, opacity:(!newBday.name||!newBday.date)?.45:1 }}>
              {t('addBirthday')}
            </button>
          </div>
        </BottomModal>
      )}

      {/* Name Modal */}
      {nameModal && (
        <BottomModal C={C} onClose={() => setNameModal(false)} title={t('changeNameTitle')}>
          <input value={nameForm.firstName} onChange={e => setNameForm(f => ({ ...f, firstName: e.target.value }))} placeholder={t('firstName')} style={inp} />
          <input value={nameForm.lastName} onChange={e => setNameForm(f => ({ ...f, lastName: e.target.value }))} placeholder={t('lastName')} style={{ ...inp, marginBottom: 20 }} />
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => setNameModal(false)} style={{ flex:1, padding:14, borderRadius:12, border:'1.5px solid '+C.border, background:'none', color:C.muted, cursor:'pointer', fontWeight:600 }}>{t('cancel')}</button>
            <button disabled={!nameForm.firstName.trim()||nameLoading}
              onClick={async () => { setNameLoading(true); try{ const res=await api.patch('/api/auth/me',{firstName:nameForm.firstName.trim(),lastName:nameForm.lastName.trim()}); setUser(res.user); setNameModal(false); }catch(_){}finally{ setNameLoading(false); } }}
              style={{ flex:2, padding:14, borderRadius:12, border:'none', background:'linear-gradient(135deg,'+C.navy+','+C.mid+')', color:'#fff', cursor:'pointer', fontWeight:700, opacity:(!nameForm.firstName.trim()||nameLoading)?.45:1 }}>
              {nameLoading ? t('successSave') : t('save')}
            </button>
          </div>
        </BottomModal>
      )}

      {/* HERO */}
      <div style={{ background:'linear-gradient(145deg,#1e1b4b 0%,#4f46e5 58%,#7c3aed 100%)', paddingTop:isDesktop?20:36, paddingBottom:28, position:'relative', overflow:'hidden' }}>
        <div style={{ maxWidth:600, margin:'0 auto', padding:'0 20px', position:'relative' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <button onClick={() => setPage('home')} style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(255,255,255,.12)', border:'1px solid rgba(255,255,255,.2)', borderRadius:8, padding:'6px 11px', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:600 }}>
              <Home size={14} /> {t('home')}
            </button>
            <button onClick={() => { setNameForm({firstName:user?.firstName||'',lastName:user?.lastName||''}); setNameModal(true); }}
              style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(255,255,255,.12)', border:'1px solid rgba(255,255,255,.2)', borderRadius:8, padding:'6px 11px', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:600 }}>
              <Pencil size={14} /> {t('profileEdit')}
            </button>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:68, height:68, borderRadius:'50%', background:'linear-gradient(135deg,rgba(255,255,255,.22),rgba(255,255,255,.08))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:900, color:'#fff', border:'2px solid rgba(255,255,255,.28)', flexShrink:0 }}>
              {initials}
            </div>
            <div>
              <div style={{ fontSize:18, fontWeight:900, color:'#fff', marginBottom:3 }}>{user?.name||'Foydalanuvchi'}</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,.6)', marginBottom:7, display:'flex', alignItems:'center', gap:4 }}>
                <Phone size={11} />
                {user?.phone
                  ? user.phone
                  : user?.username
                    ? <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                        <span style={{ background:'rgba(0,136,204,.3)', color:'#7dd3fc', borderRadius:6, padding:'1px 6px', fontSize:10, fontWeight:700 }}>Telegram</span>
                        @{user.username}
                      </span>
                    : ''}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div style={{ maxWidth:600, margin:'12px auto 0', padding:'0 16px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8 }}>
          {[
            { icon:<Package size={16} weight="duotone"/>, color:'#4f46e5', val:orders.length, label:t('ordersStat') },
            { icon:<TrendingUp size={16} weight="duotone"/>, color:'#059669', val:sum(totalSpent), label:t('spentStat'), small:totalSpent>999999 },
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
              <div style={{ fontSize:18, fontWeight:700, color:C.dark, marginBottom:8 }}>{t('noOrders')}</div>
              <div style={{ fontSize:14 }}>{t('firstOrder')}</div>
            </div>
          ) : orders.slice().reverse().map((order, i) => {
            const st = ORDER_STATUS[order.status] || ORDER_STATUS.pending;
            // Extract seller ID from bakery JSON (id = 'seller_abc123')
            const bakeryId = order.bakery?.id || '';
            const sellerId = bakeryId.startsWith('seller_') ? bakeryId.replace('seller_', '') : (order.sellerId || order.seller_id || '');
            const canChat  = order.status && order.status !== 'cancelled';
            return (
              <div key={order.id || i} style={{ background:C.s1, borderRadius:20, marginBottom:12, border:'1px solid '+C.border, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,.04)' }}>
                <div style={{ padding:'13px 18px', borderBottom:'1px solid '+C.border, display:'flex', justifyContent:'space-between', alignItems:'center', background:C.navy+'08' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:34, height:34, borderRadius:10, background:'linear-gradient(135deg,'+C.navy+','+C.mid+')', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', flexShrink:0 }}>
                      <Package size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:800, color:C.dark }}>{t('orderNo')}{String(order.id||'').slice(-6)||orders.length-i}</div>
                      <div style={{ fontSize:11, color:C.muted }}>{order.date || (order.createdAt ? new Date(order.createdAt).toLocaleDateString('uz-UZ') : '')}</div>
                    </div>
                  </div>
                  <span style={{ fontSize:11, color:st.color, fontWeight:700, background:st.bg, padding:'5px 13px', borderRadius:50 }}>
                    {st.label}
                  </span>
                </div>
                {order.bakery?.name && (
                  <div style={{ padding:'8px 18px 0', fontSize:12, color:C.muted, display:'flex', alignItems:'center', gap:4 }}>
                    🏪 <span style={{ color:C.navy, fontWeight:600 }}>{order.bakery.name}</span>
                  </div>
                )}
                <div style={{ padding:'12px 18px 14px' }}>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:12 }}>
                    {(Array.isArray(order.items)?order.items:[]).map((it,j) => (
                      <span key={j} style={{ fontSize:11, color:C.muted, background:C.s2, padding:'5px 12px', borderRadius:50, border:'1px solid '+C.border }}>
                        {it.emoji} {it.name} x{it.qty||1}
                      </span>
                    ))}
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:20, fontWeight:900, color:C.navy, letterSpacing:-.5 }}>{sum(order.total)}</span>
                    {canChat && sellerId && (
                      <button
                        onClick={() => { setChatData({ orderId: order.id, userId: user.id, sellerId }); setShowChat(true); }}
                        style={{ padding:'8px 16px', borderRadius:10, border:'none', background:'rgba(139,92,246,.12)', color:'#7c3aed', cursor:'pointer', fontSize:12, fontWeight:700, display:'flex', alignItems:'center', gap:6 }}>
                        💬 Chat
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        {showChat && chatData && (
          <ChatModal
            onClose={() => setShowChat(false)}
            orderId={chatData.orderId}
            userId={chatData.userId}
            sellerId={chatData.sellerId}
            isSeller={false}
            C={C}
            isDesktop={isDesktop}
          />
        )}

        {activeTab==='bdays' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <div style={{ fontSize:16, fontWeight:800, color:C.dark }}>{t('birthdaysTitle')}</div>
              <button onClick={() => setBdayModal(true)} style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 18px', borderRadius:50, border:'none', background:'linear-gradient(135deg,'+C.navy+','+C.mid+')', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700, boxShadow:'0 4px 14px '+C.navy+'44' }}>
                <Plus size={15} /> {t('addBirthday')}
              </button>
            </div>
            {bdays.length===0 && (
              <div style={{ textAlign:'center', padding:'48px 0' }}>
                <Gift size={56} weight="duotone" color={C.muted} style={{ opacity:.3, marginBottom:12 }} />
                <div style={{ fontSize:16, fontWeight:700, color:C.dark, marginBottom:6 }}>{t('noBirthdays')}</div>
                <div style={{ fontSize:13, color:C.muted }}>{t('noBirthdaysHint')}</div>
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
                    <button onClick={async () => { try{ await api.del('/api/birthdays/'+b.id); }catch(_){} setBdays(b2=>b2.filter((_,j)=>j!==i)); }}
                      style={{ padding:'0 16px', background:'none', border:'none', cursor:'pointer', color:'#ef4444', opacity:.5, display:'flex', alignItems:'center' }}>
                      <Trash2 size={16} />
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
                <span style={{ fontSize:11, fontWeight:700, color:C.muted, letterSpacing:1.2, textTransform:'uppercase' }}>{t('appearanceSection')}</span>
              </div>
              {/* Theme toggle */}
              <div style={{ padding:'16px 18px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid '+C.border }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:44, height:44, borderRadius:14, background:isDark?'linear-gradient(135deg,#1e293b,#334155)':'linear-gradient(135deg,#fef3c7,#fde68a)', display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid '+C.border, color:isDark?'#93c5fd':'#d97706' }}>
                    {isDark ? <Moon size={22} weight="duotone"/> : <Sun size={22} weight="duotone"/>}
                  </div>
                  <div>
                    <div style={{ fontSize:15, fontWeight:700, color:C.dark }}>{isDark ? t('darkTheme') : t('lightTheme')}</div>
                    <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>{t('changeTheme')}</div>
                  </div>
                </div>
                <Toggle on={isDark} onToggle={() => setIsDark(d=>!d)} C={C} />
              </div>
              {/* Language switcher */}
              <div style={{ padding:'16px 18px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:44, height:44, borderRadius:14, background:'linear-gradient(135deg,#f0fdf4,#dcfce7)', display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid '+C.border, fontSize:22 }}>
                    🌐
                  </div>
                  <div>
                    <div style={{ fontSize:15, fontWeight:700, color:C.dark }}>Til</div>
                    <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>{lang === 'uz' ? "O'zbek tili" : 'Русский язык'}</div>
                  </div>
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  {['uz','ru'].map(l => (
                    <button key={l} onClick={() => setLang(l)} style={{
                      padding:'8px 16px', borderRadius:10, border:'2px solid '+(lang===l ? C.navy : C.border),
                      background: lang===l ? `linear-gradient(135deg,${C.navy},${C.mid})` : C.s2,
                      color: lang===l ? '#fff' : C.muted,
                      cursor:'pointer', fontWeight:700, fontSize:13, transition:'all .18s',
                    }}>
                      {l.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ background:C.s1, borderRadius:20, overflow:'hidden', border:'1px solid '+C.border, marginBottom:16 }}>
              <div style={{ padding:'10px 18px', borderBottom:'1px solid '+C.border }}>
                <span style={{ fontSize:11, fontWeight:700, color:C.muted, letterSpacing:1.2, textTransform:'uppercase' }}>{t('accountSection')}</span>
              </div>
              {[
                { icon:<UserCircle2 size={20} weight="duotone"/>, color:'#4f46e5', label:t('yourName'),    val:user?.name||'—' },
                { icon:<Phone size={20} weight="duotone"/>,      color:'#059669', label:t('phoneNumber'), val:user?.phone||'—' },
              ].map((row) => (
                <div key={row.label} style={{ padding:'14px 18px', display:'flex', alignItems:'center', gap:12, borderBottom:'1px solid '+C.border }}>
                  <div style={{ width:40, height:40, borderRadius:12, background:row.color+'15', display:'flex', alignItems:'center', justifyContent:'center', color:row.color, flexShrink:0 }}>
                    {row.icon}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:2 }}>{row.label}</div>
                    <div style={{ fontSize:14, fontWeight:700, color:C.dark }}>{row.val}</div>
                  </div>
                </div>
              ))}
              {/* Location row */}
              <div style={{ padding:'14px 18px', display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:40, height:40, borderRadius:12, background:'#0891b215', display:'flex', alignItems:'center', justifyContent:'center', color:'#0891b2', flexShrink:0 }}>
                  <MapPin size={20} weight="duotone"/>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:2 }}>{t('locationLabel')}</div>
                  <div style={{ fontSize:14, fontWeight:700, color:C.dark }}>
                    {user?.region ? `${user.region}${user.city ? ', '+user.city : ''}` : (t('locationLabel') === 'Местоположение' ? 'Не указано' : 'Belgilanmagan')}
                  </div>
                </div>
                <button onClick={onChangeLocation} style={{ padding:'7px 14px', borderRadius:10, border:'1px solid '+C.border, background:C.s2, color:C.navy, cursor:'pointer', fontSize:12, fontWeight:700 }}>
                  {t('changeLocation')}
                </button>
              </div>
            </div>
            <button onClick={onLogout} style={{ width:'100%', padding:16, borderRadius:18, border:'1.5px solid rgba(239,68,68,.25)', background:'rgba(239,68,68,.05)', color:'#ef4444', cursor:'pointer', fontWeight:700, fontSize:15, display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
              <LogOut size={18} /> {t('logout')}
            </button>
          </div>
        )}

      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   LANGUAGE PICKER
═══════════════════════════════════════════════════════ */
function LangPickerPage({ onPick }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      background: 'linear-gradient(145deg,#1e1b4b 0%,#4f46e5 55%,#7c3aed 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '40px 28px',
    }}>
      {/* Logo */}
      <div style={{ marginBottom: 16, fontSize: 52 }}>🎂</div>
      <div style={{
        fontFamily: "'Playfair Display',serif", fontSize: 36, fontWeight: 900,
        color: '#fff', marginBottom: 8, letterSpacing: -1,
      }}>SweetMarket</div>
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,.6)', marginBottom: 56 }}>
        Shirin hayot platformasi
      </div>

      <div style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {[
          { code: 'uz', label: "O'zbek tili", sub: 'Davom etish uchun bosing', flag: '🇺🇿' },
          { code: 'ru', label: 'Русский язык', sub: 'Нажмите для продолжения',  flag: '🇷🇺' },
        ].map(({ code, label, sub, flag }) => (
          <button key={code} onClick={() => onPick(code)} style={{
            width: '100%', padding: '20px 24px', borderRadius: 20,
            border: '2px solid rgba(255,255,255,.18)',
            background: 'rgba(255,255,255,.1)',
            backdropFilter: 'blur(12px)',
            cursor: 'pointer', textAlign: 'left',
            display: 'flex', alignItems: 'center', gap: 16,
            transition: 'all .18s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.2)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.4)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.18)'; }}
          >
            <span style={{ fontSize: 36, flexShrink: 0 }}>{flag}</span>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.6)' }}>{sub}</div>
            </div>
          </button>
        ))}
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
  const { setLang } = useLocale();

  const [langChosen, setLangChosen] = useState(() => {
    try {
      return !!localStorage.getItem('sm_lang');
    } catch {
      return false;
    }
  });

  const [page, setPage] = useState('login');
  const [orders, setOrders] = useState([]);
  const [_cards, setCards] = useState([]);
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sm_cart') || '[]'); } catch { return []; }
  });
  const [cakeCards, setCakeCards] = useState([]);
  const [bakeries, setBakeries] = useState([]);
  const [user, setUser] = useState(null);
  const [seller, setSeller] = useState(null);

  const [showRegionPicker, setShowRegionPicker] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastId, setToastId] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => { injectGlobal(C); }, [C]);

  // Fetch public data on mount
  useEffect(() => {
    api.get('/api/products').then(setCakeCards).catch(() => {});
    api.get('/api/bakeries').then(setBakeries).catch(() => {});
  }, []);

  // Show RegionPicker only once per account (first login without region)
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!seller?.id) return;
    const key = `region_asked_${seller.id}`;
    if (!seller.region && !localStorage.getItem(key)) {
      localStorage.setItem(key, '1');
      setShowRegionPicker(true);
    }
  }, [seller?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!user?.id) return;
    const key = `region_asked_${user.id}`;
    if (!user.region && !localStorage.getItem(key)) {
      localStorage.setItem(key, '1');
      setShowRegionPicker(true);
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  /* eslint-enable react-hooks/set-state-in-effect */

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

  // Restore session from localStorage on mount, or show Telegram role-select
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const token = localStorage.getItem('sm_token');
    const inTelegram = !!window.Telegram?.WebApp?.initData;
    if (inTelegram) { window.Telegram.WebApp.ready(); window.Telegram.WebApp.expand(); }

    if (token) {
      api.get('/api/auth/me').then(({ user: fresh }) => {
        setUser(fresh);
        setPage('home');
      }).catch(() => {
        localStorage.removeItem('sm_token');
        setUser(null);
        setPage(inTelegram ? 'telegram-auth' : 'login');
      });
      return;
    }
    // Token yo'q — Telegram ichida bo'lsa rol tanlash
    if (inTelegram) setPage('telegram-auth');
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Fetch user-specific data when user changes
  useEffect(() => {
    if (!user?.id) return;
    api.get('/api/orders').then(setOrders).catch(() => {});
    api.get('/api/cards').then(setCards).catch(() => {});
  }, [user?.id]);

  const toast = (msg) => { setToastMsg(msg); setToastId(id => id + 1); setTimeout(() => setToastMsg(''), 2600); };

  const handleLogin = (userData) => {
    if (userData?.lang && (userData.lang === 'ru' || userData.lang === 'uz')) {
      setLang(userData.lang);
      setLangChosen(true);
    }
    setUser(userData);
    setPage('home');
  };

  const handleTelegramAuth = (userData, userType) => {
    // Apply language from user's stored preference
    if (userData?.lang && (userData.lang === 'ru' || userData.lang === 'uz')) {
      setLang(userData.lang);
      setLangChosen(true);
    }
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
    setPage(window.Telegram?.WebApp?.initData ? 'telegram-auth' : 'login');
  };
  const handleSellerLogin = (sellerData) => {
    if (sellerData?.lang && (sellerData.lang === 'ru' || sellerData.lang === 'uz')) {
      setLang(sellerData.lang);
      setLangChosen(true);
    }
    setSeller(sellerData);
    setPage('seller');
  };

  const handleRegionSave = async (region, city) => {
    setShowRegionPicker(false);
    try {
      if (seller) {
        await api.patch('/api/seller/location', { region, city });
        setSeller(s => ({ ...s, region, city }));
      } else if (user) {
        const res = await api.patch('/api/auth/me', { region, city });
        setUser(res.user);
      }
    } catch (_) {}
  };
  const handleSellerLogout = () => {
    setSeller(null);
    localStorage.removeItem('sm_seller_token');
    setPage(window.Telegram?.WebApp?.initData ? 'telegram-auth' : 'seller-login');
  };
  const handleAddToOrder = async (items, total, bakery, address = '') => {
    try {
      const order = await api.post('/api/orders', { items, total, bakery, address });
      setOrders(prev => [...prev, order]);
    } catch {
      setOrders(prev => [...prev, { items, total, bakery, address, date: new Date().toLocaleDateString('ru-RU'), status: 'pending' }]);
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
  useEffect(() => { localStorage.setItem('sm_cart', JSON.stringify(cart)); }, [cart]);

  const updateCartQty = (id, qty) => setCart(prev => prev.map(i => i.id === id ? { ...i, qty } : i));
  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));
  const clearCart = () => setCart([]);

  const renderPage = () => {
    if (page === 'admin' && seller?.phone?.replace(/\D/g,'').endsWith('998902021051')) return <AdminPage C={C} onBack={() => setPage('seller')} />;
    if (page === 'telegram-auth') return <TelegramAuthPage onBack={null} onAuthSuccess={handleTelegramAuth} C={C} isDesktop={isDesktop} />;
    if (page === 'seller-login') return <SellerLoginPage onLogin={handleSellerLogin} goUserLogin={() => setPage('login')} C={C} isDesktop={isDesktop} />;
    if (page === 'seller') return <SellerDashboardPage seller={seller} setSeller={setSeller} onLogout={handleSellerLogout} C={C} isDesktop={isDesktop} setPage={setPage} />;
    if (page === 'login') return <LoginPage onLogin={handleLogin} goSignup={() => setPage('signup')} goSellerLogin={() => setPage('seller-login')} C={C} isDesktop={isDesktop} setPage={setPage} />;
    if (page === 'signup') return <SignupPage onLogin={handleLogin} goLogin={() => setPage('login')} C={C} isDesktop={isDesktop} />;
        if (page === 'camera') return <CameraPage onBack={() => setPage('home')} onPhotoTaken={() => { toast('📸 Фото добавлено!'); setPage('home'); }} C={C} />;
    if (page === 'explore') return <ExplorePage C={C} isDesktop={isDesktop} toast={toast} addToCart={addToCart} />;
    if (page === 'create') return <CreatePage C={C} toast={toast} setPage={setPage} bakeries={bakeries} cakeCards={cakeCards} addToCart={addToCart} />;
    if (page === 'cart') return <CartPage C={C} isDesktop={isDesktop} cart={cart} onUpdateQty={updateCartQty} onRemove={removeFromCart} onClear={clearCart} onOrder={(items, total, bakery, address) => handleAddToOrder(items, total, bakery, address)} toast={toast} setPage={setPage} user={user} />;
    if (page === 'profile') return <ProfilePage C={C} isDesktop={isDesktop} user={user} orders={orders} onLogout={handleLogout} isDark={isDark} setIsDark={setIsDark} setUser={setUser} setPage={setPage} onChangeLocation={() => setShowRegionPicker(true)} />;
    return <HomePage toast={toast} user={user} C={C} cakeCards={cakeCards} setPage={setPage} isDesktop={isDesktop} addToCart={addToCart} isDark={isDark} setIsDark={setIsDark} />;
  };

  const showNav = user && !['login','signup','seller-login','seller','telegram-auth'].includes(page);

  return (
    <div style={{ minHeight:'100vh', background:C.bg, color:C.text, transition:'background .3s,color .3s', display: showNav && isDesktop ? 'flex' : 'block' }}>
      {!langChosen && (
        <LangPickerPage onPick={(code) => {
          setLang(code);
          setLangChosen(true);
        }} />
      )}

      <Toast msg={toastMsg} id={toastId} C={C} isDesktop={isDesktop}/>

      {showRegionPicker && (
        <RegionPicker C={C} onSave={handleRegionSave} />
      )}

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