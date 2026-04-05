import { useState, useEffect } from 'react';
import { Package, ChatCircle, X, CheckCircle } from '@phosphor-icons/react';
import { sum } from '../utils/format';
import ChatModal from '../components/ChatModal';
import api from '../api';

export default function UserOrdersPage({ user, C, isDesktop, setPage }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [chatOrderData, setChatOrderData] = useState(null);

  useEffect(() => {
    api.get('/api/user/orders')
      .then(data => {
        setOrders(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const handleChat = (order) => {
    setChatOrderData({
      orderId: order.id,
      userId: user.id,
      sellerId: order.seller_id
    });
    setShowChat(true);
  };

  const STATUS_LABELS = { 
    pending:'Kutilmoqda', 
    confirmed:'Tasdiqlandi', 
    cancelled:"Bekor qilindi",
    ready:'Tayyor'
  };
  
  const STATUS_COLORS = { 
    pending:'#d97706', 
    confirmed:'#2563eb', 
    cancelled:'#dc2626',
    ready:'#16a34a'
  };

  const topPad = isDesktop ? 0 : 52;

  return (
    <div style={{ minHeight:'100vh', background:C.bg }}>
      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#3b82f6,#1d4ed8)', padding:`${topPad+20}px 20px 24px` }}>
        <div style={{ maxWidth:700, margin:'0 auto' }}>
          <div style={{ fontSize:12, color:'rgba(255,255,255,.6)', fontWeight:600, marginBottom:4 }}>Mening buyurtmalarim</div>
          <div style={{ fontSize:22, fontWeight:900, color:'#fff' }}>Buyurtmalar tarixi</div>
        </div>
      </div>

      {/* Orders List */}
      <div style={{ maxWidth:700, margin:'0 auto', padding:'16px 16px 100px' }}>
        {loading ? (
          <div style={{ textAlign:'center', padding:'60px 20px', color:C.muted }}>Yuklanmoqda...</div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 20px' }}>
            <div style={{ fontSize:60, marginBottom:12, opacity:.3 }}>📦</div>
            <div style={{ fontWeight:700, color:C.dark, marginBottom:6 }}>Buyurtmalar yo'q</div>
            <div style={{ color:C.muted, fontSize:13 }}>Siz hali buyurtma bermagansiz</div>
            <button 
              onClick={() => setPage('home')}
              style={{ marginTop:16, padding:'10px 20px', borderRadius:10, border:'none', background:C.navy, color:'#fff', cursor:'pointer', fontSize:14, fontWeight:600 }}
            >
              Asosiy sahifa
            </button>
          </div>
        ) : orders.map(order => (
          <div key={order.id} style={{ background:C.s1, borderRadius:20, padding:16, marginBottom:12, border:`1px solid ${C.border}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:C.dark }}>
                  {order.seller?.shop_name || 'Sotuvchi'}
                </div>
                <div style={{ fontSize:12, color:C.muted }}>{order.seller?.phone || ''}</div>
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
                {order.status === 'confirmed' && (
                  <button onClick={() => handleChat(order)}
                    style={{ padding:'6px 14px', borderRadius:10, border:'none', background:'#8b5cf6', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:700 }}>
                    <ChatCircle size={14} />
                  </button>
                )}
                {order.status === 'ready' && (
                  <div style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 14px', borderRadius:10, background:'#16a34a15', color:'#16a34a', fontSize:12, fontWeight:700 }}>
                    <CheckCircle size={14} />
                    Tayyor
                  </div>
                )}
              </div>
            </div>

            <div style={{ fontSize:11, color:C.muted, marginTop:8 }}>
              {order.created_at ? new Date(order.created_at).toLocaleString('ru-RU',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : ''}
            </div>
          </div>
        ))}
      </div>

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
