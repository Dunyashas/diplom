import { useAuth } from '../context/AuthContext';

const GOLD = '#c9a84c';

export default function Navbar({ onNavigate, activePage }) {
  const { user, logout } = useAuth();

  return (
    <nav style={{
      background: 'rgba(10,10,10,0.95)',
      borderBottom: '1px solid rgba(201,168,76,0.2)',
      backdropFilter: 'blur(10px)',
      position: 'sticky', top: 0, zIndex: 100
    }}>
      <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px' }}>🍽️</span>
          <div>
            <span style={{ color: GOLD, fontSize: '15px', letterSpacing: '2px', fontFamily: "'Georgia', serif" }}>ELEGANCE</span>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '15px', letterSpacing: '2px', fontFamily: "'Georgia', serif" }}>  RESTO</span>
          </div>
        </div>

        {onNavigate && user?.role !== 'ADMIN' && (
          <div style={{ display: 'flex', gap: '4px' }}>
            <NavBtn label="Бронирование" onClick={() => onNavigate('home')} active={activePage === 'home'} />
            <NavBtn label="Мои брони" onClick={() => onNavigate('reservations')} active={activePage === 'reservations'} />
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', color: '#fff' }}>{user?.firstName} {user?.lastName}</div>
            <div style={{ fontSize: '11px', color: user?.role === 'ADMIN' ? GOLD : 'rgba(255,255,255,0.4)', letterSpacing: '1px' }}>
              {user?.role === 'ADMIN' ? 'Администратор' : 'Гость'}
            </div>
          </div>
          <button onClick={logout} style={{
            padding: '7px 14px', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '3px', background: 'transparent', color: 'rgba(255,255,255,0.5)',
            fontSize: '12px', cursor: 'pointer', fontFamily: "'Georgia', serif",
            letterSpacing: '1px', transition: 'all 0.2s'
          }}
            onMouseEnter={e => { e.target.style.color = '#fff'; e.target.style.borderColor = 'rgba(255,255,255,0.4)'; }}
            onMouseLeave={e => { e.target.style.color = 'rgba(255,255,255,0.5)'; e.target.style.borderColor = 'rgba(255,255,255,0.15)'; }}>
            Выйти
          </button>
        </div>
      </div>
    </nav>
  );
}

function NavBtn({ label, onClick, active }) {
  return (
    <button onClick={onClick} style={{
      padding: '6px 16px', border: 'none', borderRadius: '3px',
      background: active ? 'rgba(201,168,76,0.15)' : 'transparent',
      color: active ? '#c9a84c' : 'rgba(255,255,255,0.6)',
      fontSize: '13px', cursor: 'pointer', fontFamily: "'Georgia', serif",
      letterSpacing: '0.5px', transition: 'all 0.2s'
    }}>
      {label}
    </button>
  );
}
