const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  balance: {
    type: DataTypes.REAL,
    defaultValue: 0,
  },
  isAdmin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'users',
  timestamps: true,
});

// Hash password before create
User.beforeCreate(async (user) => {
  const salt = await bcrypt.genSalt(10);
  user.passwordHash = await bcrypt.hash(user.passwordHash, salt);
});

// Compare plain password with hash
User.prototype.validatePassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

// Return user data without sensitive fields
User.prototype.toSafeJSON = function () {
  const { passwordHash, ...safe } = this.toJSON();
  return safe;
};

module.exports = User;
