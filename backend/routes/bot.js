const router  = require('express').Router();
const https   = require('https');
const pool    = require('../db/pool');
const { genId } = require('../utils/db');

const BOT_TOKEN   = process.env.BOT_TOKEN  || '';
const MINI_APP_URL = process.env.MINI_APP_URL || 'https://sweetmarket.vercel.app';

/* ── Telegram API helper ── */
function tgCall(method, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req  = https.request({
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${BOT_TOKEN}/${method}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    }, res => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => { try { resolve(JSON.parse(buf)); } catch { resolve(buf); } });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function sendMessage(chatId, text, extra = {}) {
  return tgCall('sendMessage', { chat_id: chatId, text, parse_mode: 'HTML', ...extra });
}

/* ── POST /api/bot/webhook ── */
router.post('/webhook', async (req, res) => {
  res.sendStatus(200);

  if (!BOT_TOKEN) {
    console.error('[bot] BOT_TOKEN sozlanmagan — webhook ishlayotgan emas');
    return;
  }

  const update = req.body;
  const msg    = update.message;
  if (!msg) return;

  const chatId = msg.chat.id;
  const from   = msg.from || {};

  /* /start command */
  if (msg.text && msg.text.startsWith('/start')) {
    await sendMessage(chatId,
      "Salom! 👋 <b>SweetMarket</b>'ga xush kelibsiz!\n\nKirish yoki ro'yxatdan o'tish uchun telefon raqamingizni yuboring:",
      {
        reply_markup: {
          keyboard: [[{ text: '📱 Telefon raqamini ulashish', request_contact: true }]],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      }
    );
    return;
  }

  /* Contact shared */
  if (msg.contact) {
    const contact  = msg.contact;
    const phone    = (contact.phone_number || '').replace(/\D/g, '');
    const rawPhone = phone.startsWith('998') ? '+' + phone : '+998' + phone;
    const firstName = contact.first_name || from.first_name || '';
    const lastName  = contact.last_name  || from.last_name  || '';
    const name      = [firstName, lastName].filter(Boolean).join(' ') || 'Foydalanuvchi';
    const telegramId = String(from.id || contact.user_id || '');

    // Find or create user
    let isNew = false;
    let userRow = null;

    if (telegramId) {
      userRow = (await pool.query('SELECT * FROM users WHERE telegram_id = $1', [telegramId]).catch(()=>({rows:[]}))).rows[0];
    }
    if (!userRow) {
      userRow = (await pool.query('SELECT * FROM users WHERE phone = $1', [rawPhone]).catch(()=>({rows:[]}))).rows[0];
    }

    if (!userRow) {
      isNew = true;
      const id = genId();
      const fn = firstName;
      const ln = lastName;
      const nm = name;
      await pool.query(
        `INSERT INTO users (id, telegram_id, phone, first_name, last_name, name) VALUES ($1,$2,$3,$4,$5,$6)`,
        [id, telegramId || null, rawPhone, fn, ln, nm]
      ).catch(() => {});
      await pool.query(
        `INSERT INTO birthdays (id, user_id, emoji, name, date) VALUES ($1,$2,$3,$4,$5),($6,$2,$7,$8,$9)`,
        [genId(), id, '🎂', 'Onam', '12 Апреля', genId(), '🎉', "Do'stim", '3 Июня']
      ).catch(() => {});
      userRow = (await pool.query('SELECT * FROM users WHERE id = $1', [id]).catch(()=>({rows:[]}))).rows[0];
    } else if (telegramId && !userRow.telegram_id) {
      await pool.query('UPDATE users SET telegram_id=$1 WHERE id=$2', [telegramId, userRow.id]).catch(() => {});
    }

    const displayName = userRow?.name || name;
    const actionText  = isNew
      ? "Siz yangi foydalanuvchisiz.\nQuyidagi tugmani bosib ro'yxatdan o'ting:"
      : "Siz allaqachon ro'yxatdan o'tgansiz.\nQuyidagi tugmani bosib kirishingiz mumkin:";

    await sendMessage(chatId,
      `Salom, <b>${displayName}</b> 👋\n\n${actionText}`,
      {
        reply_markup: {
          remove_keyboard: true,
          inline_keyboard: [[{
            text: isNew ? '🚀 Ro\'yxatdan o\'tish' : '🔑 Kirish',
            web_app: { url: MINI_APP_URL },
          }]],
        },
      }
    );
    return;
  }
});

/* GET /api/bot/setup — registers webhook with Telegram (call once) */
router.get('/setup', async (req, res) => {
  if (!BOT_TOKEN) return res.status(400).json({ error: 'BOT_TOKEN sozlanmagan' });
  const backendUrl = process.env.BACKEND_URL || `https://sweetmaket-front-1.onrender.com`;
  const result = await tgCall('setWebhook', { url: `${backendUrl}/api/bot/webhook` });
  res.json(result);
});

module.exports = router;