const router   = require('express').Router();
const https    = require('https');
const pool     = require('../db/pool');
const { genId } = require('../utils/db');

const BOT_TOKEN    = process.env.BOT_TOKEN   || '';
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
function answerCallback(id, text = '') {
  return tgCall('answerCallbackQuery', { callback_query_id: id, text });
}
function editMessage(chatId, messageId, text, extra = {}) {
  return tgCall('editMessageText', { chat_id: chatId, message_id: messageId, text, parse_mode: 'HTML', ...extra });
}

/* ── Language helpers ── */
const langMap = new Map(); // in-memory cache

async function getLang(chatId, telegramId) {
  const key = String(chatId);
  if (langMap.has(key)) return langMap.get(key);
  // Try DB
  if (telegramId) {
    const r = await pool.query(
      `SELECT lang FROM users WHERE telegram_id=$1
       UNION ALL
       SELECT lang FROM sellers WHERE telegram_id=$1 LIMIT 1`,
      [String(telegramId)]
    ).catch(() => ({ rows: [] }));
    if (r.rows[0]?.lang) {
      langMap.set(key, r.rows[0].lang);
      return r.rows[0].lang;
    }
  }
  return 'uz';
}

async function setLang(chatId, telegramId, lang) {
  langMap.set(String(chatId), lang);
  if (telegramId) {
    await pool.query(`UPDATE users   SET lang=$1 WHERE telegram_id=$2`, [lang, String(telegramId)]).catch(() => {});
    await pool.query(`UPDATE sellers SET lang=$1 WHERE telegram_id=$2`, [lang, String(telegramId)]).catch(() => {});
  }
}

/* ── Translations ── */
const T = {
  uz: {
    chooseLang:      "Tilni tanlang / Выберите язык:",
    alreadyReg:      (n) => `Salom, <b>${n}</b> 👋\n\nSiz allaqachon ro'yxatdan o'tgansiz. Quyidagi tugmani bosib kirishingiz mumkin:`,
    welcome:         "Salom! 👋 <b>SweetMarket</b>'ga xush kelibsiz!\n\nKirish yoki ro'yxatdan o'tish uchun telefon raqamingizni yuboring:",
    sharePhoneBtn:   '📱 Telefon raqamini ulashish',
    loginBtn:        '🔑 Kirish',
    registerBtn:     "🚀 Ro'yxatdan o'tish",
    sendPhone:       "Ro'yxatdan o'tish uchun telefon raqamingizni yuboring:",
    contactNew:      (n) => `Salom, <b>${n}</b> 👋\n\nSiz yangi foydalanuvchisiz.\nQuyidagi tugmani bosib ro'yxatdan o'ting:`,
    contactExisting: (n) => `Salom, <b>${n}</b> 👋\n\nSiz allaqachon ro'yxatdan o'tgansiz.\nQuyidagi tugmani bosib kirishingiz mumkin:`,
  },
  ru: {
    chooseLang:      "Tilni tanlang / Выберите язык:",
    alreadyReg:      (n) => `Привет, <b>${n}</b> 👋\n\nВы уже зарегистрированы. Нажмите кнопку ниже, чтобы войти:`,
    welcome:         "Привет! 👋 Добро пожаловать в <b>SweetMarket</b>!\n\nДля входа или регистрации отправьте ваш номер телефона:",
    sharePhoneBtn:   '📱 Поделиться номером телефона',
    loginBtn:        '🔑 Войти',
    registerBtn:     '🚀 Зарегистрироваться',
    sendPhone:       "Для регистрации отправьте ваш номер телефона:",
    contactNew:      (n) => `Привет, <b>${n}</b> 👋\n\nВы новый пользователь.\nНажмите кнопку ниже для регистрации:`,
    contactExisting: (n) => `Привет, <b>${n}</b> 👋\n\nВы уже зарегистрированы.\nНажмите кнопку ниже, чтобы войти:`,
  },
};

function tr(lang, key, ...args) {
  const val = T[lang]?.[key] ?? T.uz[key];
  return typeof val === 'function' ? val(...args) : val;
}

const langKeyboard = {
  inline_keyboard: [[
    { text: "🇺🇿 O'zbek",   callback_data: 'lang_uz' },
    { text: '🇷🇺 Русский', callback_data: 'lang_ru' },
  ]],
};

