require('dotenv').config();
const express = require('express');
const cors = require('cors');
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true 
}));
const { PrismaClient } = require('@prisma/client');
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} = require('@simplewebauthn/server');
const bcrypt = require('bcrypt');

const app = express();
const prisma = new PrismaClient();

prisma.$connect()
  .then(() => console.log(' Prisma подключена к БД'))
  .catch(err => console.error(' Ошибка подключения к БД:', err.message));

app.use(cors({ origin: '*', credentials: false }));
app.use(express.json());

const rpName = 'Elegance Resto';
const rpID = process.env.RP_ID || 'localhost';
const originUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
const challenges = {};

async function requireAuth(req, res, next) {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Необходима авторизация' });
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(401).json({ error: 'Пользователь не найден' });
    req.user = user;
    next();
  } catch { res.status(500).json({ error: 'Ошибка проверки авторизации' }); }
}

async function checkAdmin(req, res, next) {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Необходима авторизация' });
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.role === 'ADMIN') { req.user = user; next(); }
    else res.status(403).json({ error: 'Доступ запрещён. Только для администратора.' });
  } catch { res.status(500).json({ error: 'Ошибка проверки прав доступа' }); }
}

app.get('/', (req, res) => res.send('<h1> API запущен</h1>'));

app.get('/ping', (req, res) => res.status(200).send('Pong!'));

