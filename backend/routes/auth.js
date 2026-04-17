const router = require('express').Router();
const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const auth   = require('../middleware/auth');
const pool   = require('../db/pool');
const { sendTelegramMessage } = require('../utils/telegram');
const { genId } = require('../utils/db');

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const JWT_SECRET = process.env.JWT_SECRET || 'sweetmarket_secret_key';
const BOT_TOKEN  = process.env.BOT_TOKEN || '';

function verifyTelegramData(initData) {
  if (!BOT_TOKEN) return true;
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
router.post('/request-otp', async (req, res) => {
  const phone = String(req.body.phone || '').trim();
  if (!phone) return res.status(400).json({ error: 'Telefon raqami kerak' });

  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await pool.query(
      `INSERT INTO otps (phone, otp, created_at) VALUES ($1, $2, $3)
       ON CONFLICT (phone) DO UPDATE SET otp = $2, created_at = $3`,
      [phone, otp, Date.now()]
    );

    const linked = await pool.query(
      `SELECT telegram_id
       FROM (
         SELECT telegram_id FROM users WHERE phone = $1 AND telegram_id IS NOT NULL
         UNION ALL
         SELECT telegram_id FROM sellers WHERE phone = $1 AND telegram_id IS NOT NULL
       ) AS linked
       LIMIT 1`,
      [phone]
    );
    const chat = linked.rows[0]?.telegram_id;
    if (chat) {
      sendTelegramMessage(chat,
        `🔐 <b>SweetMarket — Tasdiqlash kodi</b>\n\n` +
        `Sizning kodingiz: <code>${otp}</code>\n\n` +
        `⏱ Kod 5 daqiqa ichida amal qiladi.\n` +
        `Agar siz so'ramagan bo'lsangiz, e'tibor bermang.`
      );
      console.log(`OTP sent via Telegram bot to chat ${chat} for ${phone}`);
      res.json({ message: 'OTP Telegram botingizga yuborildi' });
    } else if (!BOT_TOKEN) {
      // Dev mode: BOT_TOKEN yo'q — ekranda ko'rsatish
      console.log(`DEV OTP [${phone}]: ${otp}`);
      res.json({ message: 'OTP yuborildi', devOtp: otp });
    } else {
      // Bot bor lekin telefon bog'lanmagan
      console.log(`OTP for ${phone}: ${otp} (no telegram linked)`);
      return res.status(400).json({
        error: `Telefon raqamingiz Telegram botga ulanmagan.\nAvval @sweet_market_ika_bot ga /start yuboring va telefon raqamingizni ulashing.`,
        notLinked: true,
      });
    }
  } catch (error) {
    console.error('OTP request error:', error);
    res.status(500).json({ error: error.message || 'Xatolik yuz berdi' });
  }
});

// POST /api/auth/verify
router.post('/verify', async (req, res) => {
  const { phone, otp, firstName, lastName } = req.body;
  if (!phone || !otp) return res.status(400).json({ error: 'Telefon va OTP kerak' });

  const { rows } = await pool.query('SELECT * FROM otps WHERE phone = $1', [phone]);
  const record = rows[0];
  if (!record) return res.status(400).json({ error: "OTP noto'g'ri" });
  if (record.otp !== otp) return res.status(400).json({ error: "OTP noto'g'ri" });
  if (Date.now() - Number(record.created_at) > 5 * 60 * 1000) {
    await pool.query('DELETE FROM otps WHERE phone = $1', [phone]);
    return res.status(400).json({ error: "OTP muddati o'tgan" });
  }
  await pool.query('DELETE FROM otps WHERE phone = $1', [phone]);

  let userRow = (await pool.query('SELECT * FROM users WHERE phone = $1', [phone])).rows[0];
  if (!userRow) {
    const id = genId();
    const fn = firstName || '';
    const ln = lastName  || '';
    const nm = [fn, ln].filter(Boolean).join(' ');
    await pool.query(
      `INSERT INTO users (id, phone, first_name, last_name, name) VALUES ($1,$2,$3,$4,$5)`,
      [id, phone, fn, ln, nm]
    );
    // Default tug'ilgan kunlar
    await pool.query(
      `INSERT INTO birthdays (id, user_id, emoji, name, date) VALUES ($1,$2,$3,$4,$5),($6,$2,$7,$8,$9)`,
      [genId(), id, '🎂', 'Onam', '12 Апреля', genId(), '🎉', "Do'stim", '3 Июня']
    );
    userRow = (await pool.query('SELECT * FROM users WHERE id = $1', [id])).rows[0];
  } else {
    if (firstName || lastName) {
      const fn = firstName || userRow.first_name;
      const ln = lastName  || userRow.last_name;
      await pool.query(
        `UPDATE users SET first_name=$1, last_name=$2, name=$3 WHERE id=$4`,
        [fn, ln, [fn, ln].filter(Boolean).join(' '), userRow.id]
      );
      userRow = (await pool.query('SELECT * FROM users WHERE id = $1', [userRow.id])).rows[0];
    }
  }

  const user = rowToUser(userRow);
  const token = jwt.sign({ id: user.id, phone: user.phone }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user });
});

