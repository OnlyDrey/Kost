# Contributing

## What you need

- Node.js 20+, npm 10+
- Docker Compose v2
- Familiarity with TypeScript, NestJS, and React

## What you get

- Consistent contributor workflow.
- Clear commit and PR expectations.

## Development workflow

1. Create a feature branch from `main`.
2. Make focused changes with tests/checks.
3. Commit using Conventional Commits.
4. Open a PR with summary, scope, and verification steps.

## Branching

- Branch format: `type/scope-short-description`
- Examples:
  - `fix/web-lint-bootstrap`
  - `docs/setup-deployment-refresh`

## Commit standard

Use Conventional Commits:

```text
feat(periods): add period close summary endpoint
fix(auth): clear cookie on invalid token
docs(operations): simplify recovery steps
```

## Coding standards

- Keep changes small and scoped.
- Prefer explicit types over `any`.
- Keep monetary logic in integer cents.
- Keep frontend strings translatable.
- Do not commit secrets or local `.env` changes.

## Pull request expectations

Each PR should include:

- concise problem statement
- what changed and why
- validation commands and outcomes
- screenshots for UI-visible changes

Recommended checks:

```bash
npm run lint --workspaces --if-present
npm run test --workspaces --if-present
npm run build
```


## Documentation placement

- Keep repository-level documentation in `docs/`.
- Keep `README.md` at repository root as the primary entry point.
- When adding a new guide, link it from `docs/index.md`.
