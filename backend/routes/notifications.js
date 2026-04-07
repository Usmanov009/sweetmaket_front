const router = require('express').Router();
const { getDB } = require('../db/mongo');

// GET /api/notifications
router.get('/', async (req, res, next) => {
  try {
    const db = getDB();
    const notifications = await db.collection('notifications')
      .find({ user_id: req.user.id })
      .sort({ created_at: -1 })
      .toArray();
    res.json(notifications.map(rowToNotif));
  } catch (e) { next(e); }
});

// PATCH /api/notifications/read-all
router.patch('/read-all', async (req, res, next) => {
  try {
    const db = getDB();
    await db.collection('notifications').updateMany(
      { user_id: req.user.id },
      { $set: { read: true } }
    );
    
    const notifications = await db.collection('notifications')
      .find({ user_id: req.user.id })
      .sort({ created_at: -1 })
      .toArray();
    res.json(notifications.map(rowToNotif));
  } catch (e) { next(e); }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', async (req, res, next) => {
  try {
    const db = getDB();
    await db.collection('notifications').updateOne(
      { id: req.params.id, user_id: req.user.id },
      { $set: { read: true } }
    );
    
    const notifications = await db.collection('notifications')
      .find({ user_id: req.user.id })
      .sort({ created_at: -1 })
      .toArray();
    res.json(notifications.map(rowToNotif));
  } catch (e) { next(e); }
});

function rowToNotif(r) {
  return {
    id: r.id,
    userId: r.user_id,
    title: r.title,
    message: r.message,
    type: r.type,
    read: r.read,
    createdAt: r.created_at,
  };
}

module.exports = router;
