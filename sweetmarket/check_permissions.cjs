const pool = require('./backend/db/pool');

async function checkPermissions() {
  try {
    console.log('Checking database permissions...');
    
    // Test basic SELECT
    const testSelect = await pool.query('SELECT COUNT(*) FROM users');
    console.log('✅ SELECT permission:', testSelect.rows[0].count);
    
    // Test INSERT
    const testId = 'test_' + Date.now();
    try {
      await pool.query('INSERT INTO users (id, phone, password) VALUES ($1, $2, $3)', [testId, 'test', 'test']);
      console.log('✅ INSERT permission: OK');
      
      // Test DELETE on our test record
      await pool.query('DELETE FROM users WHERE id = $1', [testId]);
      console.log('✅ DELETE permission: OK');
    } catch (error) {
      console.log('❌ INSERT/DELETE permission:', error.message);
    }
    
    // Check table ownership
    const tables = await pool.query(`
      SELECT table_name, table_owner 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'birthdays', 'orders', 'cards', 'notifications')
    `);
    
    console.log('Table ownership:');
    tables.rows.forEach(row => {
      console.log(`  ${row.table_name}: ${row.table_owner}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkPermissions();
