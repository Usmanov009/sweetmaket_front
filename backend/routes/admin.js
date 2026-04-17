const router = require('express').Router();
const pool = require('../db/pool');
const { genId } = require('../utils/db');

// Temporary endpoint to delete specific users
// This should be removed after use!
router.delete('/cleanup-users', async (req, res) => {
  try {
    const userIds = [
      'mnyadp5413j2', 'mnydgdtr95sy', 'mnyf1f52cxb8', 'mnyfhybwk2b0', 'mnyg9asi6dpy',
      'mnygh7gtqsrq', 'mnzvwyr4z4ba', 'mnzvyx0nci7v', 'mnzzle3gmiin', 'mnzzlq38r0j5',
      'mo01hyiby6tk', 'mo07fgyjbeoo', 'mo09dbcdxdf6', 'mo09dupv9768', 'mo0w4hcs4wu0',
      'mo0w4w8260vj', 'mo0w5l1yj7h7', 'mo0w68p0af1z', 'mo2jknuk48i8', 'mo34a0odysn8',
      'mo35sjwfxjlb'
    ];
    
    console.log('Starting cleanup of test users...');
    
    // Delete related data first
    const birthdayResult = await pool.query(
      `DELETE FROM birthdays WHERE user_id = ANY($1)`,
      [userIds]
    );
    console.log(`Deleted ${birthdayResult.rowCount} birthday records`);
    
    const orderResult = await pool.query(
      `DELETE FROM orders WHERE user_id = ANY($1)`,
      [userIds]
    );
    console.log(`Deleted ${orderResult.rowCount} order records`);
    
    const cardResult = await pool.query(
      `DELETE FROM cards WHERE user_id = ANY($1)`,
      [userIds]
    );
    console.log(`Deleted ${cardResult.rowCount} card records`);
    
    const notificationResult = await pool.query(
      `DELETE FROM notifications WHERE user_id = ANY($1)`,
      [userIds]
    );
    console.log(`Deleted ${notificationResult.rowCount} notification records`);
    
    // Finally delete users
    const userResult = await pool.query(
      `DELETE FROM users WHERE id = ANY($1)`,
      [userIds]
    );
    console.log(`Deleted ${userResult.rowCount} user records`);
    
    res.json({ 
      success: true,
      deleted: {
        users: userResult.rowCount,
        birthdays: birthdayResult.rowCount,
        orders: orderResult.rowCount,
        cards: cardResult.rowCount,
        notifications: notificationResult.rowCount
      }
    });
    
  } catch (error) {
    console.error('Cleanup error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
