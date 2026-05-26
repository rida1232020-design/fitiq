import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { C } from '../lib/theme';
import { Btn, Spinner } from '../components/UI';

export default function AuthPage() {
  const { signInWithPi } = useAuth();
  const { t, toggleLanguage, dir } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const handlePiLogin = async () => {
    setErr('');
    if (!window.Pi) {
      setErr(t('piSdkMissing'));
      return;
    }
    setLoading(true);
    const result = await signInWithPi(false);
    if (result?.error) setErr(result.error);
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', direction: dir, fontFamily: 'Cairo,sans-serif' }}>
      <div style={{
        background: `linear-gradient(135deg,${C.primary} 0%,#FF8C00 60%,${C.secondary} 100%)`,
        padding: '40px 24px 50px', textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        <button
          type="button"
          onClick={toggleLanguage}
          style={{
            position: 'absolute', top: 16,
            ...(dir === 'rtl' ? { left: 16 } : { right: 16 }),
            background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)',
            borderRadius: 20, padding: '6px 14px', color: '#fff', fontWeight: 700,
            fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          {t('langSwitch')}
        </button>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
        <div style={{ position: 'absolute', bottom: -30, left: -30, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 56, marginBottom: 10 }}>🏋️</div>
          <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 28, marginBottom: 4 }}>{t('appName')}</h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>{t('appTagline')}</p>
        </div>
      </div>

      <div style={{
        flex: 1, background: '#fff', borderRadius: '28px 28px 0 0', marginTop: -20,
        padding: '28px 20px 40px', maxWidth: 480, width: '100%', margin: '-20px auto 0',
        boxShadow: '0 -8px 30px rgba(26,26,46,0.08)',
      }}>
        {err && (
          <div style={{
            background: '#FEF2F2', border: '1.5px solid #FCA5A5', borderRadius: 12,
            padding: '10px 14px', color: C.danger, fontSize: 13, marginBottom: 16, fontWeight: 600,
          }}>
            ⚠️ {err}
          </div>
        )}

        <div className="fade-in">
          <p style={{
            color: C.textMuted, fontSize: 14, lineHeight: 1.7, textAlign: 'center',
            marginBottom: 24, padding: '0 8px',
          }}>
            {t('piLoginHint')}
          </p>

          <Btn
            onClick={handlePiLogin}
            disabled={loading}
            fullWidth
            size="lg"
            style={{
              background: 'linear-gradient(135deg, #5A2C84 0%, #7B4CA8 100%)',
              color: '#FFB800',
              fontWeight: 900,
              border: '1.5px solid #FFB800',
              boxShadow: '0 4px 18px rgba(90, 44, 132, 0.28)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {loading ? (
              <Spinner size={20} color="#FFB800" />
            ) : (
              <>
                <span style={{ fontSize: 22, fontWeight: 'bold' }}>π</span>
                {t('piLoginButton')}
              </>
            )}
          </Btn>
        </div>
      </div>
    </div>
  );
}
