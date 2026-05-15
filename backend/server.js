require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const { sequelize } = require('./config/database');
const cron = require('./jobs/cronScheduler');

const app = express();

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://sub-vault-sand.vercel.app/login', // replace with your actual Vercel URL
  ],
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/payment',       require('./routes/payment'));
app.use('/api/admin',         require('./routes/admin'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected (SQLite)');

    await sequelize.sync({ alter: true });
    console.log('✅ Tables synced');

    cron.start();

    app.listen(PORT, () => console.log(`✅ Server running → http://localhost:${PORT}`));
  } catch (err) {
    console.error('❌ Startup error:', err.message);
    process.exit(1);
  }
}

start();
