# Setup Guide (Legacy)

> Archived reference. Prefer [docs/setup.md](./setup.md).


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

# Start PostgreSQL + App (single container: API + web UI)
npm run docker:up

# Run migrations (in a new terminal)
npm run db:migrate

# Seed test data
npm run db:seed
```

### 5. Access the Application

- **App (Web UI + API):** http://localhost:3000
- **API Docs:** http://localhost:3000/api/docs

**Default login (seeded from `.env` bootstrap vars):**

| Username | Password | Role  |
|----------|----------|-------|
| admin    | kostpass | Admin |

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
