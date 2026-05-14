const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  subscriptionId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  amount: {
    type: DataTypes.REAL,
    allowNull: false,
  },
  // 'success' | 'failed' | 'pending'
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending',
  },
  failReason: {
    type: DataTypes.STRING,
    defaultValue: null,
  },
  // 'auto' = cron triggered | 'manual' = user clicked
  triggeredBy: {
    type: DataTypes.STRING,
    defaultValue: 'manual',
  },
}, {
  tableName: 'transactions',
  timestamps: true,
  updatedAt: false,
});

module.exports = Transaction;
