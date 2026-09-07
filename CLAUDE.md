# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Overview

A minimal single-page app built with Vite + React 19 + TypeScript. Bootstrapped from the
official Vite React template and customized with two real features: a dark-mode toggle and
an image-to-WebP converter. No router, no state-management library, no backend — everything
runs client-side in a single static page. Package manager is pnpm (`pnpm-lock.yaml`).

## Commands

- `pnpm dev` — start the Vite dev server (HMR)
- `pnpm build` — typecheck (`tsc -b`) then production build (`vite build`)
- `pnpm lint` — run ESLint (flat config in `eslint.config.js`)
- `pnpm preview` — preview the production build locally

## Architecture / entry flow

- `index.html` loads `src/main.tsx`, which mounts `<ThemeProvider><App /></ThemeProvider>`
  into `#root` under `StrictMode`.
- `src/App.tsx` is the page composition root: renders `Header`, a hero section, a counter
  demo, `ImageUploader`, and static "next steps" links. Most of the markup is unmodified
  template scaffolding; the theme toggle and image uploader are the real features.
- No routing — the app is a single static page.

## Component/module map

- `src/Header.tsx` + `Header.css` — top bar with the dark-mode toggle switch; reads/writes
  theme via `useTheme()`.
- `src/ThemeContext.ts` — theme domain logic: the `Theme` type, `getInitialTheme()`
  (localStorage, falling back to `prefers-color-scheme`), `persistTheme()`, the
  `ThemeContext`, and the `useTheme()` hook (throws if used outside `ThemeProvider`).
- `src/ThemeProvider.tsx` — context provider component; owns `theme` state, syncs the
  `data-theme` attribute on `<html>` and localStorage in a `useEffect`, exposes
  `toggleTheme`.
- `src/ImageUploader.tsx` + `ImageUploader.css` — file input UI. Validates image type/size
  (`MAX_UPLOAD_BYTES` = 10 MB), converts the file to WebP, shows before/after size and a
  preview, and cleans up object URLs on change/unmount.
- `src/convertToWebp.ts` — pure conversion utility: draws the file onto a canvas via
  `createImageBitmap` and exports it as a WebP `Blob` at a given quality (default `0.85`);
  throws if WebP encoding isn't supported by the browser.
- `src/App.css`, `src/index.css` — global/page styling. Theming is driven by the
  `data-theme` attribute set by `ThemeProvider`, not by a CSS-in-JS or utility framework.

## Conventions

- Theme persistence key in localStorage is `'theme'`.
- Components pair 1:1 with a same-named `.css` file (co-located styles); no CSS modules,
  no Tailwind.
- TypeScript config is split per the Vite template (`tsconfig.app.json` for app code,
  `tsconfig.node.json` for tooling/config files).
