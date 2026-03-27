export const THEMES = {
  light: {
    dark:    '#0f172a',
    navy:    '#2563eb',
    mid:     '#3b82f6',
    light:   '#93c5fd',
    pale:    '#eff6ff',
    bg:      '#f8fafc',
    s1:      '#ffffff',
    s2:      '#f1f5f9',
    muted:   '#64748b',
    border:  'rgba(15,23,42,0.08)',
    text:    '#0f172a',
    card:    '#ffffff',
    navBg:   'rgba(255,255,255,0.92)',
    accent:  '#7c3aed',
    success: '#10b981',
    danger:  '#ef4444',
  },
  dark: {
    dark:    '#f8fafc',
    navy:    '#60a5fa',
    mid:     '#3b82f6',
    light:   '#93c5fd',
    pale:    '#1e3a5f',
    bg:      '#0f172a',
    s1:      '#1e293b',
    s2:      '#334155',
    muted:   '#94a3b8',
    border:  'rgba(255,255,255,0.07)',
    text:    '#f8fafc',
    card:    '#1e293b',
    navBg:   'rgba(15,23,42,0.95)',
    accent:  '#a78bfa',
    success: '#34d399',
    danger:  '#f87171',
  },
};

export function getThemeCSS(C) {
  return `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Inter:wght@300;400;500;600;700;800&display=swap');
  *{margin:0;padding:0;box-sizing:border-box;}
  body{background:${C.bg};font-family:'Inter',sans-serif;transition:background .3s;-webkit-font-smoothing:antialiased;}
  ::-webkit-scrollbar{width:5px;height:5px;}
  ::-webkit-scrollbar-track{background:transparent;}
  ::-webkit-scrollbar-thumb{background:${C.border};border-radius:10px;}
  input,textarea,button{font-family:'Inter',sans-serif;outline:none;}
  @keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
  @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeInUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
  @keyframes toastIn{0%{transform:translateX(-50%) translateY(-50px);opacity:0}12%{transform:translateX(-50%) translateY(0);opacity:1}80%{transform:translateX(-50%) translateY(0);opacity:1}100%{transform:translateX(-50%) translateY(-50px);opacity:0}}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
  @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
  @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
  .slide-up{animation:slideUp .28s cubic-bezier(.16,1,.3,1);}
  .fade-in{animation:fadeIn .3s ease;}
  .fade-in-up{animation:fadeInUp .38s ease;}
  .toast-anim{animation:toastIn 2.8s cubic-bezier(.16,1,.3,1) forwards;}
  .float-anim{animation:float 3s ease-in-out infinite;}
  .input-focus:focus{border-color:${C.navy}!important;box-shadow:0 0 0 3px ${C.navy}20!important;}
  .btn-hover:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 8px 24px ${C.navy}40!important;}
  .card-lift:hover{transform:translateY(-3px);box-shadow:0 12px 32px rgba(0,0,0,.12)!important;}
  .nav-item:hover{background:${C.s2}!important;}
  .icon-btn:hover{background:${C.s2}!important;transform:scale(1.08);}
  `;
}

export function injectGlobal(C) {
  let s = document.getElementById('sm-global');
  if (!s) { s = document.createElement('style'); s.id = 'sm-global'; document.head.appendChild(s); }
  s.textContent = getThemeCSS(C);
}
