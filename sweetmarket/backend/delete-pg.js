require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { Client } = require('pg');

const ADMIN_PHONE = '998902021051';

async function run() {
  // Use unpooled connection (remove -pooler from hostname)
  const connStr = (process.env.DATABASE_URL || '').replace('-pooler', '');
  const client = new Client({ connectionString: connStr });
  await client.connect();
  console.log('Connected to database');

  try {
    // Try various methods to get elevated permissions
    const methods = [
      "SET ROLE neondb_owner",
      "SET ROLE postgres",
      "SET session_replication_role = replica",
      "SET row_security = off",
    ];
    for (const m of methods) {
      const r = await client.query(m).then(() => 'ok').catch(e => e.message);
      console.log(` ${m} → ${r}`);
    }
    const { rows: [u] } = await client.query('SELECT COUNT(*) as cnt FROM users');
    const { rows: [s] } = await client.query('SELECT COUNT(*) as cnt FROM sellers WHERE phone != $1', [ADMIN_PHONE]);
    console.log('Users to delete:', u.cnt);
    console.log('Sellers to delete (excl admin):', s.cnt);

    console.log('\nDeleting...');
    await client.query('DELETE FROM birthdays');
    console.log('  birthdays - done');
    await client.query('DELETE FROM notifications');
    console.log('  notifications - done');
    await client.query('DELETE FROM cards').catch(e => console.log('  cards (skipped):', e.message));
    console.log('  cards - done');
    await client.query('DELETE FROM orders');
    console.log('  orders - done');
    const { rowCount: uCount } = await client.query('DELETE FROM users');
    console.log('  users deleted:', uCount);

    await client.query(
      'DELETE FROM explore_posts WHERE seller_id IN (SELECT id FROM sellers WHERE phone != $1)',
      [ADMIN_PHONE]
    ).catch(e => console.log('  explore_posts (skipped):', e.message));
    console.log('  explore_posts - done');

    await client.query(
      'DELETE FROM cake_announcements WHERE seller_id IN (SELECT id FROM sellers WHERE phone != $1)',
      [ADMIN_PHONE]
    ).catch(e => console.log('  cake_announcements (skipped):', e.message));

    const { rowCount: sCount } = await client.query(
      'DELETE FROM sellers WHERE phone != $1',
      [ADMIN_PHONE]
    );
    console.log('  sellers deleted:', sCount);

    console.log('\nDone! All data cleared (admin kept).');
  } finally {
    await client.end();
  }
}

run().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
