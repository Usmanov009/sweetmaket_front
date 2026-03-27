import { useEffect, useRef, useState } from 'react';
import { Camera, X, ArrowLeft } from 'lucide-react';

export default function CameraPage({ onBack, onPhotoTaken, C }) {
  const videoRef = useRef(null);
  const [stream, setStream]   = useState(null);
  const [error,  setError]    = useState('');
  const [photo,  setPhoto]    = useState(null);

  useEffect(() => {
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'environment' } })
      .then(s => { setStream(s); if (videoRef.current) videoRef.current.srcObject = s; })
      .catch(() => setError('Камера недоступна'));
    return () => stream?.getTracks().forEach(t => t.stop());
  }, []); // eslint-disable-line

  const capture = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    setPhoto(canvas.toDataURL('image/jpeg'));
    stream?.getTracks().forEach(t => t.stop());
  };

  const retake = () => {
    setPhoto(null);
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'environment' } })
      .then(s => { setStream(s); if (videoRef.current) videoRef.current.srcObject = s; })
      .catch(() => setError('Камера недоступна'));
  };

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column', color: '#fff' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
        <button onClick={onBack} style={{ background: 'rgba(0,0,0,.4)', border: 'none', borderRadius: 12, width: 40, height: 40, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={20}/>
        </button>
        <span style={{ fontWeight: 700, fontSize: 16 }}>Камера</span>
      </div>

      {/* Viewfinder */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        {error ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Camera size={56} color="rgba(255,255,255,.3)" style={{ marginBottom: 16 }}/>
            <div style={{ fontSize: 15, color: 'rgba(255,255,255,.6)' }}>{error}</div>
          </div>
        ) : photo ? (
          <img src={photo} alt="preview" style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}/>
        ) : (
          <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', maxHeight: '80vh', objectFit: 'cover' }}/>
        )}
      </div>

      {/* Controls */}
      <div style={{ padding: '24px 40px 48px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40 }}>
        {photo ? (
          <>
            <button onClick={retake} style={{ background: 'rgba(255,255,255,.15)', border: 'none', borderRadius: 16, padding: '12px 24px', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <X size={18}/> Переснять
            </button>
            <button onClick={onPhotoTaken} style={{ background: `linear-gradient(135deg,${C.navy},${C.mid})`, border: 'none', borderRadius: 16, padding: '12px 24px', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: `0 4px 16px ${C.navy}66` }}>
              ✓ Использовать
            </button>
          </>
        ) : (
          <button onClick={capture} disabled={!!error} style={{ width: 72, height: 72, borderRadius: '50%', background: error ? 'rgba(255,255,255,.2)' : '#fff', border: '4px solid rgba(255,255,255,.3)', cursor: error ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Camera size={30} color={error ? 'rgba(0,0,0,.3)' : '#000'}/>
          </button>
        )}
      </div>
    </div>
  );
}
