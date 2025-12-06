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
- pnpm 8+
- Docker & Docker Compose (for development)
- Redis 6+ (or use Docker)
- MySQL 8+ (or use Docker)

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/binaryroute/bullmq-hono-dashboard.git
cd bullmq-hono-dashboard
pnpm install
```

### 2. Start Development Servers

Start MySQL and Redis using Docker Compose:

```bash
pnpm docker:up
```

This starts:
- **MySQL 8.0** on port 3306 (password: `password`, database: `job_dashboard`)
- **Redis 7** on port 6379

Other useful commands:
```bash
pnpm docker:down   # Stop and remove containers
pnpm docker:logs   # View container logs
```

### 3. Configure Environment

For local development (pre-configured for docker-compose):
```bash
cp .env.local.example .env.local
```

For production, copy and edit `.env.example`:
```bash
cp .env.example .env
# Edit .env with your production values
```

### 4. Setup Database

Run database migrations and seed default roles:

```bash
pnpm db:push    # Push schema to database (development)
pnpm db:seed    # Seed default roles
```

For production, use migrations:
```bash
pnpm db:migrate  # Run migrations
pnpm db:seed     # Seed default roles and sample admin user
```

The seed script creates a sample admin user:
- **Username:** `admin`
- **Password:** `admin123`

### 5. Start the Server

```bash
# Development
pnpm dev

# Production
pnpm build
pnpm start
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
│   ├── schema.ts         # Drizzle schema
│   └── seed.ts           # Database seeding script
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

## Database Migrations

This project uses [Drizzle ORM](https://orm.drizzle.team/) for database migrations.

| Script | Description |
|--------|-------------|
| `pnpm db:generate` | Generate migration from schema changes |
| `pnpm db:migrate` | Run pending migrations |
| `pnpm db:push` | Push schema directly (development) |
| `pnpm db:studio` | Open Drizzle Studio GUI |
| `pnpm db:seed` | Seed default roles |

### Creating a New Migration

1. Modify the schema in `src/db/schema.ts`
2. Generate migration: `pnpm db:generate`
3. Review generated SQL in `drizzle/` folder
4. Apply migration: `pnpm db:migrate`

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