app.get('/api/tables', async (req, res) => {
  try {
    const { date, startTime, endTime } = req.query;
    const tables = await prisma.table.findMany({ where: { isRemoved: false }, orderBy: { number: 'asc' } });
    if (date && startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      const busyReservations = await prisma.reservation.findMany({
        where: {
          status: { in: ['CONFIRMED', 'HOLD', 'PENDING'] },
          OR: [
            { startTime: { lte: start }, endTime: { gt: start } },
            { startTime: { lt: end }, endTime: { gte: end } },
            { startTime: { gte: start }, endTime: { lte: end } }
          ]
        },
        select: { tableId: true }
      });
      const busyIds = new Set(busyReservations.map(r => r.tableId));
      return res.json(tables.map(t => ({ ...t, isBusy: busyIds.has(t.id) })));
    }
    res.json(tables.map(t => ({ ...t, isBusy: false })));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Ошибка получения столов' }); }
});

app.put('/api/tables/:id', checkAdmin, async (req, res) => {
  const { posX, posY, number, capacity, shape, tableW, tableH } = req.body;
  try {
    const table = await prisma.table.update({
      where: { id: req.params.id },
      data: {
        posX, posY,
        number: number != null ? parseInt(number) : undefined,
        capacity: capacity != null ? parseInt(capacity) : undefined,
        shape,
        tableW: tableW != null ? parseInt(tableW) : undefined,
        tableH: tableH != null ? parseInt(tableH) : undefined,
      }
    });
    res.json(table);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Не удалось обновить стол' }); }
});

app.post('/api/admin/tables', checkAdmin, async (req, res) => {
  const { number, capacity, posX, posY, shape } = req.body;
  if (!number || !capacity) return res.status(400).json({ error: 'Номер и вместимость обязательны' });
  try {
    const existing = await prisma.table.findFirst({ where: { number: parseInt(number), isRemoved: false } });
    if (existing) return res.status(400).json({ error: `Стол №${number} уже существует` });
    const removed = await prisma.table.findFirst({ where: { number: parseInt(number), isRemoved: true } });
    if (removed) {
      const table = await prisma.table.update({
        where: { id: removed.id },
        data: { isRemoved: false, capacity: parseInt(capacity), posX: posX || 45, posY: posY || 45, shape: shape || 'rectangle' }
      });
      return res.json(table);
    }
    const table = await prisma.table.create({
      data: { number: parseInt(number), capacity: parseInt(capacity), posX: posX || 45, posY: posY || 45, shape: shape || 'rectangle' }
    });
    res.json(table);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Не удалось создать стол' }); }
});

app.delete('/api/admin/tables/:id', checkAdmin, async (req, res) => {
  try {
    await prisma.table.update({ where: { id: req.params.id }, data: { isRemoved: true } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Не удалось удалить стол' }); }
});

app.get('/api/menu', async (req, res) => {
  try {
    const menu = await prisma.menuItem.findMany({ orderBy: [{ category: 'asc' }, { name: 'asc' }] });
    res.json(menu);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Ошибка получения меню' }); }
});

app.post('/api/admin/menu', checkAdmin, async (req, res) => {
  const { name, description, price, category, imageUrl } = req.body;
  if (!name || !price || !category) return res.status(400).json({ error: 'Название, цена и категория обязательны' });
  try {
    const item = await prisma.menuItem.create({ data: { name, description: description || null, price: parseFloat(price), category, imageUrl: imageUrl || null } });
    res.json(item);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Ошибка создания позиции меню' }); }
});

app.delete('/api/admin/menu/:id', checkAdmin, async (req, res) => {
  try {
    await prisma.preorderItem.deleteMany({ where: { menuItemId: req.params.id } });
    await prisma.menuItem.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Ошибка удаления позиции меню' }); }
});

app.post('/api/reserve', requireAuth, async (req, res) => {
  const { tableId, cart, reservationTime, durationHours, guestComment } = req.body;
  if (!tableId || !reservationTime || !durationHours)
    return res.status(400).json({ error: 'Укажите стол, время и длительность бронирования' });
  const start = new Date(reservationTime);
  const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
  if (start < new Date()) return res.status(400).json({ error: 'Нельзя бронировать прошедшее время' });
  try {
    const overlap = await prisma.reservation.findFirst({
      where: {
        tableId, status: { in: ['CONFIRMED', 'HOLD', 'PENDING'] },
        OR: [
          { startTime: { lte: start }, endTime: { gt: start } },
          { startTime: { lt: end }, endTime: { gte: end } },
          { startTime: { gte: start }, endTime: { lte: end } }
        ]
      }
    });
    if (overlap) return res.status(400).json({ error: 'Этот стол уже занят на выбранное время' });
    const reservation = await prisma.reservation.create({
      data: {
        tableId, userId: req.user.id, status: 'CONFIRMED',
        date: new Date(start.toDateString()), startTime: start, endTime: end,
        guestComment: guestComment || null,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        preorders: cart?.length > 0 ? { create: cart.map(item => ({ menuItemId: item.id, quantity: item.quantity || 1 })) } : undefined
      },
      include: { table: true, preorders: { include: { menuItem: true } } }
    });
    res.json(reservation);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Ошибка сервера при создании брони' }); }
});

app.get('/api/my-reservations', requireAuth, async (req, res) => {
  try {
    const list = await prisma.reservation.findMany({
      where: { userId: req.user.id },
      include: { table: true, preorders: { include: { menuItem: true } } },
      orderBy: { startTime: 'desc' }
    });
    res.json(list);
  } catch (err) { res.status(500).json({ error: 'Ошибка получения бронирования' }); }
});

app.patch('/api/reservations/:id/cancel', requireAuth, async (req, res) => {
  try {
    const reservation = await prisma.reservation.findUnique({ where: { id: req.params.id } });
    if (!reservation) return res.status(404).json({ error: 'Бронь не найдена' });
    if (reservation.userId !== req.user.id && req.user.role !== 'ADMIN')
      return res.status(403).json({ error: 'Нет доступа к этой брони' });
    if (reservation.status === 'CANCELLED') return res.status(400).json({ error: 'Бронь уже отменена' });
    const updated = await prisma.reservation.update({
      where: { id: req.params.id }, data: { status: 'CANCELLED' }, include: { table: true }
    });
    res.json(updated);
  } catch (err) { res.status(500).json({ error: 'Ошибка отмены бронирования' }); }
});

app.get('/api/admin/reservations', checkAdmin, async (req, res) => {
  try {
    const { date, status } = req.query;
    const where = {};
    if (status) where.status = status;
    if (date) {
      const d = new Date(date); const next = new Date(d); next.setDate(next.getDate() + 1);
      where.startTime = { gte: d, lt: next };
    }
    const list = await prisma.reservation.findMany({
      where, include: { table: true, user: true, preorders: { include: { menuItem: true } } },
      orderBy: { startTime: 'asc' }
    });
    res.json(list);
  } catch (err) { res.status(500).json({ error: 'Ошибка получения списка броней' }); }
});

app.patch('/api/admin/reservations/:id/status', checkAdmin, async (req, res) => {
  const { status } = req.body;
  const allowed = ['CONFIRMED', 'CANCELLED', 'PENDING'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Некорректный статус' });
  try {
    const updated = await prisma.reservation.update({
      where: { id: req.params.id }, data: { status }, include: { table: true, user: true }
    });
    res.json(updated);
  } catch (err) { res.status(500).json({ error: 'Ошибка обновления статуса' }); }
});

app.delete('/api/admin/reservations/:id', checkAdmin, async (req, res) => {
  try {
    await prisma.preorderItem.deleteMany({ where: { reservationId: req.params.id } });
    await prisma.reservation.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Ошибка удаления брони' }); }
});

app.get('/api/admin/stats', checkAdmin, async (req, res) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const [totalUsers, totalTables, todayReservations, totalReservations] = await Promise.all([
      prisma.user.count(),
      prisma.table.count({ where: { isRemoved: false } }),
      prisma.reservation.count({ where: { startTime: { gte: today, lt: tomorrow }, status: { not: 'CANCELLED' } } }),
      prisma.reservation.count({ where: { status: { not: 'CANCELLED' } } })
    ]);
    res.json({ totalUsers, totalTables, todayReservations, totalReservations });
  } catch (err) { res.status(500).json({ error: 'Ошибка получения статистики' }); }
});

app.post('/api/auth/register-password', async (req, res) => {
  const { email, firstName, lastName, phone, password } = req.body;
  if (!email || !firstName || !phone || !password)
    return res.status(400).json({ error: 'Все поля обязательны' });
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      if (existing.phone !== phone) return res.status(400).json({ error: 'Неверный номер телефона для этого аккаунта' });
      if (existing.password) return res.status(400).json({ error: 'У этого аккаунта уже установлен пароль. Войдите через пароль.' });
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.update({ where: { email }, data: { password: hashedPassword } });
      return res.json({ success: true, user });
    }
    const phoneExists = await prisma.user.findUnique({ where: { phone } });
    if (phoneExists) return res.status(400).json({ error: 'Этот номер телефона уже используется' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, firstName, lastName: lastName || '', phone, role: 'GUEST', password: hashedPassword }
    });
    res.json({ success: true, user });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/login-password', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Укажите email и пароль' });
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    if (!user.password) return res.status(400).json({ error: 'У этого аккаунта нет пароля. Войдите через Passkey или установите пароль.' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: 'Неверный пароль' });
    res.json({ success: true, user });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/register-options', async (req, res) => {
  const { email, firstName, lastName, phone, password } = req.body;
  if (!email || !firstName || !phone)
    return res.status(400).json({ error: 'Email, имя и телефон обязательны' });
  try {
    let user = await prisma.user.findUnique({ where: { email }, include: { passkeys: true } });
    if (!user) {
      const phoneExists = await prisma.user.findUnique({ where: { phone } });
      if (phoneExists) return res.status(400).json({ error: 'Этот номер телефона уже используется' });
      const userData = { email, firstName, lastName: lastName || '', phone, role: 'GUEST' };
      if (password) userData.password = await bcrypt.hash(password, 10);
      user = await prisma.user.create({ data: userData, include: { passkeys: true } });
    }
    const options = await generateRegistrationOptions({
      rpName, rpID,
      userID: new TextEncoder().encode(user.id),
      userName: user.email,
      userDisplayName: `${user.firstName} ${user.lastName}`.trim(),
      attestationType: 'none',
      authenticatorSelection: { residentKey: 'preferred', userVerification: 'discouraged' },
      excludeCredentials: user.passkeys.map(pk => ({
        id: typeof pk.webAuthnId === 'string' ? pk.webAuthnId : Buffer.from(pk.webAuthnId).toString('base64url'),
        type: 'public-key'
      })),
      timeout: 60000,
    });
    challenges[user.id] = options.challenge;
    res.json({ ...options, userId: user.id });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message || 'Ошибка регистрации' }); }
});

app.post('/api/auth/register-verify', async (req, res) => {
  const { userId, body } = req.body;
  const expectedChallenge = challenges[userId];
  if (!expectedChallenge) return res.status(400).json({ error: 'Challenge не найден или истёк' });
  try {
    const verification = await verifyRegistrationResponse({
      response: body, expectedChallenge, expectedOrigin: originUrl, expectedRPID: rpID, requireUserVerification: false,
    });
    if (verification.verified && verification.registrationInfo) {
      const { credential, credentialDeviceType } = verification.registrationInfo;
      await prisma.passkey.create({
        data: {
          webAuthnId: Buffer.from(credential.id).toString('base64url'),
          publicKey: Buffer.from(credential.publicKey),
          counter: credential.counter, deviceType: credentialDeviceType, userId
        }
      });
      delete challenges[userId];
      const user = await prisma.user.findUnique({ where: { id: userId } });
      res.json({ success: true, user });
    } else {
      res.status(400).json({ error: 'Верификация не удалась' });
    }
  } catch (err) { console.error(err); res.status(400).json({ error: err.message }); }
});

app.post('/api/auth/login-options', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Укажите email' });
  try {
    const user = await prisma.user.findUnique({ where: { email }, include: { passkeys: true } });
    if (!user) return res.status(404).json({ error: 'Пользователь с таким email не найден' });
    if (user.passkeys.length === 0) return res.status(400).json({ error: 'У этого аккаунта нет биометрических ключей. Войдите через пароль.' });
    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: user.passkeys.map(pk => ({
        id: typeof pk.webAuthnId === 'string' ? pk.webAuthnId : Buffer.from(pk.webAuthnId).toString('base64url'),
        type: 'public-key'
      })),
      userVerification: 'discouraged',
      timeout: 60000,
    });
    challenges[user.id] = options.challenge;
    res.json({ ...options, userId: user.id });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/login-verify', async (req, res) => {
  const { userId, body } = req.body;
  const expectedChallenge = challenges[userId];
  if (!expectedChallenge) return res.status(400).json({ error: 'Challenge не найден или истёк' });
  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { passkeys: true } });
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    const rawId = Buffer.from(body.rawId, 'base64url');
    const authenticator = user.passkeys.find(pk => {
      const pkId = typeof pk.webAuthnId === 'string' ? Buffer.from(pk.webAuthnId, 'base64url') : Buffer.from(pk.webAuthnId);
      return pkId.equals(rawId);
    });
    if (!authenticator) return res.status(400).json({ error: 'Ключ аутентификации не найден' });
    const verification = await verifyAuthenticationResponse({
      response: body, expectedChallenge, expectedOrigin: originUrl, expectedRPID: rpID,
      authenticator, requireUserVerification: false,
    });
    if (verification.verified) {
      await prisma.passkey.update({ where: { id: authenticator.id }, data: { counter: verification.authenticator.counter } });
      delete challenges[userId];
      res.json({ success: true, user });
    } else {
      res.status(400).json({ error: 'Ошибка входа' });
    }
  } catch (err) { console.error(err); res.status(400).json({ error: err.message }); }
});

app.get('/api/auth/me', requireAuth, async (req, res) => { res.json(req.user); });

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`API запущен на порту ${PORT}`);
  const databasePinger = setInterval(async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      const time = new Date().toLocaleTimeString();
      console.log(`[${time}]  Neon активен`);
    } catch (err) {
      const time = new Date().toLocaleTimeString();
      console.error(`[${time}]  Ошибка пинга БД:`, err.message);
      // Переподключаемся при ошибке
      prisma.$connect().catch(e => console.error(' Переподключение не удалось:', e.message));
    }
  }, 2 * 60 * 1000);

  databasePinger.unref();
});