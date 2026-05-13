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

function answerCallback(callbackQueryId, text = '') {
  return tgCall('answerCallbackQuery', { callback_query_id: callbackQueryId, text });
}

function editMessage(chatId, messageId, text, extra = {}) {
  return tgCall('editMessageText', { chat_id: chatId, message_id: messageId, text, parse_mode: 'HTML', ...extra });
}

/* ── Per-chat language preference (in-memory) ── */
const langMap = new Map(); // chatId -> 'uz' | 'ru'

function getLang(chatId) {
  return langMap.get(String(chatId)) || 'uz';
}

/* ── Translations ── */
const T = {
  uz: {
    chooseLang:       "Tilni tanlang / Выберите язык:",
    alreadyReg:       (name) => `Salom, <b>${name}</b> 👋\n\nSiz allaqachon ro'yxatdan o'tgansiz. Quyidagi tugmani bosib kirishingiz mumkin:`,
    welcome:          "Salom! 👋 <b>SweetMarket</b>'ga xush kelibsiz!\n\nKirish yoki ro'yxatdan o'tish uchun telefon raqamingizni yuboring:",
    sharePhoneBtn:    '📱 Telefon raqamini ulashish',
    loginBtn:         '🔑 Kirish',
    registerBtn:      "🚀 Ro'yxatdan o'tish",
    sendPhone:        "Ro'yxatdan o'tish uchun telefon raqamingizni yuboring:",
    contactNew:       (name) => `Salom, <b>${name}</b> 👋\n\nSiz yangi foydalanuvchisiz.\nQuyidagi tugmani bosib ro'yxatdan o'ting:`,
    contactExisting:  (name) => `Salom, <b>${name}</b> 👋\n\nSiz allaqachon ro'yxatdan o'tgansiz.\nQuyidagi tugmani bosib kirishingiz mumkin:`,
  },
  ru: {
    chooseLang:       "Tilni tanlang / Выберите язык:",
    alreadyReg:       (name) => `Привет, <b>${name}</b> 👋\n\nВы уже зарегистрированы. Нажмите кнопку ниже, чтобы войти:`,
    welcome:          "Привет! 👋 Добро пожаловать в <b>SweetMarket</b>!\n\nДля входа или регистрации отправьте ваш номер телефона:",
    sharePhoneBtn:    '📱 Поделиться номером телефона',
    loginBtn:         '🔑 Войти',
    registerBtn:      '🚀 Зарегистрироваться',
    sendPhone:        "Для регистрации отправьте ваш номер телефона:",
    contactNew:       (name) => `Привет, <b>${name}</b> 👋\n\nВы новый пользователь.\nНажмите кнопку ниже для регистрации:`,
    contactExisting:  (name) => `Привет, <b>${name}</b> 👋\n\nВы уже зарегистрированы.\nНажмите кнопку ниже, чтобы войти:`,
  },
};

function t(chatId, key, ...args) {
  const lang = getLang(chatId);
  const val  = T[lang]?.[key] ?? T.uz[key];
  return typeof val === 'function' ? val(...args) : val;
}

/* ── Language selection keyboard (shown on /start) ── */
const langKeyboard = {
  inline_keyboard: [[
    { text: "🇺🇿 O'zbek", callback_data: 'lang_uz' },
    { text: '🇷🇺 Русский', callback_data: 'lang_ru' },
  ]],
};

