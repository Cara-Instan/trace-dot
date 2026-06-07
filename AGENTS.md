# AGENTS.md — Trace

Desktop app for splitting and merging PDFs. **Trace** is built on Electrobun (Bun + native WebView) with a Vue 3 renderer bundled by Vite.

## Two-process layout

- **Main process**: `src/bun/index.ts` — Bun-side entry. Creates the `BrowserWindow`, sets window size 900x700, and decides whether to load the Vite dev server (HMR) or the packaged `views://mainview/index.html` URL.
- **Renderer process**: `src/mainview/` — Vue 3 SPA. **Vite's `root` is `src/mainview`** (see `vite.config.ts:7`), and `build.outDir` is `../../dist` (relative to Vite root → `<repo>/dist`). Vite serves dev on `http://localhost:5173` with `strictPort: true`.

`electrobun.config.ts:11-14` copies `dist/index.html` and `dist/assets` into the packaged app's `views/mainview/` directory. The bun main auto-detects a running Vite dev server on `:5173` only when the Updater channel is `dev` (`src/bun/index.ts:7-21`).

## Commands

All commands use **Bun** (lockfile is `bun.lock`, not `package-lock.json` / `pnpm-lock.yaml`).

| Command | What it does |
|---|---|
| `bun run dev` | `electrobun dev --watch` — runs the desktop app with file watching, **no HMR**. |
| `bun run dev:hmr` | Runs Vite (`bun run hmr`) **and** `bun run start` concurrently. Required for HMR. The bun main only uses the dev server when its Updater channel is `dev`. |
| `bun run start` | `vite build && electrobun dev` — builds dist first, then launches. |
| `bun run build:canary` | `vite build && electrobun build --env=canary`. There is **no plain `build` script** in `package.json` despite the README claiming `bun run build` — use `bun run start` for a local prod-like run. |

There is no `test`, `lint`, or `format` script. `vue-tsc` is installed but has no script wrapper; if you need a typecheck, run `bunx vue-tsc --noEmit` directly.

## Conventions

- **Path alias**: `@/*` → `./src/*` (`tsconfig.json:16-20`). Use it in Vue/TS imports.
- **Router**: `vue-router` v5 with `createWebHashHistory()` (`src/mainview/router/index.ts`). Hash routing is required because the packaged app loads from `views://` (a custom scheme), which has no server-side routing.
- **Routes**: `/`, `/merge`, `/split`, `/history`, `/settings` — see `router/index.ts:11-15` and views under `src/mainview/views/`.
- **Styling**: Tailwind v4. The only global stylesheet is `src/mainview/style.css`, which contains a single `@import "tailwindcss";`. **Do not enable `src/mainview/app.css`** — it is intentionally commented out in `main.ts:1` (kept around for shadcn-style theming experiments).
- **Components** live in `src/mainview/components/`. The shell is `App.vue` → `AppLayout.vue` (sidebar + main area via `Sidebar.vue`, `NavItem.vue`).
- **Generated/build output** is gitignored: `dist/`, `build/`, `artifacts/`, `*.tsbuildinfo` (`.gitignore`).
- **Reference HTML** in `references/` (incl. `references/shadcn/`) is **not** shipped source — it is static reference markup for UI inspiration. Do not import from it.

## What an agent typically gets wrong

- Editing files in `dist/` or `build/` — they are build outputs, not source. The real renderer source is `src/mainview/`.
- Assuming Vite's project root is the repo root — it is `src/mainview/`. Adding a `vite.config.ts`-level asset means putting it under `src/mainview/` or adjusting `root`.
- Confusing `bun run dev` with HMR — it isn't. For HMR you must use `bun run dev:hmr` and Vite must be reachable on `:5173` (port is `strictPort`; if it's taken, dev server fails rather than falling back).
- Reading the README claim that `bun run build` works — it does not. `package.json` only has `build:canary`; for a non-canary packaged build use `bun run start` (build + run) or call `electrobun build` directly.
- Trying to add tests / lint — no framework is configured. Don't introduce one without asking.
