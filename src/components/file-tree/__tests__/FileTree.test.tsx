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
