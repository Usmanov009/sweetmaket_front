const pool = require('./backend/db/pool');
const crypto = require('crypto');

async function addSeller() {
  try {
    const phone = '998902021051';
    const { genId } = require('./backend/utils/db');
    
    // Check if user exists
    console.log('Checking if user exists...');
    const userRes = await pool.query(
      `SELECT * FROM users WHERE REGEXP_REPLACE(phone, '[^0-9]', '', 'g') = $1`,
      [phone]
    );
    
    let user;
    if (userRes.rows.length === 0) {
      console.log('User not found, creating user...');
      const userId = genId();
      const userHash = crypto.createHash('sha256').update('usmanov009' + 'sweetmarket_salt').digest('hex');
      
      await pool.query(
        `INSERT INTO users (id, phone, password, name, first_name, last_name)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [userId, phone, userHash, 'Usmanov', 'Usmanov', '']
      );
      
      user = { id: userId, phone, name: 'Usmanov' };
      console.log('User created:', userId);
    } else {
      user = userRes.rows[0];
      console.log('User found:', user.id, user.name, user.phone);
    }
    
    // Check if seller already exists
    console.log('Checking if seller already exists...');
    const sellerRes = await pool.query(
      `SELECT * FROM sellers WHERE REGEXP_REPLACE(phone, '[^0-9]', '', 'g') = $1`,
      [phone]
    );
    
    if (sellerRes.rows.length > 0) {
      console.log('Seller already exists:', sellerRes.rows[0].id);
      return;
    }
    
    // Add seller
    console.log('Adding seller...');
    const sellerId = genId();
    const hash = crypto.createHash('sha256').update('usmanov009' + 'sweetmarket_salt').digest('hex');
    
    await pool.query(
      `INSERT INTO sellers (id, name, shop_name, phone, password, address, region, city)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [sellerId, user.name || 'Usmanov', 'Usmanov Qandolat', phone, hash, 'Toshkent', 'Toshkent', 'Toshkent']
    );
    
    console.log('Seller added successfully:', sellerId);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

addSeller();
