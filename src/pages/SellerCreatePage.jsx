import { useState, useMemo } from 'react';
import {
  Cake, Gift, Circle, Square,
  Grape, Cherry, Star, Leaf, Citrus,
  Flower2, Apple, Sparkles, Smile,
  Users, User, UserRound, UsersRound,
  ImagePlus, FileText, Rocket, Check, ArrowLeft,
  Layers,
} from 'lucide-react';
import CakeVisual from '../components/CakeVisual';
import { useLocale } from '../locale.jsx';

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

// Icon per option id
const OPTION_ICONS = {
  // type
  tort:    { icon: Cake,      bg: '#fce4ec', color: '#e91e63' },
  bento:   { icon: Gift,      bg: '#e8f5e9', color: '#2e7d32' },
  // shape
  round:   { icon: Circle,    bg: '#fce4ec', color: '#e91e63' },
  square:  { icon: Square,    bg: '#e8f5e9', color: '#1565c0' },
  // size
  mini:    { icon: User,      bg: '#e3f2fd', color: '#1565c0' },
  std:     { icon: Users,     bg: '#fff8e1', color: '#e65100' },
  big:     { icon: UsersRound,bg: '#fce4ec', color: '#c62828' },
  xl:      { icon: Layers,    bg: '#f9fbe7', color: '#33691e' },
  // flavor
  velvet:  { icon: Cherry,    bg: '#fce4ec', color: '#b71c1c' },
  choco:   { icon: Star,      bg: '#efebe9', color: '#4e342e' },
  pista:   { icon: Leaf,      bg: '#e8f5e9', color: '#2e7d32' },
  rasp:    { icon: Grape,     bg: '#fce4ec', color: '#880e4f' },
  lemon:   { icon: Citrus,    bg: '#fffde7', color: '#f57f17' },
  // decoration
  flower:  { icon: Flower2,   bg: '#fce4ec', color: '#ad1457' },
  chocoDec:{ icon: Star,      bg: '#efebe9', color: '#4e342e' },
  fruit:   { icon: Apple,     bg: '#e8f5e9', color: '#2e7d32' },
  minimal: { icon: Sparkles,  bg: '#f5f5f5', color: '#546e7a' },
  kids:    { icon: Smile,     bg: '#fffde7', color: '#f57f17' },
};

function OptionIcon({ id, size = 44 }) {
  const cfg = OPTION_ICONS[id] || { icon: Star, bg: '#f5f5f5', color: '#999' };
  const Icon = cfg.icon;
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.3,
      background: cfg.bg, display: 'flex', alignItems: 'center',
      justifyContent: 'center', flexShrink: 0,
    }}>
      <Icon size={size * 0.52} color={cfg.color} strokeWidth={2} />
    </div>
  );
}

