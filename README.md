# Kost

Kost is a self-hosted family finance and expense sharing application.
It helps households manage shared expenses, track payments, and calculate fair settlements between users.

## Workspace Layout

This repository keeps project planning/docs at the root, and the runnable monorepo workspace in:

- `project/` → application source code, Docker setup, and npm workspaces
- `docs/` → advanced project documentation

## Quick Start

```bash
git clone https://github.com/OnlyDrey/Kost.git
cd Kost/project
cp .env.example .env
docker compose up -d
```

Open:
- App: <http://localhost:3000>
- Health: <http://localhost:3000/api/health>

Stop:

```bash
docker compose down
```

## Development (from `project/`)

```bash
npm install
npm run dev:api
npm run dev:web
```

## Repository Structure

```text
.github/     CI workflows and repository automation
docs/        advanced documentation
project/     frontend, backend, packages, Docker, scripts
README.md    quick repository entrypoint
```

## Advanced Documentation

- [docs/overview.md](docs/overview.md)
- [docs/setup-and-deployment.md](docs/setup-and-deployment.md)
- [docs/operations.md](docs/operations.md)
- [docs/api.md](docs/api.md)
- [docs/web-app.md](docs/web-app.md)
- [docs/design-tokens.md](docs/design-tokens.md)
