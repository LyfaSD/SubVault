const { Sequelize } = require('sequelize');
const path = require('path');

let sequelize;

if (process.env.TURSO_URL && process.env.TURSO_TOKEN) {
  // Production — Turso cloud SQLite
  sequelize = new Sequelize({
    dialect: 'sqlite',
    dialectModule: require('@libsql/client/sequelize'),
    storage: process.env.TURSO_URL,
    dialectOptions: {
      authToken: process.env.TURSO_TOKEN,
    },
    logging: false,
  });
} else {
  // Local development — regular SQLite file
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '..', 'database.sqlite'),
    logging: false,
  });
}

module.exports = { sequelize };