export default function SellerCreatePage({ C, onBack, onPublished }) {
  const { t } = useLocale();
  const [step, setStep]             = useState(0);
  const [form, setForm]             = useState({ type:null, shape:null, size:null, flavor:null, decoration:null, note:'', image:null });
  const [publishing, setPublishing] = useState(false);
  const [imgDrag, setImgDrag]       = useState(false);
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const CREATE_OPTIONS = useMemo(() => ({
    type: [
      { id:'tort',  category:'tort', emoji:'🎂', label:t('cTortLabel'),  desc:t('klassikTortlar'),  basePrice:89000, color:'#fce4ec' },
      { id:'bento', category:'tort', emoji:'🎁', label:t('cBentoLabel'), desc:t('miniDecTort'),     basePrice:69000, color:'#e8f5e9' },
    ],
    shape: [
      { id:'round',  emoji:'⭕', label:t('cRoundLabel'),  desc:t('klassikShakl'), color:'#fce4ec' },
      { id:'square', emoji:'◼️', label:t('cSquareLabel'), desc:t('zamonaviy'),    color:'#e8f5e9' },
    ],
    size: [
      { id:'mini', emoji:'🫐', label:t('cMiniLabel'), sub:'1–2 kishi',  desc:t('kichkina'),    priceAdd:0,     color:'#e3f2fd' },
      { id:'std',  emoji:'🍓', label:t('cStdLabel'),  sub:'4–6 kishi',  desc:t('engMashhur'), priceAdd:20000, color:'#fff8e1' },
      { id:'big',  emoji:'🍒', label:t('cBigLabel'),  sub:'8–12 kishi', desc:t('toyUchun'),   priceAdd:40000, color:'#fce4ec' },
      { id:'xl',   emoji:'🎉', label:t('cXlLabel'),   sub:'15+ kishi',  desc:t('ulkan'),      priceAdd:80000, color:'#f9fbe7' },
    ],
    flavor: [
      { id:'velvet', emoji:'🍷', label:t('cVelvetLabel'), desc:t('qizilBarxat'),   priceAdd:10000, color:'#fce4ec' },
      { id:'choco',  emoji:'🍫', label:t('cChocoLabel'),  desc:t('qongirKrema'),   priceAdd:5000,  color:'#efebe9' },
      { id:'pista',  emoji:'🌿', label:t('cPistaLabel'),  desc:t('yashilRang'),    priceAdd:15000, color:'#e8f5e9' },
      { id:'rasp',   emoji:'🍓', label:t('cRaspLabel'),   desc:t('mevaliDesc'),    priceAdd:10000, color:'#fce4ec' },
      { id:'lemon',  emoji:'🍋', label:t('cLemonLabel'),  desc:t('nordonShirin'),  priceAdd:5000,  color:'#fffde7' },
    ],
    decoration: [
      { id:'flower',   emoji:'🌸', label:t('cFlowerLabel'),   desc:t('gulNaqsh'),       priceAdd:15000, color:'#fce4ec' },
      { id:'chocoDec', emoji:'🍫', label:t('cChocoDecLabel'), desc:t('shokoladPlita'),  priceAdd:10000, color:'#efebe9' },
      { id:'fruit',    emoji:'🍇', label:t('cFruitLabel'),    desc:t('yangiMevalar'),   priceAdd:12000, color:'#e8f5e9' },
      { id:'minimal',  emoji:'✨', label:t('cMinimalLabel'),  desc:t('soddaChiroyli'),  priceAdd:0,     color:'#f5f5f5' },
      { id:'kids',     emoji:'🎠', label:t('cKidsLabel'),     desc:t('rangliQuvnoq'),   priceAdd:20000, color:'#fffde7' },
    ],
  }), [t]);

  const CREATE_STEPS = useMemo(() => [
    { key:'type',       question:t('sellerStepTypeQ'),   hint:t('sellerStepTypeH') },
    { key:'shape',      question:t('sellerStepShapeQ'),  hint:t('sellerStepShapeH') },
    { key:'size',       question:t('sellerStepSizeQ'),   hint:t('sellerStepSizeH') },
    { key:'flavor',     question:t('sellerStepFlavorQ'), hint:t('sellerStepFlavorH') },
    { key:'decoration', question:t('sellerStepDecoQ'),   hint:t('sellerStepDecoH') },
  ], [t]);

  const activeSteps    = form.type?.id === 'tort' ? CREATE_STEPS : CREATE_STEPS.filter(s => s.key !== 'shape');
  const lastChoiceStep = activeSteps.length - 1;
  const currentStepCfg = activeSteps[step];
  const currentVal     = currentStepCfg ? form[currentStepCfg.key] : null;
  const selections     = [form.type, form.shape, form.size, form.flavor, form.decoration].filter(Boolean);
  const progress       = step / (activeSteps.length + 1);
  const totalPrice     = (form.type?.basePrice||0) + (form.shape?.priceAdd||0) + (form.size?.priceAdd||0) + (form.flavor?.priceAdd||0) + (form.decoration?.priceAdd||0);

  const goBack = () => setStep(s => s === 5 ? lastChoiceStep : Math.max(0, s - 1));
  const goNext = () => setStep(s => s === lastChoiceStep ? 5 : Math.min(6, s + 1));

  const handleImageFile = file => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = e => setF('image', e.target.result);
    reader.readAsDataURL(file);
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const name = [form.type?.label, form.shape?.label, form.flavor?.label].filter(Boolean).join(' · ');
      const tags = [form.type?.id, form.flavor?.id, form.size?.id].filter(Boolean);
      await sellerFetch('POST', '/api/seller/publish', {
        name,
        emoji: form.type?.emoji || '🎂',
        bg: form.type?.color || '#fce4ec',
        price: totalPrice,
        tags,
        desc: [form.size?.label, form.decoration?.label].filter(Boolean).join(', '),
        note: form.note,
      });
      setStep(6);
    } catch(e) {
      alert(e.message);
    } finally {
      setPublishing(false);
    }
  };

  const Header = ({ backHidden }) => (
    <div style={{ position:'sticky', top:0, zIndex:10, background:C.bg, borderBottom:`1px solid ${C.border}`, padding:'0 20px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, height:54 }}>
        <button
          onClick={step === 0 ? onBack : goBack}
          style={{ background:'none', border:'none', cursor:'pointer', padding:6, color: backHidden ? 'transparent' : C.dark, pointerEvents: backHidden ? 'none' : 'auto', display:'flex', alignItems:'center', borderRadius:10 }}
        >
          <ArrowLeft size={20} />
        </button>
        <div style={{ flex:1, height:4, background:C.s2, borderRadius:99, overflow:'hidden' }}>
          <div style={{ height:'100%', borderRadius:99, background:'linear-gradient(90deg,#059669,#047857)', width:`${Math.max(progress*100,4)}%`, transition:'width .4s cubic-bezier(.4,0,.2,1)' }}/>
        </div>
        <div style={{ fontSize:12, fontWeight:700, color:C.muted, minWidth:36, textAlign:'right' }}>
          {step < CREATE_STEPS.length ? `${step+1} / ${CREATE_STEPS.length}` : ''}
        </div>
      </div>
    </div>
  );

  /* ── STEP 5: Details ── */
  if (step === 5) return (
    <div style={{ minHeight:'100vh', background:C.bg }}>
      <Header />
      <div style={{ maxWidth:520, margin:'0 auto', padding:'24px 20px 120px' }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:900, color:C.dark, marginBottom:4 }}>
          {t('productDetails')}
        </div>
        <div style={{ color:C.muted, fontSize:13, marginBottom:24 }}>{t('productVisible')}</div>

        {/* selection chips */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:28 }}>
          {selections.map(o => (
            <div key={o.id} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 12px', borderRadius:50, background:o.color, border:`1px solid ${C.border}`, fontSize:13, fontWeight:600, color:C.dark }}>
              <OptionIcon id={o.id} size={22} />
              {o.label}
            </div>
          ))}
        </div>

        {/* Image upload */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.muted, letterSpacing:1.2, textTransform:'uppercase', marginBottom:12, display:'flex', alignItems:'center', gap:6 }}>
            <ImagePlus size={14} color={C.muted} /> {t('photoLabel')}
          </div>
          <div
            onDragOver={e => { e.preventDefault(); setImgDrag(true); }}
            onDragLeave={() => setImgDrag(false)}
            onDrop={e => { e.preventDefault(); setImgDrag(false); handleImageFile(e.dataTransfer.files[0]); }}
            onClick={() => document.getElementById('sc-img').click()}
            style={{ position:'relative', borderRadius:16, overflow:'hidden', cursor:'pointer', border:`2px dashed ${imgDrag ? '#059669' : C.border}`, background: imgDrag ? 'rgba(5,150,105,.06)' : C.s1, height: form.image ? 160 : 110, display:'flex', alignItems:'center', justifyContent:'center', transition:'all .2s' }}
          >
            <input id="sc-img" type="file" accept="image/*" style={{ display:'none' }} onChange={e => handleImageFile(e.target.files[0])} />
            {form.image ? (
              <>
                <img src={form.image} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                <button onClick={e => { e.stopPropagation(); setF('image', null); }} style={{ position:'absolute', top:8, right:8, width:28, height:28, borderRadius:'50%', background:'rgba(0,0,0,.5)', border:'none', cursor:'pointer', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Check size={14} />
                </button>
              </>
            ) : (
              <div style={{ textAlign:'center', color:C.muted, display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
                <ImagePlus size={32} color={C.border} />
                <div style={{ fontSize:13, fontWeight:600 }}>{t('uploadPhoto')}</div>
              </div>
            )}
          </div>
        </div>

        {/* Note */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.muted, letterSpacing:1.2, textTransform:'uppercase', marginBottom:12, display:'flex', alignItems:'center', gap:6 }}>
            <FileText size={14} color={C.muted} /> {t('noteLabel')}
          </div>
          <textarea
            value={form.note}
            onChange={e => setF('note', e.target.value)}
            placeholder={t('notePlaceholderSeller')}
            rows={3}
            style={{ width:'100%', background:C.s1, border:`1.5px solid ${C.border}`, borderRadius:16, padding:'14px 16px', color:C.dark, fontSize:14, resize:'none', lineHeight:1.6, boxSizing:'border-box', outline:'none' }}
            onFocus={e => e.target.style.borderColor='#059669'}
            onBlur={e => e.target.style.borderColor=C.border}
          />
        </div>

        {/* Price breakdown */}
        <div style={{ background:C.s1, borderRadius:20, border:`1px solid ${C.border}`, overflow:'hidden', marginBottom:20 }}>
          <div style={{ padding:'12px 18px', borderBottom:`1px solid ${C.border}`, fontSize:11, fontWeight:700, color:C.muted, letterSpacing:1.2, textTransform:'uppercase' }}>
            {t('priceBreakdown')}
          </div>
          {[
            { label:form.type?.label,       price:form.type?.basePrice,       id:form.type?.id,       base:true },
            { label:form.size?.label,       price:form.size?.priceAdd,        id:form.size?.id },
            { label:form.flavor?.label,     price:form.flavor?.priceAdd,      id:form.flavor?.id },
            { label:form.decoration?.label, price:form.decoration?.priceAdd,  id:form.decoration?.id },
          ].filter(r => r.label).map((row, i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'11px 18px', borderBottom:`1px solid ${C.border}` }}>
              <span style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:C.dark }}>
                <OptionIcon id={row.id} size={28} />
                {row.label}
              </span>
              <span style={{ fontSize:13, fontWeight:600, color:row.price>0?C.dark:C.muted }}>
                {row.base ? row.price?.toLocaleString('ru-RU')+' so\'m' : row.price>0 ? '+'+row.price.toLocaleString('ru-RU') : '—'}
              </span>
            </div>
          ))}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 18px', background:'rgba(5,150,105,.06)' }}>
            <span style={{ fontSize:15, fontWeight:800, color:C.dark }}>{t('totalPriceLabel')}</span>
            <span style={{ fontSize:18, fontWeight:900, color:'#059669' }}>{totalPrice.toLocaleString('ru-RU')} so'm</span>
          </div>
        </div>

        <button onClick={handlePublish} disabled={publishing} style={{
          width:'100%', padding:'17px', borderRadius:16, border:'none',
          background: publishing ? C.border : 'linear-gradient(135deg,#059669,#047857)',
          color: publishing ? C.muted : '#fff',
          cursor: publishing ? 'default' : 'pointer',
          fontWeight:700, fontSize:16,
          boxShadow: publishing ? 'none' : '0 6px 24px rgba(5,150,105,.4)',
          transition:'all .25s',
          display:'flex', alignItems:'center', justifyContent:'center', gap:8,
        }}>
          <Rocket size={18} />
          {publishing ? t('publishingBtn') : t('publishBtn')}
        </button>
      </div>
    </div>
  );

  /* ── STEP 6: Done ── */
  if (step === 6) return (
    <div style={{ minHeight:'100vh', background:C.bg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px 24px 100px', textAlign:'center' }}>
      <div style={{ width:110, height:110, borderRadius:'50%', overflow:'hidden', boxShadow:'0 12px 40px rgba(5,150,105,.25)', marginBottom:24 }}>
        <CakeVisual category={form.type?.category} shape={form.shape?.id} bg={form.type?.color||'#fce4ec'} height={110} />
      </div>
      <div style={{ fontSize:28, fontWeight:900, color:C.dark, marginBottom:8 }}>{t('published')}</div>
      <div style={{ color:C.muted, fontSize:14, lineHeight:1.8, marginBottom:32, maxWidth:280 }}>
        {t('publishedDesc')}
      </div>
      <button onClick={onPublished} style={{
        padding:'16px 40px', borderRadius:16, border:'none',
        background:'linear-gradient(135deg,#059669,#047857)',
        color:'#fff', fontWeight:700, fontSize:15, cursor:'pointer',
        boxShadow:'0 6px 20px rgba(5,150,105,.4)',
        display:'flex', alignItems:'center', gap:8,
      }}>
        <Check size={18} />
        {t('goBack')}
      </button>
    </div>
  );

  /* ── STEPS 0–4: Choices ── */
  let opts = CREATE_OPTIONS[currentStepCfg.key];
  if (currentStepCfg.key === 'size' && form.type?.id === 'bento') {
    opts = opts.filter(o => o.id === 'mini' || o.id === 'std');
  }

  return (
    <div style={{ minHeight:'100vh', background:C.bg }}>
      <Header backHidden={step === 0} />
      <div style={{ maxWidth:560, margin:'0 auto', padding:'28px 20px 120px' }}>

        {/* Step question */}
        <div style={{ marginBottom:28 }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:900, color:C.dark, marginBottom:6, lineHeight:1.2 }}>
            {currentStepCfg.question}
          </div>
          <div style={{ fontSize:14, color:C.muted }}>{currentStepCfg.hint}</div>
        </div>

        {/* Option cards */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:24 }}>
          {opts.map(opt => {
            const active   = currentVal?.id === opt.id;
            const addPrice = opt.basePrice ?? opt.priceAdd;
            const iconCfg  = OPTION_ICONS[opt.id] || {};
            return (
              <button
                key={opt.id}
                onClick={() => {
                  setF(currentStepCfg.key, opt);
                  if (currentStepCfg.key === 'type' && opt.id !== 'tort') setF('shape', null);
                  goNext();
                }}
                style={{
                  borderRadius:22,
                  border:`2px solid ${active ? '#059669' : C.border}`,
                  background: active ? opt.color : C.s1,
                  cursor:'pointer', textAlign:'left', outline:'none', overflow:'hidden',
                  position:'relative', transition:'all .2s',
                  boxShadow: active ? '0 8px 28px rgba(5,150,105,.2)' : '0 2px 8px rgba(0,0,0,.04)',
                  transform: active ? 'translateY(-2px)' : 'none',
                  padding: 0,
                }}
              >
                {/* Active checkmark */}
                {active && (
                  <div style={{ position:'absolute', top:12, right:12, width:26, height:26, borderRadius:'50%', background:'#059669', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1 }}>
                    <Check size={13} color="#fff" strokeWidth={3} />
                  </div>
                )}

                {/* Icon banner */}
                <div style={{
                  height: 100,
                  background: active ? iconCfg.bg || opt.color : C.s2,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  transition:'background .2s',
                }}>
                  <OptionIcon id={opt.id} size={54} />
                </div>

                {/* Text info */}
                <div style={{ padding:'12px 14px 14px' }}>
                  <div style={{ fontSize:14, fontWeight:800, color: active ? '#059669' : C.dark, marginBottom:4 }}>{opt.label}</div>
                  {opt.sub && <div style={{ fontSize:11, color:'#059669', fontWeight:700, marginBottom:3 }}>{opt.sub}</div>}
                  <div style={{ fontSize:12, color:C.muted, lineHeight:1.4 }}>{opt.desc}</div>
                  {addPrice != null && (
                    <div style={{ marginTop:8, display:'inline-block', background: active ? 'rgba(5,150,105,.12)' : C.s2, borderRadius:50, padding:'3px 10px', fontSize:11, fontWeight:700, color: active ? '#059669' : C.muted }}>
                      {opt.basePrice ? opt.basePrice.toLocaleString('ru-RU')+' so\'m' : addPrice > 0 ? '+'+addPrice.toLocaleString('ru-RU')+' so\'m' : t('cFree')}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom price bar */}
        {totalPrice > 0 && (
          <div style={{ background:C.s1, borderRadius:16, padding:'14px 18px', border:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', gap:8 }}>
              {selections.map(o => (
                <OptionIcon key={o.id} id={o.id} size={32} />
              ))}
            </div>
            <div style={{ fontSize:16, fontWeight:900, color:'#059669' }}>{totalPrice.toLocaleString('ru-RU')} so'm</div>
          </div>
        )}
      </div>
    </div>
  );
}