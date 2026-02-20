# Kost

A self-hosted app for tracking shared household expenses. Family members register invoices, and Kost splits the costs — equally, by custom percentage, or proportional to each person's income.

## Features

- **Invoice management** — create, categorize, and allocate invoices among family members
- **Flexible cost splitting** — equal, custom percentage, or income-proportional
- **Period management** — monthly billing periods with close and settlement calculation
- **Offline support** — works without internet; mutations sync when reconnected
- **Multi-language** — English and Norwegian (Bokmål)
- **Precise money math** — all calculations in integer cents, no floating-point errors

## Quick Start

### Requirements

- Node.js 22 LTS ([install via nvm](SETUP.md))
- Docker + Docker Compose V2 ([install guide](SETUP.md))

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set at minimum:

```bash
DB_PASSWORD=your-secure-password
JWT_SECRET=your-jwt-secret   # openssl rand -base64 32
```

### 3. Start services

```bash
npm run docker:up
```

### 4. Set up database

```bash
npm run db:migrate
npm run db:seed
```

### 5. Open the app

- **Web UI:** http://localhost:3001
- **API:** http://localhost:3000
- **API docs:** http://localhost:3000/api-docs

**Default login:**

| Username | Password    | Role  |
|----------|-------------|-------|
| admin    | password123 | Admin |
| ola      | password123 | Adult |
| lisa     | password123 | Adult |

---

## Development

Run without Docker:

```bash
# Start database
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=dev postgres:16-alpine

npm run db:migrate
npm run db:seed
npm run dev:api   # terminal 1 — API on port 3000
npm run dev:web   # terminal 2 — Web on port 3001
```

### Useful commands

```bash
npm run docker:up          # start all services
npm run docker:down        # stop all services
npm run docker:logs        # view logs
npm run db:migrate         # run pending migrations
npm run db:seed            # seed sample data
npm run test --workspace=apps/api          # run tests
npm run studio --workspace=apps/api        # open Prisma Studio
```

---

## Documentation

- [Architecture](docs/architecture.md) — tech stack, project structure, auth flow
- [Deployment](docs/deployment.md) — production setup, reverse proxy, environment variables
- [Database](docs/database.md) — schema, migrations, seed data
- [Allocation Rules](docs/allocation-rules.md) — how cost splits are calculated with exact rounding
- [Setup & Troubleshooting](SETUP.md) — installing Node, Docker, fixing common errors

---

## License

Private — family use only.
