import { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import Navbar from '../components/Navbar';

const GOLD = '#c9a84c';

const STATUS_LABELS = {
  CONFIRMED: { label: 'Подтверждено', color: '#27ae60' },
  PENDING:   { label: 'Ожидает', color: '#f39c12' },
  HOLD:      { label: 'Удерживается', color: '#3498db' },
  CANCELLED: { label: 'Отменено', color: '#e74c3c' }
};

const NAV_ITEMS = [
  { id: 'dashboard',    icon: '📊', label: 'Дашборд' },
  { id: 'reservations', icon: '📋', label: 'Бронирования' },
  { id: 'tables',       icon: '🪑', label: 'Карта зала' },
  { id: 'menu',         icon: '🍽️', label: 'Меню' },
];

export default function AdminPanel() {
  const [tab, setTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleNav = (id) => { setTab(id); setSidebarOpen(false); };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: "'Georgia', serif" }}>
      <Navbar />

      <button
        onClick={() => setSidebarOpen(o => !o)}
        style={{
          display: 'none',
          position: 'fixed', top: '68px', left: '12px', zIndex: 200,
          width: '40px', height: '40px', borderRadius: '6px',
          background: 'rgba(201,168,76,0.15)', border: `1px solid rgba(201,168,76,0.4)`,
          color: GOLD, fontSize: '18px', cursor: 'pointer',
          alignItems: 'center', justifyContent: 'center',
          id: 'burger-btn'
        }}
        className="burger-btn"
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>

      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 150
        }} />
      )}

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 60px)' }}>
        {/* Sidebar */}
        <aside style={{
          width: '220px', flexShrink: 0,
          background: 'rgba(255,255,255,0.02)',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          padding: '24px 12px',
          transition: 'transform 0.25s ease',
        }} className={`admin-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => handleNav(item.id)} style={{
              display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
              padding: '10px 14px', borderRadius: '4px', border: 'none', marginBottom: '4px',
              background: tab === item.id ? 'rgba(201,168,76,0.15)' : 'transparent',
              color: tab === item.id ? GOLD : 'rgba(255,255,255,0.6)',
              fontSize: '14px', cursor: 'pointer', fontFamily: "'Georgia', serif",
              textAlign: 'left', transition: 'all 0.15s',
              borderLeft: tab === item.id ? `3px solid ${GOLD}` : '3px solid transparent'
            }}>
              <span>{item.icon}</span> {item.label}
            </button>
          ))}
        </aside>

        <main style={{ flex: 1, padding: '32px', overflow: 'auto', minWidth: 0 }}>
          {tab === 'dashboard'    && <Dashboard />}
          {tab === 'reservations' && <ReservationsTab />}
          {tab === 'tables'       && <TablesTab />}
          {tab === 'menu'         && <MenuTab />}
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .burger-btn { display: flex !important; }
          .admin-sidebar {
            position: fixed !important;
            top: 60px; left: 0; bottom: 0;
            z-index: 160;
            transform: translateX(-100%);
            background: #111 !important;
            border-right: 1px solid rgba(201,168,76,0.3) !important;
            padding-top: 16px !important;
            overflow-y: auto;
          }
          .admin-sidebar.sidebar-open {
            transform: translateX(0);
          }
          main { padding: 16px !important; }
        }
      `}</style>
    </div>
  );
}

