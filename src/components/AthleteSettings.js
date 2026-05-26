import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useFitnessData } from '../hooks/useFitnessData';
import { C } from '../lib/theme';
import { Btn, Card, Input, Spinner, SectionHeader, Avatar } from './UI';

export default function AthleteSettings({ onToast }) {
  const { profile, signOut, becomeCaptain } = useAuth();
  const { t, language, toggleLanguage, dir } = useLanguage();
  const { CITIES, DEFAULT_CITY } = useFitnessData();
  const [showCaptainForm, setShowCaptainForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    gymName: '', specialty: '', experience: '', pricePerSession: '',
    bio: '', badge: '', city: DEFAULT_CITY,
  });

  useEffect(() => {
    setForm((p) => ({ ...p, city: DEFAULT_CITY }));
  }, [DEFAULT_CITY]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleBecomeCaptain = async () => {
    if (!form.gymName.trim() || !form.specialty.trim()) {
      onToast(t('settings.gymName') + ' & ' + t('settings.specialty'), 'error');
      return;
    }
    setLoading(true);
    try {
      await becomeCaptain(form);
      onToast(t('toast.captainSuccess'), 'success');
    } catch {
      onToast(t('toast.captainFail'), 'error');
    }
    setLoading(false);
  };

  return (
    <div className="fade-in" style={{ direction: dir }}>
      <SectionHeader title={t('settings.title')} />

      <Card style={{ padding: 18, marginBottom: 14 }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: C.text, marginBottom: 4 }}>{t('settings.language')}</div>
        <div style={{ color: C.textMuted, fontSize: 12, marginBottom: 12 }}>{t('settings.languageDesc')}</div>
        <Btn onClick={toggleLanguage} variant="secondary" fullWidth>
          🌐 {language === 'ar' ? 'English' : 'العربية'}
        </Btn>
      </Card>

      <Card style={{ padding: 18, marginBottom: 14 }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: C.text, marginBottom: 12 }}>{t('settings.account')}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <Avatar emoji={profile?.avatar_emoji || '💪'} size={52} />
          <div>
            <div style={{ fontWeight: 900, fontSize: 16 }}>{profile?.full_name}</div>
            <div style={{ color: C.textMuted, fontSize: 12 }}>{t('settings.piAccount')}</div>
            <div style={{ marginTop: 6 }}><Badge color={C.primary}>{t('settings.athlete')}</Badge></div>
          </div>
        </div>
      </Card>

      {profile?.role === 'athlete' && (
        <Card style={{ padding: 18, marginBottom: 14, border: `2px solid ${C.primary}25` }}>
          <div style={{ fontWeight: 900, fontSize: 15, color: C.primary, marginBottom: 6 }}>{t('settings.becomeCaptain')}</div>
          <p style={{ color: C.textMuted, fontSize: 13, lineHeight: 1.6, marginBottom: 14 }}>{t('settings.becomeCaptainDesc')}</p>
          {!showCaptainForm ? (
            <Btn onClick={() => setShowCaptainForm(true)} fullWidth>{t('settings.becomeCaptainBtn')}</Btn>
          ) : (
            <div>
              <p style={{ color: C.textMuted, fontSize: 13, fontWeight: 700, marginBottom: 12 }}>{t('settings.captainFormTitle')}</p>
              <Input label={t('settings.gymName')} value={form.gymName} onChange={(e) => set('gymName', e.target.value)} placeholder={t('settings.gymNamePh')} icon="🏟️" dir={dir} />
              <Input label={t('settings.specialty')} value={form.specialty} onChange={(e) => set('specialty', e.target.value)} placeholder={t('settings.specialtyPh')} icon="🎯" dir={dir} />
              <Input label={t('settings.badge')} value={form.badge} onChange={(e) => set('badge', e.target.value)} placeholder={t('settings.badgePh')} icon="🏅" dir={dir} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Input label={t('settings.experience')} value={form.experience} onChange={(e) => set('experience', e.target.value)} placeholder={t('settings.experiencePh')} type="number" icon="📅" dir={dir} />
                <Input label={t('settings.pricePerSession')} value={form.pricePerSession} onChange={(e) => set('pricePerSession', e.target.value)} placeholder={t('settings.pricePh')} type="number" icon="💰" dir={dir} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', color: C.textMuted, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{t('settings.city')}</label>
                <select value={form.city} onChange={(e) => set('city', e.target.value)} style={{
                  width: '100%', background: C.bgInput, border: `1.5px solid ${C.border}`,
                  borderRadius: 14, padding: '11px 14px', color: C.text, fontSize: 14,
                  fontFamily: 'inherit', outline: 'none', direction: dir,
                }}>
                  {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <Input label={t('settings.bio')} value={form.bio} onChange={(e) => set('bio', e.target.value)} placeholder={t('settings.bioPh')} multiline rows={3} icon="📝" dir={dir} />
              <div style={{ display: 'flex', gap: 10 }}>
                <Btn onClick={() => setShowCaptainForm(false)} variant="secondary" style={{ flex: 1 }}>{t('cancel')}</Btn>
                <Btn onClick={handleBecomeCaptain} disabled={loading} style={{ flex: 2 }}>
                  {loading ? <Spinner size={18} color="#fff" /> : t('settings.submitCaptain')}
                </Btn>
              </div>
            </div>
          )}
        </Card>
      )}

      <Btn onClick={signOut} variant="ghost" fullWidth>🚪 {t('signOut')}</Btn>
    </div>
  );
}
