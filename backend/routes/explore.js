const router = require('express').Router();
const { readDB, writeDB, genId } = require('../utils/db');
const auth = require('../middleware/auth');

// GET /api/explore/posts — only public user-created posts
router.get('/posts', (req, res) => {
  const db = readDB();
  const { q } = req.query;
  let posts = (db.explore_posts || []).filter(p => p.public && p.source === 'user');
  // attach userName from users table if missing
  posts = posts.map(p => {
    if (p.userName) return p;
    const user = (db.users || []).find(u => u.id === p.userId);
    return { ...p, userName: user ? user.name : 'Foydalanuvchi' };
  });
  if (q) {
    const query = q.toLowerCase();
    posts = posts.filter(p =>
      (p.name || '').toLowerCase().includes(query) ||
      (p.desc || '').toLowerCase().includes(query) ||
      (p.userName || '').toLowerCase().includes(query)
    );
  }
  // most liked first
  posts = posts.slice().sort((a, b) => (b.likes || 0) - (a.likes || 0));
  res.json(posts);
});

// POST /api/explore/posts/:id/like — toggle like for authenticated user
router.post('/posts/:id/like', auth, (req, res) => {
  const db = readDB();
  const post = (db.explore_posts || []).find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Not found' });
  if (!post.likedBy) post.likedBy = [];
  const idx = post.likedBy.indexOf(req.user.id);
  if (idx === -1) {
    post.likedBy.push(req.user.id);
    post.likes = (post.likes || 0) + 1;
  } else {
    post.likedBy.splice(idx, 1);
    post.likes = Math.max(0, (post.likes || 0) - 1);
  }
  writeDB(db);
  res.json({ likes: post.likes, liked: idx === -1 });
});

// POST /api/explore/posts — authenticated user publishes their creation
router.post('/posts', auth, (req, res) => {
  const db = readDB();
  const { name, desc, emoji, bg, price, tags } = req.body;
  const post = {
    id: genId(),
    source: 'user',
    public: true,
    userId: req.user.id,
    userName: req.user.name,
    name: name || 'Моя выпечка',
    desc: desc || '',
    emoji: emoji || '🎂',
    bg: bg || '#fce4ec',
    price: price || 0,
    tags: Array.isArray(tags) ? tags : [],
    likes: 0,
    createdAt: new Date().toISOString(),
  };
  if (!db.explore_posts) db.explore_posts = [];
  db.explore_posts.push(post);
  writeDB(db);
  res.json(post);
});

module.exports = router;
