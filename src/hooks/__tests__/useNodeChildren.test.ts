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
