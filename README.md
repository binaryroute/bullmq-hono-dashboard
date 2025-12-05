# BullMQ Hono Dashboard

A production-ready job queue dashboard built with BullMQ, Hono, and Bull Board. Features JWT-based authentication, role-based access control, and a beautiful web interface for monitoring your job queues.

## Features

- **BullMQ Integration** - Monitor and manage your BullMQ job queues
- **Bull Board UI** - Beautiful, interactive dashboard for queue visualization
- **JWT Authentication** - Secure session management with HttpOnly cookies
- **Role-Based Access Control** - Restrict dashboard access to authorized users
- **Rate Limiting** - Protection against brute-force login attempts
- **Health Endpoints** - Kubernetes-ready liveness and readiness probes
- **Graceful Shutdown** - Proper cleanup of Redis connections on termination

## Tech Stack

- **[Hono](https://hono.dev/)** - Ultrafast web framework
- **[BullMQ](https://docs.bullmq.io/)** - Redis-based job queue
- **[Bull Board](https://github.com/felixmosh/bull-board)** - Queue monitoring UI
- **[Drizzle ORM](https://orm.drizzle.team/)** - TypeScript ORM for database access
- **[MySQL](https://www.mysql.com/)** - User and role storage

## Prerequisites

- Node.js 18+
- Redis 6+
- MySQL 8+

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/bullmq-hono-dashboard.git
cd bullmq-hono-dashboard
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server
NODE_ENV=development
PORT=3000

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your-password
DB_DATABASE=job_dashboard

# Authentication
SESSION_SECRET=your-super-secret-key-min-32-chars

# Dashboard
DASHBOARD_BASE_PATH=/admin/queues
```

### 3. Setup Database

Run the migration to create the required tables:

```bash
mysql -u root -p job_dashboard < migrations/001_initial.sql
```

### 4. Create Admin User

```bash
# Generate a bcrypt hash for your password
node -e "require('bcrypt').hash('your-password', 10).then(console.log)"

# Insert user into database
mysql -u root -p job_dashboard -e "
INSERT INTO users (username, password_hash, email, first_name, last_name)
VALUES ('admin', '\$2b\$10\$...your-hash...', 'admin@example.com', 'Admin', 'User');

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.username = 'admin' AND r.name = 'ROLE_ADMIN';
"
```

### 5. Start the Server

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

Visit `http://localhost:3000/auth/login` to access the dashboard.

## Project Structure

```
src/
├── auth/                 # Authentication module
│   ├── config.ts         # Auth configuration
│   ├── middleware.ts     # JWT verification middleware
│   ├── routes.tsx        # Login/logout routes
│   ├── service.ts        # Credential verification
│   └── login-page.tsx    # SSR login page
├── dashboard/            # Dashboard setup
│   └── index.ts          # Bull Board configuration
├── db/                   # Database layer
│   ├── index.ts          # Connection setup
│   └── schema.ts         # Drizzle schema
├── queues/               # Queue management
│   ├── config.ts         # Redis configuration
│   ├── QueueManager.ts   # Queue lifecycle management
│   └── index.ts          # Queue exports
├── config.ts             # Application configuration
├── health.ts             # Health check endpoints
└── index.ts              # Application entry point
```

## API Endpoints

### Health Checks

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Full health status with queue stats |
| `GET /health/live` | Liveness probe (is process running?) |
| `GET /health/ready` | Readiness probe (is service ready?) |

### Authentication

| Endpoint | Description |
|----------|-------------|
| `GET /auth/login` | Login page |
| `POST /auth/login` | Handle login |
| `GET /auth/logout` | Logout (cookie clear) |
| `POST /auth/logout` | Logout (API) |
| `GET /auth/me` | Current user info (protected) |

### Dashboard

| Endpoint | Description |
|----------|-------------|
| `GET /admin/queues` | Bull Board dashboard (protected) |

## Adding Your Queues

Edit `src/queues/index.ts` to register your queues:

```typescript
import { QueueManager } from "./QueueManager.js";

export const queueManager = new QueueManager();

// Register your queues
queueManager.registerQueue("email-notifications");
queueManager.registerQueue("pdf-generation");
queueManager.registerQueue("data-processing");
```

## Security Considerations

- **Session Secret**: Use a strong, random secret (32+ characters)
- **HTTPS**: Enable `COOKIE_SECURE=true` in production
- **Rate Limiting**: Login attempts are limited to 5 per 15 minutes per IP
- **Password Hashing**: Uses bcrypt with cost factor 10
- **HttpOnly Cookies**: Session tokens are not accessible via JavaScript

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | development |
| `PORT` | Server port | 3000 |
| `REDIS_HOST` | Redis host | localhost |
| `REDIS_PORT` | Redis port | 6379 |
| `REDIS_PASSWORD` | Redis password | (none) |
| `DB_HOST` | MySQL host | localhost |
| `DB_USER` | MySQL user | root |
| `DB_PASSWORD` | MySQL password | (required) |
| `DB_DATABASE` | MySQL database | job_dashboard |
| `SESSION_SECRET` | JWT signing secret | (required) |
| `COOKIE_SECURE` | Secure cookie flag | false |
| `DASHBOARD_BASE_PATH` | Dashboard URL path | /admin/queues |
| `DASHBOARD_ALLOWED_ROLES` | Comma-separated roles | ROLE_ADMIN |

## License

MIT
