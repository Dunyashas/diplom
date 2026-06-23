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
  const [cart, setCart] = useState({});
  const [step, setStep] = useState(1);

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
      {/* Сброс внешних ограничений для ПК версии */}
      <style>{`
        #root, body, main, .app-container, [class*="container"] { 
          max-width: none !important; 
          width: 100% !important; 
          margin: 0 !important; 
          padding: 0 !important;
        }
      `}</style>

      <Navbar onNavigate={onNavigate} />

      {/* Основной контент */}
      <div style={{ width: '100%', maxWidth: '100vw', padding: '24px 6%', boxSizing: 'border-box' }}>

        {/* СТЕППЕР */}
        {step < 4 && (
 <div style={{
    width: '95%',               // Одинаковая ширина с Navbar
    maxWidth: '1400px',         // Одинаковая макс. ширина
    margin: '0 auto 32px auto', // Центрируем
    boxSizing: 'border-box'
  }}>
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      background: 'rgba(255,255,255,0.02)', 
      padding: '16px 24px', 
      borderRadius: '6px', 
      border: '1px solid rgba(255,255,255,0.04)' 
    }}>
      {['Стол', 'Инфо', 'Меню', 'Финиш'].map((label, i) => {
        const s = i + 1;
        const active = step === s;
        const done = step > s;
        return (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: done || active ? 1 : 0.3 }}>
            <div style={{
              width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '600',
              background: done ? GOLD : 'transparent',
              border: `2px solid ${done || active ? GOLD : 'rgba(255,255,255,0.2)'}`,
              color: done ? '#000' : active ? GOLD : 'rgba(255,255,255,0.4)'
            }}>
              {done ? '✓' : s}
            </div>
            <span style={{ fontSize: '14px', color: active ? '#fff' : 'rgba(255,255,255,0.5)' }}>{label}</span>
          </div>
        );
      })}
    </div>
  </div>
)}
        )}

        {/* ШАГ 1: КАРТА СТОЛОВ */}
        {step === 1 && (
          <div style={{ width: '100%' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '400', marginBottom: '4px', color: GOLD }}>Выберите стол</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '16px' }}>
              Нажмите на свободный стол, чтобы начать бронирование
            </p>

            {/* Легенда */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
              {[['#27ae60', 'Свободен'], ['#e74c3c', 'Занят'], [GOLD, 'Выбран']].map(([color, label]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color }} />
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>{label}</span>
                </div>
              ))}
            </div>

            {/* Окно просмотра карты (свайпы на телефонах) */}
            <div style={{ 
              width: '100%', 
              height: '65vh', 
              minHeight: '500px',
              overflow: 'auto', 
              border: `1px solid rgba(201,168,76,0.15)`, 
              borderRadius: '8px', 
              background: '#111', 
              marginBottom: '24px',
              position: 'relative',
              WebkitOverflowScrolling: 'touch',
              touchAction: 'auto'
            }}>
              {/* Фиксированная подложка на 1000px спасает пропорции и включает скролл */}
              <div style={{ 
                position: 'relative', 
                width: '1000px', 
                height: '100%', 
                minHeight: '480px',
                background: 'linear-gradient(180deg, #161616 0%, #111 100%)', 
                boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5)',
                margin: '0 auto'
              }}>
                
                <div style={{ position: 'absolute', top: 0, left: '42%', width: '16%', background: 'rgba(201,168,76,0.15)', color: GOLD, textAlign: 'center', fontSize: '10px', padding: '6px 0', borderRadius: '0 0 4px 4px', zIndex: 2 }}>ВХОД</div>
                
                {tables.map(table => {
                  const isSelected = selectedTable?.id === table.id;
                  const isBusy = table.isBusy;
                  const color = isSelected ? statusColors.selected : isBusy ? statusColors.busy : statusColors.free;
                  const isCircle = table.shape === 'circle';

                  const w = isCircle ? 70 : 85;
                  const h = 65;

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
                      <span style={{ fontWeight: '700', fontSize: '14px' }}>№{table.number}</span>
                      <span style={{ fontSize: '11px', opacity: 0.8 }}>{table.capacity} мест</span>
                    </div>
                  );
                })}

                {tables.length === 0 && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>Нет доступных столов</div>
                )}
              </div>
            </div>

            {/* Подтверждение стола */}
            {selectedTable && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(201,168,76,0.08)', border: `1px solid rgba(201,168,76,0.2)`, borderRadius: '6px', padding: '16px', maxWidth: '400px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ color: GOLD, fontWeight: '600', fontSize: '16px' }}>Стол №{selectedTable.number}</span>
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginLeft: '8px' }}>({selectedTable.capacity} мест)</span>
                </div>
                <button onClick={() => setStep(2)} style={btnStyle(GOLD, '#000')}>Продолжить →</button>
              </div>
            )}
          </div>
        )}

        {/* ШАГ 2: ДАТА И ВРЕМЯ */}
        {step === 2 && (
          <div style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '400', marginBottom: '4px', color: GOLD }}>Дата и время</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '20px' }}>Стол №{selectedTable?.number} · {selectedTable?.capacity} мест</p>

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

            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button onClick={() => { setStep(1); setError(''); }} style={btnStyle('rgba(255,255,255,0.08)', '#fff', true)}>Назад</button>
              <button onClick={() => { if (!reserveDate || !reserveTime) { setError('Укажите дату и время'); return; } setError(''); setStep(3); }} style={{ ...btnStyle(GOLD, '#000'), flex: 1 }}>Далее →</button>
            </div>
          </div>
        )}

        {/* ШАГ 3: ПРЕДЗАКАЗ МЕНЮ */}
        {step === 3 && (
          <div style={{ width: '100%' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '400', marginBottom: '4px', color: GOLD }}>Предзаказ блюд</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '24px' }}>По желанию — можно заказать на месте</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px', alignItems: 'flex-start' }}>
              
              <div style={{ width: '100%' }}>
                {menu.length === 0 && <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', padding: '24px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px' }}>Menu empty</div>}
                
                {Object.entries(menuByCategory).map(([category, items]) => (
                  <div key={category} style={{ marginBottom: '24px' }}>
                    <div style={{ fontSize: '13px', letterSpacing: '1px', textTransform: 'uppercase', color: GOLD, marginBottom: '12px', paddingBottom: '6px', borderBottom: '1px solid rgba(201,168,76,0.15)' }}>
                      {category}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {items.map(item => {
                        const qty = cart[item.id] || 0;
                        return (
                          <div key={item.id} style={{
                            display: 'flex', flexDirection: 'column', gap: '12px', padding: '14px', 
                            background: qty > 0 ? 'rgba(201,168,76,0.05)' : 'rgba(255,255,255,0.02)',
                            border: `1px solid ${qty > 0 ? 'rgba(201,168,76,0.25)' : 'rgba(255,255,255,0.06)'}`,
                            borderRadius: '6px'
                          }}>
                            <div>
                              <div style={{ fontSize: '15px', fontWeight: '600', color: qty > 0 ? GOLD : '#fff' }}>{item.name}</div>
                              {item.description && <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>{item.description}</div>}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ color: GOLD, fontWeight: '600', fontSize: '15px' }}>{item.price} ₽</span>
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

              {/* Корзина */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', padding: '20px', position: 'sticky', top: '20px' }}>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '14px' }}>Итого бронирования</div>
                
                <SummaryRow label="Стол" value={`№${selectedTable?.number}`} />
                <SummaryRow label="Дата" value={reserveDate ? new Date(reserveDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) : '—'} />
                <SummaryRow label="Время" value={`${reserveTime} (${duration} ч.)`} />
                
                {cartItems().length > 0 && (
                  <>
                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '14px 0' }} />
                    {cartItems().map(i => (
                      <SummaryRow key={i.id} label={`${i.name} ×${i.quantity}`} value={`${i.price * i.quantity} ₽`} />
                    ))}
                    <div style={{ height: '1px', background: `rgba(201,168,76,0.2)`, margin: '14px 0' }} />
                    <SummaryRow label="Сумма предзаказа" value={`${cartTotal()} ₽`} gold />
                  </>
                )}

                {error && <ErrorBox msg={error} />}

                <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
          <div style={{ textHighlight: 'center', padding: '60px 10px', maxWidth: '480px', margin: '0 auto' }}>
            <div style={{ fontSize: '54px', marginBottom: '16px' }}>🍽️</div>
            <h2 style={{ fontSize: '24px', fontWeight: '400', color: GOLD, marginBottom: '8px' }}>Бронь подтверждена</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '15px', marginBottom: '4px' }}>
              Стол №{selectedTable?.number} · {reserveDate ? new Date(reserveDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) : ''} · {reserveTime}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '32px' }}>Ждем вас в гости!</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
    <div style={{ marginBottom: '18px' }}>
      <label style={{ display: 'block', fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '6px' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function SummaryRow({ label, value, gold }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
      <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '8px' }}>{label}</span>
      <span style={{ fontSize: '14px', fontWeight: gold ? '700' : '400', color: gold ? '#c9a84c' : '#fff', flexShrink: 0 }}>{value}</span>
    </div>
  );
}

function ErrorBox({ msg }) {
  return (
    <div style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: '4px', padding: '12px', marginBottom: '14px', color: '#fca5a5', fontSize: '14px', textAlign: 'center' }}>
      {msg}
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '14px', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '6px', color: '#fff', fontSize: '16px', outline: 'none',
  colorScheme: 'dark'
};

const counterBtnStyle = {
  width: '34px', height: '34px', borderRadius: '50%', 
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
