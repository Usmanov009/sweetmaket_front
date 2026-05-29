import { useState, useEffect, useRef } from 'react';
import { Send, X, Image, Loader2 } from 'lucide-react';

const BASE = import.meta.env.VITE_API_URL || '';

export default function ChatModal({ onClose, orderId, userId, sellerId, isSeller, C, isDesktop }) {
  const [messages,   setMessages]   = useState([]);
  const [text,       setText]       = useState('');
  const [loading,    setLoading]    = useState(true);
  const [sending,    setSending]    = useState(false);
  const [imgPreview, setImgPreview] = useState(null); // base64 image to send
  const messagesEndRef = useRef(null);
  const fileRef        = useRef(null);

  const senderId   = isSeller ? sellerId : userId;
  const senderType = isSeller ? 'seller' : 'user';

  // Load chat history
  useEffect(() => {
    fetch(`${BASE}/api/chat/${orderId}`)
      .then(r => r.json())
      .then(data => { setMessages(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [orderId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadImage = file => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = ev => setImgPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const send = async () => {
    if (!text.trim() && !imgPreview) return;
    if (!senderId) return;
    setSending(true);
    try {
      const token = isSeller
        ? localStorage.getItem('sm_seller_token')
        : localStorage.getItem('sm_token');
      const r = await fetch(`${BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          orderId,
          senderId,
          senderType,
          message: text.trim(),
          imageUrl: imgPreview || '',
        }),
      });
      const msg = await r.json();
      if (r.ok) {
        setMessages(prev => [...prev, msg]);
        setText('');
        setImgPreview(null);
      }
    } catch (_) {}
    finally { setSending(false); }
  };

  const onKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const myBubble  = { background: isSeller ? '#059669' : '#4f46e5', color: '#fff' };
  const herBubble = { background: C.s2, color: C.dark };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: C.s1, borderRadius: 20, width: '100%', maxWidth: 480,
        height: isDesktop ? 580 : '82vh', display: 'flex', flexDirection: 'column',
        overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,.2)',
      }}>

        {/* Header */}
        <div style={{
          padding: '14px 18px', borderBottom: `1px solid ${C.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: isSeller ? 'linear-gradient(135deg,#064e3b,#059669)' : 'linear-gradient(135deg,#1e1b4b,#4f46e5)',
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>
            💬 Buyurtma #{String(orderId).slice(-6)}
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,.15)', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', color: '#fff', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: C.muted, padding: 20 }}>
              <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', opacity: .4 }} />
            </div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: C.muted, padding: 32, fontSize: 13 }}>Hozircha xabarlar yo'q</div>
          ) : (
            messages.map((msg, i) => {
              const mine = msg.sender_type === senderType;
              const bubble = mine ? myBubble : herBubble;
              return (
                <div key={i} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '75%', padding: '10px 13px', borderRadius: mine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    ...bubble, fontSize: 14, wordBreak: 'break-word',
                    boxShadow: '0 1px 4px rgba(0,0,0,.08)',
                  }}>
                    {msg.image_url && (
                      <img
                        src={msg.image_url}
                        alt="rasm"
                        style={{ width: '100%', maxWidth: 220, borderRadius: 10, marginBottom: msg.message ? 8 : 0, display: 'block' }}
                      />
                    )}
                    {msg.message && <div>{msg.message}</div>}
                    <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4, textAlign: mine ? 'right' : 'left' }}>
                      {new Date(msg.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Image preview bar */}
        {imgPreview && (
          <div style={{
            padding: '8px 16px', borderTop: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', gap: 10, background: C.s2,
          }}>
            <img src={imgPreview} alt="preview" style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover' }} />
            <div style={{ flex: 1, fontSize: 12, color: C.muted }}>Rasm yuborishga tayyor</div>
            <button onClick={() => setImgPreview(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex' }}>
              <X size={18} />
            </button>
          </div>
        )}

        {/* Input */}
        <div style={{ padding: '12px 14px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          {/* Image upload — only for seller */}
          {isSeller && (
            <>
              <button onClick={() => fileRef.current?.click()} style={{
                width: 38, height: 38, borderRadius: 10, border: `1px solid ${C.border}`,
                background: C.s2, cursor: 'pointer', color: '#059669',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Image size={18} />
              </button>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => loadImage(e.target.files[0])} />
            </>
          )}

          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={onKey}
            placeholder="Xabar yozing..."
            rows={1}
            style={{
              flex: 1, padding: '10px 14px', border: `1px solid ${C.border}`,
              borderRadius: 12, background: C.s2, color: C.dark, fontSize: 14,
              outline: 'none', resize: 'none', lineHeight: 1.5,
              maxHeight: 80, overflowY: 'auto',
            }}
          />

          <button
            onClick={send}
            disabled={sending || (!text.trim() && !imgPreview)}
            style={{
              width: 38, height: 38, borderRadius: 10, border: 'none', flexShrink: 0,
              background: (text.trim() || imgPreview) && !sending
                ? (isSeller ? '#059669' : '#4f46e5')
                : C.border,
              color: (text.trim() || imgPreview) ? '#fff' : C.muted,
              cursor: (text.trim() || imgPreview) && !sending ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {sending
              ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              : <Send size={18} />
            }
          </button>
        </div>
      </div>
    </div>
  );
}