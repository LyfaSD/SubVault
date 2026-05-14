const express = require('express');
const { Op } = require('sequelize');
const Subscription = require('../models/Subscription');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

const enrich = (sub) => ({
  ...sub.toJSON(),
  daysRemaining: sub.daysRemaining(),
  status: sub.getStatus(),
});

// GET /api/subscriptions
router.get('/', async (req, res) => {
  try {
    const subs = await Subscription.findAll({
      where: { userId: req.user.id },
      order: [['expiryDate', 'ASC']],
    });
    res.json({ subscriptions: subs.map(enrich) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/subscriptions/expiring?days=7
router.get('/expiring', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const today = new Date();
    const future = new Date();
    future.setDate(today.getDate() + days);

    const subs = await Subscription.findAll({
      where: {
        userId: req.user.id,
        expiryDate: { [Op.between]: [today, future] },
        isActive: true,
      },
      order: [['expiryDate', 'ASC']],
    });
    res.json({ subscriptions: subs.map(enrich) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/subscriptions/:id
router.get('/:id', async (req, res) => {
  try {
    const sub = await Subscription.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!sub) return res.status(404).json({ error: 'Not found' });
    res.json({ subscription: enrich(sub) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/subscriptions
router.post('/', async (req, res) => {
  try {
    const { name, category, icon, price, billingCycleDays, expiryDate, autoRenew } = req.body;
    if (!name || !price || !expiryDate)
      return res.status(400).json({ error: 'name, price and expiryDate required' });

    const sub = await Subscription.create({
      userId: req.user.id,
      name,
      category: category || 'Other',
      icon: icon || '📦',
      price,
      billingCycleDays: billingCycleDays || 30,
      expiryDate,
      autoRenew: autoRenew !== undefined ? autoRenew : true,
    });
    res.status(201).json({ subscription: enrich(sub) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/subscriptions/:id
router.put('/:id', async (req, res) => {
  try {
    const sub = await Subscription.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!sub) return res.status(404).json({ error: 'Not found' });

    await sub.update(req.body);
    res.json({ subscription: enrich(sub) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/subscriptions/:id
router.delete('/:id', async (req, res) => {
  try {
    const sub = await Subscription.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!sub) return res.status(404).json({ error: 'Not found' });

    await sub.destroy();
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
