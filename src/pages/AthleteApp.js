import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useFitnessData } from '../hooks/useFitnessData';
import { API_URL } from '../lib/api';
import { LEVEL_COLORS } from '../i18n/exercisesData';
import { levelLabel } from '../i18n/levels';
import { C } from '../lib/theme';
import { Btn, Card, Badge, Avatar, Spinner, Toast, Empty, Stars, SectionHeader, BottomNav } from '../components/UI';
import ChatRoom from '../components/ChatRoom';
import AICoachChat from '../components/AICoachChat';
import WorkoutSession from '../components/WorkoutSession';
import AthleteSettings from '../components/AthleteSettings';

export default function AthleteApp() {
  const { user, profile } = useAuth();
  const { t, dir } = useLanguage();
  const { EXERCISES_DB, MUSCLE_GROUPS, WORKOUT_PLANS } = useFitnessData();

  const [tab, setTab] = useState('home');
  const [captains, setCaptains] = useState([]);
  const [courses, setCourses] = useState([]);
  const [convos, setConvos] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [openChat, setOpenChat] = useState(null);
  const [activePlan, setActivePlan] = useState(null);
  const [selectedMuscle, setMuscle] = useState('chest');
  const [selectedEx, setSelectedEx] = useState(null);
  const [selectedCaptain, setSelectedCaptain] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [unread, setUnread] = useState(0);
  const [showAIChat, setShowAIChat] = useState(false);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

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
    setEnrollments((enr || []).map((e) => e.course_id));
    const u = (cvs || []).filter((c) => { const last = c.messages?.slice(-1)[0]; return last && last.sender_id !== user.id; }).length;
    setUnread(u);
  }, [user]);

  useEffect(() => { if (user) loadData(); }, [user, loadData]);

  useEffect(() => {
    if (!user) return;
    const sub = supabase.channel('athlete-msgs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => loadData())
      .subscribe();
    return () => sub.unsubscribe();
  }, [user, loadData]);

  const startChat = async (captain) => {
    setLoading(true);
    let convo = convos.find((c) => c.captain_id === captain.id || c.captain_profile?.id === captain.id);
    if (!convo) {
      const { data } = await supabase.from('conversations').insert({ athlete_id: user.id, captain_id: captain.id }).select('*').single();
      convo = data;
      await loadData();
    }
    const { data: full } = await supabase
      .from('conversations').select('*, captain_profile:captain_id(id, profiles(full_name,avatar_emoji)), profiles:athlete_id(full_name,avatar_emoji), messages(content,sender_id,created_at)')
      .eq('id', convo.id).single();
    setOpenChat(full);
    setLoading(false);
  };

  const enroll = async (courseId, courseTitle) => {
    if (enrollments.includes(courseId)) {
      showToast(t('toast.alreadyEnrolled'), 'info');
      return;
    }
    const course = courses.find((c) => c.id === courseId);
    if (!course) return;

    if (!course.price || course.price === 0) {
      setLoading(true);
      try {
        await supabase.from('enrollments').insert({ athlete_id: user.id, course_id: courseId });
        setEnrollments((p) => [...p, courseId]);
        showToast(t('toast.freeEnrollOk', { title: courseTitle }));
      } catch {
        showToast(t('toast.freeEnrollFail'), 'error');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!window.Pi) {
      setLoading(true);
      try {
        const mockPaymentId = `mock-pay-${Date.now()}`;
        const mockTxid = `mock-tx-${Date.now()}`;
        const response = await fetch(`${API_URL}/api/payments/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId: mockPaymentId, txid: mockTxid, courseId, athleteId: user.id }),
        });
        if (response.ok) {
          setEnrollments((p) => [...p, courseId]);
          showToast(t('toast.sandboxEnrollOk', { title: courseTitle }));
        } else throw new Error('fail');
      } catch {
        showToast(t('toast.sandboxEnrollFail'), 'error');
      } finally {
        setLoading(false);
      }
      return;
    }

    const piAmount = Math.max(1, Math.round(course.price / 10000));
    try {
      setLoading(true);
      showToast(t('toast.paymentStarting'), 'info');
      await window.Pi.createPayment({
        amount: piAmount,
        memo: `${courseTitle}`,
        metadata: { courseId, athleteId: user.id },
      }, {
        onReadyForServerApproval: async (paymentId) => {
          try {
            const res = await fetch(`${API_URL}/api/payments/approve`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paymentId }),
            });
            if (!res.ok) throw new Error('approve fail');
          } catch {
            showToast(t('toast.paymentApproveFail'), 'error');
          }
        },
        onReadyForServerCompletion: async (paymentId, txid) => {
          try {
            const res = await fetch(`${API_URL}/api/payments/complete`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paymentId, txid, courseId, athleteId: user.id }),
            });
            if (!res.ok) throw new Error('complete fail');
            setEnrollments((p) => [...p, courseId]);
            showToast(t('toast.paymentCompleteOk'));
          } catch {
            showToast(t('toast.paymentCompleteFail'), 'error');
          } finally {
            setLoading(false);
          }
        },
        onCancel: () => { showToast(t('toast.paymentCancelled'), 'info'); setLoading(false); },
        onError: () => { showToast(t('toast.paymentError'), 'error'); setLoading(false); },
      });
    } catch {
      showToast(t('toast.paymentStartFail'), 'error');
      setLoading(false);
    }
  };

  if (activePlan) return <WorkoutSession plan={activePlan} onClose={() => setActivePlan(null)} />;
  if (openChat) return <ChatRoom conversation={openChat} currentUser={user} profile={profile} onBack={() => { setOpenChat(null); loadData(); }} />;

  const TABS = [
    { key: 'home', icon: '🏠', label: t('nav.home') },
    { key: 'captains', icon: '🏆', label: t('nav.captains') },
    { key: 'courses', icon: '📚', label: t('nav.courses') },
    { key: 'exercises', icon: '💪', label: t('nav.exercises') },
    { key: 'messages', icon: '💬', label: t('nav.messages'), badge: unread },
    { key: 'settings', icon: '⚙️', label: t('nav.settings') },
  ];

  const filteredCourses = courses.filter((c) => !selectedCaptain || c.captain_id === selectedCaptain);

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Cairo,sans-serif', direction: dir, paddingBottom: 90 }}>
      {toast && <Toast message={toast.msg} type={toast.type} />}
      {showAIChat && <AICoachChat onClose={() => setShowAIChat(false)} />}

      <header style={{ background: '#fff', borderBottom: `1px solid ${C.border}`, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50, boxShadow: C.shadow }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: `linear-gradient(135deg,${C.primary},#FF8C00)`, borderRadius: 14, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🏋️</div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 17, color: C.text }}>
              FitIQ <span style={{ color: C.primary }}>{t('appNameShort')}</span>
            </div>
            <div style={{ color: C.textLight, fontSize: 10 }}>{t('hello')} {profile?.full_name?.split(' ')[0]} 👋</div>
          </div>
        </div>
        <button type="button" onClick={() => setShowAIChat(true)} style={{ background: `linear-gradient(135deg,${C.primary},#FF7340)`, border: 'none', borderRadius: 12, padding: '8px 12px', color: '#fff', fontWeight: 800, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
          {t('home.aiCoachBtn')}
        </button>
      </header>

      <main style={{ maxWidth: 520, margin: '0 auto', padding: '20px 16px' }}>

        {tab === 'home' && (
          <div className="fade-in">
            <div style={{ background: `linear-gradient(135deg,${C.primary} 0%,#FF8C00 55%,${C.secondary} 100%)`, borderRadius: 26, padding: '26px 22px', marginBottom: 18, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'relative' }}>
                <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, marginBottom: 8 }}>{t('home.heroBadge')}</div>
                <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 24, lineHeight: 1.35, marginBottom: 10, whiteSpace: 'pre-line' }}>{t('home.heroTitle')}</h1>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => setTab('captains')} style={{ background: '#fff', border: 'none', borderRadius: 12, padding: '10px 18px', color: C.primary, fontWeight: 900, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>{t('home.contactCaptain')}</button>
                  <button type="button" onClick={() => setTab('exercises')} style={{ background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.35)', borderRadius: 12, padding: '10px 16px', color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>{t('home.exercisesBtn')}</button>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 18 }}>
              {[{ icon: '🏆', val: captains.length, label: t('home.captainsStat') }, { icon: '📚', val: courses.length, label: t('home.coursesStat') }, { icon: '✅', val: enrollments.length, label: t('home.enrollmentsStat') }].map((s, i) => (
                <Card key={i} style={{ padding: '16px 10px', textAlign: 'center' }}>
                  <div style={{ fontSize: 26, marginBottom: 4 }}>{s.icon}</div>
                  <div style={{ color: C.primary, fontWeight: 900, fontSize: 22 }}>{s.val}</div>
                  <div style={{ color: C.textMuted, fontSize: 11 }}>{s.label}</div>
                </Card>
              ))}
            </div>

            <Card style={{ padding: 18, marginBottom: 18 }}>
              <SectionHeader title={t('home.workoutPlans')} subtitle={t('home.workoutPlansSub')} />
              {WORKOUT_PLANS.map((plan) => (
                <div key={plan.id} onClick={() => setActivePlan(plan)} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${C.border}`, cursor: 'pointer' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: plan.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{plan.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>{plan.name}</div>
                    <div style={{ color: C.textMuted, fontSize: 12 }}>{plan.days} {t('daysPerWeek')} • {plan.goal}</div>
                  </div>
                  <Badge color={LEVEL_COLORS[plan.level]}>{levelLabel(plan.level, t)}</Badge>
                </div>
              ))}
            </Card>

            <div onClick={() => setShowAIChat(true)} style={{ background: 'linear-gradient(135deg,#1A1A2E,#16213E)', borderRadius: 20, padding: '18px 20px', marginBottom: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: `linear-gradient(135deg,${C.primary},#FF8C00)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>🤖</div>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#fff', fontWeight: 900, fontSize: 15 }}>{t('home.aiCoachTitle')}</div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 }}>{t('home.aiCoachSub')}</div>
              </div>
            </div>

            <Card style={{ padding: 18 }}>
              <SectionHeader title={t('home.topCaptains')} action={<Btn size="sm" variant="ghost" onClick={() => setTab('captains')}>{t('all')} ←</Btn>} />
              {captains.slice(0, 3).map((cap) => (
                <div key={cap.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
                  <Avatar emoji={cap.profiles?.avatar_emoji || '🏆'} size={44} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>{cap.profiles?.full_name}</div>
                    <Stars rating={cap.rating} />
                  </div>
                  <Btn size="sm" onClick={() => startChat(cap)}>{t('captains.chat')}</Btn>
                </div>
              ))}
            </Card>
          </div>
        )}

        {tab === 'captains' && (
          <div className="fade-in">
            <SectionHeader title={t('captains.title')} subtitle={t('captains.subtitle', { count: captains.length })} />
            {captains.length === 0
              ? <Empty icon="🏆" title={t('captains.emptyTitle')} subtitle={t('captains.emptySub')} />
              : captains.map((cap) => (
                <Card key={cap.id} style={{ marginBottom: 16 }}>
                  <div style={{ height: 70, background: `linear-gradient(135deg,${C.primary},${C.primaryLight})`, position: 'relative' }}>
                    <div style={{ position: 'absolute', bottom: -22, [dir === 'rtl' ? 'right' : 'left']: 16 }}>
                      <Avatar emoji={cap.profiles?.avatar_emoji || '🏆'} size={56} style={{ border: '3px solid #fff' }} />
                    </div>
                  </div>
                  <div style={{ padding: '30px 18px 18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontWeight: 900, fontSize: 17 }}>{cap.profiles?.full_name}</div>
                        <div style={{ color: C.textMuted, fontSize: 12 }}>📍 {cap.city} — {cap.gym_name}</div>
                      </div>
                      <div>
                        <Stars rating={cap.rating} />
                        <div style={{ color: C.primary, fontWeight: 900, fontSize: 14 }}>{cap.price_per_session?.toLocaleString()} {t('currencyShort')}</div>
                      </div>
                    </div>
                    {cap.specialty && <div style={{ color: C.primary, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>🎯 {cap.specialty}</div>}
                    {cap.bio && <p style={{ color: C.textMuted, fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>{cap.bio}</p>}
                    <div style={{ display: 'flex', gap: 10 }}>
                      <Btn onClick={() => startChat(cap)} disabled={loading} style={{ flex: 1 }}>{loading ? <Spinner size={16} color="#fff" /> : t('captains.contact')}</Btn>
                      <Btn onClick={() => { setSelectedCaptain(cap.id); setTab('courses'); }} variant="secondary" style={{ flex: 1 }}>{t('captains.hisCourses')}</Btn>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        )}

        {tab === 'courses' && (
          <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontWeight: 900, fontSize: 20 }}>{t('courses.title')}</h2>
                <p style={{ color: C.textMuted, fontSize: 13 }}>{t('courses.subtitle', { count: filteredCourses.length })}</p>
              </div>
              {selectedCaptain && <Btn size="sm" variant="ghost" onClick={() => setSelectedCaptain(null)}>✕ {t('all')}</Btn>}
            </div>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 10, marginBottom: 16 }}>
              <button type="button" onClick={() => setSelectedCaptain(null)} style={{ background: !selectedCaptain ? `linear-gradient(135deg,${C.primary},${C.primaryLight})` : '#fff', border: !selectedCaptain ? 'none' : `1.5px solid ${C.border}`, borderRadius: 12, padding: '7px 14px', color: !selectedCaptain ? '#fff' : C.textMuted, fontWeight: 700, fontSize: 12, fontFamily: 'inherit', flexShrink: 0 }}>{t('all')}</button>
              {captains.map((cap) => (
                <button key={cap.id} type="button" onClick={() => setSelectedCaptain(cap.id)} style={{ background: selectedCaptain === cap.id ? `linear-gradient(135deg,${C.primary},${C.primaryLight})` : '#fff', border: selectedCaptain === cap.id ? 'none' : `1.5px solid ${C.border}`, borderRadius: 12, padding: '7px 14px', color: selectedCaptain === cap.id ? '#fff' : C.textMuted, fontWeight: 700, fontSize: 12, fontFamily: 'inherit', flexShrink: 0, whiteSpace: 'nowrap' }}>
                  {cap.profiles?.avatar_emoji} {cap.profiles?.full_name?.split(' ')[1]}
                </button>
              ))}
            </div>
            {filteredCourses.length === 0
              ? <Empty icon="📚" title={t('courses.emptyTitle')} subtitle={t('courses.emptySub')} />
              : filteredCourses.map((course) => {
                const cap = captains.find((c) => c.id === course.captain_id);
                const isEnrolled = enrollments.includes(course.id);
                return (
                  <Card key={course.id} style={{ marginBottom: 14 }}>
                    <div style={{ padding: '18px' }}>
                      <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                        <div style={{ fontSize: 34 }}>{course.icon}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 900, fontSize: 15, marginBottom: 4 }}>{course.title}</div>
                          <Badge color={C.primary}>{levelLabel(course.level, t)}</Badge>
                          <Badge color={C.accent}>{course.duration_weeks} {t('week')}</Badge>
                        </div>
                        <div style={{ textAlign: dir === 'rtl' ? 'left' : 'right' }}>
                          <div style={{ color: C.primary, fontWeight: 900 }}>{course.price?.toLocaleString()}</div>
                          <div style={{ color: C.textMuted, fontSize: 10 }}>{t('currency')}</div>
                        </div>
                      </div>
                      {cap && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, background: C.bgMuted, borderRadius: 12, padding: '8px 12px' }}>
                          <Avatar emoji={cap.profiles?.avatar_emoji || '🏆'} size={30} style={{ boxShadow: 'none' }} />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 12 }}>{cap.profiles?.full_name}</div>
                            <div style={{ color: C.textMuted, fontSize: 10 }}>{cap.gym_name}</div>
                          </div>
                        </div>
                      )}
                      <p style={{ color: C.textMuted, fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>{course.description}</p>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Btn onClick={() => enroll(course.id, course.title)} variant={isEnrolled ? 'success' : 'primary'} style={{ flex: 2 }}>
                          {isEnrolled ? t('courses.enrolled') : t('courses.enroll')}
                        </Btn>
                        {cap && <Btn onClick={() => startChat(cap)} variant="secondary" style={{ flex: 1 }}>{t('courses.ask')}</Btn>}
                      </div>
                    </div>
                  </Card>
                );
              })}
          </div>
        )}

        {tab === 'exercises' && (
          <div className="fade-in">
            <SectionHeader title={t('exercises.title')} />
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, marginBottom: 20 }}>
              {MUSCLE_GROUPS.map((m) => (
                <button key={m.key} type="button" onClick={() => { setMuscle(m.key); setSelectedEx(null); }} style={{
                  background: selectedMuscle === m.key ? `linear-gradient(135deg,${C.primary},${C.primaryLight})` : '#fff',
                  border: selectedMuscle === m.key ? 'none' : `1.5px solid ${C.border}`,
                  borderRadius: 14, padding: '8px 14px', color: selectedMuscle === m.key ? '#fff' : C.textMuted,
                  fontWeight: 700, fontSize: 13, fontFamily: 'inherit', flexShrink: 0,
                }}>{m.icon} {m.label}</button>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {(EXERCISES_DB[selectedMuscle] || []).map((ex) => {
                const sel = selectedEx?.id === ex.id;
                return (
                  <Card key={ex.id} onClick={() => setSelectedEx(sel ? null : ex)} style={{ padding: 16, border: sel ? `2px solid ${C.primary}` : undefined, cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ fontSize: 28 }}>{ex.icon}</div>
                      <Badge color={LEVEL_COLORS[ex.level]}>{levelLabel(ex.level, t)}</Badge>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 3 }}>{ex.name}</div>
                    <div style={{ color: C.textMuted, fontSize: 11 }}>💪 {ex.muscle}</div>
                  </Card>
                );
              })}
            </div>
            {selectedEx && (
              <Card style={{ marginTop: 18, padding: 22 }}>
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: 52 }}>{selectedEx.icon}</div>
                  <h3 style={{ fontWeight: 900, fontSize: 18 }}>{selectedEx.name}</h3>
                  <div style={{ color: C.textMuted, fontSize: 12 }}>🏋️ {selectedEx.equipment}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
                  {[{ l: t('exercises.sets'), v: selectedEx.sets }, { l: t('exercises.reps'), v: selectedEx.reps }, { l: t('exercises.rest'), v: `${selectedEx.rest}${t('sec')}` }].map((s, i) => (
                    <div key={i} style={{ background: '#FFF5F0', borderRadius: 14, padding: '12px 8px', textAlign: 'center' }}>
                      <div style={{ color: C.primary, fontWeight: 900, fontSize: 18 }}>{s.v}</div>
                      <div style={{ color: C.textMuted, fontSize: 10 }}>{s.l}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: '#FFF5F0', borderRadius: 14, padding: '12px 14px', color: C.primary, fontSize: 13, lineHeight: 1.7 }}>
                  💡 <strong>{t('tip')}:</strong> {selectedEx.tips}
                </div>
              </Card>
            )}
          </div>
        )}

        {tab === 'messages' && (
          <div className="fade-in">
            <SectionHeader title={t('messages.title')} subtitle={t('messages.subtitle', { count: convos.length })} />
            {convos.length === 0
              ? <Empty icon="💬" title={t('messages.emptyTitle')} subtitle={t('messages.emptySub')} action={<Btn onClick={() => setTab('captains')}>{t('messages.emptyAction')}</Btn>} />
              : convos.map((c) => {
                const capProf = c.captain_profile?.profiles;
                const last = c.messages?.slice(-1)[0];
                const isUnread = last && last.sender_id !== user.id;
                return (
                  <Card key={c.id} onClick={() => setOpenChat(c)} style={{ padding: 16, marginBottom: 12, cursor: 'pointer', border: isUnread ? `2px solid rgba(255,77,0,0.2)` : undefined }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <Avatar emoji={capProf?.avatar_emoji || '🏆'} size={50} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                          <div style={{ fontWeight: 800, fontSize: 14 }}>{capProf?.full_name || t('messages.captainDefault')}</div>
                          {isUnread && <Badge color={C.primary}>{t('new')}</Badge>}
                        </div>
                        <div style={{ color: C.textMuted, fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {last?.content || t('messages.started')}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
          </div>
        )}

        {tab === 'settings' && <AthleteSettings onToast={showToast} />}
      </main>

      <BottomNav tabs={TABS} active={tab} onChange={setTab} />
    </div>
  );
}
