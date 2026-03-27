const router = require('express').Router();
const auth   = require('../middleware/auth');
const pool   = require('../db/pool');
const { genId } = require('../utils/db');

// GET /api/explore/posts
router.get('/posts', async (req, res) => {
  const { q } = req.query;
  let { rows } = await pool.query(
    `SELECT * FROM explore_posts WHERE public = TRUE ORDER BY likes DESC, created_at DESC`
  );
  if (q) {
    const query = q.toLowerCase();
    rows = rows.filter(p =>
      (p.name || '').toLowerCase().includes(query) ||
      (p.description || '').toLowerCase().includes(query) ||
      (p.user_name || '').toLowerCase().includes(query)
    );
  }
  res.json(rows.map(rowToPost));
});

// POST /api/explore/posts/:id/like
router.post('/posts/:id/like', auth, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM explore_posts WHERE id = $1', [req.params.id]);
  const post = rows[0];
  if (!post) return res.status(404).json({ error: 'Topilmadi' });

  const likedBy = post.liked_by || [];
  const idx = likedBy.indexOf(req.user.id);
  let newLikes, newLikedBy;
  if (idx === -1) {
    newLikedBy = [...likedBy, req.user.id];
    newLikes   = (post.likes || 0) + 1;
  } else {
    newLikedBy = likedBy.filter(id => id !== req.user.id);
    newLikes   = Math.max(0, (post.likes || 0) - 1);
  }
  await pool.query(
    'UPDATE explore_posts SET likes = $1, liked_by = $2 WHERE id = $3',
    [newLikes, JSON.stringify(newLikedBy), req.params.id]
  );
  res.json({ likes: newLikes, liked: idx === -1 });
});

// POST /api/explore/posts
router.post('/posts', auth, async (req, res) => {
  const { name, desc, emoji, bg, price, tags } = req.body;
  const id = genId();
  const { rows } = await pool.query(
    `INSERT INTO explore_posts (id, user_id, user_name, name, description, emoji, bg, price, tags)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [id, req.user.id, req.user.name || 'Foydalanuvchi',
     name || 'Моя выпечка', desc || '', emoji || '🎂',
     bg || '#fce4ec', price || 0, JSON.stringify(Array.isArray(tags) ? tags : [])]
  );
  res.json(rowToPost(rows[0]));
});

function rowToPost(r) {
  return {
    id: r.id,
    source: 'user',
    public: r.public,
    userId: r.user_id,
    userName: r.user_name,
    name: r.name,
    desc: r.description,
    emoji: r.emoji,
    bg: r.bg,
    price: Number(r.price),
    tags: r.tags || [],
    likes: r.likes || 0,
    likedBy: r.liked_by || [],
    createdAt: r.created_at,
  };
}

module.exports = router;