/* ── POST /api/bot/webhook ── */
router.post('/webhook', async (req, res) => {
  res.sendStatus(200);
  if (!BOT_TOKEN) return;

  const update = req.body;

  /* ── Callback query (language button) ── */
  if (update.callback_query) {
    const cb         = update.callback_query;
    const chatId     = cb.message?.chat?.id;
    const msgId      = cb.message?.message_id;
    const data       = cb.data || '';
    const from       = cb.from || {};
    const telegramId = String(from.id || '');

    if (data === 'lang_uz' || data === 'lang_ru') {
      const chosen = data === 'lang_ru' ? 'ru' : 'uz';
      await setLang(chatId, telegramId, chosen);
      await answerCallback(cb.id);
      await editMessage(chatId, msgId, tr(chosen, 'chooseLang'));

      const existingUser = telegramId
        ? (await pool.query('SELECT * FROM users WHERE telegram_id=$1', [telegramId]).catch(() => ({ rows: [] }))).rows[0]
        : null;

      if (existingUser) {
        await sendMessage(chatId, tr(chosen, 'alreadyReg', existingUser.name || 'Foydalanuvchi'), {
          reply_markup: {
            remove_keyboard: true,
            inline_keyboard: [[{ text: tr(chosen, 'loginBtn'), web_app: { url: MINI_APP_URL } }]],
          },
        });
      } else {
        await sendMessage(chatId, tr(chosen, 'welcome'), {
          reply_markup: {
            keyboard: [[{ text: tr(chosen, 'sharePhoneBtn'), request_contact: true }]],
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
  const lang       = await getLang(chatId, telegramId);

  /* /start */
  if (msg.text && msg.text.startsWith('/start')) {
    await sendMessage(chatId, tr(lang, 'chooseLang'), { reply_markup: langKeyboard });
    return;
  }

  /* Text message */
  if (msg.text) {
    const existingUser = telegramId
      ? (await pool.query('SELECT * FROM users WHERE telegram_id=$1', [telegramId]).catch(() => ({ rows: [] }))).rows[0]
      : null;

    if (existingUser) {
      await sendMessage(chatId, tr(lang, 'alreadyReg', existingUser.name || 'Foydalanuvchi'), {
        reply_markup: {
          remove_keyboard: true,
          inline_keyboard: [[{ text: tr(lang, 'loginBtn'), web_app: { url: MINI_APP_URL } }]],
        },
      });
    } else {
      await sendMessage(chatId, tr(lang, 'sendPhone'), {
        reply_markup: {
          keyboard: [[{ text: tr(lang, 'sharePhoneBtn'), request_contact: true }]],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      });
    }
    return;
  }

  /* Contact shared */
  if (msg.contact) {
    const contact   = msg.contact;
    const phone     = (contact.phone_number || '').replace(/\D/g, '');
    const rawPhone  = phone.startsWith('998') ? '+' + phone : '+998' + phone;
    const firstName = contact.first_name || from.first_name || '';
    const lastName  = contact.last_name  || from.last_name  || '';
    const name      = [firstName, lastName].filter(Boolean).join(' ') || 'Foydalanuvchi';
    const contactTgId = telegramId || String(contact.user_id || '');

    let isNew   = false;
    let userRow = null;

    if (contactTgId) {
      userRow = (await pool.query('SELECT * FROM users WHERE telegram_id=$1', [contactTgId]).catch(() => ({ rows: [] }))).rows[0];
    }
    if (!userRow) {
      userRow = (await pool.query('SELECT * FROM users WHERE phone=$1', [rawPhone]).catch(() => ({ rows: [] }))).rows[0];
    }

    if (!userRow) {
      isNew = true;
      const id = genId();
      await pool.query(
        `INSERT INTO users (id, telegram_id, phone, first_name, last_name, name, lang) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [id, contactTgId || null, rawPhone, firstName, lastName, name, lang]
      ).catch(() => {});
      await pool.query(
        `INSERT INTO birthdays (id, user_id, emoji, name, date) VALUES ($1,$2,$3,$4,$5),($6,$2,$7,$8,$9)`,
        [genId(), id, '🎂', 'Onam', '12 Апреля', genId(), '🎉', "Do'stim", '3 Июня']
      ).catch(() => {});
      userRow = (await pool.query('SELECT * FROM users WHERE id=$1', [id]).catch(() => ({ rows: [] }))).rows[0];
    } else {
      if (contactTgId && !userRow.telegram_id) {
        await pool.query('UPDATE users SET telegram_id=$1 WHERE id=$2', [contactTgId, userRow.id]).catch(() => {});
      }
      // Save language preference
      await pool.query('UPDATE users SET lang=$1 WHERE id=$2', [lang, userRow.id]).catch(() => {});
    }

    const displayName = userRow?.name || name;
    const msgText = isNew ? tr(lang, 'contactNew', displayName) : tr(lang, 'contactExisting', displayName);
    const btnText = isNew ? tr(lang, 'registerBtn') : tr(lang, 'loginBtn');

    await sendMessage(chatId, msgText, {
      reply_markup: {
        remove_keyboard: true,
        inline_keyboard: [[{ text: btnText, web_app: { url: MINI_APP_URL } }]],
      },
    });
    return;
  }
});

/* GET /api/bot/setup */
router.get('/setup', async (req, res) => {
  if (!BOT_TOKEN) return res.status(400).json({ error: 'BOT_TOKEN sozlanmagan' });
  const backendUrl = process.env.BACKEND_URL || 'https://sweetmaket-front-1.onrender.com';
  const result = await tgCall('setWebhook', { url: `${backendUrl}/api/bot/webhook` });
  res.json(result);
});

module.exports = router;