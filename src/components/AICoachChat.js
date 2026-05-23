import { useState, useRef, useEffect } from 'react';
import { C } from '../lib/theme';
import { Spinner } from './UI';

// ══════════════════════════════════════════════════
//  Gemini Flash 2.0 — مجاني تماماً
//  احصل على API key مجاني من:
//  https://aistudio.google.com/app/apikey
//  الحد المجاني: 1500 طلب/يوم — يكفي للاستخدام الكامل
// ══════════════════════════════════════════════════

const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || '';

const SYSTEM_PROMPT = `أنت مدرب لياقة بدنية عراقي محترف اسمك "أبو العضلة". 
تتكلم باللهجة العراقية الدارجة بشكل طبيعي وودي.
متخصص في: كمال الأجسام، الفتنس، الترقيق، التغذية الرياضية، التعافي.

أسلوبك: حماسي، مشجع، عملي، مباشر.
تستخدم كلمات عراقية مثل: هلا، خوش، بس، شلون، يبه، والله، اكو، ماكو.

تقدم نصائح علمية دقيقة عن:
- التمارين وطريقة أدائها الصحيح
- التغذية وبروتوكولات الأكل
- برامج التدريب المناسبة
- الإصابات والتعافي
- التحفيز النفسي

ردودك مختصرة ومفيدة (3-5 جمل). استخدم إيموجي باعتدال.
لا تذكر أنك ذكاء اصطناعي — أنت مدرب حقيقي.`;

async function askGemini(messages) {
  if (!GEMINI_API_KEY) {
    return 'يبه، ما ضبطنا مفتاح الـ AI بعد! حط REACT_APP_GEMINI_API_KEY في ملف .env 🔑';
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

  // Convert chat history to Gemini format
  const contents = messages.map(m => ({
    role: m.from === 'user' ? 'user' : 'model',
    parts: [{ text: m.text }]
  }));

  const body = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents,
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 400,
      topP: 0.9,
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    ],
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (err?.error?.status === 'RESOURCE_EXHAUSTED') {
      return 'خلص الحد اليومي المجاني 😅 رجع بكرة أو حدّث المفتاح من Google AI Studio!';
    }
    throw new Error(err?.error?.message || 'Gemini API error');
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text
    || 'عذراً، ما قدرت أفهم السؤال. حاول مرة ثانية!';
}

const QUICK_QUESTIONS = [
  { icon: '💪', text: 'كيف أبني عضل بسرعة؟' },
  { icon: '🔥', text: 'كيف أحرق دهون البطن؟' },
  { icon: '🥗', text: 'شنو آكل قبل التمرين؟' },
  { icon: '😴', text: 'شقد أنام بعد التمرين؟' },
  { icon: '🏋️', text: 'ما هو أفضل تمرين للمبتدئين؟' },
  { icon: '⚡', text: 'كيف أزيد قوتي؟' },
];

