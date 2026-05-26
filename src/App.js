import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { GLOBAL_CSS } from './lib/theme';
import AuthPage from './pages/AuthPage';
import CaptainDashboard from './pages/CaptainDashboard';
import AthleteApp from './pages/AthleteApp';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const { t, dir } = useLanguage();

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = GLOBAL_CSS;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg,#FF4D00,#FF8C00,#FFB800)',
        fontFamily: 'Cairo, sans-serif', direction: dir,
      }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🏋️</div>
        <div style={{ color: '#fff', fontWeight: 900, fontSize: 24, marginBottom: 8 }}>{t('appName')}</div>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>{t('loading')}</div>
        <div style={{
          marginTop: 24, width: 36, height: 36, borderRadius: '50%',
          border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
          animation: 'spin 0.8s linear infinite',
        }}/>
      </div>
    );
  }

  if (!user) return <AuthPage/>;
  if (profile?.role === 'captain') return <CaptainDashboard/>;
  return <AthleteApp/>;
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent/>
      </AuthProvider>
    </LanguageProvider>
  );
}
