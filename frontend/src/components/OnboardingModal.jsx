import { useState } from 'react';

const GOLD = '#c9a84c';

export default function OnboardingModal({ onAccept }) {
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [checked, setChecked] = useState(false);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollTop + clientHeight >= scrollHeight - 10) {
      setScrolledToBottom(true);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', fontFamily: "'Georgia', 'Times New Roman', serif"
    }}>
      <div style={{
        width: '100%', maxWidth: '480px',
        background: '#111',
        border: `1px solid rgba(201,168,76,0.4)`,
        borderRadius: '4px',
        boxShadow: '0 40px 80px rgba(0,0,0,0.8)',
        overflow: 'hidden'
      }}>
        
        <div style={{ padding: '24px 28px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: '11px', letterSpacing: '4px', color: GOLD, textTransform: 'uppercase', marginBottom: '6px' }}>Elegance Resto</div>
          <div style={{ fontSize: '18px', color: '#fff', fontWeight: '300', letterSpacing: '1px' }}>Добро пожаловать</div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>Ознакомьтесь с правилами работы сервиса</div>
        </div>

        
        <div
          onScroll={handleScroll}
          style={{
            maxHeight: '320px', overflowY: 'auto', padding: '20px 28px',
            scrollbarWidth: 'thin', scrollbarColor: `${GOLD}44 transparent`
          }}
        >
          <Section title="Бронирование" gold={GOLD}>
            <Item gold={GOLD} title="Создание брони">
              Выберите дату, время и количество гостей. Бронирование доступно минимум за 2 часа до визита.
            </Item>
            <Item gold={GOLD} title="Опоздание">
              При опоздании более чем на 45 минут бронирование может быть аннулировано.
            </Item>
          </Section>

          <Section title="Личный кабинет" gold={GOLD}>
            <Item gold={GOLD} title="Мои брони">
              Все ваши бронирования хранятся в разделе «Мои брони». Там можно проверить статус или отменить бронь.
            </Item>
            <Item gold={GOLD} title="Профиль">
              Укажите имя и номер телефона — с вами могут связаться для подтверждения визита.
            </Item>
          </Section>

          <Section title="Отмена" gold={GOLD}>
            <Item gold={GOLD} title="Отмена бронирования">
              Отменить бронь можно в личном кабинете не позднее чем за 1 час до начала визита.
            </Item>
          </Section>

          <Section title="Поддержка" gold={GOLD}>
            <Item gold={GOLD} title="Обратная связь">
              Если что-то пошло не так — напишите нам на&nbsp;
              <span style={{ color: GOLD }}>support@eleganceresto.ru</span>. Мы ответим как можно скорее.
            </Item>
          </Section>
        </div>

       
        {!scrolledToBottom && (
          <div style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.25)', padding: '6px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            ↓ прокрутите вниз, чтобы продолжить
          </div>
        )}

        
        <div style={{
          padding: '16px 28px', borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px'
        }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: scrolledToBottom ? 'pointer' : 'not-allowed', userSelect: 'none' }}>
            <input
              type="checkbox"
              disabled={!scrolledToBottom}
              checked={checked}
              onChange={e => setChecked(e.target.checked)}
              style={{ accentColor: GOLD, width: '15px', height: '15px', cursor: scrolledToBottom ? 'pointer' : 'not-allowed' }}
            />
            <span style={{ fontSize: '13px', color: scrolledToBottom ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)' }}>
              {scrolledToBottom ? 'Я ознакомился с правилами' : 'Прочитайте всё до конца'}
            </span>
          </label>

          <button
            disabled={!checked}
            onClick={onAccept}
            style={{
              padding: '10px 24px',
              border: `1px solid ${checked ? GOLD : 'rgba(255,255,255,0.15)'}`,
              borderRadius: '2px',
              background: checked ? GOLD : 'transparent',
              color: checked ? '#000' : 'rgba(255,255,255,0.25)',
              fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase',
              fontWeight: '600', cursor: checked ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit', transition: 'all 0.2s'
            }}
          >
            Принять
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, gold, children }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: gold, marginBottom: '10px' }}>
        {title}
      </div>
      <div style={{ borderLeft: `1px solid rgba(201,168,76,0.2)`, paddingLeft: '14px' }}>
        {children}
      </div>
    </div>
  );
}

function Item({ title, gold, children }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ fontSize: '13px', color: '#fff', fontWeight: '400', marginBottom: '3px' }}>{title}</div>
      <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.6' }}>{children}</div>
    </div>
  );
}