// POST /api/auth/telegram
router.post('/telegram', async (req, res) => {
  const { initData, userType } = req.body;
  if (!initData) return res.status(400).json({ error: 'initData kerak' });
  if (!userType || !['user', 'seller'].includes(userType)) return res.status(400).json({ error: 'userType kerak (user yoki seller)' });
  if (!verifyTelegramData(initData)) return res.status(401).json({ error: 'Telegram data yaroqsiz' });

  const params  = new URLSearchParams(initData);
  const userRaw = params.get('user');
  if (!userRaw) return res.status(400).json({ error: 'User topilmadi' });
  let tgUser;
  try { tgUser = JSON.parse(userRaw); } catch { return res.status(400).json({ error: 'User parse xatosi' }); }

  const telegramId = String(tgUser.id);
  
  if (userType === 'seller') {
    // Check if already registered as user
    const existingUser = (await pool.query('SELECT * FROM users WHERE telegram_id = $1', [telegramId])).rows[0];
    if (existingUser) {
      return res.status(400).json({ error: 'Siz allaqachon foydalanuvchi sifatida ro\'yxatdan o\'tgansiz. Iltimos, boshqa Telegram hisobidan foydalaning.' });
    }
    
    let sellerRow = (await pool.query('SELECT * FROM sellers WHERE telegram_id = $1', [telegramId])).rows[0];
    if (!sellerRow) {
      return res.status(400).json({ 
        error: 'Sotuvchi sifatida ro\'yxatdan o\'tish uchun avval veb-saytdan ro\'yxatdan o\'ting',
        needRegistration: true 
      });
    }
    
    const seller = rowToSeller(sellerRow);
    const token = jwt.sign({ id: seller.id, role: 'seller', phone: seller.phone }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, seller, userType: 'seller' });
  } else {
    // Check if already registered as seller
    const existingSeller = (await pool.query('SELECT * FROM sellers WHERE telegram_id = $1', [telegramId])).rows[0];
    if (existingSeller) {
      return res.status(400).json({ error: 'Siz allaqachon sotuvchi sifatida ro\'yxatdan o\'tgansiz. Iltimos, boshqa Telegram hisobidan foydalaning.' });
    }
    
    let userRow = (await pool.query('SELECT * FROM users WHERE telegram_id = $1', [telegramId])).rows[0];
    if (!userRow) {
      const id = genId();
      const fn = tgUser.first_name || '';
      const ln = tgUser.last_name  || '';
      const nm = [fn, ln].filter(Boolean).join(' ') || tgUser.username || 'Foydalanuvchi';
      await pool.query(
        `INSERT INTO users (id, telegram_id, phone, first_name, last_name, name, username) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [id, telegramId, '', fn, ln, nm, tgUser.username || '']
      );
      await pool.query(
        `INSERT INTO birthdays (id, user_id, emoji, name, date) VALUES ($1,$2,$3,$4,$5),($6,$2,$7,$8,$9)`,
        [genId(), id, '🎂', 'Onam', '12 Апреля', genId(), '🎉', "Do'stim", '3 Июня']
      );
      userRow = (await pool.query('SELECT * FROM users WHERE id = $1', [id])).rows[0];
    }

    const user = rowToUser(userRow);
    const token = jwt.sign({ id: user.id, type: 'user', phone: user.phone }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user, userType: 'user' });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
  res.json({ user: rowToUser(rows[0]) });
});

// PATCH /api/auth/me
router.patch('/me', auth, async (req, res) => {
  const { firstName, lastName } = req.body;
  if (!firstName && !lastName) return res.status(400).json({ error: 'Ism yoki familiya kerak' });
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
  const fn = firstName !== undefined ? firstName : rows[0].first_name;
  const ln = lastName  !== undefined ? lastName  : rows[0].last_name;
  const nm = [fn, ln].filter(Boolean).join(' ');
  await pool.query(
    `UPDATE users SET first_name=$1, last_name=$2, name=$3 WHERE id=$4`,
    [fn, ln, nm, req.user.id]
  );
  const updated = (await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id])).rows[0];
  res.json({ user: rowToUser(updated) });
});

function rowToUser(r) {
  return {
    id: r.id,
    phone: r.phone || '',
    telegramId: r.telegram_id || undefined,
    firstName: r.first_name,
    lastName: r.last_name,
    name: r.name,
    username: r.username || undefined,
    createdAt: r.created_at,
  };
}

function rowToSeller(r) {
  return {
    id: r.id,
    phone: r.phone || '',
    telegramId: r.telegram_id || undefined,
    name: r.name,
    shopName: r.shop_name,
    address: r.address,
    createdAt: r.created_at,
  };
}

module.exports = router;
