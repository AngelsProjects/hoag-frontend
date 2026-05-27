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

export function useNodeChildren(path: string, initialChildren?: FileNode[]): NodeChildrenState {
  const [children, setChildren] = useState<FileNode[] | null>(initialChildren ?? null)
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
