require('dotenv').config();
const { sequelize } = require('./config/database');
const User         = require('./models/User');
const Subscription = require('./models/Subscription');

function addDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

async function seed() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: true }); // drops + recreates all tables

    console.log('🌱 Seeding...');

    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@subvault.com',
      passwordHash: 'admin123',
      balance: 100000,
      isAdmin: true,
    });

    const user = await User.create({
      name: 'Jean Diallo',
      email: 'jean@example.com',
      passwordHash: 'password123',
      balance: 34500,
      isAdmin: false,
    });

    await Subscription.bulkCreate([
      { userId: user.id, name: 'Netflix',              category: 'Streaming',   icon: '🎬', price: 7500,  billingCycleDays: 30,  expiryDate: addDays(1),  autoRenew: true  },
      { userId: user.id, name: 'Spotify',              category: 'Music',       icon: '🎵', price: 3500,  billingCycleDays: 30,  expiryDate: addDays(5),  autoRenew: true  },
      { userId: user.id, name: 'Office 365',           category: 'Productivity',icon: '📊', price: 12000, billingCycleDays: 30,  expiryDate: addDays(14), autoRenew: true  },
      { userId: user.id, name: 'Canal+',               category: 'Streaming',   icon: '📺', price: 15000, billingCycleDays: 30,  expiryDate: addDays(30), autoRenew: true  },
      { userId: user.id, name: 'Adobe Creative Cloud', category: 'Creative',    icon: '🎨', price: 25000, billingCycleDays: 30,  expiryDate: addDays(-2), autoRenew: false, isActive: false },
      { userId: admin.id,name: 'YouTube Premium',      category: 'Streaming',   icon: '▶️', price: 5000,  billingCycleDays: 30,  expiryDate: addDays(3),  autoRenew: true  },
    ]);

    console.log('✅ Done!');
    console.log('   Admin → admin@subvault.com / admin123');
    console.log('   User  → jean@example.com / password123');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
