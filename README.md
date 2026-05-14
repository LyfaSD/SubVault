# SubVault — Subscription Manager

Full-stack subscription manager with automated payment processing.

## Stack
- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Database**: SQLite + Sequelize ORM (zero config, no installation)
- **Auth**: JWT (JSON Web Tokens)
- **Scheduler**: node-cron

---

## Project Structure

```
subvault/
├── backend/
│   ├── config/         database.js
│   ├── models/         User.js, Subscription.js, Transaction.js
│   ├── routes/         auth.js, subscriptions.js, payment.js, admin.js
│   ├── middleware/     auth.js (JWT guard), isAdmin.js
│   ├── jobs/           cronScheduler.js
│   ├── database.sqlite (auto-created on first run)
│   ├── .env
│   ├── package.json
│   ├── seed.js
│   └── server.js
└── frontend/
    ├── src/
    │   ├── components/ Navbar, SubscriptionCard, AlertBanner, BalanceWidget, SubscriptionModal
    │   ├── pages/      Dashboard, Admin, Login
    │   ├── context/    AuthContext.jsx, ToastContext.jsx
    │   └── utils/      api.js, dateHelpers.js
    ├── .env
    └── package.json
```

---

## Quick Start

### 1. Backend
```bash
cd backend
npm install
node seed.js
npm run dev
```

### 2. Frontend (open a second terminal)
```bash
cd frontend
npm install
npm run dev
```

### 3. Open browser
```
http://localhost:5173
```



> No database credentials needed — SQLite is a local file, created automatically.
