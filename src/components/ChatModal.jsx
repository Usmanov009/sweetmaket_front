import { useState, useEffect, useRef } from 'react';
import { PaperPlaneRight, X } from '@phosphor-icons/react';
import api from '../api';

export default function ChatModal({ onClose, orderId, userId, sellerId, C, isDesktop }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Chat tarixini yuklash
    api.get(`/api/chat/${orderId}`)
      .then(data => {
        setMessages(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [orderId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    // Kim yuborganini aniqlash - bu modalni kim ochgani ga qarab
    const senderType = sellerId ? 'seller' : 'user'; // Agar sellerId bo'lsa, bu seller ochgan

    const messageData = {
      orderId,
      senderId: sellerId || userId, // sellerId bo'lsa seller, bo'lmasa user
      senderType,
      message: newMessage.trim()
    };

    try {
      const sentMessage = await api.post('/api/chat', messageData);
      setMessages(prev => [...prev, sentMessage]);
      setNewMessage('');
    } catch (error) {
      console.error('Message send error:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={{ 
      position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:9999,
      display:'flex', alignItems:'center', justifyContent:'center', padding:20 
    }}>
      <div style={{ 
        background:C.s1, borderRadius:20, width:'100%', maxWidth:500, 
        height:isDesktop ? 600 : '80vh', display:'flex', flexDirection:'column',
        overflow:'hidden'
      }}>
        {/* Header */}
        <div style={{ 
          padding:16, borderBottom:`1px solid ${C.border}`, 
          display:'flex', justifyContent:'space-between', alignItems:'center',
          background:C.s2
        }}>
          <div style={{ fontSize:16, fontWeight:700, color:C.dark }}>
            💬 Buyurtma #{orderId}
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:C.muted }}>
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div style={{ 
          flex:1, overflowY:'auto', padding:16, display:'flex', flexDirection:'column', gap:8
        }}>
          {loading ? (
            <div style={{ textAlign:'center', color:C.muted, padding:20 }}>Yuklanmoqda...</div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign:'center', color:C.muted, padding:20 }}>Xabarlar yo'q</div>
          ) : (
            messages.map((msg, index) => (
              <div key={index} style={{
                display:'flex',
                justifyContent: msg.sender === 'seller' ? 'flex-end' : 'flex-start',
                marginBottom:8
              }}>
                <div style={{
                  maxWidth:'70%',
                  padding:10,
                  borderRadius:12,
                  background: msg.sender === 'seller' ? C.navy : C.s2,
                  color: msg.sender === 'seller' ? '#fff' : C.dark,
                  fontSize:14,
                  wordBreak:'break-word'
                }}>
                  <div>{msg.message}</div>
                  <div style={{ 
                    fontSize:11, opacity:0.7, marginTop:4,
                    textAlign: msg.sender === 'seller' ? 'right' : 'left'
                  }}>
                    {new Date(msg.created_at).toLocaleTimeString('uz-UZ', {
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{ 
          padding:16, borderTop:`1px solid ${C.border}`, display:'flex', gap:8
        }}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Xabar yozing..."
            style={{
              flex:1,
              padding:10,
              border:`1px solid ${C.border}`,
              borderRadius:10,
              background:C.s2,
              color:C.dark,
              fontSize:14,
              outline:'none'
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            style={{
              padding:10,
              borderRadius:10,
              border:'none',
              background:newMessage.trim() ? C.navy : C.border,
              color:newMessage.trim() ? '#fff' : C.muted,
              cursor:newMessage.trim() ? 'pointer' : 'not-allowed',
              display:'flex',
              alignItems:'center',
              justifyContent:'center'
            }}
          >
            <PaperPlaneRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
