# Architecture

## Overview

Kost is a monorepo with a frontend app, a backend API, and a shared package used by both.

## Main Components

### Frontend (`project/apps/web`)

- React + TypeScript application built with Vite
- Serves the user interface for periods, expenses, settlements, and data tools
- In local development, it runs as a Vite dev server
- In Docker production mode, built frontend assets are served by the API container

### Backend (`project/apps/api`)

- NestJS + TypeScript API
- Handles authentication, business logic, and data APIs
- Uses Prisma ORM with PostgreSQL
- Serves API routes under `/api`

### Shared Package (`project/packages/shared`)

- Shared TypeScript types and schemas
- Reduces duplication between frontend and backend
- Helps keep API contracts consistent

## Data Flow

1. User interacts with the frontend
2. Frontend calls backend endpoints (`/api/...`)
3. Backend validates and processes requests
4. Prisma reads/writes data in PostgreSQL
5. Backend returns structured responses to frontend

In containerized mode, frontend and backend run from one app container, while PostgreSQL runs in a separate container.

## High-Level Structure

```text
apps/
  api/    NestJS backend + Prisma
  web/    React frontend (Vite)
packages/
  shared/ Shared types/schemas
docs/     Project documentation
```