function Dashboard() {
  const [stats, setStats] = useState(null);
  useEffect(() => { api.getStats().then(setStats).catch(console.error); }, []);

  return (
    <div>
      <PageTitle title="Дашборд" subtitle="Общая статистика заведения" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '40px' }}>
        <StatCard icon="👥" label="Гостей зарегистрировано" value={stats?.totalUsers ?? '—'} />
        <StatCard icon="🪑" label="Столов в зале"           value={stats?.totalTables ?? '—'} />
        <StatCard icon="📅" label="Броней сегодня"          value={stats?.todayReservations ?? '—'} gold />
        <StatCard icon="📊" label="Броней всего"            value={stats?.totalReservations ?? '—'} />
      </div>
      <div style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '4px', padding: '20px 24px' }}>
        <div style={{ fontSize: '11px', letterSpacing: '3px', color: GOLD, textTransform: 'uppercase', marginBottom: '8px' }}>Подсказка</div>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
          «Бронирования» — управление заказами гостей.<br />
          «Карта зала» — перетаскивайте, изменяйте размер и добавляйте столы.<br />
          «Меню» — настройте блюда для предзаказа.
        </p>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, gold }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${gold ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.08)'}`, borderRadius: '4px', padding: '24px' }}>
      <div style={{ fontSize: '28px', marginBottom: '12px' }}>{icon}</div>
      <div style={{ fontSize: '32px', fontWeight: '300', color: gold ? GOLD : '#fff', marginBottom: '6px' }}>{value}</div>
      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{label}</div>
    </div>
  );
}

