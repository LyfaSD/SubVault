const express = require('express');
const { Op } = require('sequelize');
const User         = require('../models/User');
const Subscription = require('../models/Subscription');
const Transaction  = require('../models/Transaction');
const { protect }  = require('../middleware/auth');
const { isAdmin }  = require('../middleware/isAdmin');

const router = express.Router();
router.use(protect, isAdmin);

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const today     = new Date();
    const weekAhead = new Date();
    weekAhead.setDate(today.getDate() + 7);

    const [totalUsers, totalSubs, expiringSoon, recentSuccess, recentFailed] = await Promise.all([
      User.count(),
      Subscription.count({ where: { isActive: true } }),
      Subscription.count({ where: { expiryDate: { [Op.between]: [today, weekAhead] }, isActive: true } }),
      Transaction.count({ where: { status: 'success' } }),
      Transaction.count({ where: { status: 'failed' } }),
    ]);

    res.json({ totalUsers, totalSubs, expiringSoon, recentSuccess, recentFailed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const users = await User.findAll({ attributes: ['id','name','email','balance','isAdmin','createdAt'] });

    const enriched = await Promise.all(users.map(async (u) => {
      const subCount      = await Subscription.count({ where: { userId: u.id } });
      const failedPayments = await Transaction.count({ where: { userId: u.id, status: 'failed' } });
      return { ...u.toJSON(), subCount, failedPayments };
    }));

    res.json({ users: enriched });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/subscriptions
router.get('/subscriptions', async (req, res) => {
  try {
    const subs = await Subscription.findAll({ order: [['expiryDate', 'ASC']] });

    const enriched = await Promise.all(subs.map(async (sub) => {
      const user = await User.findByPk(sub.userId, { attributes: ['name', 'email'] });
      return {
        ...sub.toJSON(),
        daysRemaining: sub.daysRemaining(),
        status: sub.getStatus(),
        User: user ? user.toJSON() : null,
      };
    }));

    res.json({ subscriptions: enriched });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/transactions
router.get('/transactions', async (req, res) => {
  try {
    const { status, userId } = req.query;
    const where = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;

    const txs = await Transaction.findAll({ where, order: [['createdAt', 'DESC']], limit: 100 });

    const enriched = await Promise.all(txs.map(async (tx) => {
      const user = await User.findByPk(tx.userId, { attributes: ['name', 'email'] });
      const sub  = await Subscription.findByPk(tx.subscriptionId, { attributes: ['name', 'icon', 'category'] });
      return { ...tx.toJSON(), User: user?.toJSON(), Subscription: sub?.toJSON() };
    }));

    res.json({ transactions: enriched });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/subscriptions/:id/reset
router.patch('/subscriptions/:id/reset', async (req, res) => {
  try {
    const sub = await Subscription.findByPk(req.params.id);
    if (!sub) return res.status(404).json({ error: 'Not found' });

    const days = req.body.days || 30;
    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + days);

    await sub.update({ expiryDate: newExpiry.toISOString().split('T')[0], isActive: true });
    res.json({ message: `Reset — new expiry in ${days} days`, newExpiry: sub.expiryDate });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/users/:id/balance
router.patch('/users/:id/balance', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { balance } = req.body;
    if (balance === undefined || balance < 0)
      return res.status(400).json({ error: 'Valid balance required' });

    await user.update({ balance });
    res.json({ message: `Balance updated for ${user.name}`, newBalance: balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
