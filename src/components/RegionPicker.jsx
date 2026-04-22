import { useState } from 'react';
import { MapPin, ArrowLeft, Check } from '@phosphor-icons/react';
import { REGIONS } from '../constants/regions.js';

export default function RegionPicker({ C, onSave }) {
  const [step,   setStep]   = useState(0); // 0=region, 1=city
  const [region, setRegion] = useState(null);
  const [city,   setCity]   = useState('');

  const handleRegion = (r) => {
    setRegion(r);
    if (r.cities.length === 1) {
      setCity(r.cities[0]);
      onSave(r.name, r.cities[0]);
    } else {
      setStep(1);
    }
  };

  const handleCity = (c) => {
    setCity(c);
    onSave(region.name, c);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 3000,
      background: C.bg, display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '52px 20px 16px', borderBottom: `1px solid ${C.border}`,
        background: `linear-gradient(135deg,${C.navy},${C.mid})`,
      }}>
        {step === 1 && (
          <button onClick={() => setStep(0)} style={{
            background: 'rgba(255,255,255,.15)', border: 'none', borderRadius: 10,
            width: 36, height: 36, cursor: 'pointer', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
          }}>
            <ArrowLeft size={20} />
          </button>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <MapPin size={24} color="#fff" weight="fill" />
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>
              {step === 0 ? 'Viloyatingizni tanlang' : `${region?.name}`}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', marginTop: 2 }}>
              {step === 0 ? 'O\'zbekiston viloyatlari' : 'Shahar yoki tumanni tanlang'}
            </div>
          </div>
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 40px' }}>
        {step === 0 && REGIONS.map(r => (
          <button key={r.id} onClick={() => handleRegion(r)} style={{
            width: '100%', padding: '14px 16px', borderRadius: 14, border: `1.5px solid ${C.border}`,
            background: C.s1, cursor: 'pointer', textAlign: 'left', marginBottom: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            transition: 'all .15s',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = C.navy}
          onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
          >
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.dark }}>{r.name}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{r.cities.length} ta shahar</div>
            </div>
            <div style={{ fontSize: 18, color: C.muted }}>›</div>
          </button>
        ))}

        {step === 1 && region?.cities.map(c => (
          <button key={c} onClick={() => handleCity(c)} style={{
            width: '100%', padding: '14px 16px', borderRadius: 14, border: `1.5px solid ${C.border}`,
            background: C.s1, cursor: 'pointer', textAlign: 'left', marginBottom: 8,
            display: 'flex', alignItems: 'center', gap: 12, transition: 'all .15s',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = C.navy}
          onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: `linear-gradient(135deg,${C.navy}18,${C.mid}18)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <MapPin size={18} color={C.navy} />
            </div>
            <span style={{ fontSize: 15, fontWeight: 600, color: C.dark }}>{c}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
