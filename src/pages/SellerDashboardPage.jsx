import { useState, useEffect } from 'react';
import { Package, SignOut, Storefront, Phone, TrendUp, X, ChatCircle } from '@phosphor-icons/react';
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

const STATUS_LABELS = { pending:'Kutilmoqda', confirmed:'Tasdiqlandi', cancelled:"Bekor qilindi" };
const STATUS_COLORS = { pending:'#d97706', confirmed:'#2563eb', cancelled:'#dc2626' };

export default function SellerDashboardPage({ seller, onLogout, C, isDesktop }) {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState('orders'); // 'orders' | 'accepted' | 'profile'

  useEffect(() => {
    sellerFetch('GET', '/api/seller/orders')
      .then(data => setOrders(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (orderId, status) => {
    setOrders(prev => prev.map(o => o.id === orderId ? {...o, status} : o));
    try {
      await sellerFetch('PATCH', `/api/seller/orders/${orderId}/status`, { status });
      
      // Mijozga bildirishnoma yuborish
      if (status === 'confirmed') {
        try {
          await fetch(`${BASE}/api/notifications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: orders.find(o => o.id === orderId)?.user_id,
              title: 'Buyurtmangiz qabul qilindi',
              message: 'Sotuvchi buyurtmangizni qabul qildi va tayyorlamoqda',
              type: 'order_accepted'
            })
          });
        } catch (e) {
          console.log('Notification error:', e);
        }
      }
    } catch {}
  };

  const [showCamera, setShowCamera] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [chatOrderData, setChatOrderData] = useState(null);

  const handlePhotoCapture = (orderId) => {
    setCurrentOrderId(orderId);
    setShowCamera(true);
  };

  const handleChat = (order) => {
    setChatOrderData({
      orderId: order.id,
      userId: order.user_id,
      sellerId: seller?.id
    });
    setShowChat(true);
  };

  const handleOrderReady = async (orderId) => {
    try {
      // Mijozga bildirishnoma yuborish
      const order = orders.find(o => o.id === orderId);
      if (order) {
        await fetch(`${BASE}/api/notifications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: order.user_id,
            title: 'Buyurtmangiz tayyor!',
            message: 'Buyurtmangiz tayyor boʻldi, iltimos, olib ketishingiz mumkin',
            type: 'order_ready'
          })
        });
      }
      
      // Buyurtmani o'chirish yoki statusini o'zgartirish
      setOrders(prev => prev.filter(o => o.id !== orderId));
    } catch (e) {
      console.log('Error:', e);
    }
  };

  const totalRevenue = orders.filter(o=>o.status!=='cancelled').reduce((s,o)=>s+Number(o.total||0), 0);
  const pendingCount = orders.filter(o=>o.status==='pending').length;
  const acceptedCount = orders.filter(o=>o.status==='confirmed').length;

  const topPad = isDesktop ? 0 : 52;

  return (
    <div style={{ minHeight:'100vh', background:C.bg }}>

      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#064e3b,#059669)', padding:`${topPad+20}px 20px 24px`, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', fontSize:120, opacity:.06, right:-20, top:-10 }}>🏪</div>
        <div style={{ maxWidth:700, margin:'0 auto', position:'relative' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,.6)', fontWeight:600, marginBottom:4 }}>Sotuvchi kabineti</div>
              <div style={{ fontSize:22, fontWeight:900, color:'#fff', marginBottom:2 }}>{seller?.shopName}</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,.7)' }}>{seller?.name}</div>
            </div>
            <button onClick={onLogout}
              style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,.12)', border:'1px solid rgba(255,255,255,.2)', borderRadius:12, padding:'8px 14px', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:600 }}>
              <SignOut size={14}/> Chiqish
            </button>
          </div>

          {/* Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginTop:20 }}>
            {[
              { icon:<Package size={18}/>, val: orders.length, label:"Jami buyurtma" },
              { icon:<TrendUp size={18}/>, val: sum(totalRevenue), label:"Jami daromad" },
              { icon:<Package size={18}/>, val: pendingCount, label:"Kutilmoqda" },
            ].map(s => (
              <div key={s.label} style={{ background:'rgba(255,255,255,.1)', backdropFilter:'blur(8px)', borderRadius:16, padding:'14px 12px', textAlign:'center' }}>
                <div style={{ color:'rgba(255,255,255,.7)', marginBottom:6 }}>{s.icon}</div>
                <div style={{ fontSize:s.label==='Jami daromad'?11:18, fontWeight:900, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.val}</div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,.6)', marginTop:3 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ maxWidth:700, margin:'0 auto' }}>
        <div style={{ display:'flex', borderBottom:`1px solid ${C.border}`, padding:'0 16px' }}>
          {[['orders','📦 Yangi buyurtmalar'],['accepted','✅ Qabul qilingan'],['profile','🏪 Profil']].map(([t, label]) => (
            <button key={t} onClick={()=>setTab(t)}
              style={{ padding:'14px 18px', border:'none', background:'none', cursor:'pointer', fontSize:14,
                fontWeight: tab===t ? 700 : 500, color: tab===t ? C.navy : C.muted,
                borderBottom: tab===t ? `2px solid ${C.navy}` : '2px solid transparent',
                transition:'all .2s', marginBottom:-1 }}>
              {label}
            </button>
          ))}
        </div>

        <div style={{ padding:'16px 16px 100px' }}>

          {/* Orders tab - Yangi buyurtmalar */}
          {tab==='orders' && (
            loading ? (
              <div style={{ textAlign:'center', padding:'60px 20px', color:C.muted }}>Yuklanmoqda...</div>
            ) : orders.length === 0 ? (
              <div style={{ textAlign:'center', padding:'60px 20px' }}>
                <div style={{ fontSize:60, marginBottom:12, opacity:.3 }}>📦</div>
                <div style={{ fontWeight:700, color:C.dark, marginBottom:6 }}>Buyurtmalar yo'q</div>
                <div style={{ color:C.muted, fontSize:13 }}>Yangi buyurtmalar bu yerda ko'rinadi</div>
              </div>
            ) : orders.map(order => (
              <div key={order.id} style={{ background:C.s1, borderRadius:20, padding:16, marginBottom:12, border:`1px solid ${C.border}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:C.dark }}>{order.user_name || 'Xaridor'}</div>
                    <div style={{ fontSize:12, color:C.muted }}>{order.user_phone || ''}</div>
                  </div>
                  <div style={{ fontSize:12, fontWeight:700, color:STATUS_COLORS[order.status]||'#666',
                    background:`${STATUS_COLORS[order.status]||'#666'}15`, padding:'4px 10px', borderRadius:50 }}>
                    {STATUS_LABELS[order.status] || order.status}
                  </div>
                </div>

                {/* Items */}
                <div style={{ background:C.s2, borderRadius:12, padding:'10px 12px', marginBottom:10 }}>
                  {(Array.isArray(order.items)?order.items:[]).map((item,i) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:C.dark, marginBottom: i<order.items.length-1?6:0 }}>
                      <span>{item.emoji||'🎂'} {item.name} × {item.qty||1}</span>
                      <span style={{ fontWeight:700, color:C.navy }}>{sum((item.price||0)*(item.qty||1))}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ fontSize:16, fontWeight:800, color:C.navy }}>{sum(order.total)}</div>
                  <div style={{ display:'flex', gap:6 }}>
                    <button onClick={() => handleChat(order)}
                      style={{ padding:'6px 14px', borderRadius:10, border:'none', background:'#8b5cf6', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:700 }}>
                      <ChatCircle size={14} />
                    </button>
                    {order.status==='pending' && (
                      <>
                        <button onClick={()=>updateStatus(order.id,'confirmed')}
                          style={{ padding:'6px 14px', borderRadius:10, border:'none', background:'#2563eb', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:700 }}>
                          Tasdiqlash
                        </button>
                        <button onClick={()=>updateStatus(order.id,'cancelled')}
                          style={{ padding:'6px 14px', borderRadius:10, border:'none', background:'rgba(220,38,38,.1)', color:'#dc2626', cursor:'pointer', fontSize:12, fontWeight:700 }}>
                          Bekor
                        </button>
                      </>
                    )}
                    {order.status==='confirmed' && (
                      <button onClick={()=>updateStatus(order.id,'cancelled')}
                        style={{ padding:'6px 14px', borderRadius:10, border:'none', background:'rgba(220,38,38,.1)', color:'#dc2626', cursor:'pointer', fontSize:12, fontWeight:700 }}>
                        Bekor qilish
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ fontSize:11, color:C.muted, marginTop:8 }}>
                  {order.bakery?.name && `🏪 ${order.bakery.name} · `}
                  {order.created_at ? new Date(order.created_at).toLocaleString('ru-RU',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : ''}
                </div>
              </div>
            ))
          )}

          {/* Accepted orders tab */}
          {tab==='accepted' && (
            loading ? (
              <div style={{ textAlign:'center', padding:'60px 20px', color:C.muted }}>Yuklanmoqda...</div>
            ) : orders.filter(o=>o.status==='confirmed').length === 0 ? (
              <div style={{ textAlign:'center', padding:'60px 20px' }}>
                <div style={{ fontSize:60, marginBottom:12, opacity:.3 }}>✅</div>
                <div style={{ fontWeight:700, color:C.dark, marginBottom:6 }}>Qabul qilingan buyurtmalar yo'q</div>
                <div style={{ color:C.muted, fontSize:13 }}>Qabul qilingan buyurtmalar bu yerda ko'rinadi</div>
              </div>
            ) : orders.filter(o=>o.status==='confirmed').map(order => (
              <div key={order.id} style={{ background:C.s1, borderRadius:20, padding:16, marginBottom:12, border:`1px solid ${C.border}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:C.dark }}>{order.user_name || 'Xaridor'}</div>
                    <div style={{ fontSize:12, color:C.muted }}>{order.user_phone || ''}</div>
                  </div>
                  <div style={{ fontSize:12, fontWeight:700, color:STATUS_COLORS[order.status]||'#666',
                    background:`${STATUS_COLORS[order.status]||'#666'}15`, padding:'4px 10px', borderRadius:50 }}>
                    {STATUS_LABELS[order.status] || order.status}
                  </div>
                </div>

                {/* Items */}
                <div style={{ background:C.s2, borderRadius:12, padding:'10px 12px', marginBottom:10 }}>
                  {(Array.isArray(order.items)?order.items:[]).map((item,i) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:C.dark, marginBottom: i<order.items.length-1?6:0 }}>
                      <span>{item.emoji||'🎂'} {item.name} × {item.qty||1}</span>
                      <span style={{ fontWeight:700, color:C.navy }}>{sum((item.price||0)*(item.qty||1))}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ fontSize:16, fontWeight:800, color:C.navy }}>{sum(order.total)}</div>
                  <div style={{ display:'flex', gap:6 }}>
                    <button onClick={() => handleChat(order)}
                      style={{ padding:'6px 14px', borderRadius:10, border:'none', background:'#8b5cf6', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:700 }}>
                      <ChatCircle size={14} />
                    </button>
                    <button onClick={() => handlePhotoCapture(order.id)}
                      style={{ padding:'6px 14px', borderRadius:10, border:'none', background:'#10b981', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:700 }}>
                      📸 Rasmga olish
                    </button>
                    <button onClick={() => handleOrderReady(order.id)}
                      style={{ padding:'6px 14px', borderRadius:10, border:'none', background:'#3b82f6', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:700 }}>
                      Tayyor
                    </button>
                  </div>
                </div>

                <div style={{ fontSize:11, color:C.muted, marginTop:8 }}>
                  {order.bakery?.name && `🏪 ${order.bakery.name} · `}
                  {order.created_at ? new Date(order.created_at).toLocaleString('ru-RU',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : ''}
                </div>
              </div>
            ))
          )}

          {/* Profile tab */}
          {tab==='profile' && (
            <div style={{ background:C.s1, borderRadius:20, padding:20, border:`1px solid ${C.border}` }}>
              {[
                { icon:<Storefront size={18}/>, label:"Do'kon nomi", val: seller?.shopName },
                { icon:<Storefront size={18}/>, label:"Ism Familiya", val: seller?.name },
                { icon:<Phone size={18}/>, label:"Telefon",     val: seller?.phone },
                { icon:<Storefront size={18}/>, label:"Manzil",      val: seller?.address || '—' },
              ].map(row => (
                <div key={row.label} style={{ display:'flex', gap:14, alignItems:'center', padding:'14px 0', borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ width:36, height:36, borderRadius:12, background:`${C.navy}15`, display:'flex', alignItems:'center', justifyContent:'center', color:C.navy, flexShrink:0 }}>
                    {row.icon}
                  </div>
                  <div>
                    <div style={{ fontSize:11, color:C.muted, fontWeight:600 }}>{row.label}</div>
                    <div style={{ fontSize:15, fontWeight:700, color:C.dark, marginTop:2 }}>{row.val}</div>
                  </div>
                </div>
              ))}
              <button onClick={onLogout}
                style={{ width:'100%', marginTop:20, padding:14, borderRadius:14, border:`1px solid rgba(220,38,38,.3)`, background:'rgba(220,38,38,.06)', color:'#dc2626', cursor:'pointer', fontWeight:700, fontSize:14 }}>
                <SignOut size={15} style={{ marginRight:8, verticalAlign:'middle' }}/> Chiqish
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.8)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:C.s1, borderRadius:20, width:'100%', maxWidth:500, margin:20, overflow:'hidden' }}>
            <div style={{ padding:16, borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontSize:16, fontWeight:700, color:C.dark }}>Buyurtma rasmi</div>
              <button onClick={() => setShowCamera(false)} style={{ background:'none', border:'none', cursor:'pointer', color:C.muted }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ padding:16 }}>
              <input 
                type="file" 
                accept="image/*" 
                capture="camera"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    // Rasmni saqlash yoki yuborish logikasi
                    console.log('Photo captured for order:', currentOrderId, file);
                    alert('Rasm muvaffaqiyatli olindi!');
                    setShowCamera(false);
                  }
                }}
                style={{ width:'100%', padding:12, border:`1px solid ${C.border}`, borderRadius:10 }}
              />
              <div style={{ marginTop:12, fontSize:13, color:C.muted }}>
                Buyurtma tayyorligini rasmini oling va mijozga yuboring
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {showChat && chatOrderData && (
        <ChatModal
          onClose={() => setShowChat(false)}
          orderId={chatOrderData.orderId}
          userId={chatOrderData.userId}
          sellerId={chatOrderData.sellerId}
          C={C}
          isDesktop={isDesktop}
        />
      )}
    </div>
  );
}