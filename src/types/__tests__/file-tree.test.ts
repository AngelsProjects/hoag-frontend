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
