const router = require('express').Router();
const { bakeries } = require('../db/static.json');

// GET /api/bakeries
router.get('/', (req, res) => {
  res.json(bakeries || []);
});

module.exports = router;
