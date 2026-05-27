# File Explorer

A Next.js 16 filesystem tree visualizer that fetches directory structure from a NestJS backend and renders it as an interactive, lazily-loaded tree with VS Code dark theme aesthetics.

## Overview

The frontend acts as a thin rendering layer over a NestJS API. On the server, it fetches the root tree via SSR. On the client, expanding directories triggers lazy fetches — children are loaded on demand and cached for the session.

```
Browser ──► Next.js (SSR page + /api/files proxy) ──► NestJS (:4000/files)
```

## Tech Stack

| Tool | Version | Purpose |
|---|---|---|
| Next.js | 16.2.x | App Router, SSR, API routes |
| React | 19.x | UI |
| Tailwind CSS | v4 | Styling (CSS-driven, no config file) |
| Framer Motion | 12.x | Expand/collapse animations |
| TypeScript | 5.x | Type safety |
| Vitest | 4.x | Unit tests |
| Playwright | 1.60.x | E2E tests |
| pnpm | 10.x | Package manager |
| Node.js | 24 | Runtime |

## Project Structure

```
src/
├── app/
│   ├── api/files/route.ts      # Next.js API route — proxies to NestJS
│   ├── page.tsx                # SSR root: fetches tree, renders FileTree
│   ├── layout.tsx              # HTML shell, dark bg
│   └── globals.css             # Tailwind v4 CSS import
├── components/
│   ├── file-tree/
│   │   ├── FileTree.tsx        # Client component — TreeStateProvider wrapper
│   │   ├── TreeNode.tsx        # Recursive node — handles files and dirs
│   │   ├── TreeIcon.tsx        # Emoji + color icon per file type
│   │   └── LoadingNode.tsx     # Skeleton shown while children fetch
│   └── ui/
│       └── ErrorBoundary.tsx   # React error boundary for tree render failures
├── context/
│   └── TreeStateContext.tsx    # Open/closed path state (Set<string>)
├── hooks/
│   └── useNodeChildren.ts      # Lazy fetch + cache for directory children
├── lib/
│   └── api-client.ts           # fetchFiles() — hits /api/files proxy
├── types/
│   └── file-tree.ts            # FileNode, ApiResponse, NodeType
└── utils/
    └── file-icons.ts           # Extension → emoji + color mapping
```

## Architecture

### Data Flow

1. **SSR** — `page.tsx` calls `NESTJS_API_URL/files` directly (server-to-server). Root tree renders with no client-side loading state.
2. **Client lazy load** — Expanding a dir calls `useNodeChildren`, which fetches `/api/files?path=<path>`. The Next.js API route proxies to NestJS.
3. **Cache** — Children are stored in component state. Once loaded, re-expanding skips the network call.
4. **Error recovery** — Fetch failures show an inline "Failed to load — click to retry" message. Retry calls `refetch()` which bypasses the cache.

### State Management

`TreeStateContext` holds a `Set<string>` of open paths. `toggle(path)` adds or removes a path. No global store — all state lives in the React tree.

### API Contract

NestJS must expose:

```
GET /files           → ApiResponse (root node with children)
GET /files?path=...  → ApiResponse (subtree at path)
```

Response shape:

```ts
interface ApiResponse {
  name: string
  type: 'file' | 'dir'
  path: string
  children: FileNode[]
}
```

## Setup

### Prerequisites

- Node.js 24+
- pnpm 10+
- NestJS backend running (default: `http://localhost:4000`)

### Install

```bash
pnpm install
```

### Environment

```bash
# .env.local
NESTJS_API_URL=http://localhost:4000
```

### Run

```bash
pnpm dev        # dev server at localhost:3000
pnpm build      # production build
pnpm start      # serve production build
```

## Testing

### Unit tests (Vitest + jsdom)

```bash
pnpm test:run   # single run
pnpm test       # watch mode
pnpm test:ui    # Vitest UI
```

Tests live next to source in `__tests__/` directories.

### E2E tests (Playwright)

Playwright starts the Next.js dev server and a mock NestJS server (`src/e2e/mock-nestjs.mjs`) automatically.

```bash
pnpm test:e2e
```

E2E test coverage:
- Root tree renders on page load
- Folder expand/collapse
- Nested expand at depth 3
- Fetch error shows inline error
- Retry after error re-fetches successfully

### Other checks

```bash
pnpm lint       # ESLint
pnpm typecheck  # tsc --noEmit
```

## CI

GitHub Actions runs on push/PR to `main`:

1. **ci** job — lint → typecheck → unit tests → build
2. **e2e** job (after ci) — installs Playwright Chromium, runs E2E suite, uploads report artifact on failure

## File Icon Colors

Icons follow VS Code conventions:

| Extension | Color |
|---|---|
| `.ts`, `.tsx` | `#519aba` (blue) |
| `.json` | `#f7c948` (yellow) |
| `.css`, `.scss` | `#ce9178` (orange) |
| `.md` | `#cccccc` (light gray) |
| directories | `#dcb67a` (tan) |
| other | `#858585` (gray) |
