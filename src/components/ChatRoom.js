import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../context/LanguageContext';
import { C } from '../lib/theme';
import { Avatar, Spinner } from './UI';

export default function ChatRoom({ conversation, currentUser, profile, onBack }) {
  const { t, dir, locale } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  const otherProfile = conversation.profiles || conversation.captain_profile;

  const loadMessages = useCallback(async () => {
    const { data } = await supabase
      .from('messages')
      .select('*, profiles:sender_id(full_name, avatar_emoji)')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true });
    setMessages(data || []);
    setLoading(false);
  }, [conversation.id]);

  useEffect(() => {
    loadMessages();
    const sub = supabase.channel(`chat-${conversation.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `conversation_id=eq.${conversation.id}`,
      }, (payload) => {
        setMessages((p) => [...p, payload.new]);
      })
      .subscribe();
    return () => sub.unsubscribe();
  }, [conversation.id, loadMessages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput('');
    setSending(true);
    await supabase.from('messages').insert({
      conversation_id: conversation.id,
      sender_id: currentUser.id,
      content: text,
    });
    setSending(false);
  };

  const formatTime = (ts) => new Date(ts).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

  const formatDate = (ts) => {
    const d = new Date(ts);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return t('today');
    return d.toLocaleDateString(locale, { day: 'numeric', month: 'long' });
  };

  let lastDate = '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: C.bg, fontFamily: 'Cairo,sans-serif', direction: dir }}>
      <header style={{ background: '#fff', borderBottom: `1px solid ${C.border}`, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: C.shadow, position: 'sticky', top: 0, zIndex: 10 }}>
        <button type="button" onClick={onBack} style={{ background: C.bgMuted, border: 'none', borderRadius: 10, width: 36, height: 36, fontSize: 18, cursor: 'pointer' }}>←</button>
        <Avatar emoji={otherProfile?.avatar_emoji || '💪'} size={42} style={{ background: `linear-gradient(135deg,${C.accent},#0080FF)`, boxShadow: 'none' }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 15 }}>{otherProfile?.full_name || t('chat.conversation')}</div>
          <div style={{ color: C.success, fontSize: 11, fontWeight: 700 }}>{t('chat.online')}</div>
        </div>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading
          ? <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}><Spinner /></div>
          : messages.length === 0
            ? (
              <div style={{ textAlign: 'center', marginTop: 60 }}>
                <div style={{ fontSize: 52 }}>👋</div>
                <div style={{ color: C.textMuted, fontSize: 14, marginTop: 10 }}>{t('chat.startChat')}</div>
              </div>
            )
            : messages.map((m, i) => {
              const isMine = m.sender_id === currentUser.id;
              const msgDate = formatDate(m.created_at);
              const showDate = msgDate !== lastDate;
              if (showDate) lastDate = msgDate;
              return (
                <div key={m.id || i}>
                  {showDate && (
                    <div style={{ textAlign: 'center', margin: '8px 0' }}>
                      <span style={{ background: 'rgba(26,26,46,0.06)', color: C.textMuted, borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 600 }}>{msgDate}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: isMine ? 'flex-start' : 'flex-end' }}>
                    <div style={{ maxWidth: '78%' }}>
                      <div style={{
                        padding: '10px 14px', lineHeight: 1.6, fontSize: 14,
                        borderRadius: isMine ? '18px 18px 18px 4px' : '18px 18px 4px 18px',
                        background: isMine ? '#fff' : `linear-gradient(135deg,${C.primary},${C.primaryLight})`,
                        color: isMine ? C.text : '#fff',
                        boxShadow: C.shadow, border: isMine ? `1.5px solid ${C.border}` : 'none',
                      }}>
                        {m.content}
                      </div>
                      <span style={{ color: C.textLight, fontSize: 10, padding: '0 4px' }}>{formatTime(m.created_at)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
        <div ref={endRef} />
      </div>

      <div style={{ background: '#fff', borderTop: `1px solid ${C.border}`, padding: '12px 14px', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder={t('chat.placeholder')}
          rows={1}
          style={{
            flex: 1, background: C.bgInput, border: `1.5px solid ${C.border}`,
            borderRadius: 16, padding: '11px 14px', color: C.text, fontSize: 14,
            direction: dir, outline: 'none', resize: 'none', fontFamily: 'inherit', maxHeight: 100,
          }}
        />
        <button type="button" onClick={send} disabled={sending || !input.trim()} style={{
          background: input.trim() ? `linear-gradient(135deg,${C.primary},${C.primaryLight})` : C.bgMuted,
          border: 'none', borderRadius: 14, width: 46, height: 46, cursor: input.trim() ? 'pointer' : 'default',
          fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          {sending ? <Spinner size={18} color="#fff" /> : '⚡'}
        </button>
      </div>
    </div>
  );
}
