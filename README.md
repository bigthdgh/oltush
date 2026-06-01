# Oltush Booking System

Booking system for recreational base (houses, sauna, tub) with Telegram bot and bePaid payment integration.

## Tech Stack

- **Backend**: Go 1.23, chi router, PostgreSQL 16 (pgx), bePaid API
- **Frontend**: React 18, Vite, Tailwind CSS, Telegram Mini App
- **Infrastructure**: Docker Compose, Nginx, Certbot

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `POSTGRES_USER` | Yes | PostgreSQL user |
| `POSTGRES_PASSWORD` | Yes | PostgreSQL password |
| `POSTGRES_DB` | Yes | PostgreSQL database name |
| `BEPAID_ID` | Yes | bePaid shop ID |
| `BEPAID_SECRET` | Yes | bePaid shop secret |
| `BEPAID_CHECKOUT_URL` | No | bePaid checkout URL (default: https://checkout.bepaid.by/v2/checkout) |
| `BOT_TOKEN` | Yes | Telegram bot token from @BotFather |
| `BOT_WEBHOOK_SECRET` | Yes | Secret token for Telegram webhook validation |
| `ADMIN_TG_IDS` | Yes | Comma-separated Telegram numeric IDs of admins |
| `DOMAIN` | Yes | Production domain name |
| `FRONTEND_URL` | Yes | Frontend URL (e.g., https://your-domain.com) |
| `APP_ENV` | No | Environment (development/production) |
| `PORT` | No | Backend port (default: 8080) |

## Local Development

1. Copy `.env.example` to `.env` and fill values
2. Start PostgreSQL (Docker or local)
3. Run backend:
   ```bash
   cd backend
   go run ./cmd/server
   ```
4. Run frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Production Deployment

### 1. Prepare Environment
```bash
cp .env.example .env
# Fill all required variables in .env
```

### 2. Build Frontend
```bash
cd frontend
npm install
npm run build
```

### 3. Obtain SSL Certificate
```bash
docker compose -f docker-compose.prod.yml run --rm certbot-init
```

### 4. Set Telegram Webhook
```bash
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://<DOMAIN>/webhooks/telegram&secret_token=<BOT_WEBHOOK_SECRET>"
```

### 5. Start Stack
```bash
docker compose -f docker-compose.prod.yml up -d
```

## Database Schema

Tables: `items`, `customers`, `bookings`, `payments`

Migrations run automatically on backend startup via embedded SQL files.

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/items` - List all items
- `GET /api/items/{id}` - Get item details
- `GET /api/bookings/busy` - Get busy dates for item
- `POST /api/bookings/create` - Create booking
- `POST /api/payments/create` - Create payment
- `POST /api/webhooks/bepaid` - bePaid webhook
- `GET /api/admin/bookings` - Get all bookings (admin only)
- `POST /api/admin/bookings/manual` - Create manual booking (admin only)
- `PUT /api/admin/items/{id}` - Update item (admin only)
- `POST /webhooks/telegram` - Telegram bot webhook

## Telegram Bot Commands

- `/start` - Start bot
- `/help` - Help message
- `/bookings` - View your bookings
- `/admin` - Admin panel (admin only)
- `/stats` - Statistics (admin only)
