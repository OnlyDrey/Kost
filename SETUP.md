# Setup Guide

## Quick Setup (5 minutes)

### 1. Prerequisites

- **Node.js 18.19.1+** (not Node 20 - the project is compatible with Node 18)
- npm 9.0.0+
- Docker & Docker Compose

### 2. Check Your Environment

```bash
# Check Node version (should be 18.x)
node --version

# Check npm version (should be 9.x or higher)
npm --version

# If using nvm (recommended)
nvm use
```

### 3. Install Dependencies

```bash
npm install
```

**Expected Output:**
- ✅ Some deprecation warnings for development dependencies (this is normal)
- ✅ Husky git hooks installed
- ✅ ~1320 packages installed
- ⚠️ A few security vulnerabilities in dev dependencies (non-critical)

**If you see errors**, check the Troubleshooting section below.

### 4. Configure Environment

```bash
cp .env.example .env
```

**Minimum required configuration:**
```bash
# Database password
DB_PASSWORD=your-secure-password

# JWT secret (generate with: openssl rand -base64 32)
JWT_SECRET=your-jwt-secret-here

# Password auth is enabled by default (no SMTP needed)
AUTH_PASSWORD_ENABLED=true
```

### 5. Start Services

```bash
# Start PostgreSQL + API + Web
npm run docker:up

# Run migrations (in a new terminal)
npm run db:migrate

# Seed test data
npm run db:seed
```

### 6. Access the Application

- **Web UI:** http://localhost:3001
- **API:** http://localhost:3000
- **API Docs:** http://localhost:3000/api-docs

**Default login:**
- Email: `admin@familyfinance.local`
- Password: `password123`

---

## Troubleshooting

### Node Version Issues

**Problem:** `npm install` shows engine compatibility warnings

```
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE   package: 'family-finance@1.0.0',
npm warn EBADENGINE   required: { node: '>=18.0.0', npm: '>=9.0.0' },
npm warn EBADENGINE   current: { node: 'v16.x.x', npm: '8.x.x' }
npm warn EBADENGINE }
```

**Solution:**
1. Install Node 18.19.1 or higher
2. If using nvm:
   ```bash
   nvm install 18.19.1
   nvm use 18.19.1
   ```

### Installation Errors

**Problem:** `npm install` fails with peer dependency errors

**Solution:**
The project includes `.npmrc` with `legacy-peer-deps=true`. If you still see errors:

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### Husky Git Hook Error

**Problem:** During `npm install`:
```
fatal: not a git repository (or any of the parent directories): .git
```

**Solution:**
This is normal if you cloned the repo as a zip file or didn't initialize git:

```bash
# Initialize git (if needed)
git init
git add .
git commit -m "Initial commit"
```

Or disable husky preparation:
```bash
npm install --ignore-scripts
```

### Security Vulnerabilities

**Problem:** `npm install` shows vulnerabilities:
```
17 vulnerabilities (5 low, 6 moderate, 6 high)
```

**Solution:**
Most vulnerabilities are in **development dependencies** (build tools, testing libraries) and do not affect runtime security:

- **esbuild/vite**: Development build tool
- **glob**: Used by NestJS CLI (dev only)
- **webpack**: Used by NestJS CLI (dev only)
- **tmp/inquirer**: Used by NestJS CLI (dev only)

**For production deployments**, these dev dependencies are not included in the Docker image or runtime.

**To update (optional, may cause breaking changes):**
```bash
npm audit fix --force
# Note: This may upgrade major versions and require code changes
```

### Docker Issues

**Problem:** `docker-compose up` fails

**Common causes:**
1. **Port already in use:**
   ```bash
   # Check what's using port 5432 (PostgreSQL)
   lsof -i :5432
   # Kill the process or change the port in docker-compose.yml
   ```

2. **Docker not running:**
   ```bash
   # Start Docker daemon
   sudo systemctl start docker  # Linux
   open -a Docker              # macOS
   ```

### Database Migration Errors

**Problem:** `npm run db:migrate` fails

**Solution:**
1. Ensure PostgreSQL is running:
   ```bash
   docker-compose ps
   ```

2. Check database connection:
   ```bash
   # Test connection
   docker-compose exec db psql -U financeuser -d familyfinance
   ```

3. Reset database (⚠️ destructive):
   ```bash
   npm run migrate:reset --workspace=apps/api
   ```

### Build Errors

**Problem:** `npm run build` fails with TypeScript errors

**Solution:**
The project uses relaxed TypeScript settings for development. If you see errors:

1. Clean build:
   ```bash
   rm -rf apps/*/dist
   npm run build
   ```

2. Check TypeScript version:
   ```bash
   npx tsc --version  # Should be 5.3.3
   ```

### Environment Variable Issues

**Problem:** Application doesn't start or auth doesn't work

**Solution:**
1. Verify `.env` file exists:
   ```bash
   ls -la .env
   ```

2. Check required variables:
   ```bash
   cat .env | grep -E "DB_PASSWORD|JWT_SECRET|AUTH_PASSWORD_ENABLED"
   ```

3. Regenerate secrets if needed:
   ```bash
   openssl rand -base64 32  # New JWT_SECRET
   ```

---

## Clean Reinstall

If all else fails, perform a clean reinstall:

```bash
# Stop all services
npm run docker:down

# Remove all dependencies and build artifacts
rm -rf node_modules apps/*/node_modules packages/*/node_modules
rm -rf apps/*/dist
rm package-lock.json

# Reinstall
npm install

# Restart from scratch
npm run docker:up
npm run db:migrate
npm run db:seed
```

---

## Development Dependencies Explained

The project uses several **deprecated development dependencies** that do not affect runtime:

| Package | Status | Impact | Reason |
|---------|--------|--------|--------|
| `eslint@8.x` | Deprecated (EOL) | Dev only | ESLint 9 requires config migration |
| `glob@7.x/10.x` | Deprecated | Dev only | Used by NestJS CLI, not runtime |
| `rimraf@3.x` | Deprecated | Dev only | Used in prebuild scripts |
| `inflight`, `npmlog`, `gauge` | Deprecated | Dev only | Transitive dependencies of npm packages |

**For production:**
- These packages are **not included** in the Docker image
- Only runtime dependencies are bundled
- All runtime dependencies are up-to-date and secure

**To migrate to latest versions** (advanced users):
- ESLint 9: Requires flat config migration
- NestJS CLI 11: Requires NestJS 10+ and config changes
- This is planned for a future update

---

## Getting Help

- **GitHub Issues:** [Report a bug](https://github.com/your-org/family-finance/issues)
- **Discussions:** [Ask questions](https://github.com/your-org/family-finance/discussions)
- **Documentation:** See [README.md](./README.md) for full documentation

**When reporting issues, include:**
1. Node version: `node --version`
2. npm version: `npm --version`
3. Operating system
4. Error messages (full output)
5. Steps to reproduce
