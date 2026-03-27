const pool = require('./pool');

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id          TEXT PRIMARY KEY,
      phone       TEXT,
      telegram_id TEXT,
      first_name  TEXT DEFAULT '',
      last_name   TEXT DEFAULT '',
      name        TEXT DEFAULT '',
      username    TEXT DEFAULT '',
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS otps (
      phone      TEXT PRIMARY KEY,
      otp        TEXT NOT NULL,
      created_at BIGINT NOT NULL
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id           TEXT PRIMARY KEY,
      user_id      TEXT NOT NULL REFERENCES users(id),
      items        JSONB NOT NULL DEFAULT '[]',
      total        NUMERIC NOT NULL,
      bakery       JSONB,
      payment_mode TEXT DEFAULT 'cash',
      card_info    JSONB,
      status       TEXT DEFAULT 'pending',
      created_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `);
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
      likes      INTEGER DEFAULT 0,
      liked_by   JSONB DEFAULT '[]',
      public     BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  console.log('✅ PostgreSQL jadvallar tayyor');
}

module.exports = initDB;