/* ── POST /api/bot/webhook ── */
router.post('/webhook', async (req, res) => {
  res.sendStatus(200);

  if (!BOT_TOKEN) {
    console.error('[bot] BOT_TOKEN sozlanmagan — webhook ishlayotgan emas');
    return;
  }

  const update = req.body;

  /* ── Callback query (language button tapped) ── */
  if (update.callback_query) {
    const cb      = update.callback_query;
    const chatId  = cb.message?.chat?.id;
    const msgId   = cb.message?.message_id;
    const data    = cb.data || '';
    const from    = cb.from || {};
    const telegramId = String(from.id || '');

    if (data === 'lang_uz' || data === 'lang_ru') {
      const chosen = data === 'lang_ru' ? 'ru' : 'uz';
      langMap.set(String(chatId), chosen);
      await answerCallback(cb.id);

      // Remove language selection message
      await editMessage(chatId, msgId, t(chatId, 'chooseLang'));

      // Check if user already registered
      let existingUser = null;
      if (telegramId) {
        existingUser = (await pool.query('SELECT * FROM users WHERE telegram_id = $1', [telegramId]).catch(() => ({ rows: [] }))).rows[0];
      }

      if (existingUser) {
        await sendMessage(chatId, t(chatId, 'alreadyReg', existingUser.name || 'Foydalanuvchi'), {
          reply_markup: {
            remove_keyboard: true,
            inline_keyboard: [[{ text: t(chatId, 'loginBtn'), web_app: { url: MINI_APP_URL } }]],
          },
        });
      } else {
        await sendMessage(chatId, t(chatId, 'welcome'), {
          reply_markup: {
            keyboard: [[{ text: t(chatId, 'sharePhoneBtn'), request_contact: true }]],
            resize_keyboard: true,
            one_time_keyboard: true,
          },
        });
      }
    }
    return;
  }

  const msg = update.message;
  if (!msg) return;

  const chatId     = msg.chat.id;
  const from       = msg.from || {};
  const telegramId = String(from.id || '');

  /* /start command — show language selection */
  if (msg.text && msg.text.startsWith('/start')) {
    await sendMessage(chatId, t(chatId, 'chooseLang'), { reply_markup: langKeyboard });
    return;
  }

  /* Any text message */
  if (msg.text) {
    let existingUser = null;
    if (telegramId) {
      existingUser = (await pool.query('SELECT * FROM users WHERE telegram_id = $1', [telegramId]).catch(() => ({ rows: [] }))).rows[0];
    }
    if (existingUser) {
      await sendMessage(chatId, t(chatId, 'alreadyReg', existingUser.name || 'Foydalanuvchi'), {
        reply_markup: {
          remove_keyboard: true,
          inline_keyboard: [[{ text: t(chatId, 'loginBtn'), web_app: { url: MINI_APP_URL } }]],
        },
      });
    } else {
      await sendMessage(chatId, t(chatId, 'sendPhone'), {
        reply_markup: {
          keyboard: [[{ text: t(chatId, 'sharePhoneBtn'), request_contact: true }]],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      });
    }
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
    const contactTelegramId = telegramId || String(contact.user_id || '');

    let isNew = false;
    let userRow = null;

    if (contactTelegramId) {
      userRow = (await pool.query('SELECT * FROM users WHERE telegram_id = $1', [contactTelegramId]).catch(() => ({ rows: [] }))).rows[0];
    }
    if (!userRow) {
      userRow = (await pool.query('SELECT * FROM users WHERE phone = $1', [rawPhone]).catch(() => ({ rows: [] }))).rows[0];
    }

    if (!userRow) {
      isNew = true;
      const id = genId();
      await pool.query(
        `INSERT INTO users (id, telegram_id, phone, first_name, last_name, name) VALUES ($1,$2,$3,$4,$5,$6)`,
        [id, contactTelegramId || null, rawPhone, firstName, lastName, name]
      ).catch(() => {});
      await pool.query(
        `INSERT INTO birthdays (id, user_id, emoji, name, date) VALUES ($1,$2,$3,$4,$5),($6,$2,$7,$8,$9)`,
        [genId(), id, '🎂', 'Onam', '12 Апреля', genId(), '🎉', "Do'stim", '3 Июня']
      ).catch(() => {});
      userRow = (await pool.query('SELECT * FROM users WHERE id = $1', [id]).catch(() => ({ rows: [] }))).rows[0];
    } else if (contactTelegramId && !userRow.telegram_id) {
      await pool.query('UPDATE users SET telegram_id=$1 WHERE id=$2', [contactTelegramId, userRow.id]).catch(() => {});
    }

    const displayName = userRow?.name || name;
    const msgText     = isNew
      ? t(chatId, 'contactNew', displayName)
      : t(chatId, 'contactExisting', displayName);
    const btnText     = isNew ? t(chatId, 'registerBtn') : t(chatId, 'loginBtn');

    await sendMessage(chatId, msgText, {
      reply_markup: {
        remove_keyboard: true,
        inline_keyboard: [[{ text: btnText, web_app: { url: MINI_APP_URL } }]],
      },
    });
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
