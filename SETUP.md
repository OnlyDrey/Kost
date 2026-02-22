# Setup Guide

## Required Packages

Install these before cloning the project.

### Node.js 22 LTS

```bash
# Install nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc           # or open a new terminal

# Install and activate Node 22 LTS
nvm install 22
nvm use 22

# Verify
node --version             # v22.x.x
npm --version              # 10.x.x
```

### Docker Engine

```bash
# Install Docker from official script (Ubuntu/Debian)
curl -fsSL https://get.docker.com | sudo bash

# Allow running without sudo
sudo usermod -aG docker $USER
newgrp docker

# Verify
docker --version           # Docker version 24.x.x or newer
docker info                # should succeed (daemon running)
```

### Docker Compose V2

> **Important:** The project uses `docker compose` (space, V2 plugin). The old
> `docker-compose` (hyphen, V1 Python-based) is EOL and **crashes on Python 3.12+**
> with `ModuleNotFoundError: No module named 'distutils'`.

**Method A — apt** (only works if Docker was installed from Docker's official apt repo):
```bash
sudo apt-get update && sudo apt-get install docker-compose-plugin
docker compose version     # verify
```

**Method B — manual install** (works with ANY Docker installation, use this if apt fails):
```bash
DOCKER_CONFIG=${DOCKER_CONFIG:-$HOME/.docker}
mkdir -p $DOCKER_CONFIG/cli-plugins
curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
  -o $DOCKER_CONFIG/cli-plugins/docker-compose
chmod +x $DOCKER_CONFIG/cli-plugins/docker-compose
docker compose version     # verify: Docker Compose version v2.x.x
```

---

## Quick Setup (5 minutes)

### 1. Check Your Environment

```bash
# After cloning the project, run the built-in system checker:
bash check-system.sh
# or: npm run check  (after npm install)
```

It will detect and explain how to fix any missing requirements.

### 2. Install Dependencies

```bash
npm install
```

**Expected Output:**
- ✅ Some deprecation warnings for old transitive dev dependencies (normal, no EBADENGINE)
- ✅ Husky git hooks installed
- ✅ ~1222 packages installed
- ✅ No vulnerability count shown (audit is handled separately)

Run `npm run audit` to verify `found 0 vulnerabilities` for runtime dependencies.

**If you see errors**, check the Troubleshooting section below.

### 3. Configure Environment

```bash
cp .env.example .env
```

**Minimum required configuration:**
```bash
# Database password
DB_PASSWORD=your-secure-password

# JWT secret (generate with: openssl rand -base64 32)
JWT_SECRET=your-jwt-secret-here
```

### 4. Start Services

```bash
# Ensure Docker daemon is running
sudo systemctl start docker        # Linux — start once
sudo systemctl enable docker       # Linux — auto-start on boot
# open -a Docker                   # macOS — open Docker Desktop

# Allow running docker without sudo (Linux only, apply without re-login)
sudo usermod -aG docker $USER && newgrp docker

# Start PostgreSQL + API + Web
npm run docker:up

# Run migrations (in a new terminal)
npm run db:migrate

# Seed test data
npm run db:seed
```

### 5. Access the Application

- **Web UI:** http://localhost:3001
- **API:** http://localhost:3000
- **API Docs:** http://localhost:3000/api/docs

**Default login:**

| Username | Password    | Role  |
|----------|-------------|-------|
| admin    | password123 | Admin |
| ola      | password123 | Adult |
| lisa     | password123 | Adult |

---

## Troubleshooting

### Node Version Issues

**Problem:** `npm install` shows EBADENGINE warnings like:
```
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE   package: 'vite@7.x.x',
npm warn EBADENGINE   required: { node: '^20.19.0 || >=22.12.0' },
npm warn EBADENGINE   current: { node: 'v18.x.x', ... }
```

**Solution:** Upgrade to Node 22 LTS:
```bash
# Using nvm (recommended)
nvm install 22
nvm use 22

# Verify
node --version  # Should show v22.x.x
```

Node 18 reached End-of-Life in April 2025 and is no longer supported by this project.

### Docker Compose Error

**Problem:** `npm run docker:up` fails with:
```
ModuleNotFoundError: No module named 'distutils'
```
or
```
command not found: docker-compose
```

**Cause:** The old Python-based `docker-compose` V1 (with hyphen) is broken on Python 3.12+ and is EOL.

**Solution:** Install Docker Compose V2:
```bash
# Verify Docker Compose V2 is available (no hyphen)
docker compose version
# Should show: Docker Compose version v2.x.x

# If not available, install via Docker Desktop or:
# Ubuntu/Debian:
sudo apt-get install docker-compose-plugin
# Or install Docker Desktop which includes Compose V2
```

**Never use the old `docker-compose` command** (with hyphen). Always use `docker compose` (with space).

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
This is normal if you extracted a zip file instead of cloning the repo. Initialize git:

```bash
git init
git add .
git commit -m "Initial commit"
npm install  # Re-run to install husky hooks
```

Or skip hooks entirely:
```bash
npm install --ignore-scripts
```

### Security Vulnerabilities

**Problem:** `npm install` shows a vulnerability count

**Cause:** Your local files may be from an older download. The latest version suppresses this.

**Solution:**
1. Re-download or pull the latest version from the branch
2. Delete `node_modules` and `package-lock.json`, then run `npm install`

After a clean install from the latest branch, `npm install` should show no vulnerability messages.

To manually check runtime security at any time:
```bash
npm run audit
# Expected: found 0 vulnerabilities
```

> ⚠️ **WARNING: Never run `npm audit fix --force`** — it downgrades packages to ancient incompatible versions and introduces CRITICAL vulnerabilities. The remaining dev-tool warnings are in Angular DevKit's internals and have no fixable upstream alternative.

### Docker Issues

**Problem:** `docker compose up` fails

**Common causes:**
1. **Port already in use:**
   ```bash
   # Check what's using port 5432 (PostgreSQL)
   lsof -i :5432
   # Kill the process or change the port in docker-compose.yml
   ```

2. **Docker not running** — `Cannot connect to the Docker daemon at unix:///var/run/docker.sock`:
   ```bash
   sudo systemctl start docker     # Linux (one-time)
   sudo systemctl enable docker    # Linux (auto-start on boot)
   open -a Docker                  # macOS — open Docker Desktop
   ```

3. **Permission denied** — `dial unix /var/run/docker.sock: connect: permission denied`:
   ```bash
   # Add your user to the docker group (no sudo needed after this)
   sudo usermod -aG docker $USER && newgrp docker
   # Verify: docker ps  (should work without sudo)
   ```

### Database Migration Errors

**Problem:** `npm run db:migrate` fails

**Solution:**
1. Ensure PostgreSQL is running:
   ```bash
   docker compose ps
   ```

2. Check database connection:
   ```bash
   docker compose exec db psql -U kostuser -d kost
   ```

3. Reset database (⚠️ destructive):
   ```bash
   npm run migrate:reset --workspace=apps/api
   ```

### Build Errors

**Problem:** `npm run build` fails with TypeScript errors

**Solution:**
1. Clean build:
   ```bash
   rm -rf apps/*/dist
   npm run build
   ```

2. Check TypeScript version:
   ```bash
   npx tsc --version  # Should be 5.3.x
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

## Security Audit Explained

The project is configured to suppress the automatic npm audit report during `npm install` (`audit=false` in `.npmrc`). This is intentional because:

1. **Zero runtime vulnerabilities** — `npm run audit` reports `found 0 vulnerabilities`
2. **10 moderate dev-only warnings** from Angular DevKit's internal `ajv@6` usage (inside `@nestjs/cli`) cannot be fixed upstream and are dev-build-time only
3. **Running `npm audit fix --force` is destructive** — it downgrades `@nestjs/cli` to ancient v1.8.0 and introduces CRITICAL lodash vulnerabilities

**Security overrides applied:**
| Package | Override | CVE Fixed |
|---------|----------|-----------|
| `js-yaml` | `^4.1.1` | GHSA-mh29-5h37-fv8m (prototype pollution) |
| `lodash` | `^4.17.23` | GHSA-jf85-cpcp-j695 (prototype pollution) |
| `nodemon` | `^3.1.0` | GHSA-grv7-fg5c-xmjg (braces ReDoS) |
| `cross-spawn` | `^7.0.6` | GHSA-3xgq-45jj-v275 (ReDoS) |
| `got` | `^11.8.5` | GHSA-pfrx-2q88-qq97 (redirect) |

---

## Getting Help

- **GitHub Issues:** [Report a bug](https://github.com/your-org/kost/issues)
- **Discussions:** [Ask questions](https://github.com/your-org/kost/discussions)
- **Documentation:** See [README.md](./README.md) for full documentation

**When reporting issues, include:**
1. Node version: `node --version`
2. npm version: `npm --version`
3. Docker Compose version: `docker compose version`
4. Operating system
5. Error messages (full output)
6. Steps to reproduce
