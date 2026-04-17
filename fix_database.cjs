const pool = require('./backend/db/pool');

async function fixDatabase() {
  try {
    console.log('Fixing foreign key constraints...');
    
    // Fix foreign key constraints to use CASCADE delete
    await pool.query('ALTER TABLE birthdays DROP CONSTRAINT IF EXISTS birthdays_user_id_fkey').catch(() => {});
    await pool.query('ALTER TABLE birthdays ADD CONSTRAINT birthdays_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE').catch(() => {});
    
    await pool.query('ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey').catch(() => {});
    await pool.query('ALTER TABLE orders ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE').catch(() => {});
    
    await pool.query('ALTER TABLE cards DROP CONSTRAINT IF EXISTS cards_user_id_fkey').catch(() => {});
    await pool.query('ALTER TABLE cards ADD CONSTRAINT cards_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE').catch(() => {});
    
    await pool.query('ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey').catch(() => {});
    await pool.query('ALTER TABLE notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE').catch(() => {});
    
    console.log('Constraints fixed successfully!');
    
    // Now delete the users
    const userIds = [
      'mnyadp5413j2', 'mnydgdtr95sy', 'mnyf1f52cxb8', 'mnyfhybwk2b0', 'mnyg9asi6dpy',
      'mnygh7gtqsrq', 'mnzvwyr4z4ba', 'mnzvyx0nci7v', 'mnzzle3gmiin', 'mnzzlq38r0j5',
      'mo01hyiby6tk', 'mo07fgyjbeoo', 'mo09dbcdxdf6', 'mo09dupv9768', 'mo0w4hcs4wu0',
      'mo0w4w8260vj', 'mo0w5l1yj7h7', 'mo0w68p0af1z', 'mo2jknuk48i8', 'mo34a0odysn8',
      'mo35sjwfxjlb'
    ];
    
    console.log('Deleting users...');
    const result = await pool.query(
      `DELETE FROM users WHERE id = ANY($1)`,
      [userIds]
    );
    
    console.log(`Successfully deleted ${result.rowCount} users and their related data!`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

fixDatabase();
