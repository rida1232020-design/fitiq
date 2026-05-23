import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { C } from '../lib/theme';
import { Btn, Input, Spinner } from '../components/UI';

const AVATARS = ['💪','🏋️','🔥','⚡','🦾','🏆','🥊','🎯','🦅','🐉'];
const CITIES  = ['بغداد','البصرة','الموصل','أربيل','النجف','كربلاء','الناصرية','الكوت','الرمادي','كركوك'];

export default function AuthPage() {
  const { signInWithPi } = useAuth();
  const [mode, setMode]   = useState('login');   // login | register
  const [role, setRole]   = useState('athlete'); // athlete | captain
  const [step, setStep]   = useState(1);
  const [loading, setLoading] = useState(false);
  const [err, setErr]     = useState('');

  const [form, setForm] = useState({
    email: '', password: '', fullName: '', phone: '',
    avatar: '💪', gymName: '', specialty: '', experience: '',
    pricePerSession: '', bio: '', badge: '', city: 'بغداد',
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleLogin = async () => {
    setLoading(true); setErr('');
    const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
    if (error) setErr('البريد الإلكتروني أو كلمة السر غلط');
    setLoading(false);
  };

  const handleRegister = async () => {
    setLoading(true); setErr('');
    try {
      const { data, error } = await supabase.auth.signUp({ email: form.email, password: form.password });
      if (error) throw error;

      const uid = data.user.id;
      await supabase.from('profiles').insert({
        id: uid, role, full_name: form.fullName,
        phone: form.phone, avatar_emoji: form.avatar,
      });

      if (role === 'captain') {
        await supabase.from('captains').insert({
          id: uid, gym_name: form.gymName, specialty: form.specialty,
          experience_years: parseInt(form.experience) || 0,
          price_per_session: parseInt(form.pricePerSession) || 0,
          bio: form.bio, badge: form.badge, city: form.city, available: true,
        });
      }
    } catch (e) {
      setErr(e.message || 'حصل خطأ، حاول ثانية');
    }
    setLoading(false);
  };

  /* ── RENDER ── */
  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      {/* Hero Top */}
      <div style={{
        background: `linear-gradient(135deg,${C.primary} 0%,#FF8C00 60%,${C.secondary} 100%)`,
        padding: '40px 24px 50px', textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position:'absolute', top:-40, right:-40, width:180, height:180, borderRadius:'50%', background:'rgba(255,255,255,0.07)' }}/>
        <div style={{ position:'absolute', bottom:-30, left:-30, width:130, height:130, borderRadius:'50%', background:'rgba(255,255,255,0.05)' }}/>
        <div style={{ position:'relative' }}>
          <div style={{ fontSize:56, marginBottom:10 }}>🏋️</div>
          <h1 style={{ color:'#fff', fontWeight:900, fontSize:28, marginBottom:4 }}>FitIQ العراق</h1>
          <p style={{ color:'rgba(255,255,255,0.8)', fontSize:13 }}>منصة الفتنس العراقية الأولى</p>
        </div>
      </div>

      {/* Card */}
      <div style={{
        flex:1, background:'#fff', borderRadius:'28px 28px 0 0', marginTop:-20,
        padding:'28px 20px 40px', maxWidth:480, width:'100%', margin:'-20px auto 0',
        boxShadow:'0 -8px 30px rgba(26,26,46,0.08)',
      }}>
        {/* Tabs */}
        <div style={{ display:'flex', background:C.bgMuted, borderRadius:16, padding:4, marginBottom:24 }}>
          {[['login','دخول'],['register','تسجيل جديد']].map(([k,l]) => (
            <button key={k} onClick={() => { setMode(k); setStep(1); setErr(''); }} style={{
              flex:1, border:'none', borderRadius:12, padding:'11px 0',
              background: mode===k ? '#fff' : 'none',
              color: mode===k ? C.primary : C.textMuted,
              fontWeight:800, fontSize:14, fontFamily:'Cairo,sans-serif',
              boxShadow: mode===k ? C.shadow : 'none', transition:'all 0.2s',
            }}>{l}</button>
          ))}
        </div>

        {err && (
          <div style={{ background:'#FEF2F2', border:'1.5px solid #FCA5A5', borderRadius:12, padding:'10px 14px', color:C.danger, fontSize:13, marginBottom:16, fontWeight:600 }}>
            ⚠️ {err}
          </div>
        )}

        {/* LOGIN */}
        {mode === 'login' && (
          <div className="fade-in">
            <Btn onClick={() => signInWithPi(false)} fullWidth size="lg" style={{
              background: 'linear-gradient(135deg, #5A2C84 0%, #7B4CA8 100%)',
              color: '#FFB800',
              fontWeight: 900,
              border: '1.5px solid #FFB800',
              boxShadow: '0 4px 18px rgba(90, 44, 132, 0.28)',
              marginBottom: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s',
            }}>
              <span style={{ fontSize: 22, fontWeight: 'bold' }}>π</span> دخول سريع عبر Pi Network
            </Btn>

            <div style={{ display: 'flex', alignItems: 'center', margin: '14px 0 20px', color: C.textMuted }}>
              <div style={{ flex: 1, height: 1, background: C.border }} />
              <span style={{ padding: '0 10px', fontSize: 12, fontWeight: 700 }}>أو سجل بالطريقة العادية</span>
              <div style={{ flex: 1, height: 1, background: C.border }} />
            </div>

            <Input label="البريد الإلكتروني" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="example@email.com" type="email" icon="📧"/>
            <Input label="كلمة السر" value={form.password} onChange={e=>set('password',e.target.value)} placeholder="••••••••" type="password" icon="🔒"/>
            <Btn onClick={handleLogin} disabled={loading} fullWidth size="lg" style={{ marginTop:8 }}>
              {loading ? <Spinner size={20} color="#fff"/> : '🚀 دخول'}
            </Btn>
            <p style={{ textAlign:'center', color:C.textMuted, fontSize:13, marginTop:20 }}>
              ما عندك حساب؟{' '}
              <span onClick={() => setMode('register')} style={{ color:C.primary, fontWeight:800, cursor:'pointer' }}>سجل هسه</span>
            </p>
          </div>
        )}

        {/* REGISTER */}
        {mode === 'register' && (
          <div className="fade-in">
            {/* Step 1 — Role */}
            {step === 1 && (
              <div>
                <p style={{ color:C.textMuted, fontSize:14, marginBottom:20, textAlign:'center' }}>أنت تسجل كـ:</p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:24 }}>
                  {[['athlete','🏃','رياضي','تمارين، تواصل مع كباتن، اشتراك بكورسات'],
                    ['captain','🏆','كابتن','إدارة ملفك، تقديم كورسات، تواصل مع الرياضيين']].map(([k,ic,lb,desc]) => (
                    <div key={k} onClick={() => setRole(k)} style={{
                      border: `2px solid ${role===k ? C.primary : C.border}`,
                      borderRadius:18, padding:'18px 14px', textAlign:'center', cursor:'pointer',
                      background: role===k ? '#FFF5F0' : '#fff', transition:'all 0.2s',
                    }}>
                      <div style={{ fontSize:36, marginBottom:8 }}>{ic}</div>
                      <div style={{ color:C.text, fontWeight:900, fontSize:15, marginBottom:4 }}>{lb}</div>
                      <div style={{ color:C.textMuted, fontSize:11, lineHeight:1.5 }}>{desc}</div>
                    </div>
                  ))}
                </div>
                <Btn onClick={() => setStep(2)} fullWidth size="lg">التالي →</Btn>
              </div>
            )}

            {/* Step 2 — Basic Info */}
            {step === 2 && (
              <div>
                <p style={{ color:C.textMuted, fontSize:13, marginBottom:16, fontWeight:700 }}>📋 المعلومات الأساسية</p>
                <Input label="الاسم الكامل" value={form.fullName} onChange={e=>set('fullName',e.target.value)} placeholder="اسمك الكامل" icon="👤"/>
                <Input label="البريد الإلكتروني" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="example@email.com" type="email" icon="📧"/>
                <Input label="كلمة السر" value={form.password} onChange={e=>set('password',e.target.value)} placeholder="6 أحرف على الأقل" type="password" icon="🔒"/>
                <Input label="رقم الهاتف" value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="+964 7XX XXX XXXX" icon="📱"/>

                <p style={{ color:C.textMuted, fontSize:12, fontWeight:700, marginBottom:8 }}>اختار أيقونتك:</p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:18 }}>
                  {AVATARS.map(a => (
                    <button key={a} onClick={() => set('avatar', a)} style={{
                      width:42, height:42, borderRadius:12, border:`2px solid ${form.avatar===a ? C.primary : C.border}`,
                      background: form.avatar===a ? '#FFF5F0' : '#fff', fontSize:22, cursor:'pointer',
                    }}>{a}</button>
                  ))}
                </div>

                <div style={{ display:'flex', gap:10 }}>
                  <Btn onClick={() => setStep(1)} variant="secondary" style={{ flex:1 }}>← رجوع</Btn>
                  <Btn onClick={() => role==='athlete' ? handleRegister() : setStep(3)} disabled={loading} style={{ flex:2 }}>
                    {loading ? <Spinner size={18} color="#fff"/> : role==='athlete' ? '✅ تسجيل' : 'التالي →'}
                  </Btn>
                </div>
              </div>
            )}

            {/* Step 3 — Captain Info */}
            {step === 3 && role === 'captain' && (
              <div>
                <p style={{ color:C.textMuted, fontSize:13, marginBottom:16, fontWeight:700 }}>🏆 معلومات الكابتن</p>
                <Input label="اسم القاعة" value={form.gymName} onChange={e=>set('gymName',e.target.value)} placeholder="مثال: قاعة الفارس" icon="🏟️"/>
                <Input label="تخصصك" value={form.specialty} onChange={e=>set('specialty',e.target.value)} placeholder="مثال: كمال أجسام وضخامة" icon="🎯"/>
                <Input label="شهادة أو لقب" value={form.badge} onChange={e=>set('badge',e.target.value)} placeholder="مثال: محترف IFBB" icon="🏅"/>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <Input label="سنوات الخبرة" value={form.experience} onChange={e=>set('experience',e.target.value)} placeholder="مثال: 8" type="number" icon="📅"/>
                  <Input label="سعر الجلسة (دينار)" value={form.pricePerSession} onChange={e=>set('pricePerSession',e.target.value)} placeholder="25000" type="number" icon="💰"/>
                </div>

                <div style={{ marginBottom:14 }}>
                  <label style={{ display:'block', color:C.textMuted, fontSize:12, fontWeight:700, marginBottom:6 }}>المدينة</label>
                  <select value={form.city} onChange={e=>set('city',e.target.value)} style={{
                    width:'100%', background:C.bgInput, border:`1.5px solid ${C.border}`,
                    borderRadius:14, padding:'11px 14px', color:C.text, fontSize:14,
                    fontFamily:'Cairo,sans-serif', outline:'none', direction:'rtl',
                  }}>
                    {CITIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>

                <Input label="نبذة عنك" value={form.bio} onChange={e=>set('bio',e.target.value)} placeholder="اكتب نبذة قصيرة عن تجربتك وخبرتك..." multiline rows={3} icon="📝"/>

                <div style={{ display:'flex', gap:10 }}>
                  <Btn onClick={() => setStep(2)} variant="secondary" style={{ flex:1 }}>← رجوع</Btn>
                  <Btn onClick={handleRegister} disabled={loading} style={{ flex:2 }}>
                    {loading ? <Spinner size={18} color="#fff"/> : '🏆 إنشاء ملف الكابتن'}
                  </Btn>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
