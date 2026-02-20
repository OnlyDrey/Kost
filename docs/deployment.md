# Deployment

## Production Setup

### 1. Environment

Copy and configure the environment file:

```bash
cp .env.example .env
```

Minimum required changes:

```bash
# Strong database password
DB_PASSWORD=your-secure-password

# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 32)

# Set your domain
APP_URL=https://finance.yourdomain.com
CORS_ORIGIN=https://finance.yourdomain.com
```

### 2. Build and start

```bash
docker compose up -d
```

### 3. Run migrations

```bash
docker compose exec api npx prisma migrate deploy
```

### 4. (Optional) Seed initial data

```bash
docker compose exec api npx ts-node prisma/seed.ts
```

---

## Reverse Proxy

The app runs on two ports:
- **Web UI** → port `3001`
- **API** → port `3000`

Use any reverse proxy to expose them over HTTPS.

### Caddy

```caddy
finance.yourdomain.com {
    reverse_proxy /api* localhost:3000
    reverse_proxy localhost:3001
}
```

### Nginx

```nginx
server {
    listen 443 ssl;
    server_name finance.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Traefik

```yaml
# docker-compose labels on the web service
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.kost.rule=Host(`finance.yourdomain.com`)"
  - "traefik.http.services.kost.loadbalancer.server.port=3001"
```

---

## Environment Variables Reference

| Variable          | Required | Default           | Description                       |
|-------------------|----------|-------------------|-----------------------------------|
| `NODE_ENV`        | No       | `development`     | Set to `production` in prod       |
| `DB_USER`         | Yes      | `kostuser`        | PostgreSQL username                |
| `DB_PASSWORD`     | Yes      | `kostpass`        | PostgreSQL password                |
| `DB_NAME`         | Yes      | `kost`            | PostgreSQL database name           |
| `DATABASE_URL`    | Yes      | auto-generated    | Full PostgreSQL connection string  |
| `JWT_SECRET`      | Yes      | _(insecure default)_ | Secret for signing JWTs         |
| `JWT_EXPIRES_IN`  | No       | `7d`              | Token expiry                       |
| `APP_URL`         | No       | `http://localhost:3001` | Application base URL        |
| `CORS_ORIGIN`     | No       | `http://localhost:3001` | Allowed CORS origin         |
| `RATE_LIMIT_TTL`  | No       | `60`              | Rate limit window (seconds)        |
| `RATE_LIMIT_MAX`  | No       | `10`              | Max requests per window            |
| `API_PORT`        | No       | `3000`            | API server port                    |
| `WEB_PORT`        | No       | `3001`            | Web server port                    |
| `VITE_API_URL`    | No       | `http://localhost:3000/api` | API URL for frontend  |

---

## Database Backup

```bash
# Backup
docker compose exec db pg_dump -U kostuser kost > backup.sql

# Restore
docker compose exec -T db psql -U kostuser kost < backup.sql
```

---

## Updating

```bash
git pull
docker compose build
docker compose up -d
docker compose exec api npx prisma migrate deploy
```