function ReservationsTab() {
  const [list, setList] = useState([]);
  const [filter, setFilter] = useState({ date: '', status: '' });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter.date) params.date = filter.date;
      if (filter.status) params.status = filter.status;
      const data = await api.getAdminReservations(Object.keys(params).length ? params : undefined);
      setList(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter]);

  const handleStatus = async (id, status) => {
    try { await api.updateReservationStatus(id, status); load(); }
    catch (err) { alert(err.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить бронь полностью? Это нельзя отменить.')) return;
    try { await api.deleteReservation(id); load(); }
    catch (err) { alert(err.message); }
  };

  return (
    <div>
      <PageTitle title="Бронирования" subtitle={`Всего записей: ${list.length}`} />
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <input type="date" value={filter.date} onChange={e => setFilter(f => ({ ...f, date: e.target.value }))} style={{ ...adminInput, width: '170px' }} />
        <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))} style={{ ...adminInput, width: '170px' }}>
          <option value="">Все статусы</option>
          <option value="CONFIRMED">Подтверждено</option>
          <option value="PENDING">Ожидает</option>
          <option value="CANCELLED">Отменено</option>
        </select>
        <button onClick={() => setFilter({ date: '', status: '' })} style={ghostBtn}>Сбросить</button>
      </div>

      {loading ? <Loading /> : list.length === 0 ? <Empty text="Бронирований не найдено" /> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr>
                {['Стол', 'Гость', 'Начало', 'Конец', 'Предзаказ', 'Статус', 'Действия'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '11px', letterSpacing: '1px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map(r => {
                const s = STATUS_LABELS[r.status] || { label: r.status, color: '#888' };
                const preorderTotal = r.preorders?.reduce((sum, p) => sum + (p.menuItem?.price || 0) * p.quantity, 0) || 0;
                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px', fontWeight: '600', color: GOLD }}>№{r.table?.number}</td>
                    <td style={{ padding: '12px' }}>
                      <div>{r.user?.firstName} {r.user?.lastName}</div>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{r.user?.email}</div>
                    </td>
                    <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>{new Date(r.startTime).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                    <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>{new Date(r.endTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td style={{ padding: '12px', color: preorderTotal > 0 ? GOLD : 'rgba(255,255,255,0.3)' }}>
                      {preorderTotal > 0 ? `${preorderTotal.toLocaleString('ru-RU')} ₽` : '—'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '20px', background: `${s.color}22`, color: s.color, border: `1px solid ${s.color}44`, whiteSpace: 'nowrap' }}>
                        {s.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {r.status !== 'CANCELLED' && (
                          <>
                            {r.status !== 'CONFIRMED' && <ActionBtn label="✓" color="#27ae60" onClick={() => handleStatus(r.id, 'CONFIRMED')} />}
                            <ActionBtn label="✕ Отменить" color="#e74c3c" onClick={() => handleStatus(r.id, 'CANCELLED')} />
                          </>
                        )}
                        <ActionBtn label="🗑" color="#888" onClick={() => handleDelete(r.id)} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TablesTab() {
  const [tables, setTables] = useState([]);
  const [form, setForm] = useState({ number: '', capacity: 4, shape: 'rectangle' });
  const [selectedTable, setSelectedTable] = useState(null);
  const [error, setError] = useState('');
  const isDragging = useRef(false);
  const isMobile = window.innerWidth <= 768;

const [showManagePanel, setShowManagePanel] = useState(false);

  const load = async () => {
    const data = await api.getTables();
    setTables(Array.isArray(data) ? data : []);
  };
  useEffect(() => { load(); }, []);

  const handleDrop = async (e) => {
    const tableId = e.dataTransfer.getData('tableId');
    const rect = e.currentTarget.getBoundingClientRect();
    const posX = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const posY = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, posX, posY } : t));
    try { await api.updateTable(tableId, { posX, posY }); } catch { load(); }
  };

  const handleAdd = async (e) => {
    e.preventDefault(); setError('');
    try {
      await api.createTable({ ...form, number: parseInt(form.number), capacity: parseInt(form.capacity) });
      load(); setForm({ number: '', capacity: 4, shape: 'rectangle' });
    } catch (err) { setError(err.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить стол?')) return;
    if (selectedTable?.id === id) setSelectedTable(null);
    await api.deleteTable(id); load();
  };

  const startResize = (e, table) => {
  e.preventDefault();
  e.stopPropagation();
  isDragging.current = true;
  const startX = e.clientX;
  const startY = e.clientY;
  const startW = table.tableW || 100;
  const startH = table.tableH || 76;

  const onMove = (mv) => {
    const newW = Math.max(60, Math.round(startW + (mv.clientX - startX)));
    const newH = Math.max(50, Math.round(startH + (mv.clientY - startY)));
    setTables(prev => prev.map(t => t.id === table.id ? { ...t, tableW: newW, tableH: newH } : t));
    setSelectedTable(prev => prev?.id === table.id ? { ...prev, tableW: newW, tableH: newH } : prev);
  };

  const onUp = async (mv) => {
    isDragging.current = false;
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    const newW = Math.max(60, Math.round(startW + (mv.clientX - startX)));
    const newH = Math.max(50, Math.round(startH + (mv.clientY - startY)));
    try {
      await api.updateTable(table.id, {
        number: table.number,
        capacity: table.capacity,
        shape: table.shape,
        posX: table.posX,
        posY: table.posY,
        tableW: newW,
        tableH: newH
      });

      setSelectedTable(prev => prev?.id === table.id ? { ...prev, tableW: newW, tableH: newH } : prev);
    } catch (err) {
      console.error(err);
      load();
    }
  };

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
};

  const handleCapacity = async (delta) => {
    if (!selectedTable) return;
    const updated = { ...selectedTable, capacity: Math.max(1, selectedTable.capacity + delta) };
    setSelectedTable(updated);
    setTables(prev => prev.map(t => t.id === updated.id ? updated : t));
    try { await api.updateTable(updated.id, { capacity: updated.capacity }); } catch { load(); }
  };

  const handleShapeChange = async (shape) => {
    if (!selectedTable) return;
    const updated = { ...selectedTable, shape };
    setSelectedTable(updated);
    setTables(prev => prev.map(t => t.id === updated.id ? updated : t));
    try { await api.updateTable(updated.id, { shape }); } catch { load(); }
  };

  return (
    <div>
      <PageTitle title="Карта зала" subtitle="Перетаскивайте столы · Тяните за ↘ угол чтобы изменить размер" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '24px', alignItems: 'start' }}>

        <div>
  <div style={{
    position: 'relative',
    height: isMobile ? '80vh' : '520px',
    width: isMobile ? '1200px' : '100%',
    background: 'linear-gradient(180deg, #141414 0%, #0f0f0f 100%)',
    border: `1px solid rgba(201,168,76,0.2)`,
    borderRadius: '4px',
    overflow: 'hidden'
  }}
            onDragOver={e => e.preventDefault()} onDrop={handleDrop}>

            <div style={{ position: 'absolute', top: 0, left: '44%', width: '12%', background: 'rgba(201,168,76,0.1)', color: GOLD, textAlign: 'center', fontSize: '10px', padding: '5px 0', letterSpacing: '2px', borderRadius: '0 0 4px 4px' }}>
              ВХОД
            </div>

            {tables.map(table => {
              const isSelected = selectedTable?.id === table.id;
              const w = table.tableW || (table.shape === 'circle' ? 80 : 100);
              const h = table.tableH || 76;

              return (
                <div key={table.id}
                  draggable
                  onDragStart={e => { if (isDragging.current) { e.preventDefault(); return; } e.dataTransfer.setData('tableId', table.id); }}
                  onClick={() => setSelectedTable(isSelected ? null : table)}
                  style={{
                    position: 'absolute',
                    left: `calc(${table.posX}% - ${w / 2}px)`,
                    top: `calc(${table.posY}% - ${h / 2}px)`,
                    width: `${w}px`, height: `${h}px`,
                    borderRadius: table.shape === 'circle' ? '50%' : '6px',
                    background: isSelected ? 'rgba(201,168,76,0.25)' : 'rgba(201,168,76,0.12)',
                    border: `2px solid ${isSelected ? '#fff' : GOLD}`,
                    color: isSelected ? '#fff' : GOLD,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    cursor: 'move', userSelect: 'none',
                    boxShadow: isSelected ? '0 0 16px rgba(201,168,76,0.5)' : '0 4px 12px rgba(0,0,0,0.4)',
                    transition: 'box-shadow 0.15s'
                  }}>
                  <span style={{ fontWeight: '700', fontSize: '14px' }}>№{table.number}</span>
                  <span style={{ fontSize: '10px', opacity: 0.7 }}>{table.capacity} мест</span>

                  <button onClick={(e) => { e.stopPropagation(); handleDelete(table.id); }}
                    style={{ position: 'absolute', top: '-7px', right: '-7px', width: '20px', height: '20px', borderRadius: '50%', background: '#e74c3c', border: 'none', color: '#fff', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    ×
                  </button>

                  {table.shape !== 'circle' && (
                    <div
                      onMouseDown={(e) => startResize(e, table)}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        position: 'absolute', bottom: '2px', right: '2px',
                        width: '14px', height: '14px', cursor: 'se-resize',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: isSelected ? 'rgba(255,255,255,0.8)' : 'rgba(201,168,76,0.6)',
                        fontSize: '10px', lineHeight: 1,
                        userSelect: 'none'
                      }}
                      title="Потяните для изменения размера"
                    >
                      ◢
                    </div>
                  )}

                  {table.shape === 'circle' && (
                    <div
                      onMouseDown={(e) => startResize(e, table)}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        position: 'absolute', bottom: '-8px', right: '-8px',
                        width: '16px', height: '16px', cursor: 'se-resize',
                        background: isSelected ? 'rgba(255,255,255,0.3)' : 'rgba(201,168,76,0.4)',
                        borderRadius: '50%', border: `1px solid ${GOLD}`,
                        userSelect: 'none'
                      }}
                      title="Потяните для изменения размера"
                    />
                  )}
                </div>
              );
            })}

            {tables.length === 0 && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '14px' }}>
                Добавьте первый стол →
              </div>
            )}
          </div>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '8px' }}>
            Перетащите стол чтобы переместить · Нажмите чтобы выбрать · Тяните ◢ чтобы изменить размер
          </p>
        </div>

        
       {!isMobile && (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}
  >

          
          {selectedTable ? (
            <div style={{ background: 'rgba(201,168,76,0.08)', border: `1px solid rgba(201,168,76,0.3)`, borderRadius: '4px', padding: '20px' }}>
              <div style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: GOLD, marginBottom: '16px' }}>
                Стол №{selectedTable.number}
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px', letterSpacing: '1px', textTransform: 'uppercase' }}>Размер (пикс.)</div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
                  {selectedTable.tableW || (selectedTable.shape === 'circle' ? 80 : 100)} × {selectedTable.tableH || 76} px
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginLeft: '6px' }}>тяните ◢</span>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px', letterSpacing: '1px', textTransform: 'uppercase' }}>Вместимость</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button onClick={() => handleCapacity(-1)} style={resizeBtn}>−</button>
                  <span style={{ fontSize: '20px', fontWeight: '600', color: '#fff', minWidth: '30px', textAlign: 'center' }}>{selectedTable.capacity}</span>
                  <button onClick={() => handleCapacity(1)} style={resizeBtn}>+</button>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>мест</span>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px', letterSpacing: '1px', textTransform: 'uppercase' }}>Форма</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[['rectangle', '▬ Прямоугольный'], ['circle', '● Круглый']].map(([val, label]) => (
                    <button key={val} onClick={() => handleShapeChange(val)}
                      style={{
                        flex: 1, padding: '8px 4px', border: `1px solid ${selectedTable.shape === val ? GOLD : 'rgba(255,255,255,0.15)'}`,
                        borderRadius: '3px', background: selectedTable.shape === val ? 'rgba(201,168,76,0.2)' : 'transparent',
                        color: selectedTable.shape === val ? GOLD : 'rgba(255,255,255,0.5)',
                        fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit'
                      }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={() => setSelectedTable(null)} style={{ ...ghostBtn, width: '100%', fontSize: '12px' }}>
                Снять выделение
              </button>
            </div>
          ) : (
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px', padding: '16px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>
              Нажмите на стол<br />чтобы редактировать
            </div>
          )}

         
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '20px' }}>
            <div style={{ fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: GOLD, marginBottom: '16px' }}>Добавить стол</div>
            <form onSubmit={handleAdd}>
              <AdminField label="Номер стола">
                <input type="number" required value={form.number} onChange={e => setForm(f => ({ ...f, number: e.target.value }))} style={adminInput} />
              </AdminField>
              <AdminField label="Вместимость">
                <input type="number" required min="1" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} style={adminInput} />
              </AdminField>
              <AdminField label="Форма">
                <select value={form.shape} onChange={e => setForm(f => ({ ...f, shape: e.target.value }))} style={adminInput}>
                  <option value="rectangle">Прямоугольный</option>
                  <option value="circle">Круглый</option>
                </select>
              </AdminField>
              {error && <div style={{ color: '#fca5a5', fontSize: '13px', marginBottom: '12px' }}>{error}</div>}
              <button type="submit" style={{ ...goldBtn, width: '100%' }}>+ Создать стол</button>
            </form>

            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '11px', letterSpacing: '2px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Столов: {tables.length}
              </div>
              {tables.map(t => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '13px' }}>
                  <span style={{ color: GOLD }}>№{t.number}</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>{t.capacity} мест · {t.shape === 'circle' ? '○' : '□'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
       )}
      </div>
    </div>
  );
}


