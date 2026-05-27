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
