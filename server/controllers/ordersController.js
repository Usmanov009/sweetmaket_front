import { readDb, writeDb } from '../db.js';

export const getOrders = (req, res) => {
  const orders = readDb().orders.filter(o => o.userId === req.user.id);
  res.json(orders);
};

export const createOrder = (req, res) => {
  const { items, total, bakery, paymentMode, cardInfo } = req.body;
  if (!items?.length) return res.status(400).json({ error: 'items required' });
  if (!paymentMode)   return res.status(400).json({ error: 'paymentMode required' });

  const db = readDb();
  const order = {
    id: Date.now().toString(),
    userId: req.user.id,
    items, total,
    bakery: bakery || null,
    date: new Date().toLocaleDateString('uz-UZ'),
    status: 'pending',
    paymentMode,
    cardInfo: paymentMode === 'card' ? (cardInfo || null) : null,
  };
  db.orders.push(order);
  writeDb(db);
  res.json(order);
};

export const updateOrderStatus = (req, res) => {
  const { status } = req.body;
  const db = readDb();
  const order = db.orders.find(o => o.id === req.params.id && o.userId === req.user.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  order.status = status;
  writeDb(db);
  res.json(order);
};

