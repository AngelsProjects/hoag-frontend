/**
 * Tiny mock NestJS server for Playwright e2e tests.
 * Responds to GET /files and GET /files?path=... with static fixtures.
 * Started by playwright.config.ts as a webServer alongside `pnpm dev`.
 */

import http from 'http'
import { URL } from 'url'

const MOCK_ROOT = {
  name: 'bucket',
  type: 'dir',
  path: '/',
  children: [
    {
      // No `children` field = not yet loaded; clicking will trigger a fetch
      name: 'src',
      type: 'dir',
      path: '/src',
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
      // No `children` field = not yet loaded; clicking will trigger a fetch
      name: 'components',
      type: 'dir',
      path: '/src/components',
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

const DATA_BY_PATH = {
  '/': MOCK_ROOT,
  '/src': MOCK_SRC_CHILDREN,
  '/src/components': MOCK_COMPONENTS_CHILDREN,
}

const PORT = 3001

const server = http.createServer((req, res) => {
  const baseUrl = `http://localhost:${PORT}`
  const url = new URL(req.url, baseUrl)

  if (url.pathname !== '/files') {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Not found' }))
    return
  }

  const path = url.searchParams.get('path') ?? '/'
  const data = DATA_BY_PATH[path]

  if (!data) {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: `Unknown path: ${path}` }))
    return
  }

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
})

server.listen(PORT, () => {
  console.log(`Mock NestJS listening on http://localhost:${PORT}`)
})
