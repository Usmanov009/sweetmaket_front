const router = require('express').Router();
const pool = require('../db/pool');

// GET /api/announcements - Public route for users to see all cake announcements
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT ca.*, s.name as seller_name, s.shop_name, s.address 
      FROM cake_announcements ca 
      JOIN sellers s ON ca.seller_id = s.id 
      ORDER BY ca.created_at DESC
    `);
    res.json(rows);
  } catch(e) {
    console.error('Get announcements error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/announcements/:id - Get single announcement details
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT ca.*, s.name as seller_name, s.shop_name, s.address, s.phone 
      FROM cake_announcements ca 
      JOIN sellers s ON ca.seller_id = s.id 
      WHERE ca.id = $1
    `, [req.params.id]);
    
    if (!rows[0]) {
      return res.status(404).json({ error: 'E\'lon topilmadi' });
    }
    
    res.json(rows[0]);
  } catch(e) {
    console.error('Get announcement error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
