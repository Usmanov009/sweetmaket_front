import { memo } from 'react';
import { Home, Search, Cake, ShoppingCart, User, LogOut } from 'lucide-react';

const ITEMS = [
  { id:'home',    Icon: Home,         label:'Главная' },
  { id:'explore', Icon: Search,       label:'Поиск'   },
  { id:'create',  Icon: Cake,         label:'Создать' },
  { id:'cart',    Icon: ShoppingCart, label:'Корзина' },
  { id:'profile', Icon: User,         label:'Профиль' },
];

const SidebarNav = memo(function SidebarNav({ page, setPage, cartCount, C, isDark, user, onLogout }) {
  const initials = user?.name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() || 'SM';
  return (
    <aside style={{
      width: 240, flexShrink: 0, height: '100vh', position: 'sticky', top: 0,
      background: C.s1, borderRight: `1px solid ${C.border}`,
      display: 'flex', flexDirection: 'column', padding: '28px 12px',
    }}>
      {/* Logo */}
      <div style={{ padding: '4px 12px 28px' }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize: 22, fontWeight: 900, color: C.dark }}>
          Sweet<span style={{ color: C.navy }}>Market</span>
        </div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>Лучшие торты Узбекистана</div>
      </div>

      {/* Nav items */}
      <nav style={{ flex:1, display:'flex', flexDirection:'column', gap:2 }}>
        {ITEMS.map(({ id, Icon, label }) => {
          const active = page===id || (page==='notifications' && id==='profile');
          return (
            <button key={id} onClick={() => setPage(id)}
              className="nav-item"
              style={{
                display:'flex', alignItems:'center', gap:12, padding:'11px 14px',
                borderRadius:14, border:'none', cursor:'pointer',
                background: active ? (isDark ? 'rgba(96,165,250,.1)' : `${C.navy}10`) : 'transparent',
                color: active ? C.navy : C.muted,
                fontWeight: active ? 600 : 400,
                fontSize: 14, textAlign:'left',
                transition: 'all .15s', position:'relative',
              }}>
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              <span>{label}</span>
              {id==='cart' && cartCount>0 && (
                <span style={{
                  marginLeft:'auto', background:C.navy, color:'#fff',
                  fontSize:10, fontWeight:700, minWidth:20, height:20,
                  borderRadius:50, display:'flex', alignItems:'center', justifyContent:'center',
                }}>{cartCount}</span>
              )}
              {active && (
                <div style={{
                  position:'absolute', left:0, top:'50%', transform:'translateY(-50%)',
                  width:3, height:18, background:C.navy, borderRadius:'0 3px 3px 0',
                }}/>
              )}
            </button>
          );
        })}
      </nav>

      {/* User footer */}
      <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:16, marginTop:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:12, cursor:'pointer' }}
          onClick={() => setPage('profile')}>
          <div style={{
            width:38, height:38, borderRadius:'50%',
            background: `linear-gradient(135deg,${C.navy},${C.mid})`,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:13, fontWeight:700, color:'#fff', flexShrink:0,
          }}>
            {user?.avatar
              ? <img src={user.avatar} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }}/>
              : initials
            }
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:600, color:C.dark, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {user?.name||'Гость'}
            </div>
            <div style={{ fontSize:11, color:C.navy, fontWeight:500 }}>🥇 Gold</div>
          </div>
        </div>
        <button onClick={onLogout}
          className="nav-item"
          style={{
            width:'100%', display:'flex', alignItems:'center', gap:10,
            padding:'9px 14px', borderRadius:12, border:'none', cursor:'pointer',
            background:'transparent', color:'#ef4444', fontWeight:500, fontSize:13, marginTop:4,
          }}>
          <LogOut size={18} />
          <span>Выйти</span>
        </button>
      </div>
    </aside>
  );
});

export default SidebarNav;
