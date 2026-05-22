const pool = require('./backend/db/pool');
const crypto = require('crypto');

async function addTelegramSeller() {
  try {
    const telegramUsername = 'sweetmakers_admin';
    
    // Check if user exists by username
    console.log('Checking if user exists by username...');
    const userRes = await pool.query(
      `SELECT * FROM users WHERE username ILIKE $1`,
      [telegramUsername]
    );
    
    let user;
    if (userRes.rows.length === 0) {
      console.log('User not found by username, checking by telegram_id...');
      // Try to get telegram_id from Telegram API or check if we have it
      console.log('Please provide the Telegram ID for @sweetmakers_admin');
      return;
    }
    
    user = userRes.rows[0];
    console.log('User found:', user.id, user.username, user.telegram_id);
    
    // Check if seller already exists
    console.log('Checking if seller already exists...');
    const sellerRes = await pool.query(
      `SELECT * FROM sellers WHERE telegram_id = $1`,
      [user.telegram_id]
    );
    
    if (sellerRes.rows.length > 0) {
      console.log('Seller already exists:', sellerRes.rows[0].id);
      return;
    }
    
    // Add seller
    console.log('Adding seller...');
    const { genId } = require('./backend/utils/db');
    const sellerId = genId();
    const hash = crypto.createHash('sha256').update('sweetmakers_admin' + 'sweetmarket_salt').digest('hex');
    
    await pool.query(
      `INSERT INTO sellers (id, name, shop_name, phone, password, address, region, city, telegram_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [sellerId, user.name || 'Sweetmakers Admin', 'Sweetmakers Shop', user.phone || '998000000000', hash, 'Toshkent', 'Toshkent', 'Toshkent', user.telegram_id]
    );
    
    console.log('Seller added successfully:', sellerId);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

addTelegramSeller();
