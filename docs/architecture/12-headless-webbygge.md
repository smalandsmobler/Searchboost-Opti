# 12 — Headless webbygge (Next.js anti-slop-standard)

> Källa: `searchboost-react/package.json` + `app/`. Verifierat 2026-05-30. Konkreta configs tillagda 2026-05-31.

## Installerade configs (2026-05-31)

| Fil | Roll |
|-----|------|
| `searchboost-react/.eslintrc.cjs` | next/core-web-vitals + @typescript-eslint + prettier; warn på `any`, `console.log`, mutation, filer >400 rader, funktioner >80 rader |
| `searchboost-react/.prettierrc.json` | semi, single quotes, 100 width, lf line endings |
| `searchboost-react/.prettierignore` | hoppar över `.next/`, `node_modules/`, `public/`, `out/` |
| `searchboost-react/playwright.config.ts` | Chromium, Firefox, WebKit + mobil-Chrome (Pixel 7) + mobil-Safari (iPhone 14); webServer i CI |
| `searchboost-react/.lighthouserc.json` | Performance ≥85, A11y ≥95, BP ≥90, SEO ≥95; LCP <2.5s, CLS <0.1 (matchar `ecc/web/performance.md`) |
| `searchboost-react/tests/e2e/smoke.spec.ts` | 3 grundtester: titel-laddning, inga konsolfel, mobil 375px utan overflow |

### Nya npm scripts
```
npm run lint          # next lint
npm run lint:fix      # next lint --fix
npm run format        # prettier --write .
npm run format:check  # prettier --check .
npm run typecheck     # tsc --noEmit
npm run test:e2e      # playwright test
npm run lighthouse    # lhci autorun
npm run quality       # typecheck + lint + format:check (en-trigg)
```

### devDependencies tillagda
`@playwright/test`, `@lhci/cli`, `eslint` + `eslint-config-next` + `eslint-config-prettier` + `@typescript-eslint/parser` + `@typescript-eslint/eslint-plugin`, `prettier`.

Installera: `cd searchboost-react && npm install`.

## Nuläge

`searchboost-react` = searchboost.se lab-sajt (Next.js, ej WordPress). Testbädd för att utveckla en optimization-pipeline för React/Next/headless som sen kan säljas in till kunder.

Stack:
- Next **16.2.4**, React **19.2.4**, Tailwind **4**, framer-motion 12, three 0.184, next-themes, lucide-react.
- TypeScript 5.
- App Router (`app/`): page.tsx, layout.tsx, tjanster, om-oss, kontakt, seo-skola, robots.ts, sitemap.ts.

## ⚠️ KRITISKT GAP: noll kvalitetstooling

`package.json` scripts = endast `dev`, `build`, `start`. **Saknas helt:**
- ESLint
- Prettier
- TypeScript type-check i CI (`tsc --noEmit`)
- Lighthouse / CWV-mätning
- Playwright / tester
- Visual regression

Detta är roten till Mikaels "slop"-oro: utan tooling finns ingen automatisk kvalitetsgrind.

## Anti-slop byggstandard (specifikation — implementeras separat pass)

Baserad på ECC web-rules ([design-quality](../../.claude-config/.claude/rules/ecc/web/design-quality.md), performance, testing).

### 1. Tooling att lägga till
```jsonc
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "typecheck": "tsc --noEmit",
  "format": "prettier --write .",
  "test": "playwright test",
  "lighthouse": "lhci autorun"
}
```
devDependencies: eslint + eslint-config-next, prettier, @playwright/test, @lhci/cli, stylelint.

### 2. CWV-budget (från web/performance.md)
| Metrik | Mål |
|--------|-----|
| LCP | < 2.5s |
| INP | < 200ms |
| CLS | < 0.1 |
| FCP | < 1.5s |
JS-budget landningssida < 150kb gzip, CSS < 30kb.

### 3. Design-quality (anti-template)
Varje yta ska visa minst 4 av: hierarki via skalkontrast, medveten rytm, djup/lager, typografi med karaktär, semantisk färg, designade hover/focus/active, editorial/bento-komposition, textur/atmosfär, motion som klargör, datavisualisering som del av systemet. Förbjudet: default-kortgrid, stock-hero med gradient-blob, obearbetade biblioteksdefaults, safe grå-på-vitt.

### 4. Bild/font
- Explicit width/height på alla bilder, AVIF/WebP, hero `fetchpriority=high` + eager, övrigt lazy.
- Max 2 typsnitt, `font-display: swap`, preload bara kritisk vikt.

### 5. Motion
- Endast compositor-vänliga properties (transform/opacity/clip-path).
- `will-change` smalt, IntersectionObserver istället för scroll-handlers.
- Respektera `prefers-reduced-motion`.

### 6. Pipeline för React/Next-optimering (säljbar produkt)
- `headless_pending_fixes`-tabellen finns redan → bygg loop: audit headless-sajt → flagga fixar → PR-baserad applicering (WP REST API funkar inte för headless, behöver git-PR-approach).
- Återanvändbart starter-/theme-template som uppfyller ovan från start.

## GÖR vs BORDE GÖRA

| Område | GÖR | BORDE |
|--------|-----|-------|
| Modern stack | ✅ Next 16/React 19/TW4 | — |
| Kvalitetsgrind | ❌ Ingen | ESLint+Prettier+tsc+Lighthouse+Playwright |
| Anti-slop | Ingen checklista | Implementera design-quality-checklista |
| Headless-optim-pipeline | `headless_pending_fixes` finns | Bygg PR-baserad fix-loop |
