# GitHub Copilot Instructions for this repository

## Quick summary ✅
- Repository is currently minimal: only `README.md` exists and no source directories, tests, or CI workflows are present.
- Default branch: `main`.

## Primary objective for an AI agent 🎯
- Confirm intent with the repo owner before adding language-specific scaffolding. This repo currently has no source files, so any non-trivial change should be agreed with the owner first.
- When asked to implement a feature or fix, create _small, incremental_ changes with tests and a clear PR describing intent.

## First steps (what to check immediately) 🔍
1. Read `README.md` for any project notes or scope. (Currently short; ask for more details.)
2. Inspect branches and recent activity:
   - `git fetch && git branch -a`
   - `git log --oneline -n 20`
   - `gh repo view --web` (open the repo in browser to view issues/PRs)
3. Look for CI/workflows: check `.github/workflows/` — if none, recommend adding a minimal workflow when adding tests.
4. Check issues and PRs for context: `gh issue list` and `gh pr list`.

---

## Node-specific guidance (recommended defaults) 🔧
> This repo currently has no source code. The following suggestions are tailored for a Node.js project; confirm choices before scaffolding.

- **Language**: Prefer **TypeScript** for new code unless the owner requests plain JavaScript.
- **Frameworks** (pick one per repo):
  - API: `express` or `fastify` (Express is simplest; Fastify for performance)
  - Fullstack: `next` if you intend to build a web app with SSR
  - Backend structure: keep `src/` as the source root with `index.ts` or `server.ts`
- **Package manager**: `npm` by default, or `pnpm` if performance is desired.
- **Testing**: `jest` + `supertest` for HTTP integration tests, or `vitest` for faster unit tests in TypeScript.
- **Linting & formatting**: `eslint` + `prettier` with `lint-staged` + `husky` pre-commit hooks.
- **CI**: GitHub Actions that run `npm ci` and `npm test` on push/PR.
- **Docker**: Add a lightweight `Dockerfile` when the team intends to deploy containers.

### Suggested repository layout
```
/ (repo root)
├─ README.md
├─ package.json
├─ tsconfig.json
├─ .eslintrc.cjs
├─ .prettierrc
├─ src/
│  └─ index.ts
├─ tests/
│  └─ example.test.ts
└─ .github/workflows/ci.yml
```

### Useful commands /scripts to include in `package.json`
- `npm run dev` — start dev server (e.g., `ts-node-dev src/index.ts`)
- `npm run build` — compile TypeScript (`tsc`)
- `npm run start` — run compiled output (`node dist/index.js`)
- `npm test` — run tests
- `npm run lint` — run ESLint
- `npm run format` — run Prettier

**Scaffold note:** A minimal TypeScript + Express scaffold was added on branch `feat/scaffold-node-ts`. To run locally:

- `git fetch && git checkout feat/scaffold-node-ts`
- `npm ci`
- `npm run dev` (dev server) or `npm test` (tests)

Refer to `README.md` for quick commands and `Dockerfile` / `.github/workflows/ci.yml` for CI / Docker examples.

---

## CI snippet (example) ⚙️
Use a minimal GitHub Actions workflow that verifies install and tests on pushes and PRs.

Example (high-level):
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm test --if-present
      - run: npm run lint --if-present
```

---

## PR process and expectations ✅
- Create a focused branch: `feat/<short-description>` or `fix/<short-description>`.
- Open a PR with `gh pr create --fill` and include: what changed, why, how it was tested, and manual verification steps (if any).
- Keep changes small and readable. Prefer multiple small PRs to a single large one.

## Patterns & examples specific to this repo (discoverable) 📁
- There are no existing patterns to mirror; document any newly introduced conventions in `README.md` and the repository root (e.g., `CONTRIBUTING.md`).
- Example: if you choose TypeScript + Express, include an example test under `tests/` that starts the server via `supertest` and asserts a `200` on `GET /`.

## When you are blocked or uncertain ❗
- Ask concise questions in issues and mention the repo owner. Example: "@owner — should I scaffold a Node/TypeScript/Express starter with tests and CI?"
- Do not guess credentials, secrets, or private integrations; request access or explicit instructions.

## Safety & non-goals ⚠️
- Avoid large, opinionated refactors without approval.
- Do not add secrets, real keys, or external service credentials to the repo or CI configs.

---

If you'd like, confirm the **following** and I will update this file with tailored examples and (optionally) scaffold the repo:
1. TypeScript or JavaScript? (recommended: **TypeScript**) 
2. Framework choice: `express`, `fastify`, `next`, or `none` (library)
3. Test runner: `jest` or `vitest` (recommended: **jest** for wider familiarity)
4. Package manager: `npm` or `pnpm`
5. Add CI + sample `Dockerfile` now? (yes/no)

Respond with your choices (e.g., `TypeScript, express, jest, npm, yes`) and I will: create a minimal scaffold, tests, and a `.github/workflows/ci.yml` that matches your preferences.