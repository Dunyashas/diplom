import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const GOLD = '#c9a84c';
const statusColors = {
  free: '#27ae60',
  busy: '#e74c3c',
  selected: GOLD
};

export default function GuestHome({ onNavigate }) {
  const { user } = useAuth();
  const [tables, setTables] = useState([]);
  const [menu, setMenu] = useState([]);
  const [menuByCategory, setMenuByCategory] = useState({});
  const [selectedTable, setSelectedTable] = useState(null);
  const [cart, setCart] = useState({}); // { menuItemId: quantity }
  const [step, setStep] = useState(1); // 1=карта, 2=детали, 3=меню, 4=успех

  // Форма
  const [reserveDate, setReserveDate] = useState('');
  const [reserveTime, setReserveTime] = useState('19:00');
  const [duration, setDuration] = useState(2);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const minDate = new Date().toISOString().split('T')[0];

  useEffect(() => { loadTables(); }, []);
  useEffect(() => {
    if (step === 3) loadMenu();
  }, [step]);

  const loadTables = async (date, startTime, endTime) => {
    try {
      const params = date && startTime ? { date, startTime, endTime } : {};
      const data = await api.getTables(Object.keys(params).length ? params : undefined);
      setTables(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadMenu = async () => {
    try {
      const data = await api.getMenu();
      setMenu(data);
      const grouped = data.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
      }, {});
      setMenuByCategory(grouped);
    } catch (err) { console.error(err); }
  };

  const handleDateTimeChange = (date, time) => {
    setReserveDate(date);
    setReserveTime(time);
    if (date && time) {
      const start = new Date(`${date}T${time}`);
      const end = new Date(start.getTime() + duration * 3600000);
      loadTables(date, start.toISOString(), end.toISOString());
    }
  };

  const cartItems = () => Object.entries(cart)
    .filter(([, q]) => q > 0)
    .map(([id, quantity]) => {
      const item = menu.find(m => m.id === id);
      return item ? { ...item, quantity } : null;
    }).filter(Boolean);

  const cartTotal = () => cartItems().reduce((sum, i) => sum + i.price * i.quantity, 0);

  const handleBook = async () => {
    if (!reserveDate || !reserveTime) { setError('Укажите дату и время'); return; }
    setLoading(true); setError('');
    try {
      const start = new Date(`${reserveDate}T${reserveTime}`);
      await api.reserve({
        tableId: selectedTable.id,
        reservationTime: start.toISOString(),
        durationHours: Number(duration),
        guestComment: comment,
        cart: cartItems().map(i => ({ id: i.id, quantity: i.quantity }))
      });
      setStep(4);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(1); setSelectedTable(null); setCart({});
    setReserveDate(''); setReserveTime('19:00'); setDuration(2);
    setComment(''); setError('');
    loadTables();
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', color: '#fff', fontFamily: "'Georgia', serif" }}>
      <Navbar onNavigate={onNavigate} />

      <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '32px 24px' }}>

        {step < 4 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '40px' }}>
            {['Выбор стола', 'Дата и время', 'Предзаказ меню', 'Подтверждение'].map((label, i) => {
              const s = i + 1;
              const active = step === s;
              const done = step > s;
              return (
                <div key={s} style={{ display: 'flex', alignItems: 'center', flex: s < 4 ? '1' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: done || active ? 1 : 0.4 }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '600', flexShrink: 0,
                      background: done ? GOLD : 'transparent',
                      border: `2px solid ${done || active ? GOLD : 'rgba(255,255,255,0.2)'}`,
                      color: done ? '#000' : active ? GOLD : 'rgba(255,255,255,0.4)'
                    }}>
                      {done ? '✓' : s}
                    </div>
                    <span style={{ fontSize: '13px', color: active ? '#fff' : 'rgba(255,255,255,0.5)', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{label}</span>
                  </div>
                  {s < 4 && <div style={{ flex: 1, height: '1px', background: done ? GOLD : 'rgba(255,255,255,0.1)', margin: '0 16px' }} />}
                </div>
              );
            })}
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '300', letterSpacing: '2px', marginBottom: '8px', color: GOLD }}>
              Выберите стол
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '28px' }}>
              Нажмите на свободный стол, чтобы начать бронирование
            </p>

            <div style={{ display: 'flex', gap: '24px', marginBottom: '20px' }}>
              {[['#27ae60', 'Свободен'], ['#e74c3c', 'Занят'], [GOLD, 'Выбран']].map(([color, label]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: color }} />
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>{label}</span>
                </div>
              ))}
            </div>

            <div style={{
              position: 'relative', width: '100%', height: '520px',
              background: 'linear-gradient(180deg, #161616 0%, #111 100%)',
              borderRadius: '4px', border: `1px solid rgba(201,168,76,0.2)`,
              boxShadow: 'inset 0 0 60px rgba(0,0,0,0.5)',
              overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', top: 0, left: '44%', width: '12%', background: 'rgba(201,168,76,0.15)', color: GOLD, textAlign: 'center', fontSize: '10px', padding: '5px 0', letterSpacing: '2px', borderRadius: '0 0 4px 4px' }}>
                ВХОД
              </div>
              <div style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '11px', color: 'rgba(255,255,255,0.2)', letterSpacing: '1px' }}>
                ПЛАН ЗАЛА
              </div>

              {[20, 40, 60, 80].map(y => (
                <div key={y} style={{ position: 'absolute', left: 0, right: 0, top: `${y}%`, height: '1px', background: 'rgba(255,255,255,0.03)' }} />
              ))}

              {tables.map(table => {
                const isSelected = selectedTable?.id === table.id;
                const isBusy = table.isBusy;
                const color = isSelected ? statusColors.selected : isBusy ? statusColors.busy : statusColors.free;
                const isCircle = table.shape === 'circle';

                const w = table.tableW || (isCircle ? 80 : 100);
                const h = table.tableH || 76;

                return (
                  <div key={table.id}
                    onClick={() => !isBusy && setSelectedTable(isSelected ? null : table)}
                    style={{
                      position: 'absolute',
                      left: `calc(${table.posX}% - ${w / 2}px)`,
                      top: `calc(${table.posY}% - ${h / 2}px)`,
                      width: `${w}px`,
                      height: `${h}px`,
                      borderRadius: isCircle ? '50%' : '6px',
                      background: `rgba(${isSelected ? '201,168,76' : isBusy ? '231,76,60' : '39,174,96'},0.15)`,
                      border: `2px solid ${color}`,
                      color: color,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      cursor: isBusy ? 'not-allowed' : 'pointer',
                      userSelect: 'none',
                      transition: 'all 0.2s',
                      boxShadow: isSelected ? `0 0 20px rgba(201,168,76,0.4)` : `0 4px 12px rgba(0,0,0,0.4)`,
                      opacity: isBusy ? 0.6 : 1
                    }}>
                    <span style={{ fontWeight: '700', fontSize: '14px' }}>№{table.number}</span>
                    <span style={{ fontSize: '10px', opacity: 0.8, marginTop: '2px' }}>{table.capacity} мест</span>
                    {isBusy && <span style={{ fontSize: '9px', marginTop: '2px', opacity: 0.7 }}>занят</span>}
                  </div>
                );
              })}

              {tables.length === 0 && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>
                  Нет доступных столов
                </div>
              )}
            </div>

            {selectedTable && (
              <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(201,168,76,0.1)', border: `1px solid rgba(201,168,76,0.3)`, borderRadius: '4px', padding: '16px 24px' }}>
                <div>
                  <span style={{ color: GOLD, fontWeight: '600' }}>Стол №{selectedTable.number}</span>
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginLeft: '12px' }}>{selectedTable.capacity} персон · {selectedTable.shape === 'circle' ? 'круглый' : 'прямоугольный'}</span>
                </div>
                <button onClick={() => setStep(2)} style={btnStyle(GOLD, '#000')}>
                  Продолжить →
                </button>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div style={{ maxWidth: '520px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '300', letterSpacing: '2px', marginBottom: '8px', color: GOLD }}>
              Дата и время
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '32px' }}>
              Стол №{selectedTable?.number} · {selectedTable?.capacity} персон
            </p>

            <FormGroup label="Дата">
              <input type="date" min={minDate} value={reserveDate}
                onChange={e => handleDateTimeChange(e.target.value, reserveTime)}
                style={inputStyle} />
            </FormGroup>

            <FormGroup label="Время">
              <input type="time" value={reserveTime}
                onChange={e => handleDateTimeChange(reserveDate, e.target.value)}
                style={inputStyle} />
            </FormGroup>

            <FormGroup label="Длительность">
              <select value={duration} onChange={e => setDuration(e.target.value)} style={inputStyle}>
                {[1,2,3,4].map(h => <option key={h} value={h}>{h} {h === 1 ? 'час' : h < 5 ? 'часа' : 'часов'}</option>)}
              </select>
            </FormGroup>

            <FormGroup label="Комментарий (необязательно)">
              <textarea value={comment} onChange={e => setComment(e.target.value)}
                placeholder="Особые пожелания, аллергии, повод..." rows={3}
                style={{ ...inputStyle, resize: 'vertical' }} />
            </FormGroup>

            {error && <ErrorBox msg={error} />}

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button onClick={() => { setStep(1); setError(''); }} style={btnStyle('rgba(255,255,255,0.1)', '#fff', true)}>
                ← Назад
              </button>
              <button onClick={() => { if (!reserveDate || !reserveTime) { setError('Укажите дату и время'); return; } setError(''); setStep(3); }}
                style={btnStyle(GOLD, '#000')}>
                Далее:  Меню →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '300', letterSpacing: '2px', marginBottom: '8px', color: GOLD }}>
              Предзаказ блюд
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '32px' }}>
              Необязательно — добавьте блюда заранее или закажете у нас на месте
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '32px', alignItems: 'start' }}>
              <div>
                {menu.length === 0 && (
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', padding: '40px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px' }}>
                    Меню пока не добавлено
                  </div>
                )}
                {Object.entries(menuByCategory).map(([category, items]) => (
                  <div key={category} style={{ marginBottom: '28px' }}>
                    <div style={{ fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: GOLD, marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid rgba(201,168,76,0.2)' }}>
                      {category}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {items.map(item => {
                        const qty = cart[item.id] || 0;
                        return (
                          <div key={item.id} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '12px 16px', background: qty > 0 ? 'rgba(201,168,76,0.08)' : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${qty > 0 ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.08)'}`,
                            borderRadius: '3px', transition: 'all 0.2s'
                          }}>
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: qty > 0 ? '600' : '400', color: qty > 0 ? GOLD : '#fff' }}>{item.name}</div>
                              {item.description && <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{item.description}</div>}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
                              <span style={{ color: GOLD, fontWeight: '600', fontSize: '15px' }}>{item.price.toLocaleString('ru-RU')} ₽</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button onClick={() => setCart(c => ({ ...c, [item.id]: Math.max(0, (c[item.id] || 0) - 1) }))}
                                  style={{ width: '28px', height: '28px', borderRadius: '50%', border: `1px solid rgba(255,255,255,0.2)`, background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                                <span style={{ minWidth: '20px', textAlign: 'center', fontSize: '15px', fontWeight: '600' }}>{qty}</span>
                                <button onClick={() => setCart(c => ({ ...c, [item.id]: (c[item.id] || 0) + 1 }))}
                                  style={{ width: '28px', height: '28px', borderRadius: '50%', border: `1px solid ${GOLD}`, background: 'transparent', color: GOLD, cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ position: 'sticky', top: '20px' }}>
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '24px' }}>
                  <div style={{ fontSize: '11px', letterSpacing: '3px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '16px' }}>Ваш заказ</div>
                  
                  <SummaryRow label="Стол" value={`№${selectedTable?.number}`} />
                  <SummaryRow label="Дата" value={reserveDate ? new Date(reserveDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) : '—'} />
                  <SummaryRow label="Время" value={`${reserveTime} · ${duration} ч.`} />
                  
                  {cartItems().length > 0 && (
                    <>
                      <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '16px 0' }} />
                      {cartItems().map(i => (
                        <SummaryRow key={i.id} label={`${i.name} ×${i.quantity}`} value={`${(i.price * i.quantity).toLocaleString('ru-RU')} ₽`} />
                      ))}
                      <div style={{ height: '1px', background: `rgba(201,168,76,0.3)`, margin: '12px 0' }} />
                      <SummaryRow label="Итого предзаказ" value={`${cartTotal().toLocaleString('ru-RU')} ₽`} gold />
                    </>
                  )}

                  {error && <ErrorBox msg={error} />}

                  <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button onClick={handleBook} disabled={loading} style={btnStyle(GOLD, '#000')}>
                      {loading ? 'Оформляем...' : '✓ Подтвердить бронь'}
                    </button>
                    <button onClick={() => { setStep(2); setError(''); }} style={btnStyle('rgba(255,255,255,0.08)', '#fff', true)}>
                      ← Назад
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: '64px', marginBottom: '24px' }}>🍽️</div>
            <h2 style={{ fontSize: '28px', fontWeight: '300', letterSpacing: '3px', color: GOLD, marginBottom: '12px' }}>
              Бронирование подтверждено
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '16px', marginBottom: '8px' }}>
              Стол №{selectedTable?.number} · {reserveDate ? new Date(reserveDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) : ''} · {reserveTime}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '48px' }}>
              Ждём вас! Бронирование сохранено в вашем профиле.
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <button onClick={reset} style={btnStyle(GOLD, '#000')}>Забронировать ещё</button>
              <button onClick={() => onNavigate('reservations')} style={btnStyle('rgba(255,255,255,0.1)', '#fff', true)}>Мои брони</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FormGroup({ label, children }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{ display: 'block', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function SummaryRow({ label, value, gold }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
      <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{label}</span>
      <span style={{ fontSize: '13px', fontWeight: gold ? '700' : '400', color: gold ? '#c9a84c' : '#fff' }}>{value}</span>
    </div>
  );
}

function ErrorBox({ msg }) {
  return (
    <div style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.4)', borderRadius: '3px', padding: '12px', marginBottom: '16px', color: '#fca5a5', fontSize: '13px' }}>
      {msg}
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '11px 14px', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: '3px', color: '#fff', fontSize: '14px', outline: 'none',
  fontFamily: "'Georgia', serif", colorScheme: 'dark'
};

function btnStyle(bg, color, ghost = false) {
  return {
    padding: '12px 24px', border: ghost ? '1px solid rgba(255,255,255,0.2)' : 'none',
    borderRadius: '3px', background: bg, color,
    fontSize: '13px', letterSpacing: '1px', cursor: 'pointer',
    fontFamily: "'Georgia', serif", fontWeight: '600', transition: 'all 0.2s'
  };
}
