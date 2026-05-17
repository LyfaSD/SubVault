const { Sequelize } = require('sequelize');
const path = require('path');

let sequelize;

if (process.env.TURSO_URL && process.env.TURSO_TOKEN) {
  // Production — Turso cloud SQLite
  const { createClient } = require('@libsql/client');

  const client = createClient({
    url: process.env.TURSO_URL,
    authToken: process.env.TURSO_TOKEN,
  });

  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    dialectModule: client,
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