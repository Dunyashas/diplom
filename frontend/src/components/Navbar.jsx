import { useAuth } from '../context/AuthContext';

const GOLD = '#c9a84c';

export default function Navbar({ onNavigate, activePage }) {
  const { user, logout } = useAuth();

  return (
    <nav style={{
      background: 'rgba(10,10,10,0.95)',
      borderBottom: '1px solid rgba(201,168,76,0.2)',
      backdropFilter: 'blur(10px)',
      position: 'sticky', top: 0, zIndex: 100,
      width: '100%'
    }}>
      <style>{`
        .nav-container {
          max-width: 100%; 
          padding: 0 6%; /* Тот же отступ, что и в основном контенте */
          margin: 0 auto; 
          display: flex; 
          align-items: center; 
          justify-content: space-between; 
          height: 70px;
        }
        .nav-buttons { display: flex; gap: 8px; }
        
        /* Мобильный вид */
        @media (max-width: 600px) {
          .nav-container { padding: 0 4%; height: auto; padding-top: 10px; padding-bottom: 10px; flex-direction: column; gap: 12px;}
          .nav-buttons { width: 100%; justify-content: center; margin-bottom: 10px; }
          .nav-user-block { width: 100%; justify-content: space-between; }
          .nav-user-info { display: block !important; } /* Имя всегда видно */
        }
      `}</style>

      <div className="nav-container">
        {/* Логотип */}
        <div className="nav-logo" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '18px' }}>🍽️</span>
          <div>
            <span style={{ fontSize: '15px', color: GOLD, letterSpacing: '2px', fontFamily: 'Georgia' }}>ELEGANCE</span>
            <span style={{ fontSize: '15px', color: 'rgba(255,255,255,0.5)', letterSpacing: '2px', fontFamily: 'Georgia' }}> RESTO</span>
          </div>
        </div>

        {/* Кнопки навигации */}
        {onNavigate && user?.role !== 'ADMIN' && (
          <div className="nav-buttons">
            <NavBtn label="Бронирование" onClick={() => onNavigate('home')} active={activePage === 'home'} />
            <NavBtn label="Мои брони" onClick={() => onNavigate('reservations')} active={activePage === 'reservations'} />
          </div>
        )}

        {/* Профиль и Выход */}
        <div className="nav-user-block" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="nav-user-info" style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', color: '#fff', fontWeight: 'bold' }}>{user?.firstName}</div>
            <div style={{ fontSize: '10px', color: GOLD, letterSpacing: '1px' }}>{user?.role === 'ADMIN' ? 'АДМИНИСТРАТОР' : 'ГОСТЬ'}</div>
          </div>
          <button onClick={logout} style={{
            padding: '6px 12px', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '4px', background: 'transparent', color: '#fff',
            fontSize: '11px', cursor: 'pointer', letterSpacing: '1px'
          }}>Выйти</button>
        </div>
      </div>
    </nav>
  );
}
