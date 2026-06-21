import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import Navbar from '../components/Navbar';

const GOLD = '#c9a84c';

const STATUS_LABELS = {
  CONFIRMED: { label: 'Подтверждено', color: '#27ae60' },
  PENDING:   { label: 'Ожидает', color: '#f39c12' },
  HOLD:      { label: 'Удерживается', color: '#3498db' },
  CANCELLED: { label: 'Отменено', color: '#e74c3c' }
};

export default function MyReservations({ onNavigate }) {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getMyReservations();
      setReservations(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCancel = async (id) => {
    if (!confirm('Отменить бронирование?')) return;
    setCancelling(id);
    try {
      await api.cancelReservation(id);
      load();
    } catch (err) { alert(err.message); }
    finally { setCancelling(null); }
  };

  const upcoming = reservations.filter(r => r.status !== 'CANCELLED' && new Date(r.startTime) > new Date());
  const past = reservations.filter(r => r.status === 'CANCELLED' || new Date(r.startTime) <= new Date());

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', color: '#fff', fontFamily: "'Georgia', serif" }}>
      <Navbar onNavigate={onNavigate} />
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '300', letterSpacing: '2px', color: GOLD, margin: 0 }}>Мои бронирования</h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginTop: '4px' }}>{reservations.length} всего</p>
          </div>
          <button onClick={() => onNavigate('home')} style={btnStyle(GOLD, '#000')}>
            + Новая бронь
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px', color: 'rgba(255,255,255,0.3)' }}>Загрузка...</div>
        ) : reservations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🗓️</div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '16px', marginBottom: '24px' }}>У вас пока нет бронирований</p>
            <button onClick={() => onNavigate('home')} style={btnStyle(GOLD, '#000')}>Забронировать стол</button>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <Section title="Предстоящие" items={upcoming} onCancel={handleCancel} cancelling={cancelling} />
            )}
            {past.length > 0 && (
              <Section title="История" items={past} onCancel={null} cancelling={null} muted />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Section({ title, items, onCancel, cancelling, muted }) {
  return (
    <div style={{ marginBottom: '40px' }}>
      <div style={{ fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: muted ? 'rgba(255,255,255,0.3)' : GOLD, marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {items.map(r => <ReservationCard key={r.id} reservation={r} onCancel={onCancel} cancelling={cancelling} muted={muted} />)}
      </div>
    </div>
  );
}

function ReservationCard({ reservation: r, onCancel, cancelling, muted }) {
  const status = STATUS_LABELS[r.status] || { label: r.status, color: '#888' };
  const start = new Date(r.startTime);
  const end = new Date(r.endTime);
  const canCancel = onCancel && r.status !== 'CANCELLED' && start > new Date();

  const preorderTotal = r.preorders?.reduce((sum, p) => sum + (p.menuItem?.price || 0) * p.quantity, 0) || 0;

  return (
    <div style={{
      background: muted ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
      border: `1px solid ${muted ? 'rgba(255,255,255,0.06)' : 'rgba(201,168,76,0.2)'}`,
      borderRadius: '4px', padding: '20px 24px',
      opacity: muted ? 0.7 : 1
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <span style={{ fontSize: '18px', fontWeight: '600', color: muted ? '#fff' : GOLD }}>Стол №{r.table?.number}</span>
            <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '20px', background: `${status.color}22`, color: status.color, border: `1px solid ${status.color}44` }}>
              {status.label}
            </span>
          </div>
          <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>
            📅 {start.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>
            🕐 {start.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} – {end.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
            <span style={{ color: 'rgba(255,255,255,0.4)', marginLeft: '8px', fontSize: '13px' }}>({r.table?.capacity} мест)</span>
          </div>
          {r.guestComment && (
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginTop: '6px', fontStyle: 'italic' }}>
              "{r.guestComment}"
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          {preorderTotal > 0 && (
            <div style={{ fontSize: '13px', color: GOLD }}>Предзаказ: {preorderTotal.toLocaleString('ru-RU')} ₽</div>
          )}
          {canCancel && (
            <button onClick={() => onCancel(r.id)} disabled={cancelling === r.id}
              style={{ padding: '8px 16px', border: '1px solid rgba(231,76,60,0.5)', borderRadius: '3px', background: 'transparent', color: '#e74c3c', fontSize: '13px', cursor: 'pointer', fontFamily: "'Georgia', serif" }}>
              {cancelling === r.id ? 'Отмена...' : 'Отменить'}
            </button>
          )}
        </div>
      </div>

      {r.preorders?.length > 0 && (
        <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: '11px', letterSpacing: '2px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: '8px' }}>Предзаказ</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {r.preorders.map(p => (
              <span key={p.id} style={{ fontSize: '12px', padding: '4px 10px', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '20px', color: 'rgba(255,255,255,0.7)' }}>
                {p.menuItem?.name} ×{p.quantity}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function btnStyle(bg, color) {
  return {
    padding: '10px 22px', border: 'none', borderRadius: '3px',
    background: bg, color, fontSize: '13px', letterSpacing: '1px',
    cursor: 'pointer', fontFamily: "'Georgia', serif", fontWeight: '600'
  };
}
