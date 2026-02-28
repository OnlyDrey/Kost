.PHONY: build dev docker-build docker-up db-migrate db-reset

build:
	npm run build

dev:
	npm run dev:api & npm run dev:web

docker-build:
	docker compose build

docker-up:
	docker compose up -d --build

db-migrate:
	docker compose exec app /app/node_modules/.bin/prisma migrate deploy

db-reset:
	docker compose exec app /app/node_modules/.bin/prisma migrate reset --force