function MenuTab() {
  const [menu, setMenu] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', price: '', category: '', imageUrl: '' });
  const [error, setError] = useState('');

  const load = async () => { try { setMenu(await api.getMenu()); } catch { setMenu([]); } };
  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    setError('');
    if (!form.name || !form.price || !form.category) { setError('Название, цена и категория обязательны'); return; }
    try {
      await api.createMenuItem({ ...form, price: parseFloat(form.price) });
      load(); setForm({ name: '', description: '', price: '', category: '', imageUrl: '' });
    } catch (err) { setError(err.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить позицию?')) return;
    await api.deleteMenuItem(id); load();
  };

  const categories = [...new Set(menu.map(m => m.category))];

  return (
    <div>
      <PageTitle title="Меню" subtitle={`${menu.length} позиций`} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '32px', alignItems: 'start' }}>

        <div>
          {menu.length === 0 ? <Empty text="Меню пока пустое. Добавьте первую позицию." /> : (
            categories.map(cat => (
              <div key={cat} style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: GOLD, marginBottom: '10px', paddingBottom: '6px', borderBottom: '1px solid rgba(201,168,76,0.2)' }}>
                  {cat}
                </div>
                {menu.filter(m => m.category === cat).map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                      <div style={{ fontSize: '14px', marginBottom: '2px' }}>{item.name}</div>
                      {item.description && <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{item.description}</div>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
                      <span style={{ color: GOLD, fontWeight: '600' }}>{item.price.toLocaleString('ru-RU')} ₽</span>
                      <button onClick={() => handleDelete(item.id)} style={{ border: '1px solid rgba(231,76,60,0.4)', borderRadius: '3px', background: 'transparent', color: '#e74c3c', padding: '4px 10px', fontSize: '12px', cursor: 'pointer' }}>
                        Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '20px', position: 'sticky', top: '20px' }}>
          <div style={{ fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: GOLD, marginBottom: '16px' }}>Добавить позицию</div>
          <AdminField label="Название">
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={adminInput} />
          </AdminField>
          <AdminField label="Описание">
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={adminInput} />
          </AdminField>
          <AdminField label="Цена (₽)">
            <input type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} style={adminInput} />
          </AdminField>
          <AdminField label="Категория">
            <select 
              value={form.category} 
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))} 
              style={adminInput}
  >           
              <option value="" disabled>Выберите категорию</option>
              
              <option value="Горячее">Горячее</option>
              <option value="Салаты">Салаты</option>
              <option value="Напитки">Напитки</option>
              <option value="Десерты">Десерты</option>
              </select>
            </AdminField>
          {error && <div style={{ color: '#fca5a5', fontSize: '13px', marginBottom: '12px' }}>{error}</div>}
          <button type="button" onClick={handleAdd} style={{ ...goldBtn, width: '100%' }}>+ Добавить</button>
        </div>
      </div>
    </div>
  );
}

