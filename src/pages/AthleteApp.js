import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../lib/api';
import { C } from '../lib/theme';
import { Btn, Card, Badge, Avatar, Spinner, Toast, Empty, Stars, SectionHeader, BottomNav } from '../components/UI';
import ChatRoom from '../components/ChatRoom';
import AICoachChat from '../components/AICoachChat';

/* ════════════ LOCAL EXERCISE DATA ════════════ */
const EXERCISES_DB = {
  chest: [
    { id:'c1', name:'ضغط بالبار', muscle:'صدر', equipment:'بار', sets:4, reps:'8-12', rest:90, icon:'🏋️', tips:'نزّل البار ببطء حتى يلمس صدرك، أبقِ الكتفين ثابتتين', level:'متوسط' },
    { id:'c2', name:'ضغط الدمبل', muscle:'صدر', equipment:'دمبل', sets:3, reps:'10-12', rest:75, icon:'💪', tips:'وسّع ذراعيك بشكل طبيعي، لا تنزل الدمبل أكثر من اللازم', level:'مبتدئ' },
    { id:'c3', name:'تمرين الفراشة', muscle:'صدر داخلي', equipment:'كيبل', sets:3, reps:'12-15', rest:60, icon:'🦅', tips:'ركّز على الإحساس بالعضلة عند الضغط', level:'متوسط' },
    { id:'c4', name:'ضغط الأرض', muscle:'صدر', equipment:'بدون', sets:4, reps:'15-20', rest:60, icon:'⬆️', tips:'جسمك مستقيم من الرأس للقدمين', level:'مبتدئ' },
  ],
  back: [
    { id:'b1', name:'سحب البار', muscle:'ظهر عريض', equipment:'بار', sets:4, reps:'8-10', rest:90, icon:'🔙', tips:'انحنِ 45 درجة، ظهرك مستقيم دائماً', level:'متقدم' },
    { id:'b2', name:'سحب علوي', muscle:'ظهر عريض', equipment:'كيبل', sets:4, reps:'10-12', rest:75, icon:'⬇️', tips:'اسحب حتى مستوى الذقن، فعّل عضلة الظهر', level:'مبتدئ' },
    { id:'b3', name:'عقلة', muscle:'ظهر كامل', equipment:'بار عقلة', sets:3, reps:'6-10', rest:90, icon:'🤸', tips:'فعّل عضلة الظهر وليس فقط الذراعين', level:'متقدم' },
  ],
  legs: [
    { id:'l1', name:'سكوات', muscle:'فخذ كامل', equipment:'بار', sets:4, reps:'8-12', rest:120, icon:'🦵', tips:'انزل حتى تتوازى الفخذ مع الأرض', level:'متقدم' },
    { id:'l2', name:'ضغط الرجل', muscle:'فخذ أمامي', equipment:'جهاز', sets:4, reps:'12-15', rest:90, icon:'🦿', tips:'لا تقفل ركبتيك عند القمة', level:'مبتدئ' },
    { id:'l3', name:'رفعة الساق', muscle:'فخذ خلفي', equipment:'جهاز', sets:3, reps:'12-15', rest:60, icon:'🔄', tips:'احبس الحركة ثانية في القمة', level:'مبتدئ' },
    { id:'l4', name:'رفعة الكعب', muscle:'ساق', equipment:'جهاز/بدون', sets:4, reps:'15-20', rest:45, icon:'👟', tips:'انزل بالكامل للأسفل للتمدد', level:'مبتدئ' },
  ],
  shoulders: [
    { id:'s1', name:'ضغط الكتف', muscle:'كتف كامل', equipment:'بار/دمبل', sets:4, reps:'8-10', rest:90, icon:'🙆', tips:'اضغط عمودياً ولا تقوس ظهرك', level:'متوسط' },
    { id:'s2', name:'رفع جانبي', muscle:'كتف جانبي', equipment:'دمبل', sets:3, reps:'12-15', rest:60, icon:'↔️', tips:'ارفع حتى مستوى الكتف فقط', level:'مبتدئ' },
    { id:'s3', name:'رفع أمامي', muscle:'كتف أمامي', equipment:'دمبل', sets:3, reps:'12-15', rest:60, icon:'☝️', tips:'تحكم بالحركة صعوداً وهبوطاً', level:'مبتدئ' },
  ],
  arms: [
    { id:'a1', name:'بايسبس كيرل', muscle:'بايسبس', equipment:'دمبل/بار', sets:4, reps:'10-12', rest:60, icon:'💪', tips:'لا تتأرجح، الحركة في المرفق فقط', level:'مبتدئ' },
    { id:'a2', name:'ترايسبس داون', muscle:'ترايسبس', equipment:'كيبل', sets:3, reps:'12-15', rest:60, icon:'⬇️', tips:'مرفقيك ثابتان بجانب جسمك', level:'مبتدئ' },
    { id:'a3', name:'هامر كيرل', muscle:'ساعد+بايسبس', equipment:'دمبل', sets:3, reps:'12', rest:60, icon:'🔨', tips:'المقبض عمودي طوال الحركة', level:'مبتدئ' },
  ],
  core: [
    { id:'cr1', name:'بلانك', muscle:'بطن كامل', equipment:'بدون', sets:3, reps:'45-60ث', rest:45, icon:'🏂', tips:'جسمك خط مستقيم، لا ترفع مؤخرتك', level:'مبتدئ' },
    { id:'cr2', name:'كرنش', muscle:'بطن علوي', equipment:'بدون', sets:4, reps:'20', rest:45, icon:'🌀', tips:'فقط عضلة البطن تعمل، ليس الرقبة', level:'مبتدئ' },
    { id:'cr3', name:'رفع الرجلين', muscle:'بطن سفلي', equipment:'بدون', sets:3, reps:'15', rest:45, icon:'🦵', tips:'نزّل الرجلين ببطء ولا تلمس الأرض', level:'متوسط' },
  ],
};

