import { useAuth } from '../context/AuthContext';

const GOLD = '#c9a84c';

export default function Navbar({ onNavigate, activePage }) {
  const { user, logout } = useAuth();

  return (
    <nav
      style={{
        background: 'rgba(10,10,10,0.95)',
        borderBottom: '1px solid rgba(201,168,76,0.2)',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        width: '100%',
      }}
    >
      <style>{`
        .nav-container {
          padding: 0 6%;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 70px;
        }

        @media (min-width: 601px) {
          .nav-container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 0 40px;
            box-sizing: border-box;

            display: flex;
            align-items: center;
            justify-content: center;
            gap: 760px;
          }
        }

       


        @media (max-width: 600px) {
          .nav-container {
            padding: 15px 4%;
            height: auto;
            flex-direction: column;
            gap: 12px;
          }

          .nav-logo {
            order: 1;
            display: flex !important;
            justify-content: center;
            width: 100%;
          }

          .nav-buttons {
            order: 2;
            width: 100%;
            justify-content: center;
          }

          .nav-user-block {
            order: 3;
            width: 100%;
            display: flex !important;
            justify-content: center !important;
            gap: 15px !important;
            padding-top: 5px;
            border-top: 1px solid rgba(255,255,255,0.05);
          }
        }
      `}</style>

      <div className="nav-container">
        <div
          className="nav-logo"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <span style={{ fontSize: '18px' }}>🍽️</span>

          <div>
            <span
              style={{
                fontSize: '15px',
                color: GOLD,
                letterSpacing: '2px',
                fontFamily: 'Georgia',
              }}
            >
              ELEGANCE
            </span>

            <span
              style={{
                fontSize: '15px',
                color: 'rgba(255,255,255,0.5)',
                letterSpacing: '2px',
                fontFamily: 'Georgia',
              }}
            >
              {' '}
              RESTO
            </span>
          </div>
        </div>

        {onNavigate && user?.role !== 'ADMIN' && (
          <div
            className="nav-buttons"
            style={{ display: 'flex', gap: '8px' }}
          >
            <NavBtn
              label="Бронирование"
              onClick={() => onNavigate('home')}
              active={activePage === 'home'}
            />

            <NavBtn
              label="Мои брони"
              onClick={() => onNavigate('reservations')}
              active={activePage === 'reservations'}
            />
          </div>
        )}

        <div
          className="nav-user-block"
          style={{ display: 'flex', alignItems: 'center', gap: '16px' }}
        >
          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                fontSize: '13px',
                color: '#fff',
                fontWeight: 'bold',
              }}
            >
              {user?.firstName}
            </div>

            <div
              style={{
                fontSize: '10px',
                color: GOLD,
                letterSpacing: '1px',
              }}
            >
              {user?.role === 'ADMIN'
                ? 'АДМИНИСТРАТОР'
                : 'ГОСТЬ'}
            </div>
          </div>

          <button
            onClick={logout}
            style={{
              padding: '6px 12px',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '4px',
              background: 'transparent',
              color: '#fff',
              fontSize: '11px',
              cursor: 'pointer',
              letterSpacing: '1px',
            }}
          >
            Выйти
          </button>
        </div>
      </div>
    </nav>
  );
}

function NavBtn({ label, onClick, active }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 16px',
        border: 'none',
        borderRadius: '4px',
        background: active
          ? 'rgba(201,168,76,0.15)'
          : 'transparent',
        color: active ? GOLD : 'rgba(255,255,255,0.7)',
        fontSize: '12px',
        cursor: 'pointer',
        fontFamily: 'Georgia',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        transition: '0.2s',
      }}
    >
      {label}
    </button>
  );
}