export default function AICoachChat({ onClose }) {
  const [messages, setMessages] = useState([
    { from: 'ai', text: 'هلا وسهلاً! أنا أبو العضلة — مدربك الشخصي 💪🇮🇶\nاسألني أي شي عن التمارين، التغذية، أو الفتنس!' }
  ]);
  const [input, setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

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
      // Send full history for context (last 10 messages)
      const history = newMessages.slice(-10);
      const reply = await askGemini(history);
      setMessages(p => [...p, { from: 'ai', text: reply }]);
    } catch {
      setMessages(p => [...p, { from: 'ai', text: 'ماكو اتصال هسه يبه! تحقق من الإنترنت وحاول ثانية 📡' }]);
    }
    setLoading(false);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(26,26,46,0.65)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Cairo, sans-serif',
    }}>
      <div style={{
        width: 'min(460px, 96vw)', height: 'min(640px, 92vh)',
        background: '#fff', borderRadius: 28,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 30px 80px rgba(26,26,46,0.3)',
      }}>

        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg,${C.primary},#FF8C00)`,
          padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
          }}>🏋️</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontWeight: 900, fontSize: 15 }}>أبو العضلة</div>
            <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11 }}>
              مدرب ذكي مجاني • Gemini AI ✨
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ADE80', animation: 'pulse 2s infinite' }}/>
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11 }}>متاح</span>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff',
            width: 32, height: 32, borderRadius: '50%', cursor: 'pointer',
            fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginRight: 4,
          }}>✕</button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', background: C.bg, display: 'flex', flexDirection: 'column', gap: 10 }}>

          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.from === 'user' ? 'flex-start' : 'flex-end', animation: 'fadeIn 0.25s ease' }}>
              {m.from === 'ai' && (
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg,${C.primary},#FF8C00)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0, marginLeft: 8, alignSelf: 'flex-end' }}>🏋️</div>
              )}
              <div style={{
                maxWidth: '75%', padding: '11px 15px', lineHeight: 1.65,
                borderRadius: m.from === 'user' ? '18px 18px 18px 4px' : '18px 18px 4px 18px',
                background: m.from === 'user'
                  ? '#fff'
                  : `linear-gradient(135deg,${C.primary},#FF7340)`,
                color: m.from === 'user' ? C.text : '#fff',
                fontSize: 13.5, direction: 'rtl', textAlign: 'right',
                boxShadow: C.shadow,
                border: m.from === 'user' ? `1.5px solid ${C.border}` : 'none',
                whiteSpace: 'pre-wrap',
              }}>
                {m.text}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, alignItems: 'center' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg,${C.primary},#FF8C00)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🏋️</div>
              <div style={{ padding: '12px 16px', borderRadius: '18px 18px 4px 18px', background: `linear-gradient(135deg,${C.primary},#FF7340)`, display: 'flex', gap: 5, alignItems: 'center' }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(255,255,255,0.7)', animation: `bounce3 1.2s ${i*0.2}s infinite` }}/>
                ))}
              </div>
            </div>
          )}
          <div ref={endRef}/>
        </div>

        {/* Quick Questions — show only at start */}
        {messages.length <= 1 && (
          <div style={{ padding: '8px 14px', background: '#fff', borderTop: `1px solid ${C.border}` }}>
            <div style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, marginBottom: 8, direction: 'rtl' }}>أسئلة سريعة:</div>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
              {QUICK_QUESTIONS.map((q, i) => (
                <button key={i} onClick={() => send(q.text)} style={{
                  background: '#FFF5F0', border: `1.5px solid rgba(255,77,0,0.15)`,
                  borderRadius: 10, padding: '6px 10px', cursor: 'pointer',
                  color: C.primary, fontWeight: 700, fontSize: 11,
                  fontFamily: 'Cairo, sans-serif', whiteSpace: 'nowrap',
                  display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
                }}>
                  {q.icon} {q.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div style={{ padding: '12px 14px', background: '#fff', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 8 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="اسأل مدربك..."
            style={{
              flex: 1, background: C.bg, border: `1.5px solid ${C.border}`,
              borderRadius: 14, padding: '11px 14px', color: C.text,
              fontSize: 14, direction: 'rtl', outline: 'none',
              fontFamily: 'Cairo, sans-serif',
            }}
          />
          <button onClick={() => send()} disabled={loading || !input.trim()} style={{
            background: input.trim() ? `linear-gradient(135deg,${C.primary},#FF7340)` : C.bgMuted,
            border: 'none', borderRadius: 14, width: 46, height: 46,
            cursor: input.trim() ? 'pointer' : 'default', fontSize: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: input.trim() ? `0 4px 14px rgba(255,77,0,0.3)` : 'none',
            transition: 'all 0.2s', flexShrink: 0,
          }}>
            {loading ? <Spinner size={18} color="#fff"/> : '⚡'}
          </button>
        </div>

      </div>
    </div>
  );
}
