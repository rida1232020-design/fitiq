import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useFitnessData } from '../hooks/useFitnessData';
import { LEVEL_COLORS } from '../i18n/exercisesData';
import { levelLabel } from '../i18n/levels';
import { C } from '../lib/theme';
import { Btn, Card, Badge } from './UI';

export default function WorkoutSession({ plan, onClose }) {
  const { t, dir } = useLanguage();
  const { EXERCISES_DB } = useFitnessData();
  const allEx = plan.schedule.flatMap((d) => d.muscles.flatMap((m) => (EXERCISES_DB[m] || []).slice(0, 2))).slice(0, 8);
  const [idx, setIdx] = useState(0);
  const [set, setSet] = useState(1);
  const [rest, setRest] = useState(false);
  const [tLeft, setTLeft] = useState(0);
  const [done, setDone] = useState({});
  const cur = allEx[idx];
  const prog = Math.round(((idx * 4 + set - 1) / (allEx.length * 4)) * 100);

  useEffect(() => {
    if (!rest) return;
    if (tLeft <= 0) { setRest(false); return; }
    const timer = setTimeout(() => setTLeft((p) => p - 1), 1000);
    return () => clearTimeout(timer);
  }, [rest, tLeft]);

  const completeSet = () => {
    setDone((p) => ({ ...p, [`${cur.id}-${set}`]: true }));
    if (set < cur.sets) { setSet((s) => s + 1); setTLeft(cur.rest); setRest(true); }
    else if (idx < allEx.length - 1) { setIdx((i) => i + 1); setSet(1); setRest(false); }
    else onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: C.bg, zIndex: 200, overflow: 'auto', direction: dir, fontFamily: 'Cairo,sans-serif' }}>
      <div style={{ background: '#fff', borderBottom: `1px solid ${C.border}`, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0 }}>
        <button type="button" onClick={onClose} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#EF4444', borderRadius: 10, padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 800, fontSize: 13 }}>{t('workout.end')}</button>
        <div style={{ fontWeight: 800, fontSize: 15, color: C.text }}>{plan.name}</div>
        <Badge color={plan.color}>{idx + 1}/{allEx.length}</Badge>
      </div>
      <div style={{ height: 4, background: '#F0EDE8' }}>
        <div style={{ height: '100%', width: `${prog}%`, background: `linear-gradient(90deg,${plan.color},${C.secondary})`, transition: 'width 0.5s' }} />
      </div>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 16px' }}>
        {cur && (
          <>
            <Card style={{ padding: 26, textAlign: 'center', marginBottom: 18 }}>
              <div style={{ fontSize: 68, marginBottom: 12 }}>{cur.icon}</div>
              <h2 style={{ color: C.text, fontSize: 22, fontWeight: 900, marginBottom: 4 }}>{cur.name}</h2>
              <div style={{ color: C.textMuted, fontSize: 13, marginBottom: 10 }}>💪 {cur.muscle} • 🏋️ {cur.equipment}</div>
              <Badge color={LEVEL_COLORS[cur.level]}>{levelLabel(cur.level, t)}</Badge>
              <div style={{ marginTop: 16, background: '#FFF5F0', border: '1.5px solid rgba(255,77,0,0.12)', borderRadius: 14, padding: '12px 14px', color: C.primary, fontSize: 13, lineHeight: 1.7 }}>
                💡 {cur.tips}
              </div>
            </Card>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 18 }}>
              {[{ l: t('exercises.sets'), v: cur.sets }, { l: t('exercises.reps'), v: cur.reps }, { l: t('exercises.rest'), v: `${cur.rest}${t('sec')}` }].map((s, i) => (
                <Card key={i} style={{ padding: '14px 8px', textAlign: 'center' }}>
                  <div style={{ color: C.primary, fontWeight: 900, fontSize: 18 }}>{s.v}</div>
                  <div style={{ color: C.textMuted, fontSize: 10 }}>{s.l}</div>
                </Card>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 18 }}>
              {Array.from({ length: cur.sets }, (_, i) => {
                const isDone = done[`${cur.id}-${i + 1}`];
                const isAct = i + 1 === set;
                return (
                  <div key={i} style={{
                    width: 46, height: 46, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 900, fontSize: 16, background: isDone ? 'linear-gradient(135deg,#22C55E,#16A34A)' : isAct ? `linear-gradient(135deg,${C.primary},${C.primaryLight})` : '#F0EDE8',
                    color: (isDone || isAct) ? '#fff' : C.textMuted,
                  }}>{isDone ? '✓' : i + 1}</div>
                );
              })}
            </div>
            {rest ? (
              <Card style={{ padding: 22, textAlign: 'center', marginBottom: 16 }}>
                <div style={{ color: C.textMuted, fontSize: 13, marginBottom: 6 }}>{t('workout.restTime')}</div>
                <div style={{ fontSize: 56, fontWeight: 900, color: tLeft > 30 ? '#22C55E' : tLeft > 10 ? '#FF8C00' : '#EF4444' }}>{tLeft}s</div>
                <button type="button" onClick={() => { setRest(false); setTLeft(0); }} style={{ marginTop: 10, background: '#F0EDE8', border: 'none', color: C.textMuted, borderRadius: 10, padding: '8px 16px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>{t('skip')}</button>
              </Card>
            ) : (
              <Btn onClick={completeSet} fullWidth size="lg">
                {set < cur.sets ? t('workout.setDone', { n: set }) : idx < allEx.length - 1 ? t('workout.nextEx') : t('workout.finish')}
              </Btn>
            )}
          </>
        )}
      </div>
    </div>
  );
}
