import { test, expect } from '@playwright/test'

/**
 * Fixture data — must match what mock-nestjs.mjs serves.
 *
 * NOTE: dirs deliberately omit `children` so that `useNodeChildren` initialises
 * with `null` (not `[]`) and therefore triggers a client-side fetch on click.
 * If a dir has `children: []` the hook treats it as "already loaded / empty"
 * and never fetches, which would cause the expand tests to fail.
 */

const MOCK_SRC_CHILDREN = {
  name: 'src',
  type: 'dir',
  path: '/src',
  children: [
    {
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

/**
 * Happy-path tests rely on the mock NestJS server (mock-nestjs.mjs) that
 * playwright.config.ts starts alongside `pnpm dev`.  Client-side child
 * fetches reach Next.js /api/files, which proxies to localhost:3001.
 *
 * Error-path tests intercept /api/files client-side via page.route() so the
 * Next.js proxy never forwards the request.  We use a URL-function matcher to
 * avoid glob-metacharacter issues with `?` in query strings.
 */

const srcRoute = (url: URL) =>
  url.pathname === '/api/files' && url.searchParams.get('path') === '/src'

const componentsRoute = (url: URL) =>
  url.pathname === '/api/files' &&
  url.searchParams.get('path') === '/src/components'

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
  await expect(page.getByText('components')).toBeVisible()
  await page.getByRole('button', { name: /components/ }).click()
  await expect(page.getByText('Button.tsx')).toBeVisible()
})

test('fetch error shows inline error message', async ({ page }) => {
  await page.route(srcRoute, route =>
    route.fulfill({ status: 502, json: { error: 'NestJS unreachable' } })
  )

  await page.goto('/')
  await page.getByRole('button', { name: /src/ }).click()
  await expect(page.getByText(/failed to load/i)).toBeVisible()
})

test('retry after error re-fetches', async ({ page }) => {
  let callCount = 0
  await page.route(srcRoute, route => {
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
