# Setup

## Prerequisites

- Node.js 22 LTS
- npm 10+
- Docker Engine with Compose v2 (`docker compose`)

## 1) Clone and install

```bash
git clone https://github.com/OnlyDrey/Kost.git
cd Kost
npm install
```

## 2) Configure environment

```bash
cp .env.example .env
```

Minimum recommended values:

```bash
DB_PASSWORD=change-me
JWT_SECRET=replace-with-strong-secret
NODE_ENV=development
TRUST_PROXY=1
VITE_DEBUG_MODE=true
```

## 3) Start locally (containers)

```bash
docker compose up --build
```

## 4) Initialize database

```bash
npm run db:migrate
npm run db:seed
```

## 5) Access

- Web: http://localhost:3000
- API docs: http://localhost:3000/api/docs
