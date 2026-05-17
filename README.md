# SubVault — Subscription Manager

A full-stack web application to manage subscriptions, automate payments,
and track renewals with expiry countdowns and alerts.

**Live demo:** https://sub-vault-rho.vercel.app

---

## What it does

- Users can add subscriptions (Netflix, Spotify, etc.) with a price and expiry date
- Dashboard shows a countdown ring for each subscription
- Alerts appear automatically when a subscription is 7, 5, 3, 2, or 1 day(s) from expiring
- Users can top up their wallet balance and renew subscriptions with one click
- If balance is insufficient, a 402 error is shown and the user is prompted to top up
- A daily cron job runs at midnight to auto-renew subscriptions and send reminders
- Admin panel shows all users, balances, subscriptions, and transactions
- Admins can reset expiry dates and manually edit user balances
- Fully responsive — works on mobile, tablet, and desktop

---

## Stack

| Layer          | Technology                        |
|----------------|-----------------------------------|
| Frontend       | React 18 + Vite                   |
| Backend        | Node.js + Express                 |
| Database       | SQLite + Sequelize ORM            |
| Auth           | JWT (JSON Web Tokens)             |
| Scheduler      | node-cron                         |
| Frontend host  | Vercel                            |
| Backend host   | Render                            |

---

## Project Structure

```
subvault/
├── backend/
│   ├── config/
│   │   └── database.js          SQLite connection (auto-creates file)
│   ├── models/
│   │   ├── User.js              name, email, balance, isAdmin
│   │   ├── Subscription.js      name, price, expiryDate, autoRenew
│   │   └── Transaction.js       payment log — success/failed/pending
│   ├── routes/
│   │   ├── auth.js              POST /login, /register — GET /me
│   │   ├── subscriptions.js     full CRUD for subscriptions
│   │   ├── payment.js           balance check, deduct, extend expiry
│   │   └── admin.js             admin-only endpoints
│   ├── middleware/
│   │   ├── auth.js              JWT guard — protects private routes
│   │   └── isAdmin.js           admin-only route guard
│   ├── jobs/
│   │   └── cronScheduler.js     runs daily at midnight
│   ├── seed.js                  creates demo users and subscriptions
│   ├── server.js                Express entry point
│   ├── .env                     local environment variables (never commit)
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx            top nav — hamburger menu on mobile
    │   │   ├── SubscriptionCard.jsx  card with SVG countdown ring
    │   │   ├── AlertBanner.jsx       expiry warning banners
    │   │   ├── BalanceWidget.jsx     balance display + top-up modal
    │   │   └── SubscriptionModal.jsx add/edit subscription form
    │   ├── pages/
    │   │   ├── Login.jsx        login and register page
    │   │   ├── Dashboard.jsx    main user view
    │   │   └── Admin.jsx        admin panel with 4 tabs
    │   ├── context/
    │   │   ├── AuthContext.jsx  global user state — login/logout/balance
    │   │   └── ToastContext.jsx toast notification system
    │   └── utils/
    │       ├── api.js              all fetch calls to the backend
    │       ├── dateHelpers.js      date math, formatting, status logic
    │       └── useBreakpoint.js    responsive hook — isMobile/isTablet/isDesktop
    ├── .env                     local environment variables (never commit)
    ├── vercel.json              Vercel build config
    └── package.json
```

---

## Local Development

### 1. Clone the repo
```bash
git clone https://github.com/LyfaSD/SubVault.git
cd SubVault
```

### 2. Backend
```bash
cd backend
npm install
node seed.js
npm run dev
```

### 3. Frontend (open a second terminal)
```bash
cd frontend
npm install
npm run dev
```

### 4. Open browser
```
http://localhost:5173
```

---


---

## API Endpoints

### Auth
| Method | Route               | Auth  | Description            |
|--------|---------------------|-------|------------------------|
| POST   | /api/auth/register  | —     | Create account         |
| POST   | /api/auth/login     | —     | Login, receive JWT     |
| GET    | /api/auth/me        | ✓     | Get current user       |

### Subscriptions
| Method | Route                    | Auth | Description            |
|--------|--------------------------|------|------------------------|
| GET    | /api/subscriptions       | ✓    | List all subscriptions |
| POST   | /api/subscriptions       | ✓    | Create subscription    |
| PUT    | /api/subscriptions/:id   | ✓    | Update subscription    |
| DELETE | /api/subscriptions/:id   | ✓    | Delete subscription    |

### Payment
| Method | Route                       | Auth | Description          |
|--------|-----------------------------|------|----------------------|
| POST   | /api/payment/process        | ✓    | Renew a subscription |
| POST   | /api/payment/topup          | ✓    | Add balance          |
| GET    | /api/payment/transactions   | ✓    | Payment history      |

### Admin
| Method | Route                              | Auth  | Description           |
|--------|------------------------------------|-------|-----------------------|
| GET    | /api/admin/stats                   | Admin | System statistics     |
| GET    | /api/admin/users                   | Admin | All users             |
| GET    | /api/admin/subscriptions           | Admin | All subscriptions     |
| GET    | /api/admin/transactions            | Admin | All transactions      |
| PATCH  | /api/admin/subscriptions/:id/reset | Admin | Reset expiry +30 days |
| PATCH  | /api/admin/users/:id/balance       | Admin | Edit user balance     |

---

## Payment Flow

```
User clicks Renew
        ↓
POST /api/payment/process
        ↓
Check: balance >= price ?
        ↓                      ↓
      YES                      NO
        ↓                      ↓
  Deduct balance          Return 402 error
  Extend expiry +30d      Show "Top Up" prompt
  Log success TX          Log failed TX
```

---

## Cron Scheduler

Runs every day at midnight — `0 0 * * *`

For each active subscription it:
1. Checks days remaining until expiry
2. Sends a reminder notification if days match `[7, 5, 3, 2, 1]`
3. Auto-pays if today is the expiry day and `autoRenew` is true
4. Marks subscription inactive if expired more than 3 days with no auto-renew

To plug in real notifications, edit `backend/jobs/cronScheduler.js`
and replace the `console.log` in `sendReminder()` with nodemailer or Twilio.

---

## Responsiveness

Uses a custom `useBreakpoint` hook that watches `window.innerWidth` and
returns `isMobile`, `isTablet`, `isDesktop` as boolean values.

| Breakpoint | Width      | Changes                                                            |
|------------|------------|--------------------------------------------------------------------|
| Mobile     | < 640px    | 1 column cards, hamburger menu, scrollable tables, stacked modals |
| Tablet     | 640–1023px | 2 column cards                                                     |
| Desktop    | ≥ 1024px   | 3+ column cards, full navbar with balance                          |

---

## Deployment

### Backend — Render
- **Service type**: Web Service
- **Root directory**: `backend`
- **Build command**: `npm install`
- **Start command**: `node seed.js && node server.js`
- Set `JWT_SECRET` in the Render environment variables dashboard
- CORS is configured in `server.js` to allow your Vercel domain

### Frontend — Vercel
- **Root directory**: `frontend`
- **Framework preset**: Vite
- Set `VITE_API_URL` in the Vercel environment variables dashboard
- `vercel.json` is already configured in the frontend folder

### Important note on free tier
Render's free tier spins down after 15 minutes of inactivity.
The first request after inactivity may take 30–60 seconds to respond
while the server wakes up. This is normal on the free plan.
The SQLite database resets on each deploy — demo data is restored
automatically by `seed.js` running at startup.

---

