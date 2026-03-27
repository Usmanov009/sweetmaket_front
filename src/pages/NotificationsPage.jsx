import { useState, useEffect } from 'react';
import { Bell, CheckCircle } from 'lucide-react';
import api from '../api';

export default function NotificationsPage({ onClose, C, isDesktop }) {
  const [notifs, setNotifs] = useState([]);
  const unread = notifs.filter(n => !n.read).length;
  const topPad = isDesktop ? 32 : 56;

  useEffect(() => {
    api.get('/api/notifications').then(setNotifs).catch(() => {});
  }, []);

  const markRead = async (id) => {
    const updated = await api.patch(`/api/notifications/${id}/read`, {}).catch(() => null);
    if (updated) setNotifs(updated);
    else setNotifs(p => p.map(n => n.id===id ? {...n,read:true} : n));
  };

  const markAllRead = async () => {
    const updated = await api.patch('/api/notifications/read-all', {}).catch(() => null);
    if (updated) setNotifs(updated);
    else setNotifs(p => p.map(n => ({...n,read:true})));
  };

  return (
    <div className="fade-in" style={{ color:C.dark, minHeight:'100vh', background:C.bg }}>
      <div style={{ padding:`${topPad}px 20px 18px`, display:'flex', alignItems:'center', gap:14 }}>
        {!isDesktop && (
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:C.dark, fontSize:22, padding:0, lineHeight:1 }}>←</button>
        )}
        <Bell size={22} fill={C.navy} color={C.navy} style={{ flexShrink:0 }}/>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:isDesktop?30:22, fontWeight:900, color:C.dark, flex:1 }}>
          Уведомления
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} style={{
            display:'flex', alignItems:'center', gap:6,
            fontSize:12, color:C.navy, fontWeight:600,
            background:'none', border:`1.5px solid ${C.border}`,
            borderRadius:50, padding:'7px 14px', cursor:'pointer',
          }}>
            <CheckCircle size={14}/>
            Прочитать всё
          </button>
        )}
      </div>

      {unread === 0 && notifs.length > 0 && (
        <div style={{ textAlign:'center', padding:'12px 20px 0', color:C.muted }}>
          <div style={{ fontSize:11, background:C.s2, borderRadius:50, padding:'6px 18px', display:'inline-block' }}>
            ✅ Все уведомления прочитаны
          </div>
        </div>
      )}

      <div style={{ padding:'8px 16px', maxWidth: isDesktop?700:'none' }}>
        {notifs.length === 0 && (
          <div style={{ textAlign:'center', padding:'80px 20px', color:C.muted }}>
            <Bell size={56} color={C.border} style={{ marginBottom:16 }}/>
            <div style={{ fontSize:16, fontWeight:600, color:C.dark }}>Уведомлений нет</div>
          </div>
        )}
        {notifs.map(notif => (
          <div key={notif.id} onClick={() => markRead(notif.id)}
            style={{
              display:'flex', gap:14, padding:'14px 0',
              borderBottom:`1px solid ${C.border}`, cursor:'pointer',
              opacity: notif.read ? 0.55 : 1, transition:'opacity .2s',
            }}>
            <div style={{
              width:46, height:46, borderRadius:15, flexShrink:0,
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:21,
              background: notif.read ? C.s2 : `linear-gradient(135deg,${C.navy},${C.mid})`,
            }}>
              {notif.icon}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight: notif.read?500:700, fontSize:14, color:C.dark, marginBottom:2 }}>{notif.title}</div>
              <div style={{ fontSize:12, color:C.muted, marginBottom:4 }}>{notif.sub}</div>
              <div style={{ fontSize:11, color:C.muted }}>{notif.time}</div>
            </div>
            {!notif.read && <div style={{ width:8, height:8, borderRadius:'50%', background:C.navy, marginTop:8, flexShrink:0 }}/>}
          </div>
        ))}
      </div>
    </div>
  );
}
