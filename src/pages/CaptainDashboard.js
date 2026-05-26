import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LEVEL_OPTIONS, levelLabel } from '../i18n/levels';
import { C } from '../lib/theme';
import { Btn, Input, Card, Badge, Avatar, Spinner, Toast, Empty, SectionHeader } from '../components/UI';
import ChatRoom from '../components/ChatRoom';

const ICONS = ['💪', '🔥', '⚡', '🏋️', '🎯', '🦾', '🥊', '🧘', '🏆', '🌟'];

export default function CaptainDashboard() {
  const { user, profile, captain, refreshCaptain, signOut } = useAuth();
  const { t, dir, toggleLanguage } = useLanguage();
  const [tab, setTab] = useState('home');
  const [courses, setCourses] = useState([]);
  const [convos, setConvos] = useState([]);
  const [openChat, setOpenChat] = useState(null);
  const [unread, setUnread] = useState(0);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editCourse, setEditCourse] = useState(null);
  const [cForm, setCForm] = useState({ title: '', description: '', duration_weeks: '', price: '', level: 'beginner', icon: '💪', includes: '' });
  const [editProfile, setEditProfile] = useState(false);
  const [pForm, setPForm] = useState({});

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const loadCourses = useCallback(async () => {
    const { data } = await supabase.from('courses').select('*, enrollments(count)').eq('captain_id', user.id).order('created_at', { ascending: false });
    setCourses(data || []);
  }, [user]);

  const loadConversations = useCallback(async () => {
    const { data } = await supabase
      .from('conversations')
      .select('*, profiles:athlete_id(*), messages(content, created_at, sender_id)')
      .eq('captain_id', user.id)
      .order('created_at', { ascending: false });
    setConvos(data || []);
    const unreadCount = (data || []).reduce((acc, c) => {
      const last = c.messages?.slice(-1)[0];
      return last && last.sender_id !== user.id ? acc + 1 : acc;
    }, 0);
    setUnread(unreadCount);
  }, [user]);

  useEffect(() => {
    if (user) { loadCourses(); loadConversations(); }
  }, [user, loadCourses, loadConversations]);

  useEffect(() => {
    if (!user) return;
    const sub = supabase.channel('captain-msgs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => loadConversations())
      .subscribe();
    return () => sub.unsubscribe();
  }, [user, loadConversations]);

  const saveCourse = async () => {
    setLoading(true);
    const payload = {
      captain_id: user.id,
      title: cForm.title, description: cForm.description,
      duration_weeks: parseInt(cForm.duration_weeks, 10) || 0,
      price: parseInt(cForm.price, 10) || 0,
      level: cForm.level, icon: cForm.icon,
      includes: cForm.includes.split('\n').filter(Boolean),
    };
    if (editCourse) {
      await supabase.from('courses').update(payload).eq('id', editCourse.id);
      showToast(t('toast.courseUpdated'));
    } else {
      await supabase.from('courses').insert(payload);
      showToast(t('toast.courseAdded'));
    }
    setShowCourseForm(false);
    setEditCourse(null);
    setCForm({ title: '', description: '', duration_weeks: '', price: '', level: 'beginner', icon: '💪', includes: '' });
    await loadCourses();
    setLoading(false);
  };

  const deleteCourse = async (id) => {
    if (!window.confirm(t('captain.deleteConfirm'))) return;
    await supabase.from('courses').delete().eq('id', id);
    showToast(t('toast.courseDeleted'), 'error');
    loadCourses();
  };

  const openEdit = (c) => {
    setEditCourse(c);
    setCForm({
      title: c.title, description: c.description, duration_weeks: c.duration_weeks,
      price: c.price, level: c.level, icon: c.icon, includes: (c.includes || []).join('\n'),
    });
    setShowCourseForm(true);
  };

  const saveProfile = async () => {
    setLoading(true);
    await supabase.from('captains').update({
      gym_name: pForm.gym_name, specialty: pForm.specialty,
      bio: pForm.bio, price_per_session: parseInt(pForm.price_per_session, 10),
      available: pForm.available,
    }).eq('id', user.id);
    await refreshCaptain();
    showToast(t('toast.profileUpdated'));
    setEditProfile(false);
    setLoading(false);
  };

  if (openChat) {
    return <ChatRoom conversation={openChat} currentUser={user} profile={profile} onBack={() => { setOpenChat(null); loadConversations(); }} />;
  }

  const tabs = [
    { key: 'home', icon: '🏠', label: t('captainNav.home') },
    { key: 'courses', icon: '📚', label: t('captainNav.courses') },
    { key: 'messages', icon: '💬', label: t('captainNav.messages'), badge: unread },
    { key: 'profile', icon: '👤', label: t('captainNav.profile') },
  ];

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Cairo,sans-serif', direction: dir, paddingBottom: 90 }}>
      {toast && <Toast message={toast.msg} type={toast.type} />}

      <header style={{ background: '#fff', borderBottom: `1px solid ${C.border}`, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50, boxShadow: C.shadow }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar emoji={profile?.avatar_emoji} size={40} />
          <div>
            <div style={{ fontWeight: 900, fontSize: 15 }}>{profile?.full_name}</div>
            <div style={{ color: C.primary, fontSize: 11, fontWeight: 700 }}>{t('captain.dashboard')}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn onClick={toggleLanguage} variant="ghost" size="sm">🌐</Btn>
          <Btn onClick={signOut} variant="ghost" size="sm">{t('signOut')}</Btn>
        </div>
      </header>

      <main style={{ maxWidth: 520, margin: '0 auto', padding: '20px 16px' }}>

        {tab === 'home' && (
          <div className="fade-in">
            <Card style={{ padding: 22, marginBottom: 16, background: `linear-gradient(135deg,${C.primary},${C.primaryLight})` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginBottom: 4 }}>{t('captain.availability')}</div>
                  <div style={{ color: '#fff', fontWeight: 900, fontSize: 18 }}>
                    {captain?.available ? t('captain.available') : t('captain.unavailable')}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4 }}>{captain?.gym_name}</div>
                </div>
                <button type="button" onClick={async () => {
                  await supabase.from('captains').update({ available: !captain?.available }).eq('id', user.id);
                  await refreshCaptain();
                  showToast(t('toast.statusChanged'));
                }} style={{ background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.3)', borderRadius: 12, padding: '8px 14px', color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {t('change')}
                </button>
              </div>
            </Card>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[{ icon: '📚', val: courses.length, label: t('captain.myCourses') }, { icon: '💬', val: convos.length, label: t('captain.chats') }, { icon: '⭐', val: captain?.rating?.toFixed(1) || '5.0', label: t('captain.rating') }].map((s, i) => (
                <Card key={i} style={{ padding: '16px 10px', textAlign: 'center' }}>
                  <div style={{ fontSize: 26, marginBottom: 4 }}>{s.icon}</div>
                  <div style={{ color: C.primary, fontWeight: 900, fontSize: 22 }}>{s.val}</div>
                  <div style={{ color: C.textMuted, fontSize: 11 }}>{s.label}</div>
                </Card>
              ))}
            </div>

            <Card style={{ padding: 18, marginBottom: 16 }}>
              <SectionHeader title={t('captain.recentMessages')} action={<Btn size="sm" variant="ghost" onClick={() => setTab('messages')}>{t('captain.viewAll')}</Btn>} />
              {convos.length === 0
                ? <Empty icon="💬" title={t('captain.noMessages')} subtitle={t('captain.noMessagesSub')} />
                : convos.slice(0, 3).map((c) => {
                  const last = c.messages?.slice(-1)[0];
                  const isUnread = last && last.sender_id !== user.id;
                  return (
                    <div key={c.id} onClick={() => setOpenChat(c)} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${C.border}`, cursor: 'pointer' }}>
                      <Avatar emoji={c.profiles?.avatar_emoji || '🏃'} size={42} style={{ boxShadow: 'none', background: `linear-gradient(135deg,${C.accent},#0080FF)` }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: 14 }}>{c.profiles?.full_name}</div>
                        <div style={{ color: C.textMuted, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {last?.content || t('captain.startedChat')}
                        </div>
                      </div>
                      {isUnread && <div style={{ width: 10, height: 10, borderRadius: '50%', background: C.primary }} />}
                    </div>
                  );
                })}
            </Card>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Btn onClick={() => { setShowCourseForm(true); setTab('courses'); }} fullWidth>{t('captain.newCourse')}</Btn>
              <Btn onClick={() => setTab('profile')} variant="secondary" fullWidth>{t('captain.editProfile')}</Btn>
            </div>
          </div>
        )}

        {tab === 'courses' && (
          <div className="fade-in">
            <SectionHeader title={t('captain.coursesTitle')} subtitle={t('captain.coursesCount', { count: courses.length })} action={
              <Btn size="sm" onClick={() => { setShowCourseForm(true); setEditCourse(null); setCForm({ title: '', description: '', duration_weeks: '', price: '', level: 'beginner', icon: '💪', includes: '' }); }}>
                {t('captain.addCourse')}
              </Btn>
            } />

            {showCourseForm && (
              <Card style={{ padding: 20, marginBottom: 16, border: `2px solid ${C.primary}30` }}>
                <p style={{ color: C.primary, fontWeight: 800, fontSize: 15, marginBottom: 16 }}>
                  {editCourse ? t('captain.editCourse') : t('captain.addCourse')}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                  {ICONS.map((ic) => (
                    <button key={ic} type="button" onClick={() => setCForm((p) => ({ ...p, icon: ic }))} style={{
                      width: 38, height: 38, borderRadius: 10, fontSize: 20,
                      border: `2px solid ${cForm.icon === ic ? C.primary : C.border}`,
                      background: cForm.icon === ic ? '#FFF5F0' : '#fff', cursor: 'pointer',
                    }}>{ic}</button>
                  ))}
                </div>
                <Input label={t('captain.courseTitle')} value={cForm.title} onChange={(e) => setCForm((p) => ({ ...p, title: e.target.value }))} placeholder={t('captain.courseTitlePh')} dir={dir} />
                <Input label={t('captain.courseDesc')} value={cForm.description} onChange={(e) => setCForm((p) => ({ ...p, description: e.target.value }))} placeholder={t('captain.courseDescPh')} multiline rows={3} dir={dir} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <Input label={t('captain.duration')} value={cForm.duration_weeks} onChange={(e) => setCForm((p) => ({ ...p, duration_weeks: e.target.value }))} type="number" dir={dir} />
                  <Input label={t('captain.price')} value={cForm.price} onChange={(e) => setCForm((p) => ({ ...p, price: e.target.value }))} type="number" dir={dir} />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', color: C.textMuted, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{t('captain.level')}</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {LEVEL_OPTIONS.map((l) => (
                      <button key={l} type="button" onClick={() => setCForm((p) => ({ ...p, level: l }))} style={{
                        border: `1.5px solid ${cForm.level === l ? C.primary : C.border}`,
                        borderRadius: 10, padding: '6px 12px', cursor: 'pointer',
                        background: cForm.level === l ? '#FFF5F0' : '#fff',
                        color: cForm.level === l ? C.primary : C.textMuted,
                        fontWeight: 700, fontSize: 12, fontFamily: 'inherit',
                      }}>{levelLabel(l, t)}</button>
                    ))}
                  </div>
                </div>
                <Input label={t('captain.includes')} value={cForm.includes} onChange={(e) => setCForm((p) => ({ ...p, includes: e.target.value }))} placeholder={t('captain.includesPh')} multiline rows={4} dir={dir} />
                <div style={{ display: 'flex', gap: 10 }}>
                  <Btn onClick={() => { setShowCourseForm(false); setEditCourse(null); }} variant="secondary" style={{ flex: 1 }}>{t('cancel')}</Btn>
                  <Btn onClick={saveCourse} disabled={loading} style={{ flex: 2 }}>
                    {loading ? <Spinner size={18} color="#fff" /> : editCourse ? t('captain.saveEdits') : t('captain.publish')}
                  </Btn>
                </div>
              </Card>
            )}

            {courses.length === 0 && !showCourseForm
              ? <Empty icon="📚" title={t('captain.noCourses')} subtitle={t('captain.noCoursesSub')} action={<Btn onClick={() => setShowCourseForm(true)}>{t('captain.addCourseBtn')}</Btn>} />
              : courses.map((c) => (
                <Card key={c.id} style={{ padding: 18, marginBottom: 14 }}>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                    <div style={{ fontSize: 36 }}>{c.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 900, fontSize: 15, marginBottom: 3 }}>{c.title}</div>
                      <Badge color={C.primary}>{levelLabel(c.level, t)}</Badge>
                      <Badge color={C.accent}>{c.duration_weeks} {t('week')}</Badge>
                      <Badge color={C.success}>{t('captain.enrolled', { count: c.enrollments?.[0]?.count || 0 })}</Badge>
                    </div>
                    <div style={{ color: C.primary, fontWeight: 900 }}>{c.price?.toLocaleString()} {t('currencyShort')}</div>
                  </div>
                  <p style={{ color: C.textMuted, fontSize: 13, lineHeight: 1.6, marginBottom: 14 }}>{c.description}</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Btn onClick={() => openEdit(c)} variant="secondary" size="sm" style={{ flex: 1 }}>{t('captain.edit')}</Btn>
                    <Btn onClick={() => deleteCourse(c.id)} variant="danger" size="sm" style={{ flex: 1 }}>{t('captain.delete')}</Btn>
                  </div>
                </Card>
              ))}
          </div>
        )}

        {tab === 'messages' && (
          <div className="fade-in">
            <SectionHeader title={t('captain.athleteMessages')} subtitle={t('messages.subtitle', { count: convos.length })} />
            {convos.length === 0
              ? <Empty icon="💬" title={t('captain.noAthleteMessages')} subtitle={t('captain.noAthleteMessagesSub')} />
              : convos.map((c) => {
                const last = c.messages?.slice(-1)[0];
                const isUnread = last && last.sender_id !== user.id;
                return (
                  <Card key={c.id} onClick={() => setOpenChat(c)} style={{ padding: 16, marginBottom: 12, cursor: 'pointer', border: isUnread ? `2px solid ${C.primary}30` : undefined }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <Avatar emoji={c.profiles?.avatar_emoji || '🏃'} size={48} style={{ background: `linear-gradient(135deg,${C.accent},#0080FF)`, boxShadow: 'none' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                          <div style={{ fontWeight: 800, fontSize: 14 }}>{c.profiles?.full_name}</div>
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

        {tab === 'profile' && (
          <div className="fade-in">
            <SectionHeader title={t('captain.myProfile')} action={
              <Btn size="sm" onClick={() => { setPForm({ ...captain }); setEditProfile(true); }}>✏️ {t('captain.edit')}</Btn>
            } />
            {!editProfile ? (
              <Card style={{ padding: 24 }}>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <Avatar emoji={profile?.avatar_emoji} size={72} style={{ margin: '0 auto 12px' }} />
                  <div style={{ fontWeight: 900, fontSize: 20 }}>{profile?.full_name}</div>
                  <div style={{ color: C.primary, fontSize: 13, fontWeight: 700 }}>{captain?.badge}</div>
                  <div style={{ color: C.textMuted, fontSize: 12, marginTop: 4 }}>📍 {captain?.city} — {captain?.gym_name}</div>
                </div>
                {[
                  [t('captain.specialtyLabel'), captain?.specialty],
                  [t('captain.experienceLabel'), `${captain?.experience_years} ${t('years')}`],
                  [t('captain.sessionPrice'), `${captain?.price_per_session?.toLocaleString()} ${t('currency')}`],
                  [t('captain.phone'), profile?.phone],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ color: C.textMuted, fontSize: 13 }}>{k}</span>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{v || '—'}</span>
                  </div>
                ))}
                {captain?.bio && (
                  <div style={{ marginTop: 16, background: C.bgMuted, borderRadius: 14, padding: '12px 14px', color: C.textMuted, fontSize: 13, lineHeight: 1.7 }}>
                    📝 {captain.bio}
                  </div>
                )}
                <div style={{ marginTop: 20 }}>
                  <Btn onClick={signOut} variant="ghost" fullWidth>🚪 {t('signOut')}</Btn>
                </div>
              </Card>
            ) : (
              <Card style={{ padding: 20 }}>
                <p style={{ color: C.primary, fontWeight: 800, marginBottom: 16 }}>{t('captain.editForm')}</p>
                <Input label={t('captain.gymName')} value={pForm.gym_name || ''} onChange={(e) => setPForm((p) => ({ ...p, gym_name: e.target.value }))} dir={dir} />
                <Input label={t('settings.specialty')} value={pForm.specialty || ''} onChange={(e) => setPForm((p) => ({ ...p, specialty: e.target.value }))} dir={dir} />
                <Input label={t('settings.pricePerSession')} value={pForm.price_per_session || ''} onChange={(e) => setPForm((p) => ({ ...p, price_per_session: e.target.value }))} type="number" dir={dir} />
                <Input label={t('settings.bio')} value={pForm.bio || ''} onChange={(e) => setPForm((p) => ({ ...p, bio: e.target.value }))} multiline rows={3} dir={dir} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <label style={{ color: C.textMuted, fontSize: 13, fontWeight: 700 }}>{t('captain.availableForTraining')}</label>
                  <button type="button" onClick={() => setPForm((p) => ({ ...p, available: !p.available }))} style={{
                    width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
                    background: pForm.available ? C.success : '#D1D5DB', position: 'relative',
                  }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, transition: 'all 0.2s', left: pForm.available ? 25 : 3 }} />
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <Btn onClick={() => setEditProfile(false)} variant="secondary" style={{ flex: 1 }}>{t('cancel')}</Btn>
                  <Btn onClick={saveProfile} disabled={loading} style={{ flex: 2 }}>
                    {loading ? <Spinner size={18} color="#fff" /> : t('save')}
                  </Btn>
                </div>
              </Card>
            )}
          </div>
        )}
      </main>

      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-around', padding: '10px 0 20px', zIndex: 100 }}>
        {tabs.map((tb) => (
          <button key={tb.key} type="button" onClick={() => setTab(tb.key)} style={{
            background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 3, color: tab === tb.key ? C.primary : C.textLight, fontFamily: 'inherit', position: 'relative', cursor: 'pointer',
          }}>
            {tab === tb.key && <div style={{ position: 'absolute', top: -10, width: 28, height: 3, background: `linear-gradient(90deg,${C.primary},${C.primaryLight})`, borderRadius: '0 0 4px 4px' }} />}
            {tb.badge > 0 && <div style={{ position: 'absolute', top: 0, right: 8, background: C.danger, color: '#fff', borderRadius: '50%', width: 16, height: 16, fontSize: 9, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{tb.badge}</div>}
            <span style={{ fontSize: 22 }}>{tb.icon}</span>
            <span style={{ fontSize: 10, fontWeight: tab === tb.key ? 800 : 600 }}>{tb.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
