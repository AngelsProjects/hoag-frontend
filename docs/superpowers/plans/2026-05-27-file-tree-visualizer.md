# File Tree Visualizer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js 16 app that fetches a filesystem tree from a NestJS API and renders it as a full-width, dark VS Code-style interactive tree with lazy-loaded folder expansion.

**Architecture:** Server Component fetches root node via a Next.js Route Handler (which proxies to NestJS), then passes it to a client-side `<FileTree>` component. Folder nodes lazy-fetch their children on first expand via the same Route Handler, caching results in component state. Framer Motion animates open/close transitions.

**Tech Stack:** Next.js 16, Node.js 24, TypeScript, Tailwind CSS, Framer Motion, Vitest, Playwright

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/types/file-tree.ts` | Create | Shared types: `NodeType`, `FileNode`, `ApiResponse` |
| `src/utils/file-icons.ts` | Create | Extension → VS Code color/icon map |
| `src/lib/api-client.ts` | Create | Typed fetch wrapper for `/api/files` |
| `src/context/TreeStateContext.tsx` | Create | Open paths `Set<string>` + toggle fn |
| `src/hooks/useNodeChildren.ts` | Create | Fetch + cache children for a path |
| `src/components/file-tree/TreeIcon.tsx` | Create | Renders file-type icon with color |
| `src/components/file-tree/LoadingNode.tsx` | Create | Animated skeleton rows |
| `src/components/ui/ErrorBoundary.tsx` | Create | Catches render errors gracefully |
| `src/components/file-tree/TreeNode.tsx` | Create | Recursive node (folder or file) |
| `src/components/file-tree/FileTree.tsx` | Create | Client root, holds context provider |
| `src/app/api/files/route.ts` | Create | Route Handler — proxies to NestJS |
| `src/app/page.tsx` | Create | Server Component — SSR root fetch |
| `src/app/layout.tsx` | Create | Root layout, dark global styles |
| `src/utils/__tests__/file-icons.test.ts` | Create | Unit tests for icon mapping |
| `src/hooks/__tests__/useNodeChildren.test.ts` | Create | Unit tests for hook |
| `src/components/file-tree/__tests__/TreeNode.test.tsx` | Create | Unit tests for TreeNode |
| `src/components/file-tree/__tests__/FileTree.test.tsx` | Create | Unit tests for FileTree |
| `src/e2e/file-tree.spec.ts` | Create | Playwright e2e tests |
| `.env.local` | Create | `NESTJS_API_URL` env var |
| `package.json` | Modify | Add all dependencies |

---

## Task 1: Scaffold Next.js project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `.env.local`, `.gitignore`

- [ ] **Step 1: Bootstrap Next.js app**

```bash
cd /Users/arciniega/Documents/hoag/frontend
pnpm create next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --no-turbopack \
  --import-alias "@/*"
```

When prompted, answer: Yes to all defaults.

- [ ] **Step 2: Install runtime dependencies**

```bash
pnpm add framer-motion
```

- [ ] **Step 3: Install test dependencies**

```bash
pnpm add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom @playwright/test
pnpm playwright install chromium
```

- [ ] **Step 4: Add vitest config**

Create `vitest.config.ts` at project root:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 5: Create test setup file**

Create `src/test-setup.ts`:

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 6: Add test scripts to package.json**

Open `package.json` and add to `"scripts"`:

```json
"test": "vitest",
"test:ui": "vitest --ui",
"test:e2e": "playwright test"
```

- [ ] **Step 7: Create .env.local**

```bash
echo "NESTJS_API_URL=http://localhost:3001" > .env.local
```

- [ ] **Step 8: Verify setup compiles**

```bash
pnpm build
```

Expected: Build completes with no errors (default Next.js page).

- [ ] **Step 9: Commit**

```bash
git init
git add -A
git commit -m "chore: scaffold Next.js 16 project with Vitest and Playwright"
```

---

## Task 2: Types

**Files:**
- Create: `src/types/file-tree.ts`

- [ ] **Step 1: Write the failing test**

Create `src/types/__tests__/file-tree.test.ts`:

```typescript
import { describe, it, expectTypeOf } from 'vitest'
import type { NodeType, FileNode, ApiResponse } from '@/types/file-tree'

