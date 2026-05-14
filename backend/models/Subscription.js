const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Subscription = sequelize.define('Subscription', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING,
    defaultValue: 'Other',
  },
  icon: {
    type: DataTypes.STRING,
    defaultValue: '📦',
  },
  price: {
    type: DataTypes.REAL,
    allowNull: false,
  },
  billingCycleDays: {
    type: DataTypes.INTEGER,
    defaultValue: 30,
  },
  expiryDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  autoRenew: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'subscriptions',
  timestamps: true,
});

// Days remaining until expiry (negative = already expired)
Subscription.prototype.daysRemaining = function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(this.expiryDate);
  return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
};

// Status label based on days remaining
Subscription.prototype.getStatus = function () {
  const d = this.daysRemaining();
  if (d < 0)  return 'expired';
  if (d <= 2) return 'critical';
  if (d <= 7) return 'expiring';
  return 'active';
};

module.exports = Subscription;
