import { useState } from 'react';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import OnboardingModal from '../components/OnboardingModal';

const GOLD = '#c9a84c';

export default function AuthPage() {
  const { login } = useAuth();
  const [mode, setMode] = useState('login'); // login | register
  const [authMethod, setAuthMethod] = useState('password'); // password | passkey
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ email: '', firstName: '', lastName: '', phone: '', password: '' });
  const [pendingUser, setPendingUser] = useState(null); // ждём принятия онбординга

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const clearError = () => setError('');

  const handleRegisterPassword = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const result = await api.registerPassword(form);
      if (result.success) setPendingUser(result.user); // показываем онбординг
      else setError('Ошибка регистрации');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleLoginPassword = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const result = await api.loginPassword({ email: form.email, password: form.password });
      if (result.success) login(result.user);
      else setError('Неверный email или пароль');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleRegisterPasskey = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const opts = await api.registerOptions(form);
      const { userId, ...optionsJSON } = opts;
      const regResponse = await startRegistration({ optionsJSON });
      const result = await api.registerVerify({ userId, body: regResponse });
      if (result.success) setPendingUser(result.user); // показываем онбординг
      else setError('Верификация не удалась');
    } catch (err) { setError(err.message || 'Ошибка регистрации'); }
    finally { setLoading(false); }
  };

  const handleLoginPasskey = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const opts = await api.loginOptions({ email: form.email });
      const { userId, ...optionsJSON } = opts;
      const authResponse = await startAuthentication({ optionsJSON });
      const result = await api.loginVerify({ userId, body: authResponse });
      if (result.success) login(result.user);
      else setError('Ошибка входа');
    } catch (err) { setError(err.message || 'Ошибка входа'); }
    finally { setLoading(false); }
  };

  const handleSubmit = mode === 'login'
    ? (authMethod === 'password' ? handleLoginPassword : handleLoginPasskey)
    : (authMethod === 'password' ? handleRegisterPassword : handleRegisterPasskey);

  const handleOnboardingAccept = () => {
    login(pendingUser);
    setPendingUser(null);
  };

  return (
    <>
      {pendingUser && <OnboardingModal onAccept={handleOnboardingAccept} />}
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0d0d0d 0%, #1a1008 50%, #0d0d0d 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Georgia', 'Times New Roman', serif", padding: '20px'
      }}>
      <div style={{
        width: '100%', maxWidth: '440px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(201,168,76,0.3)', borderRadius: '4px',
        padding: '48px 40px', backdropFilter: 'blur(20px)',
        boxShadow: '0 40px 80px rgba(0,0,0,0.6)'
      }}>

        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{ fontSize: '13px', letterSpacing: '6px', color: GOLD, textTransform: 'uppercase', marginBottom: '6px' }}>Elegance</div>
          <div style={{ fontSize: '32px', color: '#fff', fontWeight: '300', letterSpacing: '2px' }}>Resto</div>
          <div style={{ width: '40px', height: '1px', background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`, margin: '12px auto' }} />
        </div>

        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', padding: '3px', marginBottom: '24px', border: '1px solid rgba(255,255,255,0.08)' }}>
          {[['login', 'Войти'], ['register', 'Регистрация']].map(([m, label]) => (
            <button key={m} onClick={() => { setMode(m); clearError(); }}
              style={{
                flex: 1, padding: '9px', border: 'none', borderRadius: '1px', cursor: 'pointer',
                fontSize: '13px', letterSpacing: '1px', transition: 'all 0.2s', fontFamily: 'inherit',
                background: mode === m ? GOLD : 'transparent',
                color: mode === m ? '#000' : 'rgba(255,255,255,0.5)',
                fontWeight: mode === m ? '600' : '400'
              }}>
              {label}
            </button>
          ))}
        </div>

        {mode === 'login' && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
            {[['password', '🔐 Пароль'], ['passkey', '🔑 Passkey / Биометрия']].map(([m, label]) => (
              <button key={m} type="button" onClick={() => { setAuthMethod(m); clearError(); }}
                style={{
                  flex: 1, padding: '8px', border: `1px solid ${authMethod === m ? GOLD : 'rgba(255,255,255,0.12)'}`,
                  borderRadius: '3px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit',
                  background: authMethod === m ? 'rgba(201,168,76,0.15)' : 'transparent',
                  color: authMethod === m ? GOLD : 'rgba(255,255,255,0.5)',
                  transition: 'all 0.2s'
                }}>
                {label}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <Field label="Имя" name="firstName" value={form.firstName} onChange={handleChange} required placeholder="Иван" />
                <Field label="Фамилия" name="lastName" value={form.lastName} onChange={handleChange} placeholder="Петров" />
              </div>
              <Field label="Телефон" name="phone" value={form.phone} onChange={handleChange} required placeholder="+375291234567" style={{ marginBottom: '12px' }} />
            </>
          )}

          <Field label="Email" name="email" type="email" value={form.email} onChange={handleChange} required placeholder="your@email.com" style={{ marginBottom: '12px' }} />

          {(mode === 'register' || authMethod === 'password') && (
            <Field 
              label="Пароль" 
              name="password" 
              type="password" 
              value={form.password} 
              onChange={handleChange} 
              required 
              placeholder="••••••••" 
              style={{ marginBottom: '24px' }} 
            />
          )}

          {mode === 'login' && authMethod === 'passkey' && (
            <div style={{ marginBottom: '24px', padding: '12px', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '3px' }}>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: '1.6' }}>
                Вход через биометрию устройства.<br />
              </p>
            </div>
          )}

          {mode === 'register' && (
            <div style={{ marginBottom: '24px', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '3px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
                <input 
                  type="checkbox" 
                  checked={authMethod === 'passkey'} 
                  onChange={(e) => { setAuthMethod(e.target.checked ? 'passkey' : 'password'); clearError(); }} 
                  style={{ accentColor: GOLD, width: '16px', height: '16px', cursor: 'pointer' }}
                />
                Создать Passkey (привязать FaceID / отпечаток)
              </label>
            </div>
          )}

          {error && (
            <div style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.4)', borderRadius: '2px', padding: '12px', marginBottom: '16px', color: '#fca5a5', fontSize: '13px' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '14px', border: `1px solid ${GOLD}`, borderRadius: '2px',
            background: loading ? 'rgba(201,168,76,0.3)' : GOLD,
            color: loading ? 'rgba(0,0,0,0.5)' : '#000',
            fontSize: '13px', letterSpacing: '2px', textTransform: 'uppercase',
            fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', transition: 'all 0.2s'
          }}>
            {loading ? 'Подождите...' : (
              mode === 'login'
                ? (authMethod === 'password' ? 'Войти' : '🔑 Войти через Passkey')
                : 'Зарегистрироваться'
            )}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '11px', color: 'rgba(255,255,255,0.25)', lineHeight: '1.6' }}>
          Система бронирования столов
        </p>
      </div>
    </div>
    </>
  );
}

function Field({ label, name, value, onChange, required, placeholder, type = 'text', style = {} }) {
  return (
    <div style={{ marginBottom: '12px', ...style }}>
      <label style={{ display: 'block', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' }}>
        {label}
      </label>
      <input
        type={type} name={name} value={value} onChange={onChange}
        required={required} placeholder={placeholder}
        style={{
          width: '100%', padding: '11px 12px', boxSizing: 'border-box',
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '2px', color: '#fff', fontSize: '14px', outline: 'none',
          fontFamily: 'inherit', transition: 'border-color 0.2s'
        }}
        onFocus={e => e.target.style.borderColor = 'rgba(201,168,76,0.6)'}
        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
      />
    </div>
  );
}