const cron = require('node-cron');
const User         = require('../models/User');
const Subscription = require('../models/Subscription');
const { processPayment } = require('../routes/payment');

const REMINDER_DAYS = [7, 5, 3, 2, 1];

async function runDailyJob() {
  console.log(`\n[CRON] Daily job started — ${new Date().toISOString()}`);
  try {
    const subs = await Subscription.findAll({ where: { isActive: true } });
    console.log(`[CRON] Checking ${subs.length} subscription(s)`);

    for (const sub of subs) {
      const d    = sub.daysRemaining();
      const user = await User.findByPk(sub.userId);
      if (!user) continue;

      // Send reminder notification
      if (REMINDER_DAYS.includes(d)) {
        console.log(`[CRON] REMINDER → ${user.email} | "${sub.name}" expires in ${d} day(s)`);
        // TODO: plug in nodemailer or Twilio here for real emails/SMS
      }

      // Auto-pay on expiry day
      if (d === 0 && sub.autoRenew) {
        console.log(`[CRON] AUTO-PAY → "${sub.name}" for ${user.email}`);
        const result = await processPayment(user.id, sub.id, 'auto');
        if (result.success) {
          console.log(`[CRON] ✅ Success — charged ${result.amountCharged}, new expiry: ${result.newExpiry}`);
        } else {
          console.log(`[CRON] ❌ Failed — ${result.error}`);
        }
      }

      // Deactivate if expired >3 days with no auto-renew
      if (d < -3 && !sub.autoRenew) {
        await sub.update({ isActive: false });
        console.log(`[CRON] Deactivated "${sub.name}" (expired ${-d} days ago)`);
      }
    }

    console.log('[CRON] Daily job complete\n');
  } catch (err) {
    console.error('[CRON] Error:', err.message);
  }
}

module.exports = {
  start() {
    // Runs every day at midnight
    cron.schedule('0 0 * * *', runDailyJob);
    console.log('[CRON] Scheduler active — runs daily at 00:00');
  },
  runNow: runDailyJob,
};
