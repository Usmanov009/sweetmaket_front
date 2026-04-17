const router = require('express').Router();
const jwt    = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
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

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { phone, password, firstName, lastName } = req.body;
  
  if (!phone || !password) {
    return res.status(400).json({ error: 'Telefon raqami va parol kerak' });
  }
  
  const existingUser = (await pool.query('SELECT * FROM users WHERE phone = $1', [phone])).rows[0];
  if (existingUser) {
    return res.status(400).json({ error: 'Bu telefon raqami allaqachon ro\'yxatdan o\'tgan' });
  }
  
  const hashedPassword = await bcrypt.hash(password, 10);
  const id = genId();
  const nm = [firstName, lastName].filter(Boolean).join(' ');
  
  await pool.query(
    `INSERT INTO users (id, phone, password, first_name, last_name, name) VALUES ($1,$2,$3,$4,$5,$6)`,
    [id, phone, hashedPassword, firstName, lastName, nm]
  );
  
  await pool.query(
    `INSERT INTO birthdays (id, user_id, emoji, name, date) VALUES ($1,$2,$3,$4,$5),($6,$2,$7,$8,$9)`,
    [genId(), id, '🎂', 'Onam', '12 Апреля', genId(), '🎉', "Do'stim", '3 Июня']
  );
  
  const userRow = (await pool.query('SELECT * FROM users WHERE id = $1', [id])).rows[0];
  const user = rowToUser(userRow);
  const token = jwt.sign({ id: user.id, phone: user.phone }, JWT_SECRET, { expiresIn: '30d' });
  
  res.json({ token, user });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { phone, password } = req.body;
  
  if (!phone || !password) {
    return res.status(400).json({ error: 'Telefon raqami va parol kerak' });
  }
  
  const userRow = (await pool.query('SELECT * FROM users WHERE phone = $1', [phone])).rows[0];
  if (!userRow) {
    return res.status(400).json({ error: 'Foydalanuvchi topilmadi' });
  }
  
  const isValidPassword = await bcrypt.compare(password, userRow.password);
  if (!isValidPassword) {
    return res.status(400).json({ error: 'Noto\'g\'ri parol' });
  }
  
  const user = rowToUser(userRow);
  const token = jwt.sign({ id: user.id, phone: user.phone }, JWT_SECRET, { expiresIn: '30d' });
  
  res.json({ token, user });
});

// POST /api/auth/seller/register
router.post('/seller/register', async (req, res) => {
  const { name, shopName, phone, password, address } = req.body;
  
  if (!name || !shopName || !phone || !password) {
    return res.status(400).json({ error: 'Ism, do\'kon nomi, telefon raqami va parol kerak' });
  }
  
  const existingSeller = (await pool.query('SELECT * FROM sellers WHERE phone = $1', [phone])).rows[0];
  if (existingSeller) {
    return res.status(400).json({ error: 'Bu telefon raqami allaqachon ro\'yxatdan o\'tgan' });
  }
  
  const hashedPassword = await bcrypt.hash(password, 10);
  const id = genId();
  
  await pool.query(
    `INSERT INTO sellers (id, name, shop_name, phone, password, address) VALUES ($1,$2,$3,$4,$5,$6)`,
    [id, name, shopName, phone, hashedPassword, address]
  );
  
  const sellerRow = (await pool.query('SELECT * FROM sellers WHERE id = $1', [id])).rows[0];
  const seller = rowToSeller(sellerRow);
  const token = jwt.sign({ id: seller.id, role: 'seller', phone: seller.phone }, JWT_SECRET, { expiresIn: '30d' });
  
  res.json({ token, seller, userType: 'seller' });
});

// POST /api/auth/seller/login
router.post('/seller/login', async (req, res) => {
  const { phone, password } = req.body;
  
  if (!phone || !password) {
    return res.status(400).json({ error: 'Telefon raqami va parol kerak' });
  }
  
  const sellerRow = (await pool.query('SELECT * FROM sellers WHERE phone = $1', [phone])).rows[0];
  if (!sellerRow) {
    return res.status(400).json({ error: 'Sotuvchi topilmadi' });
  }
  
  const isValidPassword = await bcrypt.compare(password, sellerRow.password);
  if (!isValidPassword) {
    return res.status(400).json({ error: 'Noto\'g\'ri parol' });
  }
  
  const seller = rowToSeller(sellerRow);
  const token = jwt.sign({ id: seller.id, role: 'seller', phone: seller.phone }, JWT_SECRET, { expiresIn: '30d' });
  
  res.json({ token, seller, userType: 'seller' });
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