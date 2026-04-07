const router = require('express').Router();
const auth   = require('../middleware/auth');
const { getDB } = require('../db/mongo');
const { genId } = require('../utils/db');

// GET /api/explore/posts
router.get('/posts', async (req, res) => {
  const { q } = req.query;
  const db = getDB();
  
  let posts = await db.collection('explore_posts')
    .find({ public: true })
    .sort({ likes: -1, created_at: -1 })
    .toArray();
  
  // User name larni qo'shish
  const users = await db.collection('users').find({}).toArray();
  const userMap = {};
  users.forEach(user => {
    userMap[user.id] = user.name || 'Foydalanuvchi';
  });
  
  posts = posts.map(post => ({
    ...post,
    resolved_name: userMap[post.user_id] || post.user_name || 'Foydalanuvchi'
  }));
  
  if (q) {
    const query = q.toLowerCase();
    posts = posts.filter(p =>
      (p.name || '').toLowerCase().includes(query) ||
      (p.description || '').toLowerCase().includes(query) ||
      (p.resolved_name || '').toLowerCase().includes(query)
    );
  }
  
  res.json(posts.map(rowToPost));
});

// POST /api/explore/posts/:id/like
router.post('/posts/:id/like', auth, async (req, res) => {
  const db = getDB();
  const post = await db.collection('explore_posts').findOne({ id: req.params.id });
  if (!post) return res.status(404).json({ error: 'Topilmadi' });

  const likedBy = post.liked_by || [];
  const idx = likedBy.indexOf(req.user.id);
  let newLikes, newLikedBy;
  
  if (idx === -1) {
    newLikedBy = [...likedBy, req.user.id];
    newLikes = (post.likes || 0) + 1;
  } else {
    newLikedBy = likedBy.filter(id => id !== req.user.id);
    newLikes = Math.max(0, (post.likes || 0) - 1);
  }
  
  await db.collection('explore_posts').updateOne(
    { id: req.params.id },
    { $set: { likes: newLikes, liked_by: newLikedBy } }
  );
  
  res.json({ likes: newLikes, liked: idx === -1 });
});

// POST /api/explore/posts
router.post('/posts', auth, async (req, res) => {
  const { name, desc, emoji, bg, price, tags } = req.body;
  const id = genId();
  const db = getDB();
  
  const user = await db.collection('users').findOne({ id: req.user.id });
  const userName = user?.name || 'Foydalanuvchi';
  
  const newPost = {
    id,
    user_id: req.user.id,
    user_name: userName,
    name: name || 'Моя выпечка',
    description: desc || '',
    emoji: emoji || '🎂',
    bg: bg || '#fce4ec',
    price: Number(price) || 0,
    tags: Array.isArray(tags) ? tags : [],
    public: true,
    likes: 0,
    liked_by: [],
    created_at: new Date()
  };
  
  await db.collection('explore_posts').insertOne(newPost);
  res.json(rowToPost(newPost));
});

function rowToPost(r) {
  return {
    id: r.id,
    source: 'user',
    public: r.public,
    userId: r.user_id,
    userName: r.resolved_name || r.user_name,
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
