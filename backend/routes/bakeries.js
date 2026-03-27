const router = require('express').Router();
const { readDB } = require('../utils/db');

// GET /api/bakeries
router.get('/', (req, res) => {
  const db = readDB();
  res.json(db.bakeries || []);
});

module.exports = router;
