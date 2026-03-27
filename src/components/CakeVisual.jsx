/* Reusable cake/dessert illustration — replaces emoji in product cards */

const visuals = {
  tort: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* plate */}
      <ellipse cx="60" cy="98" rx="46" ry="10" fill="#e0c9f0" opacity=".45"/>
      {/* bottom layer */}
      <rect x="18" y="72" width="84" height="22" rx="11" fill="#f48fb1"/>
      <rect x="18" y="72" width="84" height="8" rx="4" fill="#f06292"/>
      {/* cream line */}
      <path d="M18 72 Q30 64 42 72 Q54 80 66 72 Q78 64 90 72 Q99 78 102 72" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
      {/* middle layer */}
      <rect x="24" y="50" width="72" height="22" rx="11" fill="#ce93d8"/>
      <rect x="24" y="50" width="72" height="8" rx="4" fill="#ba68c8"/>
      {/* cream line */}
      <path d="M24 50 Q35 42 46 50 Q57 58 68 50 Q79 42 90 50 Q95 55 96 50" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
      {/* top layer */}
      <rect x="30" y="30" width="60" height="20" rx="10" fill="#f48fb1"/>
      <rect x="30" y="30" width="60" height="7" rx="3.5" fill="#f06292"/>
      {/* frosting top */}
      <path d="M34 30 Q40 22 46 30 Q52 22 58 30 Q64 22 70 30 Q76 22 82 30 Q86 26 86 30" stroke="none" fill="#fff" opacity=".7"/>
      {/* candles */}
      <rect x="50" y="16" width="5" height="14" rx="2.5" fill="#ffcc02"/>
      <rect x="65" y="19" width="5" height="11" rx="2.5" fill="#ff7043"/>
      {/* flames */}
      <ellipse cx="52.5" cy="13" rx="3" ry="4.5" fill="#ff9800" opacity=".9"/>
      <ellipse cx="52.5" cy="12" rx="1.5" ry="2.5" fill="#fff176"/>
      <ellipse cx="67.5" cy="16" rx="3" ry="4.5" fill="#ff9800" opacity=".9"/>
      <ellipse cx="67.5" cy="15" rx="1.5" ry="2.5" fill="#fff176"/>
      {/* sprinkles */}
      <rect x="38" y="56" width="6" height="2.5" rx="1.25" fill="#ff7043" transform="rotate(30 38 56)"/>
      <rect x="80" y="58" width="6" height="2.5" rx="1.25" fill="#64b5f6" transform="rotate(-20 80 58)"/>
      <rect x="55" y="38" width="5" height="2" rx="1" fill="#a5d6a7" transform="rotate(45 55 38)"/>
    </svg>
  ),

  keks: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* shadow */}
      <ellipse cx="60" cy="102" rx="30" ry="7" fill="#d1a3c8" opacity=".35"/>
      {/* cupcake wrapper */}
      <path d="M38 70 L42 100 Q60 108 78 100 L82 70 Z" fill="#ff8a65"/>
      <path d="M38 70 L82 70" stroke="#ff7043" strokeWidth="1.5"/>
      {/* wrapper lines */}
      <line x1="50" y1="70" x2="46" y2="100" stroke="#ff7043" strokeWidth="1.2" opacity=".6"/>
      <line x1="60" y1="70" x2="60" y2="104" stroke="#ff7043" strokeWidth="1.2" opacity=".6"/>
      <line x1="70" y1="70" x2="74" y2="100" stroke="#ff7043" strokeWidth="1.2" opacity=".6"/>
      {/* cream base */}
      <ellipse cx="60" cy="70" rx="24" ry="10" fill="#f8bbd0"/>
      {/* cream swirl */}
      <path d="M36 70 Q40 54 50 50 Q60 46 70 50 Q80 54 84 70" fill="#fce4ec"/>
      <path d="M42 63 Q46 50 54 46 Q62 42 70 46 Q78 50 80 62" fill="#f8bbd0"/>
      <path d="M48 58 Q52 46 58 44 Q65 42 70 46 Q74 52 76 58" fill="#fce4ec"/>
      {/* top swirl peak */}
      <path d="M54 46 Q58 34 60 30 Q62 34 66 46" fill="#f8bbd0"/>
      <ellipse cx="60" cy="28" rx="5" ry="6" fill="#f48fb1"/>
      {/* cherry on top */}
      <circle cx="60" cy="22" r="5.5" fill="#e53935"/>
      <circle cx="58" cy="20" r="1.5" fill="#ef9a9a" opacity=".7"/>
      <path d="M60 17 Q64 10 68 12" stroke="#4caf50" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* sprinkles on cream */}
      <rect x="44" y="54" width="6" height="2.5" rx="1.25" fill="#64b5f6" transform="rotate(30 44 54)"/>
      <rect x="72" y="52" width="6" height="2.5" rx="1.25" fill="#ff9800" transform="rotate(-25 72 52)"/>
      <rect x="58" y="48" width="5" height="2" rx="1" fill="#a5d6a7" transform="rotate(50 58 48)"/>
      <circle cx="66" cy="57" r="2" fill="#ff7043"/>
      <circle cx="52" cy="60" r="2" fill="#ce93d8"/>
    </svg>
  ),

  makaron: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* shadow */}
      <ellipse cx="60" cy="104" rx="38" ry="7" fill="#b39ddb" opacity=".3"/>
      {/* macaron 1 — back */}
      <g transform="translate(10,20) rotate(-8,50,50)">
        <ellipse cx="50" cy="68" rx="28" ry="11" fill="#ce93d8"/>
        <ellipse cx="50" cy="68" rx="28" ry="6" fill="#ba68c8"/>
        {/* filling */}
        <ellipse cx="50" cy="68" rx="26" ry="5" fill="#f8bbd0"/>
        <ellipse cx="50" cy="42" rx="28" ry="11" fill="#ce93d8"/>
        <path d="M22 42 Q50 20 78 42" fill="#e1bee7"/>
      </g>
      {/* macaron 2 — front */}
      <g transform="translate(18,30)">
        <ellipse cx="50" cy="64" rx="28" ry="11" fill="#4db6ac"/>
        <ellipse cx="50" cy="64" rx="28" ry="6" fill="#26a69a"/>
        {/* filling */}
        <ellipse cx="50" cy="64" rx="26" ry="5" fill="#fff9c4"/>
        <ellipse cx="50" cy="38" rx="28" ry="11" fill="#4db6ac"/>
        <path d="M22 38 Q50 16 78 38" fill="#80cbc4"/>
        {/* shine */}
        <ellipse cx="38" cy="28" rx="8" ry="4" fill="rgba(255,255,255,.3)" transform="rotate(-20 38 28)"/>
      </g>
      {/* macaron 3 — right */}
      <g transform="translate(46,10) rotate(6,38,55)">
        <ellipse cx="38" cy="70" rx="24" ry="9" fill="#ffb74d"/>
        <ellipse cx="38" cy="70" rx="24" ry="5" fill="#ff9800"/>
        <ellipse cx="38" cy="70" rx="22" ry="4" fill="#fff9c4"/>
        <ellipse cx="38" cy="46" rx="24" ry="9" fill="#ffb74d"/>
        <path d="M14 46 Q38 28 62 46" fill="#ffe082"/>
        <ellipse cx="28" cy="36" rx="6" ry="3" fill="rgba(255,255,255,.3)" transform="rotate(-15 28 36)"/>
      </g>
      {/* dots decoration */}
      <circle cx="22" cy="18" r="3" fill="#f48fb1" opacity=".7"/>
      <circle cx="98" cy="28" r="2.5" fill="#80cbc4" opacity=".7"/>
      <circle cx="105" cy="80" r="2" fill="#ffb74d" opacity=".6"/>
    </svg>
  ),

  tiramisu: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* dish shadow */}
      <ellipse cx="60" cy="104" rx="44" ry="8" fill="#bcaaa4" opacity=".4"/>
      {/* dish */}
      <ellipse cx="60" cy="100" rx="44" ry="8" fill="#d7ccc8"/>
      <rect x="16" y="92" width="88" height="8" rx="4" fill="#efebe9"/>
      {/* bottom layer — coffee soaked */}
      <rect x="20" y="76" width="80" height="18" rx="6" fill="#795548"/>
      <rect x="20" y="76" width="80" height="7" rx="3.5" fill="#6d4c41"/>
      {/* cream layer */}
      <rect x="22" y="58" width="76" height="20" rx="6" fill="#fff8e1"/>
      {/* middle biscuit layer */}
      <rect x="20" y="44" width="80" height="16" rx="6" fill="#a1887f"/>
      <rect x="20" y="44" width="80" height="6" rx="3" fill="#8d6e63"/>
      {/* top cream */}
      <rect x="22" y="28" width="76" height="18" rx="6" fill="#fffde7"/>
      {/* cocoa powder top */}
      <rect x="22" y="28" width="76" height="6" rx="3" fill="#d7ccc8" opacity=".6"/>
      {/* cocoa dusting */}
      <path d="M28 32 Q40 28 52 32 Q64 36 76 32 Q86 28 94 32" stroke="#8d6e63" strokeWidth="1.5" opacity=".5" fill="none"/>
      {/* mascarpone swirls */}
      <path d="M30 46 Q38 38 46 46 Q54 54 62 46 Q70 38 78 46 Q86 54 90 46" stroke="rgba(255,255,255,.6)" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      {/* coffee beans decoration */}
      <ellipse cx="38" cy="31" rx="4" ry="2.5" fill="#5d4037" transform="rotate(30 38 31)"/>
      <path d="M37 31 Q39 29 41 31" stroke="#795548" strokeWidth=".8" fill="none"/>
      <ellipse cx="82" cy="30" rx="4" ry="2.5" fill="#5d4037" transform="rotate(-20 82 30)"/>
      <path d="M81 30 Q83 28 85 30" stroke="#795548" strokeWidth=".8" fill="none"/>
      {/* spoon */}
      <path d="M96 58 Q106 52 110 44 Q112 38 108 36 Q104 34 100 40 Q96 48 96 58Z" fill="#bdbdbd"/>
      <path d="M96 58 Q106 52 110 44" stroke="#9e9e9e" strokeWidth="1" fill="none"/>
    </svg>
  ),

  default: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="60" cy="100" rx="40" ry="8" fill="#f8bbd0" opacity=".5"/>
      <rect x="24" y="68" width="72" height="28" rx="14" fill="#f48fb1"/>
      <path d="M24 68 Q36 58 48 68 Q60 78 72 68 Q84 58 96 68" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <rect x="30" y="44" width="60" height="26" rx="13" fill="#ce93d8"/>
      <path d="M30 44 Q42 34 54 44 Q66 54 78 44 Q84 40 90 44" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <rect x="36" y="24" width="48" height="22" rx="11" fill="#f48fb1"/>
      <ellipse cx="60" cy="24" rx="24" ry="6" fill="#fce4ec"/>
      <circle cx="60" cy="16" r="6" fill="#e53935"/>
    </svg>
  ),
};

export default function CakeVisual({ category, bg, height = 120, width = '100%', badge, badgeColor }) {
  const key = category && visuals[category] ? category : 'default';
  const Illustration = visuals[key];
  const svgSize = Math.min(height * 0.92, 110);

  return (
    <div style={{
      height, width, background: bg || '#fce4ec',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* decorative background blob */}
      <div style={{
        position: 'absolute', width: height * 1.2, height: height * 1.2,
        borderRadius: '50%', background: 'rgba(255,255,255,.12)',
        top: '50%', left: '50%', transform: 'translate(-40%,-60%)',
        pointerEvents: 'none',
      }}/>
      <Illustration size={svgSize}/>
      {badge && (
        <span style={{
          position: 'absolute', top: 10, right: 10,
          background: badgeColor || '#052558', color: '#fff',
          fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 50,
        }}>{badge}</span>
      )}
    </div>
  );
}
