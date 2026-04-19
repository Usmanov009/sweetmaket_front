const pool = require('./pool');

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id          TEXT PRIMARY KEY,
      phone       TEXT,
      telegram_id TEXT,
      password    TEXT DEFAULT '',
      first_name  TEXT DEFAULT '',
      last_name   TEXT DEFAULT '',
      name        TEXT DEFAULT '',
      username    TEXT DEFAULT '',
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT DEFAULT ''`).catch(() => {});
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id           TEXT PRIMARY KEY,
      user_id      TEXT NOT NULL REFERENCES users(id),
      seller_id    TEXT,
      items        JSONB NOT NULL DEFAULT '[]',
      total        NUMERIC NOT NULL,
      bakery       JSONB,
      payment_mode TEXT DEFAULT 'cash',
      card_info    JSONB,
      status       TEXT DEFAULT 'pending',
      created_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  // Migrate: seller_id ni INTEGER dan TEXT ga o'tkazish (mavjud jadval uchun)
  await pool.query(`ALTER TABLE orders ALTER COLUMN seller_id DROP NOT NULL`).catch(() => {});
  await pool.query(`ALTER TABLE orders ALTER COLUMN seller_id TYPE TEXT USING seller_id::TEXT`).catch(() => {});
  // Migrate: address ustunini qo'shish
  await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS address TEXT DEFAULT ''`).catch(() => {});
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cards (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL REFERENCES users(id),
      last4       TEXT NOT NULL,
      brand       TEXT DEFAULT 'Visa',
      expiry      TEXT DEFAULT '',
      holder_name TEXT DEFAULT '',
      is_default  BOOLEAN DEFAULT FALSE,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id         TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL REFERENCES users(id),
      title      TEXT DEFAULT '',
      message    TEXT DEFAULT '',
      type       TEXT DEFAULT 'info',
      read       BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS birthdays (
      id      TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      emoji   TEXT DEFAULT '🎂',
      name    TEXT NOT NULL,
      date    TEXT NOT NULL
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS explore_posts (
      id         TEXT PRIMARY KEY,
      user_id    TEXT REFERENCES users(id),
      user_name  TEXT DEFAULT 'Foydalanuvchi',
      name       TEXT DEFAULT '',
      description TEXT DEFAULT '',
      emoji      TEXT DEFAULT '🎂',
      bg         TEXT DEFAULT '#fce4ec',
      price      NUMERIC DEFAULT 0,
      tags       JSONB DEFAULT '[]',
      public     BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sellers (
      id           TEXT PRIMARY KEY,
      name         TEXT NOT NULL,
      shop_name    TEXT NOT NULL,
      phone        TEXT UNIQUE NOT NULL,
      password     TEXT NOT NULL,
      address      TEXT DEFAULT '',
      description  TEXT DEFAULT '',
      telegram_id  TEXT UNIQUE,
      products     JSONB DEFAULT '[]',
      created_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  // Migrate: mavjud sellers jadvaliga ustunlar qo'shish
  await pool.query(`ALTER TABLE sellers ADD COLUMN IF NOT EXISTS products JSONB DEFAULT '[]'`).catch(() => {});
  await pool.query(`ALTER TABLE sellers ADD COLUMN IF NOT EXISTS plan_earnings NUMERIC DEFAULT 0`).catch(() => {});
  await pool.query(`ALTER TABLE sellers ADD COLUMN IF NOT EXISTS telegram_id TEXT`).catch(() => {});

  // Migrate: mavjud users jadvaliga telegram_id qo'shish
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_id TEXT`).catch(() => {});

  // Chat messages jadvali
  await pool.query(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id          TEXT PRIMARY KEY,
      order_id    TEXT NOT NULL,
      sender_id   TEXT NOT NULL,
      sender_type TEXT NOT NULL,
      message     TEXT DEFAULT '',
      image_url   TEXT DEFAULT '',
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  // Migrate: order_id INTEGER → TEXT, image_url qo'shish
  await pool.query(`ALTER TABLE chat_messages ALTER COLUMN order_id TYPE TEXT USING order_id::TEXT`).catch(() => {});
  await pool.query(`ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT ''`).catch(() => {});

  // Migrate: foreign key constraints ON DELETE CASCADE qo'shish
  // (users o'chirilganda bog'liq yozuvlar avtomatik o'chadi)
  const cascadeTables = [
    { table: 'birthdays',     fk: 'birthdays_user_id_fkey',      col: 'user_id' },
    { table: 'orders',        fk: 'orders_user_id_fkey',          col: 'user_id' },
    { table: 'cards',         fk: 'cards_user_id_fkey',           col: 'user_id' },
    { table: 'notifications', fk: 'notifications_user_id_fkey',   col: 'user_id' },
    { table: 'explore_posts', fk: 'explore_posts_user_id_fkey',   col: 'user_id' },
  ];
  for (const { table, fk, col } of cascadeTables) {
    await pool.query(
      `ALTER TABLE ${table} DROP CONSTRAINT IF EXISTS ${fk}`
    ).catch(() => {});
    await pool.query(
      `ALTER TABLE ${table} ADD CONSTRAINT ${fk}
       FOREIGN KEY (${col}) REFERENCES users(id) ON DELETE CASCADE`
    ).catch(() => {});
  }

  // Cake announcements table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cake_announcements (
      id         TEXT PRIMARY KEY,
      seller_id  TEXT NOT NULL REFERENCES sellers(id),
      name       TEXT NOT NULL,
      emoji      TEXT DEFAULT '🎂',
      ingredients TEXT NOT NULL,
      price      NUMERIC DEFAULT 0,
      description TEXT DEFAULT '',
      category   TEXT DEFAULT 'tort',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Seed: admin seller (usmanov009)
  const crypto = require('crypto');
  const { genId } = require('../utils/db');
  const adminPhone = '998902021051';
  const existing = (await pool.query('SELECT id FROM sellers WHERE phone = $1', [adminPhone])).rows[0];
  if (!existing) {
    const hash = crypto.createHash('sha256').update('usmanov009' + 'sweetmarket_salt').digest('hex');
    await pool.query(
      `INSERT INTO sellers (id, name, shop_name, phone, password, address) VALUES ($1,$2,$3,$4,$5,$6)`,
      [genId(), 'Usmanov', 'Usmanov Qandolat', adminPhone, hash, 'Toshkent']
    );
    console.log('✅ Admin seller yaratildi');
  } else {
    const hash = crypto.createHash('sha256').update('usmanov009' + 'sweetmarket_salt').digest('hex');
    await pool.query(
      `UPDATE sellers SET password = $1, shop_name = 'Usmanov Qandolat', name = 'Usmanov' WHERE phone = $2`,
      [hash, adminPhone]
    );
  }

  console.log('✅ PostgreSQL jadvallar tayyor');
}

module.exports = initDB;