function PageTitle({ title, subtitle }) {
  return (
    <div style={{ marginBottom: '32px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '300', letterSpacing: '2px', color: GOLD, margin: '0 0 4px' }}>{title}</h1>
      {subtitle && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: 0 }}>{subtitle}</p>}
    </div>
  );
}

function AdminField({ label, children }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <label style={{ display: 'block', fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '6px' }}>{label}</label>
      {children}
    </div>
  );
}

function ActionBtn({ label, color, onClick }) {
  return (
    <button onClick={onClick} style={{ padding: '4px 10px', border: `1px solid ${color}55`, borderRadius: '3px', background: 'transparent', color, fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
      {label}
    </button>
  );
}

function Loading() { return <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>Загрузка...</div>; }
function Empty({ text }) { return <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '14px', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px' }}>{text}</div>; }

const adminInput = {
  width: '100%', padding: '9px 12px', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '3px', color: '#fff', fontSize: '14px', outline: 'none',
  fontFamily: "'Georgia', serif", colorScheme: 'dark'
};

const goldBtn = { padding: '10px 20px', border: 'none', borderRadius: '3px', background: GOLD, color: '#000', fontSize: '13px', letterSpacing: '1px', cursor: 'pointer', fontFamily: "'Georgia', serif", fontWeight: '600' };
const ghostBtn = { padding: '9px 16px', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '3px', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: '13px', cursor: 'pointer', fontFamily: "'Georgia', serif" };
const resizeBtn = { width: '32px', height: '32px', borderRadius: '50%', border: `1px solid rgba(201,168,76,0.5)`, background: 'transparent', color: GOLD, fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' };
