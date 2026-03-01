# Setup

## Prerequisites

- Node.js 22 LTS
- npm 10+
- Docker Engine + Compose v2 (`docker compose`)

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

Recommended minimum:

```bash
NODE_ENV=development
TRUST_PROXY=1
DB_PASSWORD=change-me
JWT_SECRET=replace-with-strong-secret
VITE_DEBUG_MODE=false
```

Enable runtime diagnostics only when needed:

```bash
VITE_DEBUG_MODE=true
```

## 3) Start locally

```bash
docker compose up --build
```

## 4) Access

- Web UI: http://localhost:3000
- API docs: http://localhost:3000/api/docs
