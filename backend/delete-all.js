require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const pool = require('./db/pool');

const ADMIN_PHONE = '998902021051';

async function run() {
  try {
    console.log('Counting records...');
    const { rows: [u] } = await pool.query('SELECT COUNT(*) as cnt FROM users');
    const { rows: [s] } = await pool.query('SELECT COUNT(*) as cnt FROM sellers WHERE phone != $1', [ADMIN_PHONE]);
    console.log('Users to delete:', u.cnt);
    console.log('Sellers to delete (excl admin):', s.cnt);

    console.log('\nDeleting user-related data...');
    await pool.query('DELETE FROM birthdays');
    console.log('  birthdays - done');
    await pool.query('DELETE FROM notifications');
    console.log('  notifications - done');
    await pool.query('DELETE FROM cards');
    console.log('  cards - done');
    await pool.query('DELETE FROM orders');
    console.log('  orders - done');
    const { rows: delUsers } = await pool.query('DELETE FROM users RETURNING id');
    console.log('  users deleted:', delUsers.length);

    console.log('\nDeleting seller-related data...');
    await pool.query(
      'DELETE FROM explore_posts WHERE seller_id IN (SELECT id FROM sellers WHERE phone != $1)',
      [ADMIN_PHONE]
    );
    console.log('  explore_posts - done');
    await pool.query(
      'DELETE FROM cake_announcements WHERE seller_id IN (SELECT id FROM sellers WHERE phone != $1)',
      [ADMIN_PHONE]
    ).catch(e => console.log('  cake_announcements (skipped):', e.message));
    const { rows: delSellers } = await pool.query(
      'DELETE FROM sellers WHERE phone != $1 RETURNING id',
      [ADMIN_PHONE]
    );
    console.log('  sellers deleted:', delSellers.length);

    console.log('\nDone!');
  } catch (e) {
    console.error('Error:', e.message);
  }
}

run();
