# Kost

A self-hosted app for tracking shared household expenses. Family members register expenses, and Kost splits the costs — equally, by custom percentage, or proportional to each person's income.

## Features

- 💸 Create & split expenses (equal, %, or by income)
- 👨‍👩‍👧 Income-based splits with user control
- ✅ Track paid, partial, and unpaid invoices
- 🔁 Recurring expenses with one-click period invoices
- 🏷 Vendors with logos & reusable categories
- 💳 Managed payment methods
- 📊 Dashboard with personal share & category breakdown
- 🗓 Monthly periods with summaries & settlements
- 🧾 User income registration for fair splits
- 🖼 User avatars & profile settings
- ⚙️ Family & user admin settings
- 🌍 English & Norwegian (Bokmål)

## Quick Start

### Requirements

- Node.js 22 LTS ([install via nvm](SETUP.md))
- Docker + Docker Compose V2 ([install guide](SETUP.md))

### 1. Get repo files
```bash
git clone https://github.com/OnlyDrey/Kost.git && cd Kost
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set at minimum:

```bash
DB_PASSWORD=your-secure-password
JWT_SECRET=your-jwt-secret   # openssl rand -base64 32
```

### 4. Build and start services

```bash
npm run docker:up      # builds images and starts all services
```

### 5. Set up database

Run these after the containers are healthy (`docker compose ps` to check):

```bash
npm run db:migrate     # apply migrations (runs inside the API container)
npm run db:seed        # load sample data (runs inside the API container)
```

### 6. Open the app

- **Web UI:** http://localhost:3001
- **API:** http://localhost:3000
- **API docs:** http://localhost:3000/api/docs

**Default login:**

| Username | Password | Role  |
|----------|----------|-------|
| andreas  | kostpass | Admin |
| marta    | kostpass | Adult |

---

## Development

Run the API and web locally (database still in Docker):

```bash
# Start database only
docker run -d -p 5432:5432 \
  -e POSTGRES_USER=kostuser -e POSTGRES_PASSWORD=dev -e POSTGRES_DB=kost \
  postgres:16-alpine

# Generate Prisma client and apply migrations
export DATABASE_URL=postgresql://kostuser:dev@localhost:5432/kost
npm run generate --workspace=apps/api
npm run migrate --workspace=apps/api
npm run seed --workspace=apps/api

npm run dev:api   # terminal 1 — API on port 3000
npm run dev:web   # terminal 2 — Web on port 3001
```

### Useful commands

```bash
npm run docker:up          # build images and start all services
npm run docker:build       # force rebuild images without cache
npm run docker:down        # stop all services
npm run docker:logs        # view logs
npm run db:migrate         # apply migrations (API container must be running)
npm run db:seed            # seed sample data (API container must be running)
npm run test --workspace=apps/api          # run tests
npm run studio --workspace=apps/api        # open Prisma Studio
```

---

## Documentation

- [Architecture](docs/architecture.md) — tech stack, project structure, auth flow
- [Deployment](docs/deployment.md) — production setup, reverse proxy, environment variables
- [Database](docs/database.md) — schema, migrations, seed data
- [Allocation Rules](docs/allocation-rules.md) — how cost splits are calculated with exact rounding
- [Contributing](docs/contributing.md) — branching strategy, PR guidelines, code style, development workflow
- [Setup & Troubleshooting](SETUP.md) — installing Node, Docker, fixing common errors

---

## License

Private — family use only.
