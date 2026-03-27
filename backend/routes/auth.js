const router = require('express').Router();
const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const JWT_SECRET = require('../config');
const auth = require('../middleware/auth');
const { readDB, writeDB, genId } = require('../utils/db');

const BOT_TOKEN = process.env.BOT_TOKEN || '';

function verifyTelegramData(initData) {
  if (!BOT_TOKEN) return true; // dev: token yo'q bo'lsa tekshirmasdan o'tkazadi
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return false;
  params.delete('hash');
  const dataStr = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
  const secret = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
  return crypto.createHmac('sha256', secret).update(dataStr).digest('hex') === hash;
}

// POST /api/auth/request-otp
router.post('/request-otp', (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Telefon raqami kerak' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 xonali OTP
  const db = readDB();

  db.otps = db.otps.filter(o => o.phone !== phone);
  db.otps.push({ phone, otp, createdAt: Date.now() });
  writeDB(db);

  console.log(`📱 OTP [${phone}]: ${otp}`);
  res.json({ message: 'OTP yuborildi', devOtp: otp });
});

// POST /api/auth/verify
router.post('/verify', (req, res) => {
  const { phone, otp, firstName, lastName } = req.body;
  if (!phone || !otp) return res.status(400).json({ error: 'Telefon va OTP kerak' });

  const db = readDB();
  const record = db.otps.find(o => o.phone === phone && o.otp === otp);

  if (!record) return res.status(400).json({ error: 'OTP noto\'g\'ri' });
  if (Date.now() - record.createdAt > 5 * 60 * 1000) {
    db.otps = db.otps.filter(o => o.phone !== phone);
    writeDB(db);
    return res.status(400).json({ error: 'OTP muddati o\'tgan' });
  }

  db.otps = db.otps.filter(o => o.phone !== phone);

  let user = db.users.find(u => u.phone === phone);
  if (!user) {
    user = {
      id: genId(),
      phone,
      firstName: firstName || '',
      lastName: lastName || '',
      name: [firstName, lastName].filter(Boolean).join(' '),
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    // Yangi foydalanuvchiga default bildirishnomalar berish
    const defaultNotifs = db.notifications_templates || [];
    defaultNotifs.forEach(t => {
      db.notifications.push({ ...t, id: genId(), userId: user.id, read: false });
    });
    // Default tug'ilgan kunlar
    db.birthdays.push(
      { id: genId(), userId: user.id, emoji: '🎂', name: 'Onam', date: '12 Апреля' },
      { id: genId(), userId: user.id, emoji: '🎉', name: 'Do\'stim', date: '3 Июня' }
    );
  } else {
    if (firstName) user.firstName = firstName;
    if (lastName)  user.lastName  = lastName;
    if (firstName || lastName) user.name = [user.firstName, user.lastName].filter(Boolean).join(' ');
  }

  writeDB(db);
  const token = jwt.sign({ id: user.id, phone: user.phone }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user });
});

// POST /api/auth/telegram — Telegram Mini App auto-login
router.post('/telegram', (req, res) => {
  const { initData } = req.body;
  if (!initData) return res.status(400).json({ error: 'initData kerak' });
  if (!verifyTelegramData(initData)) return res.status(401).json({ error: 'Telegram data yaroqsiz' });

  const params  = new URLSearchParams(initData);
  const userRaw = params.get('user');
  if (!userRaw) return res.status(400).json({ error: 'User topilmadi' });

  let tgUser;
  try { tgUser = JSON.parse(userRaw); } catch { return res.status(400).json({ error: 'User parse xatosi' }); }

  const db = readDB();
  const telegramId = String(tgUser.id);
  let user = db.users.find(u => u.telegramId === telegramId);

  if (!user) {
    const firstName = tgUser.first_name || '';
    const lastName  = tgUser.last_name  || '';
    user = {
      id: genId(),
      telegramId,
      phone: '',
      firstName,
      lastName,
      name: [firstName, lastName].filter(Boolean).join(' ') || tgUser.username || 'Foydalanuvchi',
      username: tgUser.username || '',
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    const defaultNotifs = db.notifications_templates || [];
    defaultNotifs.forEach(t => db.notifications.push({ ...t, id: genId(), userId: user.id, read: false }));
    db.birthdays.push(
      { id: genId(), userId: user.id, emoji: '🎂', name: 'Onam',    date: '12 Апреля' },
      { id: genId(), userId: user.id, emoji: '🎉', name: "Do'stim", date: '3 Июня'    }
    );
    writeDB(db);
  }

  const token = jwt.sign({ id: user.id, phone: user.phone }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user });
});

// GET /api/auth/me
router.get('/me', auth, (req, res) => {
  // auth middleware already ran (set in server.js via router-level)
  const db = readDB();
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
  res.json({ user });
});

module.exports = router;
