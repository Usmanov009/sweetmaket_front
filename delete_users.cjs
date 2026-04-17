const pool = require('./backend/db/pool');

async function deleteUsers() {
  try {
    console.log('Deleting users with CASCADE...');
    
    const userIds = [
      'mnyadp5413j2', 'mnydgdtr95sy', 'mnyf1f52cxb8', 'mnyfhybwk2b0', 'mnyg9asi6dpy',
      'mnygh7gtqsrq', 'mnzvwyr4z4ba', 'mnzvyx0nci7v', 'mnzzle3gmiin', 'mnzzlq38r0j5',
      'mo01hyiby6tk', 'mo07fgyjbeoo', 'mo09dbcdxdf6', 'mo09dupv9768', 'mo0w4hcs4wu0',
      'mo0w4w8260vj', 'mo0w5l1yj7h7', 'mo0w68p0af1z', 'mo2jknuk48i8', 'mo34a0odysn8',
      'mo35sjwfxjlb'
    ];
    
    // First delete related data manually
    console.log('Deleting birthdays...');
    await pool.query(
      `DELETE FROM birthdays WHERE user_id = ANY($1)`,
      [userIds]
    );
    
    console.log('Deleting orders...');
    await pool.query(
      `DELETE FROM orders WHERE user_id = ANY($1)`,
      [userIds]
    );
    
    console.log('Deleting cards...');
    await pool.query(
      `DELETE FROM cards WHERE user_id = ANY($1)`,
      [userIds]
    );
    
    console.log('Deleting notifications...');
    await pool.query(
      `DELETE FROM notifications WHERE user_id = ANY($1)`,
      [userIds]
    );
    
    console.log('Deleting users...');
    const result = await pool.query(
      `DELETE FROM users WHERE id = ANY($1)`,
      [userIds]
    );
    
    console.log(`Successfully deleted ${result.rowCount} users!`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

deleteUsers();
