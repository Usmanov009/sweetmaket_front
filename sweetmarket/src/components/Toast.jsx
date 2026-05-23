import { memo } from 'react';

const Toast = memo(function Toast({ msg, id, C, isDesktop }) {
  if (!msg) return null;
  return (
    <div key={id} className="toast-anim" style={{
      position: 'fixed',
      top: isDesktop ? 24 : 60,
      left: isDesktop ? 'auto' : '50%',
      right: isDesktop ? 28 : 'auto',
      transform: isDesktop ? 'none' : 'translateX(-50%)',
      background: C.s1,
      color: C.dark,
      padding: '11px 20px',
      borderRadius: 50,
      fontWeight: 600,
      fontSize: 13,
      zIndex: 9999,
      whiteSpace: 'nowrap',
      boxShadow: `0 8px 32px rgba(0,0,0,.16), 0 0 0 1px ${C.border}`,
      pointerEvents: 'none',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    }}>{msg}</div>
  );
});

export default Toast;
