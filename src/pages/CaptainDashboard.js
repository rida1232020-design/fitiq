import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { C } from '../lib/theme';
import { Btn, Input, Card, Badge, Avatar, Spinner, Toast, Empty, SectionHeader } from '../components/UI';
import ChatRoom from '../components/ChatRoom';

const ICONS = ['💪','🔥','⚡','🏋️','🎯','🦾','🥊','🧘','🏆','🌟'];
const LEVELS = ['مبتدئ','متوسط','متقدم','كل المستويات'];

export default function CaptainDashboard() {
  const { user, profile, captain, refreshCaptain, signOut } = useAuth();
  const [tab, setTab]         = useState('home');
  const [courses, setCourses] = useState([]);
  const [convos, setConvos]   = useState([]);
  const [openChat, setOpenChat] = useState(null);
  const [unread, setUnread]   = useState(0);
  const [toast, setToast]     = useState(null);
  const [loading, setLoading] = useState(false);

  // Course form
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editCourse, setEditCourse] = useState(null);
  const [cForm, setCForm] = useState({ title:'', description:'', duration_weeks:'', price:'', level:'مبتدئ', icon:'💪', includes:'' });

  // Profile edit
  const [editProfile, setEditProfile] = useState(false);
  const [pForm, setPForm] = useState({});

  const showToast = (msg, type='success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

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
    // Count unread (messages not from captain)
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

  /* ── Course CRUD ── */
  const saveCourse = async () => {
    setLoading(true);
    const payload = {
      captain_id: user.id,
      title: cForm.title, description: cForm.description,
      duration_weeks: parseInt(cForm.duration_weeks) || 0,
      price: parseInt(cForm.price) || 0,
      level: cForm.level, icon: cForm.icon,
      includes: cForm.includes.split('\n').filter(Boolean),
    };
    if (editCourse) {
      await supabase.from('courses').update(payload).eq('id', editCourse.id);
      showToast('تم تحديث الكورس ✅');
    } else {
      await supabase.from('courses').insert(payload);
      showToast('تم إضافة الكورس ✅');
    }
    setShowCourseForm(false); setEditCourse(null);
    setCForm({ title:'', description:'', duration_weeks:'', price:'', level:'مبتدئ', icon:'💪', includes:'' });
    await loadCourses(); setLoading(false);
  };

  const deleteCourse = async (id) => {
    if (!window.confirm('تريد تحذف الكورس؟')) return;
    await supabase.from('courses').delete().eq('id', id);
    showToast('تم حذف الكورس', 'error'); loadCourses();
  };

  const openEdit = (c) => {
    setEditCourse(c);
    setCForm({ title:c.title, description:c.description, duration_weeks:c.duration_weeks, price:c.price, level:c.level, icon:c.icon, includes:(c.includes||[]).join('\n') });
    setShowCourseForm(true);
  };

  /* ── Profile Update ── */
  const saveProfile = async () => {
    setLoading(true);
    await supabase.from('captains').update({
      gym_name: pForm.gym_name, specialty: pForm.specialty,
      bio: pForm.bio, price_per_session: parseInt(pForm.price_per_session),
      available: pForm.available,
    }).eq('id', user.id);
    await refreshCaptain();
    showToast('تم تحديث الملف ✅'); setEditProfile(false); setLoading(false);
  };

  if (openChat) {
    return <ChatRoom conversation={openChat} currentUser={user} profile={profile} onBack={() => { setOpenChat(null); loadConversations(); }}/>;
  }

  const tabs = [
    { key:'home', icon:'🏠', label:'الرئيسية' },
    { key:'courses', icon:'📚', label:'كورساتي' },
    { key:'messages', icon:'💬', label:'رسائل', badge: unread },
    { key:'profile', icon:'👤', label:'ملفي' },
  ];

  return (
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:'Cairo,sans-serif', direction:'rtl', paddingBottom:90 }}>
      {toast && <Toast message={toast.msg} type={toast.type}/>}

      {/* Header */}
      <header style={{ background:'#fff', borderBottom:`1px solid ${C.border}`, padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:50, boxShadow:C.shadow }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <Avatar emoji={profile?.avatar_emoji} size={40}/>
          <div>
            <div style={{ fontWeight:900, fontSize:15, color:C.text }}>{profile?.full_name}</div>
            <div style={{ color:C.primary, fontSize:11, fontWeight:700 }}>🏆 لوحة الكابتن</div>
          </div>
        </div>
        <Btn onClick={signOut} variant="ghost" size="sm">خروج</Btn>
      </header>

      <main style={{ maxWidth:520, margin:'0 auto', padding:'20px 16px' }}>

        {/* ══ HOME ══ */}
        {tab === 'home' && (
          <div className="fade-in">
            {/* Status Card */}
            <Card style={{ padding:22, marginBottom:16, background:`linear-gradient(135deg,${C.primary},${C.primaryLight})` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <div style={{ color:'rgba(255,255,255,0.8)', fontSize:12, marginBottom:4 }}>حالة القبول</div>
                  <div style={{ color:'#fff', fontWeight:900, fontSize:18 }}>
                    {captain?.available ? '🟢 متاح للتدريب' : '🔴 غير متاح'}
                  </div>
                  <div style={{ color:'rgba(255,255,255,0.7)', fontSize:12, marginTop:4 }}>{captain?.gym_name}</div>
                </div>
                <button onClick={async () => {
                  await supabase.from('captains').update({ available: !captain?.available }).eq('id', user.id);
                  await refreshCaptain(); showToast('تم تغيير الحالة');
                }} style={{
                  background:'rgba(255,255,255,0.2)', border:'1.5px solid rgba(255,255,255,0.3)',
                  borderRadius:12, padding:'8px 14px', color:'#fff', fontWeight:800,
                  fontSize:13, cursor:'pointer', fontFamily:'Cairo,sans-serif',
                }}>تغيير</button>
              </div>
            </Card>

            {/* Stats */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:20 }}>
              {[
                { icon:'📚', val: courses.length, label:'كورساتي' },
                { icon:'💬', val: convos.length, label:'محادثات' },
                { icon:'⭐', val: captain?.rating?.toFixed(1) || '5.0', label:'التقييم' },
              ].map((s,i) => (
                <Card key={i} style={{ padding:'16px 10px', textAlign:'center' }}>
                  <div style={{ fontSize:26, marginBottom:4 }}>{s.icon}</div>
                  <div style={{ color:C.primary, fontWeight:900, fontSize:22 }}>{s.val}</div>
                  <div style={{ color:C.textMuted, fontSize:11 }}>{s.label}</div>
                </Card>
              ))}
            </div>

            {/* Recent Messages */}
            <Card style={{ padding:18, marginBottom:16 }}>
              <SectionHeader title="آخر الرسائل" action={
                <Btn size="sm" variant="ghost" onClick={() => setTab('messages')}>عرض الكل</Btn>
              }/>
              {convos.length === 0
                ? <Empty icon="💬" title="لا رسائل بعد" subtitle="الرياضيون سيتواصلون معك قريباً"/>
                : convos.slice(0,3).map(c => {
                  const last = c.messages?.slice(-1)[0];
                  const isUnread = last && last.sender_id !== user.id;
                  return (
                    <div key={c.id} onClick={() => setOpenChat(c)} style={{
                      display:'flex', gap:12, alignItems:'center', padding:'12px 0',
                      borderBottom:`1px solid ${C.border}`, cursor:'pointer',
                    }}>
                      <Avatar emoji={c.profiles?.avatar_emoji || '🏃'} size={42} style={{ boxShadow:'none', background:`linear-gradient(135deg,${C.accent},#0080FF)` }}/>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:800, fontSize:14, color:C.text }}>{c.profiles?.full_name}</div>
                        <div style={{ color:C.textMuted, fontSize:12, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {last?.content || 'بدأ محادثة'}
                        </div>
                      </div>
                      {isUnread && <div style={{ width:10, height:10, borderRadius:'50%', background:C.primary, flexShrink:0 }}/>}
                    </div>
                  );
                })
              }
            </Card>

            {/* Quick Actions */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Btn onClick={() => { setShowCourseForm(true); setTab('courses'); }} fullWidth>
                ➕ كورس جديد
              </Btn>
              <Btn onClick={() => setTab('profile')} variant="secondary" fullWidth>
                ✏️ تعديل ملفي
              </Btn>
            </div>
          </div>
        )}

        {/* ══ COURSES ══ */}
        {tab === 'courses' && (
          <div className="fade-in">
            <SectionHeader title="كورساتي" subtitle={`${courses.length} كورس`} action={
              <Btn size="sm" onClick={() => { setShowCourseForm(true); setEditCourse(null); setCForm({ title:'', description:'', duration_weeks:'', price:'', level:'مبتدئ', icon:'💪', includes:'' }); }}>
                ➕ كورس جديد
              </Btn>
            }/>

            {/* Course Form */}
            {showCourseForm && (
              <Card style={{ padding:20, marginBottom:16, border:`2px solid ${C.primary}30` }} >
                <p style={{ color:C.primary, fontWeight:800, fontSize:15, marginBottom:16 }}>
                  {editCourse ? '✏️ تعديل الكورس' : '➕ كورس جديد'}
                </p>

                <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:14 }}>
                  {ICONS.map(ic => (
                    <button key={ic} onClick={() => setCForm(p=>({...p, icon:ic}))} style={{
                      width:38, height:38, borderRadius:10, fontSize:20,
                      border:`2px solid ${cForm.icon===ic ? C.primary : C.border}`,
                      background: cForm.icon===ic ? '#FFF5F0' : '#fff', cursor:'pointer',
                    }}>{ic}</button>
                  ))}
                </div>

                <Input label="عنوان الكورس" value={cForm.title} onChange={e=>setCForm(p=>({...p,title:e.target.value}))} placeholder="مثال: برنامج الضخامة 12 أسبوع"/>
                <Input label="وصف الكورس" value={cForm.description} onChange={e=>setCForm(p=>({...p,description:e.target.value}))} placeholder="وصف مفصل عن الكورس وما سيتعلمه الرياضي..." multiline rows={3}/>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <Input label="المدة (أسابيع)" value={cForm.duration_weeks} onChange={e=>setCForm(p=>({...p,duration_weeks:e.target.value}))} placeholder="12" type="number"/>
                  <Input label="السعر (دينار)" value={cForm.price} onChange={e=>setCForm(p=>({...p,price:e.target.value}))} placeholder="150000" type="number"/>
                </div>

                <div style={{ marginBottom:14 }}>
                  <label style={{ display:'block', color:C.textMuted, fontSize:12, fontWeight:700, marginBottom:6 }}>المستوى</label>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    {LEVELS.map(l => (
                      <button key={l} onClick={() => setCForm(p=>({...p,level:l}))} style={{
                        border:`1.5px solid ${cForm.level===l ? C.primary : C.border}`,
                        borderRadius:10, padding:'6px 12px', cursor:'pointer',
                        background: cForm.level===l ? '#FFF5F0' : '#fff',
                        color: cForm.level===l ? C.primary : C.textMuted,
                        fontWeight:700, fontSize:12, fontFamily:'Cairo,sans-serif',
                      }}>{l}</button>
                    ))}
                  </div>
                </div>

                <Input label="محتويات الكورس (كل سطر عنصر)" value={cForm.includes} onChange={e=>setCForm(p=>({...p,includes:e.target.value}))} placeholder={"فيديوهات شرح التمارين\nخطة غذائية كاملة\nمتابعة أسبوعية\nواتساب مباشر"} multiline rows={4}/>

                <div style={{ display:'flex', gap:10 }}>
                  <Btn onClick={() => { setShowCourseForm(false); setEditCourse(null); }} variant="secondary" style={{ flex:1 }}>إلغاء</Btn>
                  <Btn onClick={saveCourse} disabled={loading} style={{ flex:2 }}>
                    {loading ? <Spinner size={18} color="#fff"/> : editCourse ? '💾 حفظ التعديلات' : '✅ نشر الكورس'}
                  </Btn>
                </div>
              </Card>
            )}

            {courses.length === 0 && !showCourseForm
              ? <Empty icon="📚" title="ما عندك كورسات بعد" subtitle="أضف كورسك الأول وابدأ تدريب الرياضيين" action={<Btn onClick={() => setShowCourseForm(true)}>➕ أضف كورس</Btn>}/>
              : courses.map(c => (
                <Card key={c.id} style={{ padding:18, marginBottom:14 }}>
                  <div style={{ display:'flex', gap:12, alignItems:'flex-start', marginBottom:12 }}>
                    <div style={{ fontSize:36 }}>{c.icon}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:900, fontSize:15, color:C.text, marginBottom:3 }}>{c.title}</div>
                      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                        <Badge color={C.primary}>{c.level}</Badge>
                        <Badge color={C.accent}>{c.duration_weeks} أسبوع</Badge>
                        <Badge color={C.success}>{(c.enrollments?.[0]?.count || 0)} مسجل</Badge>
                      </div>
                    </div>
                    <div style={{ color:C.primary, fontWeight:900, fontSize:15, whiteSpace:'nowrap' }}>
                      {c.price?.toLocaleString()} د.ع
                    </div>
                  </div>
                  <p style={{ color:C.textMuted, fontSize:13, lineHeight:1.6, marginBottom:14 }}>{c.description}</p>
                  <div style={{ display:'flex', gap:8 }}>
                    <Btn onClick={() => openEdit(c)} variant="secondary" size="sm" style={{ flex:1 }}>✏️ تعديل</Btn>
                    <Btn onClick={() => deleteCourse(c.id)} variant="danger" size="sm" style={{ flex:1 }}>🗑️ حذف</Btn>
                  </div>
                </Card>
              ))
            }
          </div>
        )}

        {/* ══ MESSAGES ══ */}
        {tab === 'messages' && (
          <div className="fade-in">
            <SectionHeader title="رسائل الرياضيين" subtitle={`${convos.length} محادثة`}/>
            {convos.length === 0
              ? <Empty icon="💬" title="لا رسائل بعد" subtitle="الرياضيون سيتواصلون معك عبر صفحة الكباتن"/>
              : convos.map(c => {
                const last = c.messages?.slice(-1)[0];
                const isUnread = last && last.sender_id !== user.id;
                return (
                  <Card key={c.id} onClick={() => setOpenChat(c)} style={{ padding:16, marginBottom:12, cursor:'pointer', border: isUnread ? `2px solid ${C.primary}30` : undefined }}>
                    <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                      <Avatar emoji={c.profiles?.avatar_emoji || '🏃'} size={48} style={{ background:`linear-gradient(135deg,${C.accent},#0080FF)`, boxShadow:'none' }}/>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:3 }}>
                          <div style={{ fontWeight:800, fontSize:14 }}>{c.profiles?.full_name}</div>
                          {isUnread && <div style={{ background:C.primary, color:'#fff', borderRadius:20, padding:'2px 8px', fontSize:10, fontWeight:800 }}>جديد</div>}
                        </div>
                        <div style={{ color:C.textMuted, fontSize:12.5, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {last?.content || '← بدأ محادثة'}
                        </div>
                        <div style={{ color:C.textLight, fontSize:11, marginTop:2 }}>{c.profiles?.phone}</div>
                      </div>
                      <span style={{ color:C.textLight, fontSize:18 }}>←</span>
                    </div>
                  </Card>
                );
              })
            }
          </div>
        )}

        {/* ══ PROFILE ══ */}
        {tab === 'profile' && (
          <div className="fade-in">
            <SectionHeader title="ملفي الشخصي" action={
              <Btn size="sm" onClick={() => { setPForm({ ...captain }); setEditProfile(true); }}>✏️ تعديل</Btn>
            }/>

            {!editProfile ? (
              <Card style={{ padding:24 }}>
                <div style={{ textAlign:'center', marginBottom:20 }}>
                  <Avatar emoji={profile?.avatar_emoji} size={72} style={{ margin:'0 auto 12px' }}/>
                  <div style={{ fontWeight:900, fontSize:20, color:C.text }}>{profile?.full_name}</div>
                  <div style={{ color:C.primary, fontSize:13, fontWeight:700 }}>{captain?.badge}</div>
                  <div style={{ color:C.textMuted, fontSize:12, marginTop:4 }}>📍 {captain?.city} — {captain?.gym_name}</div>
                </div>

                {[
                  ['🎯 التخصص', captain?.specialty],
                  ['📅 الخبرة', `${captain?.experience_years} سنة`],
                  ['💰 سعر الجلسة', `${captain?.price_per_session?.toLocaleString()} دينار`],
                  ['📱 الهاتف', profile?.phone],
                ].map(([k,v]) => (
                  <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'12px 0', borderBottom:`1px solid ${C.border}` }}>
                    <span style={{ color:C.textMuted, fontSize:13 }}>{k}</span>
                    <span style={{ color:C.text, fontWeight:700, fontSize:13 }}>{v}</span>
                  </div>
                ))}

                {captain?.bio && (
                  <div style={{ marginTop:16, background:C.bgMuted, borderRadius:14, padding:'12px 14px', color:C.textMuted, fontSize:13, lineHeight:1.7 }}>
                    📝 {captain.bio}
                  </div>
                )}

                <div style={{ marginTop:20 }}>
                  <Btn onClick={signOut} variant="ghost" fullWidth>🚪 تسجيل الخروج</Btn>
                </div>
              </Card>
            ) : (
              <Card style={{ padding:20 }}>
                <p style={{ color:C.primary, fontWeight:800, marginBottom:16 }}>✏️ تعديل الملف</p>
                <Input label="اسم القاعة" value={pForm.gym_name||''} onChange={e=>setPForm(p=>({...p,gym_name:e.target.value}))} icon="🏟️"/>
                <Input label="التخصص" value={pForm.specialty||''} onChange={e=>setPForm(p=>({...p,specialty:e.target.value}))} icon="🎯"/>
                <Input label="السعر (دينار)" value={pForm.price_per_session||''} onChange={e=>setPForm(p=>({...p,price_per_session:e.target.value}))} type="number" icon="💰"/>
                <Input label="نبذة" value={pForm.bio||''} onChange={e=>setPForm(p=>({...p,bio:e.target.value}))} multiline rows={3}/>

                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                  <label style={{ color:C.textMuted, fontSize:13, fontWeight:700 }}>متاح للتدريب:</label>
                  <button onClick={() => setPForm(p=>({...p,available:!p.available}))} style={{
                    width:48, height:26, borderRadius:13, border:'none', cursor:'pointer',
                    background: pForm.available ? C.success : '#D1D5DB', transition:'all 0.2s',
                    position:'relative',
                  }}>
                    <div style={{ width:20, height:20, borderRadius:'50%', background:'#fff', position:'absolute', top:3, transition:'all 0.2s', left: pForm.available ? 25 : 3 }}/>
                  </button>
                </div>

                <div style={{ display:'flex', gap:10 }}>
                  <Btn onClick={() => setEditProfile(false)} variant="secondary" style={{ flex:1 }}>إلغاء</Btn>
                  <Btn onClick={saveProfile} disabled={loading} style={{ flex:2 }}>
                    {loading ? <Spinner size={18} color="#fff"/> : '💾 حفظ'}
                  </Btn>
                </div>
              </Card>
            )}
          </div>
        )}
      </main>

      {/* Bottom Nav */}
      <nav style={{ position:'fixed', bottom:0, left:0, right:0, background:'#fff', borderTop:`1px solid ${C.border}`, display:'flex', justifyContent:'space-around', padding:'10px 0 20px', zIndex:100, boxShadow:'0 -4px 20px rgba(26,26,46,0.07)' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            background:'none', border:'none', display:'flex', flexDirection:'column', alignItems:'center',
            gap:3, padding:'4px 14px', color: tab===t.key ? C.primary : C.textLight,
            fontFamily:'Cairo,sans-serif', position:'relative', cursor:'pointer',
          }}>
            {tab===t.key && <div style={{ position:'absolute', top:-10, width:28, height:3, background:`linear-gradient(90deg,${C.primary},${C.primaryLight})`, borderRadius:'0 0 4px 4px' }}/>}
            {t.badge > 0 && <div style={{ position:'absolute', top:0, right:8, background:C.danger, color:'#fff', borderRadius:'50%', width:16, height:16, fontSize:9, fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center' }}>{t.badge}</div>}
            <span style={{ fontSize:22 }}>{t.icon}</span>
            <span style={{ fontSize:10, fontWeight: tab===t.key ? 800 : 600 }}>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
