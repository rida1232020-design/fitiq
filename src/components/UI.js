import { C } from '../lib/theme';

/* ── Button ── */
export function Btn({ children, onClick, variant = 'primary', size = 'md', disabled, fullWidth, style = {} }) {
  const base = {
    border: 'none', borderRadius: 14, cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'Cairo, sans-serif', fontWeight: 800, transition: 'all 0.18s',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    opacity: disabled ? 0.55 : 1, width: fullWidth ? '100%' : undefined, ...style,
  };
  const sizes = { sm: '8px 14px', md: '12px 20px', lg: '15px 26px' };
  const fontSizes = { sm: 12, md: 14, lg: 16 };
  const variants = {
    primary:  { background: `linear-gradient(135deg,${C.primary},${C.primaryLight})`, color: '#fff', boxShadow: `0 4px 16px rgba(255,77,0,0.3)` },
    secondary:{ background: '#fff', color: C.text, border: `1.5px solid ${C.border}`, boxShadow: C.shadow },
    ghost:    { background: C.bgMuted, color: C.textMuted, border: 'none' },
    danger:   { background: `linear-gradient(135deg,#EF4444,#DC2626)`, color: '#fff' },
    success:  { background: `linear-gradient(135deg,#22C55E,#16A34A)`, color: '#fff' },
  };
  return (
    <button onClick={disabled ? undefined : onClick}
      style={{ ...base, ...variants[variant], padding: sizes[size], fontSize: fontSizes[size] }}>
      {children}
    </button>
  );
}

/* ── Input ── */
export function Input({ label, value, onChange, placeholder, type = 'text', icon, multiline, rows = 3, style = {} }) {
  const inputStyle = {
    width: '100%', background: C.bgInput, border: `1.5px solid ${C.border}`,
    borderRadius: 14, padding: icon ? '11px 14px 11px 40px' : '11px 14px',
    color: C.text, fontSize: 14, outline: 'none', direction: 'rtl',
    fontFamily: 'Cairo, sans-serif', transition: 'border 0.2s', ...style,
  };
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: 'block', color: C.textMuted, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{label}</label>}
      <div style={{ position: 'relative' }}>
        {icon && <span style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 16, pointerEvents: 'none' }}>{icon}</span>}
        {multiline
          ? <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}/>
          : <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={inputStyle}/>
        }
      </div>
    </div>
  );
}

/* ── Card ── */
export function Card({ children, style = {}, onClick, hover }) {
  return (
    <div onClick={onClick} style={{
      background: C.bgCard, borderRadius: 22, boxShadow: C.shadow,
      border: `1.5px solid ${C.border}`, overflow: 'hidden',
      cursor: onClick ? 'pointer' : 'default', transition: 'all 0.2s',
      ...(hover ? { ':hover': { boxShadow: C.shadowMd } } : {}),
      ...style,
    }}>{children}</div>
  );
}

/* ── Badge ── */
export function Badge({ children, color = C.primary }) {
  return (
    <span style={{
      background: color + '18', color, border: `1px solid ${color}30`,
      borderRadius: 8, padding: '3px 10px', fontSize: 11, fontWeight: 700,
    }}>{children}</span>
  );
}

/* ── Avatar ── */
export function Avatar({ emoji = '💪', size = 48, gradient, style = {} }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: gradient || `linear-gradient(135deg,${C.primary},${C.primaryLight})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.45, boxShadow: `0 4px 14px rgba(255,77,0,0.25)`, ...style,
    }}>{emoji}</div>
  );
}

/* ── Spinner ── */
export function Spinner({ size = 28, color = C.primary }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `3px solid ${color}22`, borderTopColor: color,
      animation: 'spin 0.8s linear infinite', flexShrink: 0,
    }}/>
  );
}

/* ── Toast ── */
export function Toast({ message, type = 'success', onClose }) {
  const colors = { success: C.success, error: C.danger, info: C.accent };
  const icons  = { success: '✅', error: '❌', info: 'ℹ️' };
  return (
    <div style={{
      position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
      background: colors[type], color: '#fff', borderRadius: 16,
      padding: '13px 22px', fontWeight: 800, fontSize: 14, zIndex: 1000,
      boxShadow: `0 8px 30px ${colors[type]}55`, animation: 'toastSlide 0.3s ease',
      display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
    }}>
      {icons[type]} {message}
    </div>
  );
}

/* ── Empty State ── */
export function Empty({ icon = '📭', title, subtitle, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px', animation: 'fadeIn 0.4s ease' }}>
      <div style={{ fontSize: 52, marginBottom: 12 }}>{icon}</div>
      <div style={{ color: C.text, fontWeight: 800, fontSize: 16, marginBottom: 6 }}>{title}</div>
      {subtitle && <div style={{ color: C.textMuted, fontSize: 13, marginBottom: 20 }}>{subtitle}</div>}
      {action}
    </div>
  );
}

/* ── BottomNav ── */
export function BottomNav({ tabs, active, onChange }) {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: '#fff', borderTop: `1px solid ${C.border}`,
      display: 'flex', justifyContent: 'space-around',
      padding: '10px 0 20px', zIndex: 100,
      boxShadow: '0 -4px 20px rgba(26,26,46,0.07)',
    }}>
      {tabs.map(t => (
        <button key={t.key} onClick={() => onChange(t.key)} style={{
          background: 'none', border: 'none', display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 3, padding: '4px 14px', borderRadius: 14,
          color: active === t.key ? C.primary : C.textLight, position: 'relative',
          fontFamily: 'Cairo, sans-serif',
        }}>
          {active === t.key && (
            <div style={{
              position: 'absolute', top: -10, width: 28, height: 3,
              background: `linear-gradient(90deg,${C.primary},${C.primaryLight})`,
              borderRadius: '0 0 4px 4px',
            }}/>
          )}
          {t.badge > 0 && (
            <div style={{
              position: 'absolute', top: 0, right: 8, background: C.danger,
              color: '#fff', borderRadius: '50%', width: 16, height: 16,
              fontSize: 9, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{t.badge}</div>
          )}
          <span style={{ fontSize: 22 }}>{t.icon}</span>
          <span style={{ fontSize: 10, fontWeight: active === t.key ? 800 : 600 }}>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}

/* ── Section Header ── */
export function SectionHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
      <div>
        <h2 style={{ color: C.text, fontWeight: 900, fontSize: 20 }}>{title}</h2>
        {subtitle && <p style={{ color: C.textMuted, fontSize: 13, marginTop: 2 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* ── StarRating ── */
export function Stars({ rating = 5, size = 14 }) {
  return (
    <span style={{ color: '#FFB800', fontSize: size }}>
      {'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))}
      <span style={{ color: C.textMuted, fontSize: size - 2, marginRight: 4 }}> {rating.toFixed(1)}</span>
    </span>
  );
}
