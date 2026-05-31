import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, X, Check, Loader2 } from 'lucide-react';

/**
 * LocationPicker — Leaflet/OpenStreetMap asosida xarita orqali yetkazib berish manzilini tanlash.
 * Google Maps API key shart emas.
 *
 * Props:
 *   C          — rang palitrasi
 *   onConfirm  — ({ lat, lng, address }) => void
 *   onClose    — () => void
 *   lang       — 'uz' | 'ru'
 *   initialLat — boshlang'ich kenglik (ixtiyoriy)
 *   initialLng — boshlang'ich uzunlik (ixtiyoriy)
 */
export default function LocationPicker({ C, onConfirm, onClose, lang = 'uz', initialLat, initialLng }) {
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markerRef = useRef(null);
  const [position, setPosition] = useState(null);
  const [address, setAddress] = useState('');
  const [geocoding, setGeocoding] = useState(false);
  const [locating, setLocating] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const t = (uz, ru) => lang === 'ru' ? ru : uz;

  /* ─── Leaflet CSS va kutubxonani yuklash ─── */
  useEffect(() => {
    // Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Leaflet JS
    const initMap = () => {
      if (!mapRef.current || leafletMapRef.current) return;
      const L = window.L;

      const defaultLat = initialLat || 41.2995;
      const defaultLng = initialLng || 69.2401; // Toshkent

      const map = L.map(mapRef.current, {
        center: [defaultLat, defaultLng],
        zoom: 14,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      // Custom marker icon
      const icon = L.divIcon({
        html: `<div style="
          width:36px;height:42px;position:relative;
        ">
          <svg viewBox="0 0 36 42" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 0C8.06 0 0 8.06 0 18c0 12.5 18 30 18 30s18-17.5 18-30C36 8.06 27.94 0 18 0z" fill="#1e3a5f"/>
            <circle cx="18" cy="18" r="8" fill="white"/>
            <circle cx="18" cy="18" r="5" fill="#1e3a5f"/>
          </svg>
        </div>`,
        iconSize: [36, 42],
        iconAnchor: [18, 42],
        popupAnchor: [0, -42],
        className: '',
      });

      const marker = L.marker([defaultLat, defaultLng], { icon, draggable: true }).addTo(map);
      markerRef.current = marker;
      leafletMapRef.current = map;

      const handlePositionChange = (lat, lng) => {
        setPosition({ lat, lng });
        reverseGeocode(lat, lng);
      };

      // Drag tugaganda
      marker.on('dragend', (e) => {
        const { lat, lng } = e.target.getLatLng();
        handlePositionChange(lat, lng);
      });

      // Xaritaga bosish
      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        handlePositionChange(lat, lng);
      });

      handlePositionChange(defaultLat, defaultLng);
      setMapReady(true);
    };

    if (window.L) {
      initMap();
    } else {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = initMap;
      document.head.appendChild(script);
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ─── Reverse geocoding (Nominatim / OpenStreetMap) ─── */
  const reverseGeocode = async (lat, lng) => {
    setGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=${lang === 'ru' ? 'ru' : 'uz,ru'}`,
        { headers: { 'Accept-Language': lang === 'ru' ? 'ru' : 'uz,ru' } }
      );
      const data = await res.json();
      if (data?.display_name) {
        const addr = data.address;
        // Qisqa manzil: ko'cha, shahar
        const short = [
          addr.road || addr.pedestrian || addr.footway,
          addr.house_number,
          addr.suburb || addr.neighbourhood,
          addr.city || addr.town || addr.village,
        ].filter(Boolean).join(', ');
        setAddress(short || data.display_name);
      }
    } catch {
      setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } finally {
      setGeocoding(false);
    }
  };

  /* ─── GPS joylashuv ─── */
  const handleMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude: lat, longitude: lng } = coords;
        if (leafletMapRef.current && markerRef.current) {
          leafletMapRef.current.flyTo([lat, lng], 16, { duration: 1 });
          markerRef.current.setLatLng([lat, lng]);
        }
        setPosition({ lat, lng });
        reverseGeocode(lat, lng);
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 8000 }
    );
  };

  const handleConfirm = () => {
    if (!position) return;
    onConfirm({ lat: position.lat, lng: position.lng, address });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
    }}>
      <div style={{
        width: '100%', maxWidth: 560,
        background: C.s1,
        borderRadius: '24px 24px 0 0',
        overflow: 'hidden',
        boxShadow: '0 -8px 40px rgba(0,0,0,.2)',
        display: 'flex', flexDirection: 'column',
        maxHeight: '92vh',
      }}>

        {/* Header */}
        <div style={{
          padding: '16px 20px 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: `1px solid ${C.border}`,
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: `${C.navy}15`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <MapPin size={18} color={C.navy} weight="fill" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.dark }}>
                {t("Yetkazib berish joyi", "Место доставки")}
              </div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>
                {t("Xaritada pin qo'ying", "Поставьте метку на карте")}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: '50%',
            background: C.s2, border: `1px solid ${C.border}`,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X size={15} color={C.muted} />
          </button>
        </div>

        {/* Map container */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div
            ref={mapRef}
            style={{ width: '100%', height: 340 }}
          />

          {/* My location button */}
          <button
            onClick={handleMyLocation}
            disabled={locating}
            style={{
              position: 'absolute', bottom: 12, right: 12, zIndex: 1000,
              width: 44, height: 44, borderRadius: 12,
              background: '#fff',
              border: `1px solid ${C.border}`,
              boxShadow: '0 2px 12px rgba(0,0,0,.15)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {locating
              ? <Loader2 size={18} color={C.navy} style={{ animation: 'spin 1s linear infinite' }} />
              : <Navigation size={18} color={C.navy} weight="fill" />
            }
          </button>

          {/* Hint */}
          <div style={{
            position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.55)', color: '#fff',
            fontSize: 12, fontWeight: 600,
            padding: '6px 14px', borderRadius: 20,
            pointerEvents: 'none', zIndex: 1000,
            whiteSpace: 'nowrap',
          }}>
            {t("Xaritaga bosing yoki pinni torting", "Нажмите на карту или перетащите метку")}
          </div>
        </div>

        {/* Address preview */}
        <div style={{
          padding: '14px 20px',
          borderTop: `1px solid ${C.border}`,
          flexShrink: 0,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {t("Tanlangan manzil", "Выбранный адрес")}
          </div>
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 8,
            background: C.s2, borderRadius: 12, padding: '10px 12px',
            border: `1px solid ${C.border}`,
          }}>
            <MapPin size={16} color={C.navy} weight="fill" style={{ marginTop: 1, flexShrink: 0 }} />
            <div style={{ fontSize: 13, color: C.dark, flex: 1, lineHeight: 1.4 }}>
              {geocoding
                ? <span style={{ color: C.muted }}>{t("Manzil aniqlanmoqda...", "Определяется адрес...")}</span>
                : (address || t("Xaritadan joy tanlang", "Выберите место на карте"))
              }
            </div>
            {geocoding && <Loader2 size={14} color={C.muted} style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />}
          </div>

          {position && (
            <div style={{ fontSize: 11, color: C.muted, marginTop: 6, textAlign: 'right' }}>
              {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ padding: '0 20px 24px', display: 'flex', gap: 10, flexShrink: 0 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '13px 0', borderRadius: 14,
            border: `1.5px solid ${C.border}`,
            background: 'transparent', cursor: 'pointer',
            fontSize: 14, fontWeight: 700, color: C.muted,
          }}>
            {t("Bekor qilish", "Отмена")}
          </button>
          <button
            onClick={handleConfirm}
            disabled={!position || geocoding}
            style={{
              flex: 2, padding: '13px 0', borderRadius: 14, border: 'none',
              background: (!position || geocoding)
                ? C.border
                : `linear-gradient(135deg,${C.navy},${C.mid})`,
              cursor: (!position || geocoding) ? 'default' : 'pointer',
              fontSize: 14, fontWeight: 700, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: (!position || geocoding) ? 'none' : `0 4px 16px ${C.navy}40`,
              transition: 'all .2s',
            }}
          >
            <Check size={17} weight="bold" />
            {t("Manzilni tasdiqlash", "Подтвердить адрес")}
          </button>
        </div>
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
