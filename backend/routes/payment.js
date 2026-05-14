const express = require('express');
const { sequelize } = require('../config/database');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// ─── CORE PAYMENT LOGIC ───────────────────────────────────────────────────────
// Used by both this route AND the cron scheduler.
// Step A: check balance >= price
// Step B: deduct + extend expiry
// Step C: log transaction (success or failed)

async function processPayment(userId, subscriptionId, triggeredBy = 'manual') {
  const t = await sequelize.transaction();
  try {
    const user = await User.findByPk(userId, { transaction: t, lock: true });
    const sub  = await Subscription.findOne({
      where: { id: subscriptionId, userId },
      transaction: t,
      lock: true,
    });

    if (!user || !sub) {
      await t.rollback();
      return { success: false, error: 'User or subscription not found', status: 404 };
    }

    const balance = parseFloat(user.balance);
    const price   = parseFloat(sub.price);

    // ── Step A: Balance check ──
    if (balance < price) {
      await Transaction.create({
        userId, subscriptionId, amount: price,
        status: 'failed',
        failReason: `Insufficient funds — balance ${balance} < price ${price}`,
        triggeredBy,
      }, { transaction: t });
      await t.commit();
      return { success: false, error: 'Insufficient funds', status: 402, balance, required: price };
    }

    // ── Step B: Deduct and extend ──
    const newBalance = balance - price;
    await user.update({ balance: newBalance }, { transaction: t });

    const base = new Date(sub.expiryDate) < new Date() ? new Date() : new Date(sub.expiryDate);
    base.setDate(base.getDate() + (sub.billingCycleDays || 30));
    const newExpiry = base.toISOString().split('T')[0];

    await sub.update({ expiryDate: newExpiry, isActive: true }, { transaction: t });

    await Transaction.create({
      userId, subscriptionId, amount: price,
      status: 'success',
      triggeredBy,
    }, { transaction: t });

    await t.commit();
    return { success: true, newBalance, newExpiry, amountCharged: price, subscriptionName: sub.name };
  } catch (err) {
    await t.rollback();
    throw err;
  }
}

// POST /api/payment/process
router.post('/process', async (req, res) => {
  try {
    const { subscriptionId } = req.body;
    if (!subscriptionId) return res.status(400).json({ error: 'subscriptionId required' });

    const result = await processPayment(req.user.id, subscriptionId, 'manual');
    if (!result.success) return res.status(result.status || 400).json(result);

    res.json({ message: `Payment successful for ${result.subscriptionName}`, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/payment/topup
router.post('/topup', async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Positive amount required' });

    const newBalance = parseFloat(req.user.balance) + parseFloat(amount);
    await req.user.update({ balance: newBalance });
    res.json({ message: 'Account topped up', newBalance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/payment/transactions
router.get('/transactions', async (req, res) => {
  try {
    const txs = await Transaction.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 50,
    });

    // Manually attach subscription name since SQLite doesn't need joins
    const Subscription = require('../models/Subscription');
    const enriched = await Promise.all(txs.map(async (tx) => {
      const sub = await Subscription.findByPk(tx.subscriptionId);
      return { ...tx.toJSON(), Subscription: sub ? { name: sub.name, icon: sub.icon, category: sub.category } : null };
    }));

    res.json({ transactions: enriched });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
module.exports.processPayment = processPayment;
