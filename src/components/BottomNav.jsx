import { memo } from 'react';
import { Home, Search, Cake, ShoppingCart, User } from 'lucide-react';

const ITEMS = [
  { id:'home',    Icon: Home,         label:'Главная' },
  { id:'explore', Icon: Search,       label:'Поиск'   },
  { id:'create',  Icon: Cake,         label:'Создать', isCenter: true },
  { id:'cart',    Icon: ShoppingCart, label:'Корзина' },
  { id:'profile', Icon: User,         label:'Профиль' },
];

const BottomNav = memo(function BottomNav({ page, setPage, cartCount, C }) {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 640, height: 64,
      display: 'flex', alignItems: 'center',
      background: C.navBg, backdropFilter: 'blur(24px)',
      borderTop: `1px solid ${C.border}`,
      zIndex: 1000,
    }}>
      {ITEMS.map(({ id, Icon, label, isCenter }) => {
        const active = page === id;
        if (isCenter) return (
          <button key={id} onClick={() => setPage(id)} style={{
            flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
            border:'none', cursor:'pointer', background:'none', padding:0,
          }}>
            <div style={{
              width: 50, height: 50, borderRadius: 16, marginBottom: -10,
              background: `linear-gradient(135deg,${C.navy},${C.accent||C.mid})`,
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow: `0 6px 20px ${C.navy}50`,
              transition: 'all .2s',
            }}>
              <Icon size={24} color="#fff" strokeWidth={2} />
            </div>
          </button>
        );
        return (
          <button key={id} onClick={() => setPage(id)}
            className="nav-item"
            style={{
              flex:1, height:'100%', display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'center', gap:4,
              border:'none', cursor:'pointer', background:'transparent',
              color: active ? C.navy : C.muted,
              transition: 'color .2s', position:'relative',
              borderRadius: 0,
            }}>
            <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
            <span style={{ fontSize: 10, fontWeight: active ? 700 : 500 }}>{label}</span>
            {id === 'cart' && cartCount > 0 && (
              <span style={{
                position:'absolute', top:8, right:'22%',
                background: C.navy, color:'#fff',
                fontSize: 9, fontWeight: 700,
                minWidth: 16, height: 16, borderRadius: 50,
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>{cartCount}</span>
            )}
            {active && (
              <div style={{
                position:'absolute', bottom:0, left:'50%', transform:'translateX(-50%)',
                width:16, height:3, borderRadius:'3px 3px 0 0',
                background: C.navy,
              }}/>
            )}
          </button>
        );
      })}
    </nav>
  );
});

export default BottomNav;