describe('FileNode', () => {
  it('accepts dir with children', () => {
    const node: FileNode = {
      name: 'src',
      type: 'dir',
      path: '/src',
      children: [],
    }
    expectTypeOf(node).toMatchTypeOf<FileNode>()
  })

  it('accepts file without children', () => {
    const node: FileNode = {
      name: 'index.ts',
      type: 'file',
      path: '/src/index.ts',
    }
    expectTypeOf(node).toMatchTypeOf<FileNode>()
  })

  it('ApiResponse has required children array', () => {
    const res: ApiResponse = {
      name: 'bucket',
      type: 'dir',
      path: '/',
      children: [],
    }
    expectTypeOf(res).toMatchTypeOf<ApiResponse>()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm vitest run src/types/__tests__/file-tree.test.ts
```

Expected: FAIL — cannot find module `@/types/file-tree`

- [ ] **Step 3: Write types**

Create `src/types/file-tree.ts`:

```typescript
export type NodeType = 'file' | 'dir'

export interface FileNode {
  name: string
  type: NodeType
  path: string
  children?: FileNode[]
}

export interface ApiResponse {
  name: string
  type: NodeType
  path: string
  children: FileNode[]
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm vitest run src/types/__tests__/file-tree.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/types/
git commit -m "feat: add FileNode and ApiResponse types"
```

---

## Task 3: File icon utility

**Files:**
- Create: `src/utils/file-icons.ts`
- Test: `src/utils/__tests__/file-icons.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/utils/__tests__/file-icons.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { getFileIcon } from '@/utils/file-icons'

describe('getFileIcon', () => {
  it('returns yellow for open folder', () => {
    const result = getFileIcon('dir', true)
    expect(result.emoji).toBe('📂')
    expect(result.color).toBe('#dcb67a')
  })

  it('returns yellow for closed folder', () => {
    const result = getFileIcon('dir', false)
    expect(result.emoji).toBe('📁')
    expect(result.color).toBe('#dcb67a')
  })

  it('returns blue for .ts files', () => {
    const result = getFileIcon('file', false, 'index.ts')
    expect(result.color).toBe('#519aba')
  })

  it('returns blue for .tsx files', () => {
    const result = getFileIcon('file', false, 'App.tsx')
    expect(result.color).toBe('#519aba')
  })

  it('returns yellow for .json files', () => {
    const result = getFileIcon('file', false, 'package.json')
    expect(result.color).toBe('#f7c948')
  })

  it('returns pink for .css files', () => {
    const result = getFileIcon('file', false, 'styles.css')
    expect(result.color).toBe('#ce9178')
  })

  it('returns pink for .scss files', () => {
    const result = getFileIcon('file', false, 'styles.scss')
    expect(result.color).toBe('#ce9178')
  })

  it('returns white for .md files', () => {
    const result = getFileIcon('file', false, 'README.md')
    expect(result.color).toBe('#cccccc')
  })

  it('returns grey for unknown extensions', () => {
    const result = getFileIcon('file', false, 'Makefile')
    expect(result.color).toBe('#858585')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm vitest run src/utils/__tests__/file-icons.test.ts
```

Expected: FAIL — cannot find module `@/utils/file-icons`

- [ ] **Step 3: Implement file-icons utility**

Create `src/utils/file-icons.ts`:

```typescript
import type { NodeType } from '@/types/file-tree'

interface FileIcon {
  emoji: string
  color: string
}

const EXT_MAP: Record<string, string> = {
  ts: '#519aba',
  tsx: '#519aba',
  json: '#f7c948',
  css: '#ce9178',
  scss: '#ce9178',
  md: '#cccccc',
}

export function getFileIcon(type: NodeType, isOpen: boolean, name?: string): FileIcon {
  if (type === 'dir') {
    return { emoji: isOpen ? '📂' : '📁', color: '#dcb67a' }
  }

  const ext = name?.split('.').pop()?.toLowerCase() ?? ''
  const color = EXT_MAP[ext] ?? '#858585'
  return { emoji: '📄', color }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm vitest run src/utils/__tests__/file-icons.test.ts
```

Expected: PASS — 9 tests

- [ ] **Step 5: Commit**

```bash
git add src/utils/
git commit -m "feat: add file icon utility with VS Code color palette"
```

---

## Task 4: API client

**Files:**
- Create: `src/lib/api-client.ts`

- [ ] **Step 1: Create typed API client**

Create `src/lib/api-client.ts`:

```typescript
import type { ApiResponse } from '@/types/file-tree'

export async function fetchFiles(path?: string): Promise<ApiResponse> {
  const url = path
    ? `/api/files?path=${encodeURIComponent(path)}`
    : '/api/files'

  const res = await fetch(url)

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Request failed: ${res.status}`)
  }

  return res.json() as Promise<ApiResponse>
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/
git commit -m "feat: add typed API client for /api/files"
```

---

## Task 5: Route Handler (NestJS proxy)

**Files:**
- Create: `src/app/api/files/route.ts`

- [ ] **Step 1: Create route handler**

Create `src/app/api/files/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const nestjsUrl = process.env.NESTJS_API_URL
  if (!nestjsUrl) {
    return NextResponse.json({ error: 'NESTJS_API_URL not configured' }, { status: 500 })
  }

  const path = request.nextUrl.searchParams.get('path')
  const targetUrl = path
    ? `${nestjsUrl}/files?path=${encodeURIComponent(path)}`
    : `${nestjsUrl}/files`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30_000)

  try {
    const res = await fetch(targetUrl, { signal: controller.signal })
    clearTimeout(timeout)

    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json(
        { error: data.message ?? 'Upstream error' },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    clearTimeout(timeout)
    if (err instanceof Error && err.name === 'AbortError') {
      return NextResponse.json({ error: 'Request timed out' }, { status: 504 })
    }
    return NextResponse.json({ error: 'NestJS unreachable' }, { status: 502 })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/
git commit -m "feat: add /api/files route handler proxying to NestJS"
```

---

## Task 6: TreeStateContext

**Files:**
- Create: `src/context/TreeStateContext.tsx`

- [ ] **Step 1: Create context**

Create `src/context/TreeStateContext.tsx`:

```typescript
'use client'

import { createContext, useContext, useState, useCallback } from 'react'

interface TreeStateContextValue {
  openPaths: Set<string>
  toggle: (path: string) => void
  isOpen: (path: string) => boolean
}

const TreeStateContext = createContext<TreeStateContextValue | null>(null)

export function TreeStateProvider({ children }: { children: React.ReactNode }) {
  const [openPaths, setOpenPaths] = useState<Set<string>>(new Set())

  const toggle = useCallback((path: string) => {
    setOpenPaths(prev => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }, [])

  const isOpen = useCallback(
    (path: string) => openPaths.has(path),
    [openPaths]
  )

  return (
    <TreeStateContext.Provider value={{ openPaths, toggle, isOpen }}>
      {children}
    </TreeStateContext.Provider>
  )
}

export function useTreeState() {
  const ctx = useContext(TreeStateContext)
  if (!ctx) throw new Error('useTreeState must be used inside TreeStateProvider')
  return ctx
}
```

- [ ] **Step 2: Commit**

```bash
git add src/context/
git commit -m "feat: add TreeStateContext for open/closed path tracking"
```

---

## Task 7: useNodeChildren hook

**Files:**
- Create: `src/hooks/useNodeChildren.ts`
- Test: `src/hooks/__tests__/useNodeChildren.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/hooks/__tests__/useNodeChildren.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useNodeChildren } from '@/hooks/useNodeChildren'
import * as apiClient from '@/lib/api-client'
import type { ApiResponse } from '@/types/file-tree'

const mockChildren: ApiResponse = {
  name: 'src',
  type: 'dir',
  path: '/src',
  children: [
    { name: 'index.ts', type: 'file', path: '/src/index.ts' },
    { name: 'utils', type: 'dir', path: '/src/utils' },
  ],
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('useNodeChildren', () => {
  it('starts with null children, not loading', () => {
    const { result } = renderHook(() => useNodeChildren('/src'))
    expect(result.current.children).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.hasError).toBe(false)
  })

  it('fetches children when fetch() called', async () => {
    vi.spyOn(apiClient, 'fetchFiles').mockResolvedValue(mockChildren)

    const { result } = renderHook(() => useNodeChildren('/src'))

    act(() => { result.current.fetch() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.children).toEqual(mockChildren.children)
    expect(result.current.hasError).toBe(false)
  })

  it('sets hasError on fetch failure', async () => {
    vi.spyOn(apiClient, 'fetchFiles').mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useNodeChildren('/src'))

    act(() => { result.current.fetch() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.hasError).toBe(true)
    expect(result.current.children).toBeNull()
  })

  it('does not re-fetch if children already loaded', async () => {
    const spy = vi.spyOn(apiClient, 'fetchFiles').mockResolvedValue(mockChildren)

    const { result } = renderHook(() => useNodeChildren('/src'))

    act(() => { result.current.fetch() })
    await waitFor(() => expect(result.current.children).not.toBeNull())

    act(() => { result.current.fetch() })

    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('refetch() re-fetches even if children cached', async () => {
    const spy = vi.spyOn(apiClient, 'fetchFiles').mockResolvedValue(mockChildren)

    const { result } = renderHook(() => useNodeChildren('/src'))

    act(() => { result.current.fetch() })
    await waitFor(() => expect(result.current.children).not.toBeNull())

    act(() => { result.current.refetch() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(spy).toHaveBeenCalledTimes(2)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm vitest run src/hooks/__tests__/useNodeChildren.test.ts
```

Expected: FAIL — cannot find module `@/hooks/useNodeChildren`

- [ ] **Step 3: Implement hook**

Create `src/hooks/useNodeChildren.ts`:

```typescript
import { useState, useCallback } from 'react'
import { fetchFiles } from '@/lib/api-client'
import type { FileNode } from '@/types/file-tree'

interface NodeChildrenState {
  children: FileNode[] | null
  isLoading: boolean
  hasError: boolean
  fetch: () => void
  refetch: () => void
}

export function useNodeChildren(path: string): NodeChildrenState {
  const [children, setChildren] = useState<FileNode[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    setHasError(false)
    try {
      const res = await fetchFiles(path)
      setChildren(res.children)
    } catch {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }, [path])

  const fetch = useCallback(() => {
    if (children !== null) return
    load()
  }, [children, load])

  const refetch = useCallback(() => {
    load()
  }, [load])

  return { children, isLoading, hasError, fetch, refetch }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm vitest run src/hooks/__tests__/useNodeChildren.test.ts
```

Expected: PASS — 5 tests

- [ ] **Step 5: Commit**

```bash
git add src/hooks/
git commit -m "feat: add useNodeChildren hook with lazy fetch and cache"
```

---

## Task 8: TreeIcon component

**Files:**
- Create: `src/components/file-tree/TreeIcon.tsx`

- [ ] **Step 1: Create component**

Create `src/components/file-tree/TreeIcon.tsx`:

```typescript
import { getFileIcon } from '@/utils/file-icons'
import type { NodeType } from '@/types/file-tree'

interface TreeIconProps {
  type: NodeType
  isOpen: boolean
  name?: string
}

export function TreeIcon({ type, isOpen, name }: TreeIconProps) {
  const { emoji, color } = getFileIcon(type, isOpen, name)
  return (
    <span style={{ color }} className="text-sm select-none">
      {emoji}
    </span>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/file-tree/TreeIcon.tsx
git commit -m "feat: add TreeIcon component with VS Code color mapping"
```

---

## Task 9: LoadingNode component

**Files:**
- Create: `src/components/file-tree/LoadingNode.tsx`

- [ ] **Step 1: Create component**

Create `src/components/file-tree/LoadingNode.tsx`:

```typescript
export function LoadingNode({ depth }: { depth: number }) {
  return (
    <>
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="flex items-center gap-2 py-0.5"
          style={{ paddingLeft: `${(depth + 1) * 16}px` }}
        >
          <div className="h-3 bg-[#3c3c3c] rounded animate-pulse" style={{ width: `${60 + i * 20}px` }} />
        </div>
      ))}
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/file-tree/LoadingNode.tsx
git commit -m "feat: add LoadingNode skeleton component"
```

---

## Task 10: ErrorBoundary component

**Files:**
- Create: `src/components/ui/ErrorBoundary.tsx`

- [ ] **Step 1: Create component**

Create `src/components/ui/ErrorBoundary.tsx`:

```typescript
'use client'

import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="text-red-400 text-sm p-4">
          Something went wrong rendering the file tree.
        </div>
      )
    }
    return this.props.children
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/
git commit -m "feat: add ErrorBoundary component"
```

---

## Task 11: TreeNode component

**Files:**
- Create: `src/components/file-tree/TreeNode.tsx`
- Test: `src/components/file-tree/__tests__/TreeNode.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/file-tree/__tests__/TreeNode.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TreeNode } from '@/components/file-tree/TreeNode'
import { TreeStateProvider } from '@/context/TreeStateContext'
import type { FileNode } from '@/types/file-tree'
import * as apiClient from '@/lib/api-client'

function wrap(ui: React.ReactElement) {
  return render(<TreeStateProvider>{ui}</TreeStateProvider>)
}

const fileNode: FileNode = { name: 'index.ts', type: 'file', path: '/src/index.ts' }
const folderNode: FileNode = { name: 'src', type: 'dir', path: '/src' }
const folderWithChildren: FileNode = {
  name: 'src',
  type: 'dir',
  path: '/src',
  children: [fileNode],
}

describe('TreeNode — file', () => {
  it('renders file name', () => {
    wrap(<TreeNode node={fileNode} depth={0} />)
    expect(screen.getByText('index.ts')).toBeInTheDocument()
  })

  it('does not respond to click', () => {
    wrap(<TreeNode node={fileNode} depth={0} />)
    const row = screen.getByText('index.ts').closest('[role="button"]')
    expect(row).toBeNull()
  })
})

describe('TreeNode — folder', () => {
  it('renders folder name', () => {
    wrap(<TreeNode node={folderNode} depth={0} />)
    expect(screen.getByText('src')).toBeInTheDocument()
  })

  it('fetches and shows children on click', async () => {
    vi.spyOn(apiClient, 'fetchFiles').mockResolvedValue({
      ...folderNode,
      children: [fileNode],
    })

    wrap(<TreeNode node={folderNode} depth={0} />)
    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => expect(screen.getByText('index.ts')).toBeInTheDocument())
  })

  it('collapses children on second click', async () => {
    vi.spyOn(apiClient, 'fetchFiles').mockResolvedValue({
      ...folderNode,
      children: [fileNode],
    })

    wrap(<TreeNode node={folderNode} depth={0} />)
    fireEvent.click(screen.getByRole('button'))
    await waitFor(() => expect(screen.getByText('index.ts')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button'))
    await waitFor(() => expect(screen.queryByText('index.ts')).not.toBeInTheDocument())
  })

  it('shows error and retry on fetch failure', async () => {
    vi.spyOn(apiClient, 'fetchFiles').mockRejectedValue(new Error('fail'))

    wrap(<TreeNode node={folderNode} depth={0} />)
    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => expect(screen.getByText(/failed to load/i)).toBeInTheDocument())
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm vitest run src/components/file-tree/__tests__/TreeNode.test.tsx
```

Expected: FAIL — cannot find module `@/components/file-tree/TreeNode`

- [ ] **Step 3: Implement TreeNode**

Create `src/components/file-tree/TreeNode.tsx`:

```typescript
'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useTreeState } from '@/context/TreeStateContext'
import { useNodeChildren } from '@/hooks/useNodeChildren'
import { TreeIcon } from './TreeIcon'
import { LoadingNode } from './LoadingNode'
import type { FileNode } from '@/types/file-tree'

interface TreeNodeProps {
  node: FileNode
  depth: number
}

export function TreeNode({ node, depth }: TreeNodeProps) {
  const { isOpen, toggle } = useTreeState()
  const { children, isLoading, hasError, fetch, refetch } = useNodeChildren(node.path)
  const open = isOpen(node.path)

  if (node.type === 'file') {
    return (
      <div
        className="flex items-center gap-1.5 py-0.5 px-1 text-sm text-[#cccccc] hover:bg-[#2a2d2e] rounded-sm"
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
      >
        <TreeIcon type="file" isOpen={false} name={node.name} />
        <span style={{ color: '#cccccc' }}>{node.name}</span>
      </div>
    )
  }

  function handleClick() {
    toggle(node.path)
    if (!open) fetch()
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={e => e.key === 'Enter' && handleClick()}
        className="flex items-center gap-1.5 py-0.5 px-1 text-sm cursor-pointer hover:bg-[#2a2d2e] rounded-sm select-none"
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
      >
        <motion.span
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-[#6a9955] text-xs w-3 inline-block"
        >
          ▶
        </motion.span>
        <TreeIcon type="dir" isOpen={open} />
        <span className="text-[#cccccc]">{node.name}</span>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{
              overflow: 'hidden',
              borderLeft: '1px solid #3c3c3c',
              marginLeft: `${depth * 16 + 10}px`,
            }}
          >
            {isLoading && <LoadingNode depth={0} />}

            {hasError && (
              <div
                className="flex items-center gap-2 py-0.5 px-2 text-xs text-red-400 cursor-pointer hover:text-red-300"
                onClick={e => { e.stopPropagation(); refetch() }}
              >
                ⚠ Failed to load — click to retry
              </div>
            )}

            {children?.map(child => (
              <TreeNode key={child.path} node={child} depth={depth + 1} />
            ))}

            {children?.length === 0 && (
              <div className="py-0.5 px-2 text-xs text-[#6b7280] italic">
                Empty folder
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm vitest run src/components/file-tree/__tests__/TreeNode.test.tsx
```

Expected: PASS — 5 tests

- [ ] **Step 5: Commit**

```bash
git add src/components/file-tree/TreeNode.tsx src/components/file-tree/__tests__/
git commit -m "feat: add TreeNode component with expand/collapse and lazy load"
```

---

## Task 12: FileTree component

**Files:**
- Create: `src/components/file-tree/FileTree.tsx`
- Test: `src/components/file-tree/__tests__/FileTree.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/file-tree/__tests__/FileTree.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FileTree } from '@/components/file-tree/FileTree'
import type { ApiResponse } from '@/types/file-tree'

const root: ApiResponse = {
  name: 'bucket',
  type: 'dir',
  path: '/',
  children: [
    { name: 'src', type: 'dir', path: '/src' },
    { name: 'README.md', type: 'file', path: '/README.md' },
  ],
}

describe('FileTree', () => {
  it('renders root folder name', () => {
    render(<FileTree root={root} />)
    expect(screen.getByText('bucket')).toBeInTheDocument()
  })

  it('renders top-level children', () => {
    render(<FileTree root={root} />)
    expect(screen.getByText('src')).toBeInTheDocument()
    expect(screen.getByText('README.md')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm vitest run src/components/file-tree/__tests__/FileTree.test.tsx
```

Expected: FAIL — cannot find module `@/components/file-tree/FileTree`

- [ ] **Step 3: Implement FileTree**

Create `src/components/file-tree/FileTree.tsx`:

```typescript
'use client'

import { TreeStateProvider } from '@/context/TreeStateContext'
import { TreeNode } from './TreeNode'
import type { ApiResponse } from '@/types/file-tree'

interface FileTreeProps {
  root: ApiResponse
}

export function FileTree({ root }: FileTreeProps) {
  return (
    <TreeStateProvider>
      <div className="font-mono text-sm bg-[#1e1e1e] min-h-screen p-4">
        <div className="mb-4 text-[#858585] text-xs uppercase tracking-widest">
          File Explorer
        </div>
        <TreeNode
          node={{ name: root.name, type: root.type, path: root.path, children: root.children }}
          depth={0}
        />
      </div>
    </TreeStateProvider>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm vitest run src/components/file-tree/__tests__/FileTree.test.tsx
```

Expected: PASS — 2 tests

- [ ] **Step 5: Commit**

```bash
git add src/components/file-tree/FileTree.tsx src/components/file-tree/__tests__/FileTree.test.tsx
git commit -m "feat: add FileTree client component with TreeStateProvider"
```

---

## Task 13: Layout and Page (SSR)

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Update layout**

Replace `src/app/layout.tsx` with:

```typescript
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'File Explorer',
  description: 'Filesystem tree visualizer',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#1e1e1e] text-[#cccccc] antialiased">{children}</body>
    </html>
  )
}
```

- [ ] **Step 2: Update page — SSR root fetch**

Replace `src/app/page.tsx` with:

```typescript
import { FileTree } from '@/components/file-tree/FileTree'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import type { ApiResponse } from '@/types/file-tree'

async function getRootTree(): Promise<ApiResponse> {
  const nestjsUrl = process.env.NESTJS_API_URL
  if (!nestjsUrl) throw new Error('NESTJS_API_URL not configured')

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30_000)

  try {
    const res = await fetch(`${nestjsUrl}/files`, {
      signal: controller.signal,
      cache: 'no-store',
    })
    clearTimeout(timeout)

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.message ?? `NestJS error: ${res.status}`)
    }

    return res.json()
  } catch (err) {
    clearTimeout(timeout)
    throw err
  }
}

export default async function Page() {
  let root: ApiResponse

  try {
    root = await getRootTree()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return (
      <main className="flex items-center justify-center min-h-screen bg-[#1e1e1e]">
        <div className="text-center">
          <div className="text-red-400 text-lg mb-2">Failed to load file tree</div>
          <div className="text-[#858585] text-sm">{message}</div>
        </div>
      </main>
    )
  }

  return (
    <main>
      <ErrorBoundary>
        <FileTree root={root} />
      </ErrorBoundary>
    </main>
  )
}
```

- [ ] **Step 3: Run full unit test suite**

```bash
pnpm vitest run
```

Expected: All tests PASS

- [ ] **Step 4: Build**

```bash
pnpm build
```

Expected: Build succeeds with no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/
git commit -m "feat: add SSR page with root fetch and full-page error state"
```

---

## Task 14: Playwright e2e tests

**Files:**
- Create: `src/e2e/file-tree.spec.ts`
- Create: `playwright.config.ts`

- [ ] **Step 1: Create Playwright config**

Create `playwright.config.ts` at project root:

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './src/e2e',
  fullyParallel: true,
  retries: 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

- [ ] **Step 2: Write e2e tests**

Create `src/e2e/file-tree.spec.ts`:

```typescript
import { test, expect } from '@playwright/test'

const MOCK_ROOT = {
  name: 'bucket',
  type: 'dir',
  path: '/',
  children: [
    {
      name: 'src',
      type: 'dir',
      path: '/src',
      children: [],
    },
    { name: 'README.md', type: 'file', path: '/README.md' },
  ],
}

const MOCK_SRC_CHILDREN = {
  name: 'src',
  type: 'dir',
  path: '/src',
  children: [
    {
      name: 'components',
      type: 'dir',
      path: '/src/components',
      children: [],
    },
    { name: 'index.ts', type: 'file', path: '/src/index.ts' },
  ],
}

const MOCK_COMPONENTS_CHILDREN = {
  name: 'components',
  type: 'dir',
  path: '/src/components',
  children: [
    { name: 'Button.tsx', type: 'file', path: '/src/components/Button.tsx' },
  ],
}

test.beforeEach(async ({ page }) => {
  await page.route('/api/files', route =>
    route.fulfill({ json: MOCK_ROOT })
  )
  await page.route('/api/files?path=%2Fsrc', route =>
    route.fulfill({ json: MOCK_SRC_CHILDREN })
  )
  await page.route('/api/files?path=%2Fsrc%2Fcomponents', route =>
    route.fulfill({ json: MOCK_COMPONENTS_CHILDREN })
  )
})

test('root tree renders on load', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('bucket')).toBeVisible()
  await expect(page.getByText('README.md')).toBeVisible()
  await expect(page.getByText('src')).toBeVisible()
})

test('click folder reveals children', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /src/ }).click()
  await expect(page.getByText('index.ts')).toBeVisible()
  await expect(page.getByText('components')).toBeVisible()
})

test('click open folder collapses it', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /src/ }).click()
  await expect(page.getByText('index.ts')).toBeVisible()

  await page.getByRole('button', { name: /src/ }).click()
  await expect(page.getByText('index.ts')).not.toBeVisible()
})

test('nested expand works at depth 3', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /src/ }).click()
  await page.getByRole('button', { name: /components/ }).click()
  await expect(page.getByText('Button.tsx')).toBeVisible()
})

