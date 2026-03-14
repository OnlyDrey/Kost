<p align="center">
  <img src="apps/web/public/logo-mark.svg" alt="Kost logo" width="96" />
</p>
<h1 align="center">Kost</h1>

<p align="center">
Kost is a self-hosted family finance and expense sharing application.
<br />
It helps households manage shared expenses, track payments, and calculate fair settlements between users.
</p>

## Overview

Kost is designed for families, couples, and shared households that want one place to manage common finances.

At a high level, the application lets you:
- Track shared and personal expenses
- Organize expenses into periods
- Calculate settlements between users
- Import/export financial data
- Create and restore backups

## Features

- **Expense tracking** for daily and recurring costs
- **Period-based settlement** to close and balance each time period
- **Shared cost distribution** between household members
- **Import and export** for data portability
- **Backup and restore** for safer self-hosted operation

## Screens and Concepts

- **Periods**: time windows used for planning, tracking, and closing finances
- **Expenses**: one-time or recurring costs linked to a period
- **Settlements (Oppgjør)**: transfer suggestions and payment tracking between users
- **Data management**: import/export of expenses and master data
- **Backups**: local backup creation and restore support

## Quick Start (Docker)

1. Create your environment file:

```bash
cp .env.example .env
```

2. Start the application:

```bash
docker compose up -d
```

3. Open the app:

- Application: <http://localhost:3000>
- Health check: <http://localhost:3000/api/health>

### Notes

- The application runs on port **3000** by default (`APP_PORT` in `.env`).
- PostgreSQL data is persisted in the `postgres_data` Docker volume.
- Uploaded files are persisted in the `uploads_data` Docker volume.
- Stop services with:

```bash
docker compose down
```

## Repository Structure

```text
apps/        frontend and backend applications
packages/    shared libraries and types
docs/        detailed documentation for advanced users
scripts/     helper scripts (Docker and repository utilities)
```

## Development (Short)

Install dependencies:

```bash
npm install
```

Run development servers:

```bash
npm run dev:api
npm run dev:web
```

For full development setup, workflows, and architecture details, see the docs listed below.

## Advanced Documentation

- [docs/architecture.md](docs/architecture.md)
- [docs/development.md](docs/development.md)
- [docs/docker.md](docs/docker.md)
- [docs/data.md](docs/data.md)
