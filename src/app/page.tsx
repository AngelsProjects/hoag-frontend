import { FileTree } from '@/components/file-tree/FileTree'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import type { ApiResponse } from '@/types/file-tree'

export const dynamic = 'force-dynamic'

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
