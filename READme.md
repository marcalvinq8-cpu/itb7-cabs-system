# CABS — Online Reservation, Booking, and Payment System

A full-stack web app for Cabuyao Athletes Basic School (CABS) for booking sports facilities online, with staff/admin approval workflows and PayMongo payments.

**Stack:** Laravel 12 (PHP 8.2) + React 19 (Vite) + MySQL 8 + PayMongo

```
ITB-7-capstone/
├─ backend/    Laravel API (default port 8000)
└─ frontend/   React + Vite app (default port 5173)
```

## How a reservation works

When a client requests a facility they choose one of two types:

- **Reserve** — submit the request, pay, then wait for staff/admin approval. Payment must be completed before staff can approve it (approving an unpaid request is blocked).
- **Book** — pay immediately for instant confirmation, no approval step. If the client closes the payment dialog before paying, the booking attempt is discarded rather than left sitting unpaid.

Either way, payment always comes before the reservation is confirmed — a client can't get an approved/confirmed booking without having paid first.

## Prerequisites

Install these on the new machine before cloning:

- **PHP 8.2+** with the `mysqli`/`pdo_mysql` extensions enabled (comes with [XAMPP](https://www.apachefriends.org/))
- **Composer** ([getcomposer.org](https://getcomposer.org/))
- **Node.js 18+** and npm (Node 24 was used for development)
- **MySQL** (XAMPP's MySQL/MariaDB works fine) — start it from the XAMPP Control Panel
- A [PayMongo](https://www.paymongo.com/) test-mode account, if you want working payments (optional — the app runs without it, payments will just fail)

## 1. Clone the repo

```bash
git clone <your-github-repo-url> ITB-7-capstone
cd ITB-7-capstone
```

## 2. Backend setup (Laravel)

```bash
cd backend
composer install
copy .env.example .env        # Windows (use `cp .env.example .env` on macOS/Linux)
php artisan key:generate
```

Create an empty database (via phpMyAdmin or the `mysql` CLI), e.g. named `cabs_db`, then edit `backend/.env` and set:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=cabs_db
DB_USERNAME=root
DB_PASSWORD=
```

Then run the migrations and seeders (creates tables + demo accounts/facilities):

```bash
php artisan migrate --seed
php artisan storage:link
```

If you have PayMongo test keys, add them to `backend/.env`:

```env
FRONTEND_URL=http://localhost:5173
PAYMONGO_SECRET_KEY=sk_test_xxxxxxxx
PAYMONGO_PUBLIC_KEY=pk_test_xxxxxxxx
PAYMONGO_WEBHOOK_SECRET=whsk_xxxxxxxx
```

Start the backend:

```bash
php artisan serve --port=8000
```

## 3. Frontend setup (React + Vite)

Open a **new terminal**:

```bash
cd frontend
npm install
copy .env.example .env        # Windows (use `cp .env.example .env` on macOS/Linux)
npm run dev
```

The default `frontend/.env` values already match the backend defaults, so no edits are needed unless you changed the backend port.

## 4. Open the app

Visit **http://localhost:5173** in your browser.

### Seed accounts (created by the seeders above)

| Role          | Email                  | Password     |
|---------------|-------------------------|--------------|
| Administrator | admin@cabs.edu.ph      | Admin@1234   |
| Staff         | staff@cabs.edu.ph      | Staff@1234   |
| Client        | juan@example.com       | Client@1234  |

`ClientSeeder` also creates 14 additional named demo client accounts (maria@, pedro@, ana@, carlo@, sofia@, mark@, jasmine@, ryan@, camille@, lester@, alyssa@, dennis@, kristine@, miguel@ — all `@example.com`, password `Client@1234`), and `MassClientSeeder` adds 100 more randomized ones (`client1@example.com` … `client100@example.com`, same password) so admin views and analytics have realistic volume. `HistoricalDataSeeder` then fills in realistic historical reservations/payments/notifications (a mix of Reserve and Book, across pending/approved/confirmed/completed/rejected/cancelled) for every client automatically — it's safe to re-run on its own since it skips clients that already have reservations. `php artisan migrate --seed` reproduces this full demo dataset (115 clients total) on any machine — no separate database export or image folder is needed to share the project.

## Troubleshooting

- **CORS / network errors in the browser console** — make sure `FRONTEND_URL` in `backend/.env` matches the URL you're opening the app from (default `http://localhost:5173`), then run `php artisan config:clear`.
- **"Database connection refused"** — make sure MySQL is running in the XAMPP Control Panel and `DB_*` values in `backend/.env` match your local MySQL setup.
- **Facility images missing** — re-run `php artisan storage:link` (creates `public/storage` as a symlink to `storage/app/public`).
- **Payments fail immediately** — expected if you haven't set the `PAYMONGO_*` keys; get free test-mode keys from your PayMongo dashboard.
- **Port already in use** — change `--port=8000` on the backend or the `server.port` in `frontend/vite.config.js` on the frontend, and update `VITE_API_BASE_URL` / `FRONTEND_URL` accordingly.
