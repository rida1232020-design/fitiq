export const C = {
  primary:       '#FF4D00',
  primaryLight:  '#FF7340',
  primaryDark:   '#CC3D00',
  secondary:     '#FFB800',
  accent:        '#00C2FF',
  success:       '#22C55E',
  danger:        '#EF4444',
  warning:       '#F59E0B',

  bg:            '#F5F3EE',
  bgCard:        '#FFFFFF',
  bgMuted:       '#F0EDE8',
  bgInput:       '#F7F5F2',

  text:          '#1A1A2E',
  textMuted:     '#6B7280',
  textLight:     '#9CA3AF',

  border:        'rgba(26,26,46,0.09)',
  borderFocus:   'rgba(255,77,0,0.4)',

  shadow:        '0 2px 16px rgba(26,26,46,0.07)',
  shadowMd:      '0 6px 30px rgba(26,26,46,0.11)',
  shadowLg:      '0 16px 50px rgba(255,77,0,0.16)',
  shadowXl:      '0 24px 70px rgba(26,26,46,0.18)',
};

export const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');
  *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
  html { font-size: 16px; }
  body {
    font-family: 'Cairo', sans-serif;
    background: ${C.bg};
    color: ${C.text};
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
  }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: ${C.bgMuted}; }
  ::-webkit-scrollbar-thumb { background: #D1C9BF; border-radius: 4px; }
  button { font-family: 'Cairo', sans-serif; cursor: pointer; }
  input, textarea { font-family: 'Cairo', sans-serif; }
  a { text-decoration: none; color: inherit; }

  @keyframes fadeIn    { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
  @keyframes fadeInUp  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
  @keyframes slideIn   { from{opacity:0;transform:translateX(16px)} to{opacity:1;transform:none} }
  @keyframes scaleIn   { from{opacity:0;transform:scale(0.94)} to{opacity:1;transform:scale(1)} }
  @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:0.5} }
  @keyframes spin      { to{transform:rotate(360deg)} }
  @keyframes bounce3   { 0%,80%,100%{transform:scale(0.7);opacity:0.5} 40%{transform:scale(1);opacity:1} }
  @keyframes toastSlide{ from{opacity:0;transform:translateX(-50%) translateY(16px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
  @keyframes shimmer   { from{background-position:200% 0} to{background-position:-200% 0} }

  .fade-in    { animation: fadeIn   0.35s ease both; }
  .fade-in-up { animation: fadeInUp 0.4s  ease both; }
  .scale-in   { animation: scaleIn  0.3s  ease both; }
  .slide-in   { animation: slideIn  0.35s ease both; }

  .skeleton {
    background: linear-gradient(90deg, #EDE9E3 25%, #F5F1EB 50%, #EDE9E3 75%);
    background-size: 400% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 8px;
  }
`;
