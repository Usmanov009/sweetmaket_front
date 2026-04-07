const router = require('express').Router();
const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const auth   = require('../middleware/auth');
const { getDB } = require('../db/mongo');
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
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Telefon raqami kerak' });

  try {
    const db = getDB();
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    await db.collection('otps').updateOne(
      { phone },
      { $set: { phone, otp, created_at: Date.now() } },
      { upsert: true }
    );
    
    console.log(`📱 OTP [${phone}]: ${otp}`);
    res.json({ message: 'OTP yuborildi', devOtp: otp });
  } catch (error) {
    console.error('OTP request error:', error);
    res.status(500).json({ error: 'Xatolik yuz berdi' });
  }
});

// POST /api/auth/verify
router.post('/verify', async (req, res) => {
  const { phone, otp, firstName, lastName } = req.body;
  if (!phone || !otp) return res.status(400).json({ error: 'Telefon va OTP kerak' });

  try {
    const db = getDB();
    
    // OTP ni tekshirish
    const otpRecord = await db.collection('otps').findOne({ phone });
    if (!otpRecord) return res.status(400).json({ error: "OTP noto'g'ri" });
    if (otpRecord.otp !== otp) return res.status(400).json({ error: "OTP noto'g'ri" });
    if (Date.now() - Number(otpRecord.created_at) > 5 * 60 * 1000) {
      await db.collection('otps').deleteOne({ phone });
      return res.status(400).json({ error: "OTP muddati o'tgan" });
    }
    await db.collection('otps').deleteOne({ phone });

    // User ni topish yoki yaratish
    let user = await db.collection('users').findOne({ phone });
    if (!user) {
      const id = genId();
      const fn = firstName || '';
      const ln = lastName  || '';
      const nm = [fn, ln].filter(Boolean).join(' ');
      
      user = {
        id,
        phone,
        first_name: fn,
        last_name: ln,
        name: nm,
        created_at: new Date()
      };
      
      await db.collection('users').insertOne(user);
      
      // Default tug'ilgan kunlar
      const birthdays = [
        {
          id: genId(),
          user_id: id,
          emoji: '🎂',
          name: 'Onam',
          date: '12 Апреля'
        },
        {
          id: genId(),
          user_id: id,
          emoji: '🎉',
          name: "Do'stim",
          date: '3 Июня'
        }
      ];
      
      await db.collection('birthdays').insertMany(birthdays);
    } else {
      // Update user info if provided
      if (firstName || lastName) {
        const fn = firstName || user.first_name;
        const ln = lastName || user.last_name;
        const nm = [fn, ln].filter(Boolean).join(' ');
        
        await db.collection('users').updateOne(
          { phone },
          { $set: { first_name: fn, last_name: ln, name: nm } }
        );
        
        user.first_name = fn;
        user.last_name = ln;
        user.name = nm;
      }
    }

    const token = jwt.sign({ id: user.id, phone: user.phone }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ error: 'Xatolik yuz berdi' });
  }
});

// POST /api/auth/telegram
router.post('/telegram', async (req, res) => {
  const { initData, userType } = req.body;
  if (!initData) return res.status(400).json({ error: 'Telegram ma\'lumotlari kerak' });
  if (!userType || !['user', 'seller'].includes(userType)) {
    return res.status(400).json({ error: 'User type kerak (user yoki seller)' });
  }

  try {
    if (!verifyTelegramData(initData)) {
      return res.status(400).json({ error: 'Telegram ma\'lumotlari noto\'g\'ri' });
    }

    const params = new URLSearchParams(initData);
    const telegramId = params.get('user');
    const firstName = params.get('first_name') || '';
    const lastName = params.get('last_name') || '';
    const username = params.get('username') || '';

    const db = getDB();

    if (userType === 'user') {
      // User login
      let user = await db.collection('users').findOne({ telegram_id: telegramId });
      
      if (!user) {
        // Tekshirish - user boshqa type da ro'yxatdan o'tganmi
        const existingSeller = await db.collection('sellers').findOne({ telegram_id: telegramId });
        if (existingSeller) {
          return res.status(400).json({ error: 'Bu Telegram akkaunti allaqachon sotuvchi sifatida ro\'yxatdan o\'tgan' });
        }

        // Yangi user yaratish
        const id = genId();
        const nm = [firstName, lastName].filter(Boolean).join(' ');
        
        user = {
          id,
          telegram_id: telegramId,
          first_name: firstName,
          last_name: lastName,
          name: nm,
          username,
          created_at: new Date()
        };
        
        await db.collection('users').insertOne(user);
        
        // Default tug'ilgan kunlar
        const birthdays = [
          {
            id: genId(),
            user_id: id,
            emoji: '🎂',
            name: 'Onam',
            date: '12 Апреля'
          },
          {
            id: genId(),
            user_id: id,
            emoji: '🎉',
            name: "Do'stim",
            date: '3 Июня'
          }
        ];
        
        await db.collection('birthdays').insertMany(birthdays);
      }

      const token = jwt.sign({ id: user.id, phone: user.phone || telegramId }, JWT_SECRET, { expiresIn: '30d' });
      res.json({ token, user });

    } else {
      // Seller login
      let seller = await db.collection('sellers').findOne({ telegram_id: telegramId });
      
      if (!seller) {
        // Tekshirish - seller boshqa type da ro'yxatdan o'tganmi
        const existingUser = await db.collection('users').findOne({ telegram_id: telegramId });
        if (existingUser) {
          return res.status(400).json({ error: 'Bu Telegram akkaunti allaqachon foydalanuvchi sifatida ro\'yxatdan o\'tgan' });
        }

        return res.status(404).json({ error: 'Sotuvchi topilmadi. Avval veb-saytdan ro\'yxatdan o\'ting' });
      }

      const token = jwt.sign({ id: seller.id, phone: seller.phone, role: 'seller' }, JWT_SECRET, { expiresIn: '30d' });
      res.json({ token, seller });
    }
  } catch (error) {
    console.error('Telegram auth error:', error);
    res.status(500).json({ error: 'Xatolik yuz berdi' });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const db = getDB();
    const user = await db.collection('users').findOne({ id: req.user.id });
    if (!user) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
    res.json({ user });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Xatolik yuz berdi' });
  }
});

module.exports = router;
