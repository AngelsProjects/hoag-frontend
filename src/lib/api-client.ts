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
