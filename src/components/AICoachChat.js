import { useState, useRef, useEffect, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { C } from '../lib/theme';
import { Spinner } from './UI';

const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || '';

const SYSTEM_PROMPTS = {
  ar: `أنت مدرب لياقة بدنية عراقي محترف اسمك "أبو العضلة". 
تتكلم باللهجة العراقية الدارجة بشكل طبيعي وودي.
متخصص في: كمال الأجسام، الفتنس، الترقيق، التغذية الرياضية، التعافي.
أسلوبك: حماسي، مشجع، عملي، مباشر.
ردودك مختصرة ومفيدة (3-5 جمل). استخدم إيموجي باعتدال.
لا تذكر أنك ذكاء اصطناعي — أنت مدرب حقيقي.`,
  en: `You are a professional fitness coach named "Coach Abu".
You speak clear, friendly English.
You specialize in: bodybuilding, fitness, fat loss, sports nutrition, and recovery.
Your style: energetic, encouraging, practical, and direct.
Keep replies concise and useful (3-5 sentences). Use emoji sparingly.
Do not mention that you are an AI — you are a real coach.`,
};

async function askGemini(messages, systemPrompt, t) {
  if (!GEMINI_API_KEY) return t('ai.noKey');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
  const contents = messages.map((m) => ({
    role: m.from === 'user' ? 'user' : 'model',
    parts: [{ text: m.text }],
  }));

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: { temperature: 0.8, maxOutputTokens: 400, topP: 0.9 },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (err?.error?.status === 'RESOURCE_EXHAUSTED') return t('ai.quotaExceeded');
    throw new Error(err?.error?.message || 'Gemini API error');
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || t('ai.noUnderstand');
}

export default function AICoachChat({ onClose }) {
  const { t, dir, language } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  const quickQuestions = useMemo(() => [
    { icon: '💪', text: t('ai.q1') },
    { icon: '🔥', text: t('ai.q2') },
    { icon: '🥗', text: t('ai.q3') },
    { icon: '😴', text: t('ai.q4') },
    { icon: '🏋️', text: t('ai.q5') },
    { icon: '⚡', text: t('ai.q6') },
  ], [t, language]);

  useEffect(() => {
    setMessages([{ from: 'ai', text: t('ai.welcome') }]);
  }, [language, t]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    const newMessages = [...messages, { from: 'user', text: msg }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const reply = await askGemini(newMessages.slice(-10), SYSTEM_PROMPTS[language], t);
      setMessages((p) => [...p, { from: 'ai', text: reply }]);
    } catch {
      setMessages((p) => [...p, { from: 'ai', text: t('ai.networkError') }]);
    }
    setLoading(false);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(26,26,46,0.65)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cairo,sans-serif',
    }}>
      <div style={{
        width: 'min(460px, 96vw)', height: 'min(640px, 92vh)',
        background: '#fff', borderRadius: 28, display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 30px 80px rgba(26,26,46,0.3)', direction: dir,
      }}>
        <div style={{ background: `linear-gradient(135deg,${C.primary},#FF8C00)`, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🏋️</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontWeight: 900, fontSize: 15 }}>{t('ai.name')}</div>
            <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11 }}>{t('ai.subtitle')}</div>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11 }}>{t('ai.available')}</span>
          <button type="button" onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', background: C.bg, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.from === 'user' ? 'flex-start' : 'flex-end' }}>
              <div style={{
                maxWidth: '75%', padding: '11px 15px', lineHeight: 1.65, fontSize: 13.5,
                borderRadius: m.from === 'user' ? '18px 18px 18px 4px' : '18px 18px 4px 18px',
                background: m.from === 'user' ? '#fff' : `linear-gradient(135deg,${C.primary},#FF7340)`,
                color: m.from === 'user' ? C.text : '#fff',
                boxShadow: C.shadow, border: m.from === 'user' ? `1.5px solid ${C.border}` : 'none',
                whiteSpace: 'pre-wrap', direction: dir, textAlign: dir === 'rtl' ? 'right' : 'left',
              }}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ padding: '12px 16px', borderRadius: '18px 18px 4px 18px', background: `linear-gradient(135deg,${C.primary},#FF7340)`, display: 'flex', gap: 5 }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(255,255,255,0.7)', animation: `bounce3 1.2s ${i * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {messages.length <= 1 && (
          <div style={{ padding: '8px 14px', background: '#fff', borderTop: `1px solid ${C.border}` }}>
            <div style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, marginBottom: 8 }}>{t('ai.quickQuestions')}</div>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
              {quickQuestions.map((q, i) => (
                <button key={i} type="button" onClick={() => send(q.text)} style={{
                  background: '#FFF5F0', border: '1.5px solid rgba(255,77,0,0.15)',
                  borderRadius: 10, padding: '6px 10px', cursor: 'pointer',
                  color: C.primary, fontWeight: 700, fontSize: 11, fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0,
                }}>
                  {q.icon} {q.text}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ padding: '12px 14px', background: '#fff', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 8 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder={t('ai.placeholder')}
            style={{
              flex: 1, background: C.bg, border: `1.5px solid ${C.border}`,
              borderRadius: 14, padding: '11px 14px', fontSize: 14, direction: dir, outline: 'none', fontFamily: 'inherit',
            }}
          />
          <button type="button" onClick={() => send()} disabled={loading || !input.trim()} style={{
            background: input.trim() ? `linear-gradient(135deg,${C.primary},#FF7340)` : C.bgMuted,
            border: 'none', borderRadius: 14, width: 46, height: 46, cursor: input.trim() ? 'pointer' : 'default', fontSize: 20,
          }}>
            {loading ? <Spinner size={18} color="#fff" /> : '⚡'}
          </button>
        </div>
      </div>
    </div>
  );
}
