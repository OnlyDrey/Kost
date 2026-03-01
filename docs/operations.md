# Operations Runbook

## Update and rebuild

```bash
cd ~/Kost
git fetch origin --prune
git pull
docker compose down
docker compose up --build
```

## No-cache rebuild

```bash
docker compose down
docker compose build --no-cache
docker compose up
```

## Last resort / destructive cleanup

> Warning: These commands can remove containers/images/cache and may cause data loss.

```bash
cd ~
rm -rf .cache .var Kost
sudo docker stop kost-app kost-db || true
sudo docker container prune -f
sudo docker system prune -af
```

## Quick header checks

```bash
curl -sI http://localhost:3000/ | egrep -i "strict-transport-security|content-security-policy|x-kost-csp-mode"
curl -sI https://your-domain/ | egrep -i "strict-transport-security|content-security-policy|x-kost-csp-mode"
```