const MUSCLE_GROUPS = [
  { key:'chest',     label:'الصدر',    icon:'🫀' },
  { key:'back',      label:'الظهر',    icon:'🔙' },
  { key:'legs',      label:'الأرجل',   icon:'🦵' },
  { key:'shoulders', label:'الكتف',    icon:'🙆' },
  { key:'arms',      label:'الذراعين', icon:'💪' },
  { key:'core',      label:'البطن',    icon:'🌀' },
];

const WORKOUT_PLANS = [
  { id:'p1', name:'برنامج المبتدئين', level:'مبتدئ', days:3, goal:'بناء أساس قوي', color:'#22C55E', icon:'🌱',
    schedule:[{day:'الأحد',focus:'صدر + ترايسبس',muscles:['chest','arms']},{day:'الثلاثاء',focus:'ظهر + بايسبس',muscles:['back','arms']},{day:'الخميس',focus:'أرجل + بطن',muscles:['legs','core']}]},
  { id:'p2', name:'ترقيق وحرق دهون', level:'متوسط', days:4, goal:'حرق دهون + تشكيل', color:C.primary, icon:'🔥',
    schedule:[{day:'الأحد',focus:'صدر + كتف',muscles:['chest','shoulders']},{day:'الاثنين',focus:'أرجل + بطن',muscles:['legs','core']},{day:'الأربعاء',focus:'ظهر + بايسبس',muscles:['back','arms']},{day:'الجمعة',focus:'جسم كامل',muscles:['chest','legs','core']}]},
  { id:'p3', name:'بناء العضلات المتقدم', level:'متقدم', days:5, goal:'ضخامة وقوة قصوى', color:'#FFB800', icon:'⚡',
    schedule:[{day:'الأحد',focus:'صدر',muscles:['chest']},{day:'الاثنين',focus:'ظهر',muscles:['back']},{day:'الثلاثاء',focus:'أرجل',muscles:['legs']},{day:'الخميس',focus:'كتف + بطن',muscles:['shoulders','core']},{day:'الجمعة',focus:'ذراعين',muscles:['arms']}]},
];

