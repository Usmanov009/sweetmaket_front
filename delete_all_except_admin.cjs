const pool = require('./backend/db/pool');

async function deleteAllExceptAdmin() {
  try {
    const adminPhone = '998902021051';
    
    // Get admin seller ID
    console.log('Getting admin seller ID...');
    const adminSellerRes = await pool.query(
      `SELECT id FROM sellers WHERE REGEXP_REPLACE(phone, '[^0-9]', '', 'g') = $1`,
      [adminPhone]
    );
    
    const adminSellerId = adminSellerRes.rows[0]?.id;
    if (!adminSellerId) {
      console.log('Admin seller not found!');
      return;
    }
    console.log('Admin seller ID:', adminSellerId);
    
    // Get admin user ID
    console.log('Getting admin user ID...');
    const adminUserRes = await pool.query(
      `SELECT id FROM users WHERE REGEXP_REPLACE(phone, '[^0-9]', '', 'g') = $1`,
      [adminPhone]
    );
    
    const adminUserId = adminUserRes.rows[0]?.id;
    if (adminUserId) {
      console.log('Admin user ID:', adminUserId);
    }
    
    // Delete all sellers except admin
    console.log('Deleting all sellers except admin...');
    const deleteSellersRes = await pool.query(
      `DELETE FROM sellers WHERE id != $1`,
      [adminSellerId]
    );
    console.log(`Deleted ${deleteSellersRes.rowCount} sellers`);
    
    // Delete all users except admin
    if (adminUserId) {
      console.log('Deleting all users except admin...');
      const deleteUsersRes = await pool.query(
        `DELETE FROM users WHERE id != $1`,
        [adminUserId]
      );
      console.log(`Deleted ${deleteUsersRes.rowCount} users`);
    } else {
      console.log('Deleting all users (admin user not found)...');
      const deleteUsersRes = await pool.query(`DELETE FROM users`);
      console.log(`Deleted ${deleteUsersRes.rowCount} users`);
    }
    
    // Delete all orders (they will be cascade deleted with users, but let's be sure)
    console.log('Deleting all orders...');
    const deleteOrdersRes = await pool.query(`DELETE FROM orders`);
    console.log(`Deleted ${deleteOrdersRes.rowCount} orders`);
    
    // Delete all cards
    console.log('Deleting all cards...');
    const deleteCardsRes = await pool.query(`DELETE FROM cards`);
    console.log(`Deleted ${deleteCardsRes.rowCount} cards`);
    
    // Delete all notifications
    console.log('Deleting all notifications...');
    const deleteNotifRes = await pool.query(`DELETE FROM notifications`);
    console.log(`Deleted ${deleteNotifRes.rowCount} notifications`);
    
    // Delete all birthdays
    console.log('Deleting all birthdays...');
    const deleteBirthdaysRes = await pool.query(`DELETE FROM birthdays`);
    console.log(`Deleted ${deleteBirthdaysRes.rowCount} birthdays`);
    
    // Delete all explore posts
    console.log('Deleting all explore posts...');
    const deletePostsRes = await pool.query(`DELETE FROM explore_posts`);
    console.log(`Deleted ${deletePostsRes.rowCount} explore posts`);
    
    // Delete all cake announcements
    console.log('Deleting all cake announcements...');
    const deleteAnnRes = await pool.query(`DELETE FROM cake_announcements`);
    console.log(`Deleted ${deleteAnnRes.rowCount} cake announcements`);
    
    // Delete all chat messages
    console.log('Deleting all chat messages...');
    const deleteChatRes = await pool.query(`DELETE FROM chat_messages`);
    console.log(`Deleted ${deleteChatRes.rowCount} chat messages`);
    
    console.log('✅ All data deleted except admin seller and user!');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

deleteAllExceptAdmin();
