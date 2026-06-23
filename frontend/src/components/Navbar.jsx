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
      {/* Добавили стили медиа-запросов прямо в тег style для простоты, чтобы не ломать сборку */}
      <style>{`
        .nav-container {
          max-width: 1300px;
          margin: 0 auto;
          padding: 0 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 60px;
        }
        .nav-logo-text {
          font-size: 15px;
          color: ${GOLD};
          letter-spacing: 2px;
          font-family: 'Georgia', serif;
        }
        .nav-logo-sub {
          font-size: 15px;
          color: rgba(255,255,255,0.5);
          letter-spacing: 2px;
          font-family: 'Georgia', serif;
        }
        .nav-buttons {
          display: flex;
          gap: 4px;
        }
        .nav-user-block {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .nav-user-info {
          text-align: right;
        }

        /* Адаптив под мобильные экраны и Telegram WebApp */
        @media (max-width: 600px) {
          .nav-container {
            padding: 0 8px; /* Уменьшаем отступы по бокам */
            height: auto;
            min-height: 55px;
            padding-top: 6px;
            padding-bottom: 6px;
            flex-wrap: wrap; /* Разрешаем перенос, если экран совсем крошечный */
            gap: 8px;
            justify-content: space-around;
          }
          .nav-logo-text, .nav-logo-sub {
            font-size: 12px; /* Уменьшаем логотип */
            letter-spacing: 1px;
          }
          .nav-user-info {
            display: none; /* Скрываем имя на мобилке, чтобы освободить место */
          }
          .nav-user-block {
            gap: 8px;
          }
        }
      `}</style>

      <div className="nav-container">
        
        {/* Логотип */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '18px' }}>🍽️</span>
          <div>
            <span className="nav-logo-text">ELEGANCE</span>
            <span className="nav-logo-sub"> RESTO</span>
          </div>
        </div>

        {/* Переключатель страниц */}
        {onNavigate && user?.role !== 'ADMIN' && (
          <div className="nav-buttons">
            <NavBtn label="Бронирование" onClick={() => onNavigate('home')} active={activePage === 'home'} />
            <NavBtn label="Мои брони" onClick={() => onNavigate('reservations')} active={activePage === 'reservations'} />
          </div>
        )}

        {/* Профиль и Выход */}
        <div className="nav-user-block">
          <div className="nav-user-info">
            <div style={{ fontSize: '13px', color: '#fff' }}>{user?.firstName}</div>
            <div style={{ fontSize: '11px', color: user?.role === 'ADMIN' ? GOLD : 'rgba(255,255,255,0.4)', letterSpacing: '1px' }}>
              {user?.role === 'ADMIN' ? 'Админ' : 'Гость'}
            </div>
          </div>
          <button onClick={logout} style={{
            padding: '6px 10px', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '3px', background: 'transparent', color: 'rgba(255,255,255,0.5)',
            fontSize: '11px', cursor: 'pointer', fontFamily: "'Georgia', serif",
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
    <button onClick={onClick} className="nav-menu-btn" style={{
      padding: '6px 10px', border: 'none', borderRadius: '3px',
      background: active ? 'rgba(201,168,76,0.15)' : 'transparent',
      color: active ? '#c9a84c' : 'rgba(255,255,255,0.6)',
      fontSize: '12px', cursor: 'pointer', fontFamily: "'Georgia', serif",
      letterSpacing: '0.5px', transition: 'all 0.2s'
    }}>
      {label}
    </button>
  );
}