test('fetch error shows inline error message', async ({ page }) => {
  await page.route('/api/files?path=%2Fsrc', route =>
    route.fulfill({ status: 502, json: { error: 'NestJS unreachable' } })
  )

  await page.goto('/')
  await page.getByRole('button', { name: /src/ }).click()
  await expect(page.getByText(/failed to load/i)).toBeVisible()
})

test('retry after error re-fetches', async ({ page }) => {
  let callCount = 0
  await page.route('/api/files?path=%2Fsrc', route => {
    callCount++
    if (callCount === 1) {
      route.fulfill({ status: 502, json: { error: 'fail' } })
    } else {
      route.fulfill({ json: MOCK_SRC_CHILDREN })
    }
  })

  await page.goto('/')
  await page.getByRole('button', { name: /src/ }).click()
  await expect(page.getByText(/failed to load/i)).toBeVisible()

  await page.getByText(/failed to load/i).click()
  await expect(page.getByText('index.ts')).toBeVisible()
})
```

- [ ] **Step 3: Run e2e tests (requires dev server)**

```bash
pnpm dev &
sleep 3
pnpm playwright test
```

Expected: All 6 e2e tests PASS

- [ ] **Step 4: Commit**

```bash
git add src/e2e/ playwright.config.ts
git commit -m "test: add Playwright e2e tests with mocked NestJS responses"
```

---

## Task 15: Final polish and verification

- [ ] **Step 1: Run all unit tests**

```bash
pnpm vitest run
```

Expected: All tests PASS

- [ ] **Step 2: Run full build**

```bash
pnpm build
```

Expected: Build succeeds, no TypeScript errors.

- [ ] **Step 3: Add .gitignore entries**

Ensure `.gitignore` contains:

```
.superpowers/
.env.local
```

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: final polish — gitignore and verified build"
```