/* ════════════ WORKOUT SESSION ════════════ */
function WorkoutSession({ plan, onClose }) {
  const allEx = plan.schedule.flatMap(d => d.muscles.flatMap(m => (EXERCISES_DB[m]||[]).slice(0,2))).slice(0,8);
  const [idx, setIdx]   = useState(0);
  const [set, setSet]   = useState(1);
  const [rest, setRest] = useState(false);
  const [tLeft, setTLeft] = useState(0);
  const [done, setDone] = useState({});
  const cur = allEx[idx];
  const prog = Math.round(((idx*4+set-1)/(allEx.length*4))*100);
  const lc = { 'مبتدئ':'#22C55E','متوسط':'#FF8C00','متقدم':'#EF4444' };

  useEffect(() => {
    if (!rest) return;
    if (tLeft <= 0) { setRest(false); return; }
    const t = setTimeout(() => setTLeft(p => p-1), 1000);
    return () => clearTimeout(t);
  }, [rest, tLeft]);

  const completeSet = () => {
    setDone(p => ({ ...p, [`${cur.id}-${set}`]: true }));
    if (set < cur.sets) { setSet(s=>s+1); setTLeft(cur.rest); setRest(true); }
    else if (idx < allEx.length-1) { setIdx(i=>i+1); setSet(1); setRest(false); }
    else onClose();
  };

  return (
    <div style={{ position:'fixed', inset:0, background:C.bg, zIndex:200, overflow:'auto', direction:'rtl', fontFamily:'Cairo,sans-serif' }}>
      <div style={{ background:'#fff', borderBottom:`1px solid ${C.border}`, padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0 }}>
        <button onClick={onClose} style={{ background:'rgba(239,68,68,0.1)', border:'none', color:'#EF4444', borderRadius:10, padding:'6px 12px', cursor:'pointer', fontFamily:'Cairo,sans-serif', fontWeight:800, fontSize:13 }}>✕ إنهاء</button>
        <div style={{ fontWeight:800, fontSize:15, color:C.text }}>{plan.name}</div>
        <Badge color={plan.color}>{idx+1}/{allEx.length}</Badge>
      </div>
      <div style={{ height:4, background:'#F0EDE8' }}>
        <div style={{ height:'100%', width:`${prog}%`, background:`linear-gradient(90deg,${plan.color},${C.secondary})`, transition:'width 0.5s', borderRadius:'0 4px 4px 0' }}/>
      </div>
      <div style={{ maxWidth:480, margin:'0 auto', padding:'20px 16px' }}>
        {cur && (<>
          <Card style={{ padding:26, textAlign:'center', marginBottom:18 }}>
            <div style={{ fontSize:68, marginBottom:12 }}>{cur.icon}</div>
            <h2 style={{ color:C.text, fontSize:22, fontWeight:900, marginBottom:4 }}>{cur.name}</h2>
            <div style={{ color:C.textMuted, fontSize:13, marginBottom:10 }}>💪 {cur.muscle} • 🏋️ {cur.equipment}</div>
            <Badge color={lc[cur.level]}>{cur.level}</Badge>
            <div style={{ marginTop:16, background:'#FFF5F0', border:`1.5px solid rgba(255,77,0,0.12)`, borderRadius:14, padding:'12px 14px', color:C.primary, fontSize:13, lineHeight:1.7 }}>
              💡 {cur.tips}
            </div>
          </Card>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:18 }}>
            {[{l:'السيتات',v:cur.sets},{l:'التكرارات',v:cur.reps},{l:'الراحة',v:`${cur.rest}ث`}].map((s,i)=>(
              <Card key={i} style={{ padding:'14px 8px', textAlign:'center' }}>
                <div style={{ color:C.primary, fontWeight:900, fontSize:18 }}>{s.v}</div>
                <div style={{ color:C.textMuted, fontSize:10 }}>{s.l}</div>
              </Card>
            ))}
          </div>
          <div style={{ display:'flex', gap:8, justifyContent:'center', marginBottom:18 }}>
            {Array.from({length:cur.sets},(_,i)=>{
              const isDone=done[`${cur.id}-${i+1}`];const isAct=i+1===set;
              return <div key={i} style={{ width:46,height:46,borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:16,transition:'all 0.3s',background:isDone?`linear-gradient(135deg,#22C55E,#16A34A)`:isAct?`linear-gradient(135deg,${C.primary},${C.primaryLight})`:'#F0EDE8',color:(isDone||isAct)?'#fff':C.textMuted,boxShadow:isAct?`0 4px 14px rgba(255,77,0,0.3)`:'none' }}>{isDone?'✓':i+1}</div>;
            })}
          </div>
          {rest ? (
            <Card style={{ padding:22, textAlign:'center', marginBottom:16 }}>
              <div style={{ color:C.textMuted, fontSize:13, marginBottom:6 }}>⏱️ وقت الراحة</div>
              <div style={{ fontSize:56, fontWeight:900, color:tLeft>30?'#22C55E':tLeft>10?'#FF8C00':'#EF4444', letterSpacing:-2 }}>{tLeft}s</div>
              <button onClick={()=>{setRest(false);setTLeft(0);}} style={{ marginTop:10, background:'#F0EDE8', border:'none', color:C.textMuted, borderRadius:10, padding:'8px 16px', cursor:'pointer', fontFamily:'Cairo,sans-serif', fontSize:13 }}>تخطي</button>
            </Card>
          ):(
            <Btn onClick={completeSet} fullWidth size="lg" style={{ boxShadow:`0 8px 28px rgba(255,77,0,0.28)` }}>
              {set<cur.sets?`✅ انجزت السيت ${set}`:idx<allEx.length-1?'➡️ التمرين التالي':'🏆 إنهاء التمرين!'}
            </Btn>
          )}
        </>)}
      </div>
    </div>
  );
}

