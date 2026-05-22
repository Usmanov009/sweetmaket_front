const pool = require('./backend/db/pool');
const crypto = require('crypto');

async function addTelegramSeller() {
  try {
    const userId = 'mpf787y1qkke';
    
    // Check if user exists by ID
    console.log('Checking if user exists by ID...');
    const userRes = await pool.query(
      `SELECT * FROM users WHERE id = $1`,
      [userId]
    );
    
    if (userRes.rows.length === 0) {
      console.log('User not found with ID:', userId);
      return;
    }
    
    const user = userRes.rows[0];
    console.log('User found:', user.id, user.name, user.phone, user.telegram_id);
    
    // Check if seller already exists by phone
    console.log('Checking if seller already exists by phone...');
    if (user.phone) {
      const sellerRes = await pool.query(
        `SELECT * FROM sellers WHERE REGEXP_REPLACE(phone, '[^0-9]', '', 'g') = REGEXP_REPLACE($1, '[^0-9]', '', 'g')`,
        [user.phone]
      );
      
      if (sellerRes.rows.length > 0) {
        console.log('Seller already exists:', sellerRes.rows[0].id);
        return;
      }
    }
    
    // Add seller
    console.log('Adding seller...');
    const { genId } = require('./backend/utils/db');
    const sellerId = genId();
    const hash = crypto.createHash('sha256').update('sweetmakers_admin' + 'sweetmarket_salt').digest('hex');
    
    await pool.query(
      `INSERT INTO sellers (id, name, shop_name, phone, password, address, region, city, telegram_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [sellerId, user.name || 'Sweetmakers Admin', 'Sweetmakers Shop', user.phone || '998000000000', hash, 'Toshkent', 'Toshkent', 'Toshkent', user.telegram_id || null]
    );
    
    console.log('Seller added successfully:', sellerId);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

addTelegramSeller();
