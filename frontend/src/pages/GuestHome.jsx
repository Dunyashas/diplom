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
    <div style={{ minHeight: '100vh', background: '#0f0f0f', color: '#fff', fontFamily: "sans-serif" }}>
      <Navbar onNavigate={onNavigate} />

      <div style={{ width: '100%', maxWidth: '480px', margin: '0 auto', padding: '16px 12px' }}>

        {/* СТЕППЕР */}
        {step < 4 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '6px' }}>
            {['Стол', 'Инфо', 'Меню', 'Финиш'].map((label, i) => {
              const s = i + 1;
              const active = step === s;
              const done = step > s;
              return (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: done || active ? 1 : 0.3 }}>
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '600',
                    background: done ? GOLD : 'transparent',
                    border: `2px solid ${done || active ? GOLD : 'rgba(255,255,255,0.2)'}`,
                    color: done ? '#000' : active ? GOLD : 'rgba(255,255,255,0.4)'
                  }}>
                    {done ? '✓' : s}
                  </div>
                  <span style={{ fontSize: '12px', color: active ? '#fff' : 'rgba(255,255,255,0.5)' }}>{label}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* ШАГ 1: КАРТА СТОЛОВ С ДВУХМЕРНЫМ СКРОЛЛОМ */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '400', marginBottom: '4px', color: GOLD }}>Выберите стол</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '16px' }}>Проведите пальцем в любую сторону для обзора зала</p>

            {/* Легенда */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              {[['#27ae60', 'Свободен'], ['#e74c3c', 'Занят'], [GOLD, 'Выбран']].map(([color, label]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color }} />
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{label}</span>
                </div>
              ))}
            </div>

            {/* Контейнер двухмерного скролла (overflow: 'auto' вместо overflowX) */}
            <div style={{ 
              width: '100%', 
              height: '400px', 
              overflow: 'auto', 
              border: `1px solid rgba(201,168,76,0.2)`, 
              borderRadius: '6px', 
              background: '#111', 
              marginBottom: '16px',
              WebkitOverflowScrolling: 'touch' 
            }}>
              {/* Площадь карты увеличена по вертикали до 600px */}
              <div style={{ position: 'relative', width: '560px', height: '600px', background: 'linear-gradient(180deg, #161616 0%, #111 100%)', boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5)' }}>
                
                <div style={{ position: 'absolute', top: 0, left: '42%', width: '16%', background: 'rgba(201,168,76,0.15)', color: GOLD, textAlign: 'center', fontSize: '9px', padding: '4px 0', borderRadius: '0 0 4px 4px' }}>ВХОД</div>
                
                {tables.map(table => {
                  const isSelected = selectedTable?.id === table.id;
                  const isBusy = table.isBusy;
                  const color = isSelected ? statusColors.selected : isBusy ? statusColors.busy : statusColors.free;
                  const isCircle = table.shape === 'circle';

                  const w = isCircle ? 65 : 80;
                  const h = 60;

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
                        background: `rgba(${isSelected ? '201,168,76' : isBusy ? '231,76,60' : '39,174,96'},0.12)`,
                        border: `2px solid ${color}`,
                        color: color,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        cursor: isBusy ? 'not-allowed' : 'pointer',
                        userSelect: 'none',
                        transition: 'all 0.15s'
                      }}>
                      <span style={{ fontWeight: '700', fontSize: '13px' }}>№{table.number}</span>
                      <span style={{ fontSize: '10px', opacity: 0.8 }}>{table.capacity} мест</span>
                    </div>
                  );
                })}

                {tables.length === 0 && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>Нет доступных столов</div>
                )}
              </div>
            </div>

            {/* Подтверждение стола */}
            {selectedTable && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(201,168,76,0.08)', border: `1px solid rgba(201,168,76,0.2)`, borderRadius: '6px', padding: '12px' }}>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ color: GOLD, fontWeight: '600' }}>Стол №{selectedTable.number}</span>
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', marginLeft: '8px' }}>({selectedTable.capacity} мест)</span>
                </div>
                <button onClick={() => setStep(2)} style={btnStyle(GOLD, '#000')}>Продолжить →</button>
              </div>
            )}
          </div>
        )}

        {/* ШАГ 2: ДАТА И ВРЕМЯ */}
        {step === 2 && (
          <div style={{ width: '100%' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '400', marginBottom: '4px', color: GOLD }}>Дата и время</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '20px' }}>Стол №{selectedTable?.number} · {selectedTable?.capacity} мест</p>

            <FormGroup label="Дата">
              <input type="date" min={minDate} value={reserveDate} onChange={e => handleDateTimeChange(e.target.value, reserveTime)} style={inputStyle} />
            </FormGroup>

            <FormGroup label="Время">
              <input type="time" value={reserveTime} onChange={e => handleDateTimeChange(reserveDate, e.target.value)} style={inputStyle} />
            </FormGroup>

            <FormGroup label="Длительность">
              <select value={duration} onChange={e => setDuration(e.target.value)} style={inputStyle}>
                {[1,2,3,4].map(h => <option key={h} value={h}>{h} {h === 1 ? 'час' : h < 5 ? 'часа' : 'часов'}</option>)}
              </select>
            </FormGroup>

            <FormGroup label="Комментарий">
              <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Пожелания, аллергии..." rows={3} style={{ ...inputStyle, resize: 'none' }} />
            </FormGroup>

            {error && <ErrorBox msg={error} />}

            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
              <button onClick={() => { setStep(1); setError(''); }} style={btnStyle('rgba(255,255,255,0.08)', '#fff', true)}>Назад</button>
              <button onClick={() => { if (!reserveDate || !reserveTime) { setError('Укажите дату и время'); return; } setError(''); setStep(3); }} style={{ ...btnStyle(GOLD, '#000'), flex: 1 }}>Далее →</button>
            </div>
          </div>
        )}

        {/* ШАГ 3: ПРЕДЗАКАЗ МЕНЮ */}
        {step === 3 && (
          <div style={{ width: '100%' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '400', marginBottom: '4px', color: GOLD }}>Предзаказ блюд</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '24px' }}>По желанию — можно заказать на месте</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                {menu.length === 0 && <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', padding: '24px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px' }}>Menu empty</div>}
                
                {Object.entries(menuByCategory).map(([category, items]) => (
                  <div key={category} style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase', color: GOLD, marginBottom: '10px', paddingBottom: '4px', borderBottom: '1px solid rgba(201,168,76,0.15)' }}>
                      {category}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {items.map(item => {
                        const qty = cart[item.id] || 0;
                        return (
                          <div key={item.id} style={{
                            display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px', 
                            background: qty > 0 ? 'rgba(201,168,76,0.05)' : 'rgba(255,255,255,0.02)',
                            border: `1px solid ${qty > 0 ? 'rgba(201,168,76,0.25)' : 'rgba(255,255,255,0.06)'}`,
                            borderRadius: '6px'
                          }}>
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: '600', color: qty > 0 ? GOLD : '#fff' }}>{item.name}</div>
                              {item.description && <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{item.description}</div>}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ color: GOLD, fontWeight: '600', fontSize: '14px' }}>{item.price} ₽</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <button onClick={() => setCart(c => ({ ...c, [item.id]: Math.max(0, (c[item.id] || 0) - 1) }))} style={counterBtnStyle}>−</button>
                                <span style={{ minWidth: '16px', textAlign: 'center', fontSize: '14px', fontWeight: '600' }}>{qty}</span>
                                <button onClick={() => setCart(c => ({ ...c, [item.id]: (c[item.id] || 0) + 1 }))} style={{ ...counterBtnStyle, color: GOLD, borderColor: GOLD }}>+</button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Сводка корзины */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', padding: '16px' }}>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '12px' }}>Итого бронирования</div>
                
                <SummaryRow label="Стол" value={`№${selectedTable?.number}`} />
                <SummaryRow label="Дата" value={reserveDate ? new Date(reserveDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) : '—'} />
                <SummaryRow label="Время" value={`${reserveTime} (${duration} ч.)`} />
                
                {cartItems().length > 0 && (
                  <>
                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '12px 0' }} />
                    {cartItems().map(i => (
                      <SummaryRow key={i.id} label={`${i.name} ×${i.quantity}`} value={`${i.price * i.quantity} ₽`} />
                    ))}
                    <div style={{ height: '1px', background: `rgba(201,168,76,0.2)`, margin: '12px 0' }} />
                    <SummaryRow label="Сумма предзаказа" value={`${cartTotal()} ₽`} gold />
                  </>
                )}

                {error && <ErrorBox msg={error} />}

                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button onClick={handleBook} disabled={loading} style={{ ...btnStyle(GOLD, '#000'), width: '100%' }}>
                    {loading ? 'Оформляем...' : '✓ Подтвердить бронь'}
                  </button>
                  <button onClick={() => { setStep(2); setError(''); }} style={btnStyle('rgba(255,255,255,0.06)', '#fff', true)}>
                    ← Назад
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ШАГ 4: УСПЕХ */}
        {step === 4 && (
          <div style={{ textAlign: 'center', padding: '40px 10px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🍽️</div>
            <h2 style={{ fontSize: '22px', fontWeight: '400', color: GOLD, marginBottom: '8px' }}>Бронь подтверждена</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '4px' }}>
              Стол №{selectedTable?.number} · {reserveDate ? new Date(reserveDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) : ''} · {reserveTime}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '32px' }}>Ждем вас в гости!</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={reset} style={btnStyle(GOLD, '#000')}>Забронировать ещё</button>
              <button onClick={() => onNavigate('reservations')} style={btnStyle('rgba(255,255,255,0.08)', '#fff', true)}>Мои брони</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FormGroup({ label, children }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '6px' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function SummaryRow({ label, value, gold }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
      <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '8px' }}>{label}</span>
      <span style={{ fontSize: '13px', fontWeight: gold ? '700' : '400', color: gold ? '#c9a84c' : '#fff', flexShrink: 0 }}>{value}</span>
    </div>
  );
}

function ErrorBox({ msg }) {
  return (
    <div style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: '4px', padding: '10px', marginBottom: '12px', color: '#fca5a5', fontSize: '13px', textAlign: 'center' }}>
      {msg}
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '12px', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '6px', color: '#fff', fontSize: '16px', outline: 'none',
  colorScheme: 'dark'
};

const counterBtnStyle = {
  width: '32px', height: '32px', borderRadius: '50%', 
  border: `1px solid rgba(255,255,255,0.2)`, background: 'transparent', 
  color: '#fff', cursor: 'pointer', fontSize: '16px', 
  display: 'flex', alignItems: 'center', justifyContent: 'center'
};

function btnStyle(bg, color, ghost = false) {
  return {
    width: '100%', padding: '14px', border: ghost ? '1px solid rgba(255,255,255,0.15)' : 'none',
    borderRadius: '6px', background: bg, color,
    fontSize: '14px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.1s'
  };
}
