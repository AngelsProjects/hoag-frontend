'use client'

import { TreeStateProvider } from '@/context/TreeStateContext'
import { TreeNode } from './TreeNode'
import type { ApiResponse } from '@/types/file-tree'

interface FileTreeProps {
  root: ApiResponse
}

export function FileTree({ root }: FileTreeProps) {
  return (
    <TreeStateProvider initialOpen={[root.path]}>
      <div className="font-mono text-sm bg-[#1e1e1e] min-h-screen p-4">
        <div className="mb-4 text-[#858585] text-xs uppercase tracking-widest">
          File Explorer
        </div>
        <TreeNode
          node={{ name: root.name, type: root.type, path: root.path, children: root.children }}
          depth={0}
          initialChildren={root.children}
        />
      </div>
    </TreeStateProvider>
  )
}
