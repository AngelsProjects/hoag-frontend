# File Tree Visualizer — Design Spec

**Date:** 2026-05-27  
**Status:** Approved

---

## Overview

Next.js application that visualizes a folder/file tree served by a NestJS REST API. The NestJS backend scans a real filesystem directory and returns its structure. The Next.js frontend renders it as a full-width, dark-themed, VS Code-style interactive tree with lazy-loaded children per folder node.

---

## Requirements

- Next.js 16, Node.js 24, Tailwind CSS, Framer Motion
- Nice to have: Vitest (unit tests), Playwright (e2e tests)
- View-only: expand/collapse folders, no file actions
- Fixed root path — single `GET /files` endpoint on NestJS
- Deep/arbitrary tree depth — lazy load children on expand
- Dark theme, VS Code aesthetic

---

## Architecture & Data Flow

```
Browser
  └─ Next.js App (SSR)
       ├─ Page (Server Component)
       │    └─ fetches GET /api/files (Route Handler, server-side)
       │         └─ proxies → NestJS GET /files
       │              └─ returns { name, type, path, children[] }
       └─ <FileTree> (Client Component, "use client")
            ├─ receives root node as prop (from SSR)
            ├─ TreeStateContext — Set<string> of open paths
            └─ <TreeNode> (recursive)
                 ├─ expand click → fetch /api/files?path=<node.path>
                 ├─ children cached in node local state
                 └─ Framer Motion animate open/close
```

**Key decisions:**
- Root node fetched server-side (SSR) — fast first paint, no loading spinner on initial load
- Browser never talks to NestJS directly — no CORS issues
- `NESTJS_API_URL` env var is server-side only (no `NEXT_PUBLIC_` prefix)
- Children fetched on first expand only, cached in component state — re-expand does not re-fetch

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                  # Server Component — fetches root, renders <FileTree>
│   ├── layout.tsx                # Root layout, global styles
│   └── api/
│       └── files/
│           └── route.ts          # Route Handler — proxies to NestJS
│
├── components/
│   ├── file-tree/
│   │   ├── FileTree.tsx          # "use client" root — holds TreeStateContext provider
│   │   ├── TreeNode.tsx          # Recursive node — folder or file
│   │   ├── TreeIcon.tsx          # File-type icon + color logic
│   │   └── LoadingNode.tsx       # Skeleton rows while children load
│   └── ui/
│       └── ErrorBoundary.tsx     # Catches fetch failures gracefully
│
├── context/
│   └── TreeStateContext.tsx      # open paths Set, toggle fn
│
├── hooks/
│   └── useNodeChildren.ts        # fetch + cache children for a path
│
├── types/
│   └── file-tree.ts              # FileNode, NodeType, ApiResponse interfaces
│
├── utils/
│   └── file-icons.ts             # ext → color/icon map (VS Code palette)
│
└── lib/
    └── api-client.ts             # typed fetch wrapper for /api/files
```

---

## Types & Interfaces

```typescript
// types/file-tree.ts

type NodeType = 'file' | 'dir'

interface FileNode {
  name: string
  type: NodeType
  path: string
  children?: FileNode[]   // absent = not yet loaded, [] = empty folder
}

interface ApiResponse {
  name: string
  type: NodeType
  path: string
  children: FileNode[]
}
```

`TreeNodeState` (loading, error, cached children) is internal to `useNodeChildren` — not exported from types.

---

## Component Behavior

### TreeNode
- **Folder:** click toggles open/closed. First open fetches children via `useNodeChildren`. Subsequent opens use cache.
- **File:** renders name + icon only. No interaction.
- **Loading:** renders `LoadingNode` (3 animated skeleton rows) while fetching.
- **Error:** inline red "Failed to load" text. Click to retry.

### TreeIcon — VS Code color palette
| Extension | Color |
|---|---|
| Folder open | `📂` `#dcb67a` |
| Folder closed | `📁` `#dcb67a` |
| `.ts` / `.tsx` | `#519aba` |
| `.json` | `#f7c948` |
| `.css` / `.scss` | `#ce9178` |
| `.md` | `#cccccc` |
| default | `#858585` |

### Animations (Framer Motion)
- Folder children: `AnimatePresence` + `motion.div`, `height: 0 → auto`, `opacity: 0 → 1`, `duration: 0.2s ease`
- Chevron: rotate `0deg → 90deg` on open
- Files: no animation

### Layout
- Indent: 16px per depth level
- Vertical connector lines: left-border on indent wrapper (VS Code style)

---

## API Proxy

**Route Handler** `app/api/files/route.ts`:

| Request | Proxies to |
|---|---|
| `GET /api/files` | `{NESTJS_API_URL}/files` |
| `GET /api/files?path=/src` | `{NESTJS_API_URL}/files?path=/src` |

- 30s fetch timeout → 504 on exceeded
- NestJS errors mapped to appropriate HTTP status + `{ error: string }` JSON body

**Required env var:**
```
NESTJS_API_URL=http://localhost:3001
```

### Error Handling Matrix

| Scenario | UI behavior |
|---|---|
| NestJS unreachable (root) | Full-page error message |
| Folder fetch fails | Inline "Failed to load" on node, retry on click |
| Empty folder | No children, no error |
| 404 from NestJS | Inline "Not found" on node |

---

## Testing Strategy

### Vitest (unit)
- `utils/file-icons.ts` — ext → color/icon mapping
- `useNodeChildren` — mock fetch, test loading/error/cache states
- `TreeNode` — render file vs folder, expand/collapse behavior
- `FileTree` — initial render with root node prop

### Playwright (e2e)
- Mock NestJS via `route.fulfill()` — no real backend needed in CI
- Root tree renders on load
- Click folder → children appear
- Click again → children collapse
- Nested expand (depth 3+)
- Fetch error → inline error shown
- Retry after error → re-fetches

### Test file locations
```
src/
├── components/file-tree/__tests__/
│   ├── TreeNode.test.tsx
│   └── FileTree.test.tsx
├── hooks/__tests__/
│   └── useNodeChildren.test.ts
├── utils/__tests__/
│   └── file-icons.test.ts
└── e2e/
    └── file-tree.spec.ts
```

---

## Out of Scope

- File preview or content display
- Download, copy path, or any file actions
- Search or filter
- Multiple root paths or path picker UI
- Authentication