/* ════════════ MAIN ATHLETE APP ════════════ */
export default function AthleteApp() {
  const { user, profile, signOut } = useAuth();
  const [tab, setTab]       = useState('home');
  const [captains, setCaptains] = useState([]);
  const [courses, setCourses]   = useState([]);
  const [convos, setConvos]     = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [openChat, setOpenChat]   = useState(null);
  const [activePlan, setActivePlan] = useState(null);
  const [selectedMuscle, setMuscle] = useState('chest');
  const [selectedEx, setSelectedEx] = useState(null);
  const [selectedCaptain, setSelectedCaptain] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [toast, setToast]       = useState(null);
  const [unread, setUnread]     = useState(0);
  const [showAIChat, setShowAIChat] = useState(false);

  const showToast = (msg, type='success') => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  const loadData = useCallback(async () => {
    const [{ data: caps }, { data: crs }, { data: cvs }, { data: enr }] = await Promise.all([
      supabase.from('captains').select('*, profiles(full_name,avatar_emoji,phone)').eq('available', true).order('rating', { ascending: false }),
      supabase.from('courses').select('*, captains(id, gym_name, profiles(full_name,avatar_emoji))').order('created_at', { ascending: false }),
      supabase.from('conversations').select('*, captain_profile:captain_id(id, profiles(full_name,avatar_emoji)), messages(content,sender_id,created_at)').eq('athlete_id', user.id),
      supabase.from('enrollments').select('course_id').eq('athlete_id', user.id),
    ]);
    setCaptains(caps || []);
    setCourses(crs || []);
    setConvos(cvs || []);
    setEnrollments((enr||[]).map(e=>e.course_id));
    // Unread
    const u = (cvs||[]).filter(c => { const last=c.messages?.slice(-1)[0]; return last && last.sender_id !== user.id; }).length;
    setUnread(u);
  }, [user]);

  useEffect(() => { if(user) loadData(); }, [user, loadData]);

  useEffect(() => {
    if (!user) return;
    const sub = supabase.channel('athlete-msgs')
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'messages' }, () => loadData())
      .subscribe();
    return () => sub.unsubscribe();
  }, [user, loadData]);

  /* ── Start Conversation ── */
  const startChat = async (captain) => {
    setLoading(true);
    let convo = convos.find(c => c.captain_id === captain.id || c.captain_profile?.id === captain.id);
    if (!convo) {
      const { data } = await supabase.from('conversations').insert({ athlete_id: user.id, captain_id: captain.id }).select('*').single();
      convo = data;
      await loadData();
    }
    // Re-fetch with full data
    const { data: full } = await supabase
      .from('conversations').select('*, captain_profile:captain_id(id, profiles(full_name,avatar_emoji)), profiles:athlete_id(full_name,avatar_emoji), messages(content,sender_id,created_at)')
      .eq('id', convo.id).single();
    setOpenChat(full);
    setLoading(false);
  };

  /* ── Enroll with Pi Payments ── */
  const enroll = async (courseId, courseTitle) => {
    if (enrollments.includes(courseId)) {
      showToast('أنت مسجل بهذا الكورس مسبقاً', 'info');
      return;
    }

    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    // Handle free courses directly without launching Pi Payments
    if (!course.price || course.price === 0) {
      setLoading(true);
      try {
        await supabase.from('enrollments').insert({ athlete_id: user.id, course_id: courseId });
        setEnrollments(p => [...p, courseId]);
        showToast(`تم الاشتراك مجاناً في: ${courseTitle} ✅`);
      } catch (err) {
        showToast('فشل الاشتراك المجاني', 'error');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Paid course - Trigger Pi Payment flow
    if (!window.Pi) {
      // In non-Pi browsers or testing environments, fall back to mock sandbox/direct enrollment
      console.warn('Pi SDK not found. Falling back to Sandbox Mock mode.');
      setLoading(true);
      try {
        const mockPaymentId = `mock-pay-${Date.now()}`;
        const mockTxid = `mock-tx-${Date.now()}`;
        
        const response = await fetch(`${API_URL}/api/payments/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentId: mockPaymentId,
            txid: mockTxid,
            courseId,
            athleteId: user.id
          })
        });

        if (response.ok) {
          setEnrollments(p => [...p, courseId]);
          showToast(`[Sandbox] تم الاشتراك بنجاح في: ${courseTitle} ✅`);
        } else {
          throw new Error('Mock backend complete failed');
        }
      } catch (err) {
        showToast('فشل محاكاة الدفع في البيئة التجريبية', 'error');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Convert price to Pi (e.g. 10,000 IQD = 1 Pi)
    const piAmount = Math.max(1, Math.round(course.price / 10000));

    try {
      setLoading(true);
      showToast('جاري بدء عملية الدفع عبر Pi Network...', 'info');

      await window.Pi.createPayment({
        amount: piAmount,
        memo: `الاشتراك في كورس: ${courseTitle}`,
        metadata: { courseId, athleteId: user.id }
      }, {
        onReadyForServerApproval: async (paymentId) => {
          console.log(`Payment created: ${paymentId}. Requesting server approval...`);
          try {
            const res = await fetch(`${API_URL}/api/payments/approve`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paymentId })
            });
            if (!res.ok) throw new Error('Backend failed to approve payment');
            console.log('Payment approved by backend.');
          } catch (err) {
            console.error('Server approval error:', err);
            showToast('فشل خادم التطبيق في الموافقة على الدفعة', 'error');
          }
        },
        onReadyForServerCompletion: async (paymentId, txid) => {
          console.log(`User signed transaction: ${txid}. Submitting for completion...`);
          try {
            const res = await fetch(`${API_URL}/api/payments/complete`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                paymentId,
                txid,
                courseId,
                athleteId: user.id
              })
            });
            if (!res.ok) throw new Error('Backend failed to complete payment');
            
            console.log('Payment fully completed and enrolled!');
            setEnrollments(p => [...p, courseId]);
            showToast(`تم الاشتراك وتأكيد الدفع بنجاح عبر Pi Network! 🚀`);
          } catch (err) {
            console.error('Server completion error:', err);
            showToast('حدث خطأ أثناء تأكيد إتمام الدفعة على الخادم', 'error');
          } finally {
            setLoading(false);
          }
        },
        onCancel: (paymentId) => {
          console.log(`Payment cancelled by user: ${paymentId}`);
          showToast('تم إلغاء عملية الدفع', 'info');
          setLoading(false);
        },
        onError: (error, payment) => {
          console.error('Pi Payment Error:', error, payment);
          showToast('حدث خطأ أثناء إجراء عملية الدفع', 'error');
          setLoading(false);
        }
      });
    } catch (err) {
      console.error('Failed to initialize payment:', err);
      showToast('فشل بدء عملية الدفع', 'error');
      setLoading(false);
    }
  };

  if (activePlan) return <WorkoutSession plan={activePlan} onClose={() => setActivePlan(null)}/>;
  if (openChat)   return <ChatRoom conversation={openChat} currentUser={user} profile={profile} onBack={() => { setOpenChat(null); loadData(); }}/>;

  const TABS = [
    { key:'home',     icon:'🏠', label:'الرئيسية' },
    { key:'captains', icon:'🏆', label:'الكباتن' },
    { key:'courses',  icon:'📚', label:'الكورسات' },
    { key:'exercises',icon:'💪', label:'التمارين' },
    { key:'messages', icon:'💬', label:'رسائلي', badge: unread },
  ];

  const lc = { 'مبتدئ':'#22C55E', 'متوسط':'#FF8C00', 'متقدم':'#EF4444' };

  return (
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:'Cairo,sans-serif', direction:'rtl', paddingBottom:90 }}>
      {toast && <Toast message={toast.msg} type={toast.type}/>}
      {showAIChat && <AICoachChat onClose={() => setShowAIChat(false)}/>}

      {/* Header */}
      <header style={{ background:'#fff', borderBottom:`1px solid ${C.border}`, padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:50, boxShadow:C.shadow }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ background:`linear-gradient(135deg,${C.primary},#FF8C00)`, borderRadius:14, width:40, height:40, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>🏋️</div>
          <div>
            <div style={{ fontWeight:900, fontSize:17, color:C.text }}>FitIQ <span style={{ color:C.primary }}>العراق</span></div>
            <div style={{ color:C.textLight, fontSize:10 }}>أهلاً {profile?.full_name?.split(' ')[0]} 👋</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <button onClick={() => setShowAIChat(true)} style={{ background:`linear-gradient(135deg,${C.primary},#FF7340)`, border:'none', borderRadius:12, padding:'8px 12px', color:'#fff', fontWeight:800, fontSize:12, cursor:'pointer', fontFamily:'Cairo,sans-serif', display:'flex', alignItems:'center', gap:5 }}>
            🤖 مدرب AI
          </button>
          <Btn onClick={signOut} variant="ghost" size="sm">خروج</Btn>
        </div>
      </header>

      <main style={{ maxWidth:520, margin:'0 auto', padding:'20px 16px' }}>

        {/* ══ HOME ══ */}
        {tab === 'home' && (
          <div className="fade-in">
            {/* Hero */}
            <div style={{ background:`linear-gradient(135deg,${C.primary} 0%,#FF8C00 55%,${C.secondary} 100%)`, borderRadius:26, padding:'26px 22px', marginBottom:18, position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute',top:-30,right:-30,width:150,height:150,borderRadius:'50%',background:'rgba(255,255,255,0.07)' }}/>
              <div style={{ position:'relative' }}>
                <div style={{ color:'rgba(255,255,255,0.85)', fontSize:12, marginBottom:8 }}>🇮🇶 منصة الفتنس العراقية الأولى</div>
                <h1 style={{ color:'#fff', fontWeight:900, fontSize:24, lineHeight:1.35, marginBottom:10 }}>
                  ابدأ رحلتك<br/>للجسم المثالي ⚡
                </h1>
                <div style={{ display:'flex', gap:10 }}>
                  <button onClick={() => setTab('captains')} style={{ background:'#fff', border:'none', borderRadius:12, padding:'10px 18px', color:C.primary, fontWeight:900, fontSize:13, cursor:'pointer', fontFamily:'Cairo,sans-serif', boxShadow:'0 4px 14px rgba(0,0,0,0.15)' }}>🏆 تواصل مع كابتن</button>
                  <button onClick={() => setTab('exercises')} style={{ background:'rgba(255,255,255,0.18)', border:'1.5px solid rgba(255,255,255,0.35)', borderRadius:12, padding:'10px 16px', color:'#fff', fontWeight:800, fontSize:13, cursor:'pointer', fontFamily:'Cairo,sans-serif' }}>💪 التمارين</button>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:18 }}>
              {[{ icon:'🏆', val:captains.length, label:'كابتن' },{ icon:'📚', val:courses.length, label:'كورس' },{ icon:'✅', val:enrollments.length, label:'اشتراكاتي' }].map((s,i)=>(
                <Card key={i} style={{ padding:'16px 10px', textAlign:'center' }}>
                  <div style={{ fontSize:26, marginBottom:4 }}>{s.icon}</div>
                  <div style={{ color:C.primary, fontWeight:900, fontSize:22 }}>{s.val}</div>
                  <div style={{ color:C.textMuted, fontSize:11 }}>{s.label}</div>
                </Card>
              ))}
            </div>

            {/* Workout Plans */}
            <Card style={{ padding:18, marginBottom:18 }}>
              <SectionHeader title="برامج التدريب" subtitle="اختار البرنامج وابدأ"/>
              {WORKOUT_PLANS.map(plan => (
                <div key={plan.id} style={{ display:'flex', gap:12, alignItems:'center', padding:'12px 0', borderBottom:`1px solid ${C.border}`, cursor:'pointer' }}
                  onClick={() => setActivePlan(plan)}>
                  <div style={{ width:44, height:44, borderRadius:14, background:plan.color+'18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>{plan.icon}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:800, fontSize:14, color:C.text }}>{plan.name}</div>
                    <div style={{ color:C.textMuted, fontSize:12 }}>{plan.days} أيام/أسبوع • {plan.goal}</div>
                  </div>
                  <Badge color={plan.color}>{plan.level}</Badge>
                </div>
              ))}
            </Card>

            {/* AI Coach Banner */}
            <div onClick={() => setShowAIChat(true)} style={{ background:`linear-gradient(135deg,#1A1A2E,#16213E)`, borderRadius:20, padding:'18px 20px', marginBottom:18, cursor:'pointer', display:'flex', alignItems:'center', gap:14, boxShadow:'0 8px 24px rgba(26,26,46,0.2)' }}>
              <div style={{ width:52, height:52, borderRadius:16, background:`linear-gradient(135deg,${C.primary},#FF8C00)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, flexShrink:0 }}>🤖</div>
              <div style={{ flex:1 }}>
                <div style={{ color:'#fff', fontWeight:900, fontSize:15 }}>مدرب AI مجاني ✨</div>
                <div style={{ color:'rgba(255,255,255,0.6)', fontSize:12, marginTop:2 }}>اسأل عن أي تمرين أو تغذية — مجاناً 100%</div>
              </div>
              <div style={{ color:'rgba(255,255,255,0.4)', fontSize:20 }}>←</div>
            </div>

            {/* Top Captains */}
            <Card style={{ padding:18 }}>
              <SectionHeader title="أبرز الكباتن" action={<Btn size="sm" variant="ghost" onClick={()=>setTab('captains')}>الكل ←</Btn>}/>
              {captains.slice(0,3).map(cap => (
                <div key={cap.id} style={{ display:'flex', gap:12, alignItems:'center', padding:'10px 0', borderBottom:`1px solid ${C.border}` }}>
                  <Avatar emoji={cap.profiles?.avatar_emoji||'🏆'} size={44} style={{ background:`linear-gradient(135deg,${C.primary},${C.primaryLight})` }}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:800, fontSize:14 }}>{cap.profiles?.full_name}</div>
                    <Stars rating={cap.rating}/>
                  </div>
                  <Btn size="sm" onClick={()=>startChat(cap)}>💬 تواصل</Btn>
                </div>
              ))}
            </Card>
          </div>
        )}

        {/* ══ CAPTAINS ══ */}
        {tab === 'captains' && (
          <div className="fade-in">
            <SectionHeader title="الكباتن المحترفين" subtitle={`${captains.length} كابتن متاح`}/>

            {captains.length === 0
              ? <Empty icon="🏆" title="لا كباتن متاحين الآن" subtitle="تحقق لاحقاً"/>
              : captains.map(cap => (
                <Card key={cap.id} style={{ marginBottom:16 }}>
                  <div style={{ height:70, background:`linear-gradient(135deg,${C.primary},${C.primaryLight})`, position:'relative' }}>
                    <div style={{ position:'absolute', bottom:-22, right:16 }}>
                      <Avatar emoji={cap.profiles?.avatar_emoji||'🏆'} size={56} style={{ border:'3px solid #fff' }}/>
                    </div>
                  </div>
                  <div style={{ padding:'30px 18px 18px', direction:'rtl' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                      <div>
                        <div style={{ fontWeight:900, fontSize:17 }}>{cap.profiles?.full_name}</div>
                        <div style={{ color:C.textMuted, fontSize:12 }}>📍 {cap.city} — {cap.gym_name}</div>
                      </div>
                      <div style={{ textAlign:'left' }}>
                        <Stars rating={cap.rating}/>
                        <div style={{ color:C.primary, fontWeight:900, fontSize:14, marginTop:2 }}>{cap.price_per_session?.toLocaleString()} د.ع</div>
                      </div>
                    </div>

                    {cap.specialty && <div style={{ color:C.primary, fontSize:12, fontWeight:700, marginBottom:8 }}>🎯 {cap.specialty}</div>}
                    {cap.bio && <p style={{ color:C.textMuted, fontSize:13, lineHeight:1.6, marginBottom:12 }}>{cap.bio}</p>}

                    <div style={{ display:'flex', gap:10 }}>
                      <Btn onClick={() => startChat(cap)} disabled={loading} style={{ flex:1 }}>
                        {loading ? <Spinner size={16} color="#fff"/> : '💬 تواصل معه'}
                      </Btn>
                      <Btn onClick={() => { setSelectedCaptain(cap.id); setTab('courses'); }} variant="secondary" style={{ flex:1 }}>📚 كورساته</Btn>
                    </div>
                  </div>
                </Card>
              ))
            }
          </div>
        )}

        {/* ══ COURSES ══ */}
        {tab === 'courses' && (
          <div className="fade-in">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <div>
                <h2 style={{ color:C.text, fontWeight:900, fontSize:20 }}>الكورسات التدريبية</h2>
                <p style={{ color:C.textMuted, fontSize:13 }}>{courses.filter(c=>!selectedCaptain||c.captain_id===selectedCaptain).length} كورس متاح</p>
              </div>
              {selectedCaptain && <Btn size="sm" variant="ghost" onClick={()=>setSelectedCaptain(null)}>✕ الكل</Btn>}
            </div>

            {/* Filter chips */}
            <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:10, marginBottom:16 }}>
              <button onClick={()=>setSelectedCaptain(null)} style={{ background:!selectedCaptain?`linear-gradient(135deg,${C.primary},${C.primaryLight})`:'#fff', border:!selectedCaptain?'none':`1.5px solid ${C.border}`, borderRadius:12, padding:'7px 14px', cursor:'pointer', color:!selectedCaptain?'#fff':C.textMuted, fontWeight:700, fontSize:12, fontFamily:'Cairo,sans-serif', flexShrink:0 }}>الكل</button>
              {captains.map(cap => (
                <button key={cap.id} onClick={()=>setSelectedCaptain(cap.id)} style={{ background:selectedCaptain===cap.id?`linear-gradient(135deg,${C.primary},${C.primaryLight})`:'#fff', border:selectedCaptain===cap.id?'none':`1.5px solid ${C.border}`, borderRadius:12, padding:'7px 14px', cursor:'pointer', color:selectedCaptain===cap.id?'#fff':C.textMuted, fontWeight:700, fontSize:12, fontFamily:'Cairo,sans-serif', flexShrink:0, whiteSpace:'nowrap' }}>
                  {cap.profiles?.avatar_emoji} {cap.profiles?.full_name?.split(' ')[1]}
                </button>
              ))}
            </div>

            {courses.filter(c => !selectedCaptain || c.captain_id === selectedCaptain).length === 0
              ? <Empty icon="📚" title="لا كورسات متاحة" subtitle="الكباتن سيضيفون كورسات قريباً"/>
              : courses.filter(c => !selectedCaptain || c.captain_id === selectedCaptain).map(course => {
                const cap = captains.find(c => c.id === course.captain_id);
                const isEnrolled = enrollments.includes(course.id);
                return (
                  <Card key={course.id} style={{ marginBottom:14 }}>
                    <div style={{ height:5, background:`linear-gradient(90deg,${C.primary},${C.primaryLight})` }}/>
                    <div style={{ padding:'18px 18px 14px' }}>
                      <div style={{ display:'flex', gap:12, alignItems:'flex-start', marginBottom:10 }}>
                        <div style={{ fontSize:34 }}>{course.icon}</div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:900, fontSize:15, color:C.text, marginBottom:4 }}>{course.title}</div>
                          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                            <Badge color={C.primary}>{course.level}</Badge>
                            <Badge color={C.accent}>{course.duration_weeks} أسبوع</Badge>
                          </div>
                        </div>
                        <div style={{ textAlign:'left', flexShrink:0 }}>
                          <div style={{ color:C.primary, fontWeight:900, fontSize:15 }}>{course.price?.toLocaleString()}</div>
                          <div style={{ color:C.textMuted, fontSize:10 }}>دينار</div>
                        </div>
                      </div>

                      {cap && (
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10, background:C.bgMuted, borderRadius:12, padding:'8px 12px' }}>
                          <Avatar emoji={cap.profiles?.avatar_emoji||'🏆'} size={30} style={{ boxShadow:'none' }}/>
                          <div>
                            <div style={{ fontWeight:700, fontSize:12, color:C.text }}>{cap.profiles?.full_name}</div>
                            <div style={{ color:C.textMuted, fontSize:10 }}>{cap.gym_name}</div>
                          </div>
                        </div>
                      )}

                      <p style={{ color:C.textMuted, fontSize:13, lineHeight:1.6, marginBottom:12 }}>{course.description}</p>

                      {course.includes?.length > 0 && (
                        <div style={{ marginBottom:14 }}>
                          {course.includes.map((inc,i) => (
                            <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
                              <div style={{ width:6, height:6, borderRadius:'50%', background:C.primary, flexShrink:0 }}/>
                              <span style={{ color:C.text, fontSize:12.5 }}>{inc}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div style={{ display:'flex', gap:8 }}>
                        <Btn onClick={() => enroll(course.id, course.title)} variant={isEnrolled?'success':'primary'} style={{ flex:2 }}>
                          {isEnrolled ? '✅ مسجل بالكورس' : '🎓 اشترك الآن'}
                        </Btn>
                        {cap && <Btn onClick={()=>startChat(cap)} variant="secondary" style={{ flex:1 }}>💬 سأل</Btn>}
                      </div>
                    </div>
                  </Card>
                );
              })
            }
          </div>
        )}

        {/* ══ EXERCISES ══ */}
        {tab === 'exercises' && (
          <div className="fade-in">
            <SectionHeader title="مكتبة التمارين"/>
            <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:12, marginBottom:20 }}>
              {MUSCLE_GROUPS.map(m => (
                <button key={m.key} onClick={()=>{setMuscle(m.key);setSelectedEx(null);}} style={{
                  background: selectedMuscle===m.key?`linear-gradient(135deg,${C.primary},${C.primaryLight})`:'#fff',
                  border: selectedMuscle===m.key?'none':`1.5px solid ${C.border}`,
                  borderRadius:14, padding:'8px 14px', cursor:'pointer', whiteSpace:'nowrap',
                  color: selectedMuscle===m.key?'#fff':C.textMuted, fontWeight:700, fontSize:13,
                  boxShadow: selectedMuscle===m.key?`0 4px 14px rgba(255,77,0,0.28)`:C.shadow,
                  fontFamily:'Cairo,sans-serif', flexShrink:0,
                }}>{m.icon} {m.label}</button>
              ))}
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {(EXERCISES_DB[selectedMuscle]||[]).map(ex => {
                const sel=selectedEx?.id===ex.id;
                return (
                  <Card key={ex.id} onClick={()=>setSelectedEx(sel?null:ex)} style={{ padding:16, border:sel?`2px solid ${C.primary}`:undefined, transform:sel?'scale(1.02)':'scale(1)', transition:'all 0.2s', cursor:'pointer' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                      <div style={{ fontSize:28 }}>{ex.icon}</div>
                      <Badge color={lc[ex.level]}>{ex.level}</Badge>
                    </div>
                    <div style={{ fontWeight:800, fontSize:13, color:C.text, marginBottom:3 }}>{ex.name}</div>
                    <div style={{ color:C.textMuted, fontSize:11, marginBottom:8 }}>💪 {ex.muscle}</div>
                    <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                      {[`${ex.sets}×`,ex.reps,`${ex.rest}ث`].map((t,i)=>(
                        <span key={i} style={{ background:C.bgMuted, color:C.textMuted, borderRadius:6, padding:'2px 6px', fontSize:10 }}>{t}</span>
                      ))}
                    </div>
                  </Card>
                );
              })}
            </div>

            {selectedEx && (
              <Card style={{ marginTop:18, padding:22, border:`2px solid rgba(255,77,0,0.15)` }} >
                <div style={{ textAlign:'center', marginBottom:16 }}>
                  <div style={{ fontSize:52 }}>{selectedEx.icon}</div>
                  <h3 style={{ color:C.text, fontWeight:900, fontSize:18, marginBottom:4 }}>{selectedEx.name}</h3>
                  <div style={{ color:C.textMuted, fontSize:12 }}>🏋️ {selectedEx.equipment}</div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:14 }}>
                  {[{l:'السيتات',v:selectedEx.sets},{l:'التكرارات',v:selectedEx.reps},{l:'الراحة',v:`${selectedEx.rest}ث`}].map((s,i)=>(
                    <div key={i} style={{ background:'#FFF5F0', border:`1.5px solid rgba(255,77,0,0.1)`, borderRadius:14, padding:'12px 8px', textAlign:'center' }}>
                      <div style={{ color:C.primary, fontWeight:900, fontSize:18 }}>{s.v}</div>
                      <div style={{ color:C.textMuted, fontSize:10 }}>{s.l}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background:'#FFF5F0', borderRadius:14, padding:'12px 14px', color:C.primary, fontSize:13, lineHeight:1.7 }}>
                  💡 <strong>نصيحة:</strong> {selectedEx.tips}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ══ MESSAGES ══ */}
        {tab === 'messages' && (
          <div className="fade-in">
            <SectionHeader title="رسائلي" subtitle={`${convos.length} محادثة`}/>
            {convos.length === 0
              ? <Empty icon="💬" title="لا رسائل بعد" subtitle="تواصل مع كابتن لتبدأ محادثة" action={<Btn onClick={()=>setTab('captains')}>🏆 عرض الكباتن</Btn>}/>
              : convos.map(c => {
                const capProf = c.captain_profile?.profiles;
                const last = c.messages?.slice(-1)[0];
                const isUnread = last && last.sender_id !== user.id;
                return (
                  <Card key={c.id} onClick={()=>setOpenChat(c)} style={{ padding:16, marginBottom:12, cursor:'pointer', border:isUnread?`2px solid rgba(255,77,0,0.2)`:undefined }}>
                    <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                      <Avatar emoji={capProf?.avatar_emoji||'🏆'} size={50} style={{ background:`linear-gradient(135deg,${C.primary},${C.primaryLight})` }}/>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                          <div style={{ fontWeight:800, fontSize:14 }}>{capProf?.full_name || 'الكابتن'}</div>
                          {isUnread && <Badge color={C.primary}>جديد</Badge>}
                        </div>
                        <div style={{ color:C.textMuted, fontSize:12.5, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {last?.content || '← بدأت محادثة'}
                        </div>
                      </div>
                      <span style={{ color:C.textLight, fontSize:18 }}>←</span>
                    </div>
                  </Card>
                );
              })
            }
          </div>
        )}
      </main>

      <BottomNav tabs={TABS} active={tab} onChange={setTab}/>
    </div>
  );
}
