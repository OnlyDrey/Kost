# Operations Runbook

## Standard rebuild/update

```bash
cd ~/Kost
git fetch origin --prune
git pull
docker compose down
docker compose up --build
```

## Last resort / destructive cleanup

> ⚠️ Warning: these commands can remove containers/images and may cause data loss if volumes are removed separately.

```bash
cd ~
rm -rf .cache .var Kost
sudo docker stop kost-app kost-db || true
sudo docker container prune -f
sudo docker system prune -af
```

Notes:
- `docker container prune -f` removes stopped containers.
- `docker system prune -af` removes unused images, networks, build cache, and stopped containers.
- Persistent data in named volumes is not removed by default, but verify before running destructive commands.
