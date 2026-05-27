'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useTreeState } from '@/context/TreeStateContext'
import { useNodeChildren } from '@/hooks/useNodeChildren'
import { TreeIcon } from './TreeIcon'
import { LoadingNode } from './LoadingNode'
import type { FileNode } from '@/types/file-tree'

interface TreeNodeProps {
  node: FileNode
  depth: number
  initialChildren?: FileNode[]
}

export function TreeNode({ node, depth, initialChildren }: TreeNodeProps) {
  const { isOpen, toggle } = useTreeState()
  const { children, isLoading, hasError, fetch, refetch } = useNodeChildren(node.path, initialChildren ?? node.children)
  const open = isOpen(node.path)

  if (node.type === 'file') {
    return (
      <div
        className="flex items-center gap-1.5 py-0.5 px-1 text-sm text-[#cccccc] hover:bg-[#2a2d2e] rounded-sm"
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
      >
        <TreeIcon type="file" isOpen={false} name={node.name} />
        <span style={{ color: '#cccccc' }}>{node.name}</span>
      </div>
    )
  }

  function handleClick() {
    toggle(node.path)
    if (!open) fetch()
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={e => e.key === 'Enter' && handleClick()}
        className="flex items-center gap-1.5 py-0.5 px-1 text-sm cursor-pointer hover:bg-[#2a2d2e] rounded-sm select-none"
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
      >
        <motion.span
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-[#6a9955] text-xs w-3 inline-block"
        >
          ▶
        </motion.span>
        <TreeIcon type="dir" isOpen={open} />
        <span className="text-[#cccccc]">{node.name}</span>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{
              overflow: 'hidden',
              borderLeft: '1px solid #3c3c3c',
              marginLeft: `${depth * 16 + 10}px`,
            }}
          >
            {isLoading && <LoadingNode depth={0} />}

            {hasError && (
              <div
                className="flex items-center gap-2 py-0.5 px-2 text-xs text-red-400 cursor-pointer hover:text-red-300"
                onClick={e => { e.stopPropagation(); refetch() }}
              >
                ⚠ Failed to load — click to retry
              </div>
            )}

            {children?.map(child => (
              <TreeNode key={child.path} node={child} depth={depth + 1} />
            ))}

            {children?.length === 0 && (
              <div className="py-0.5 px-2 text-xs text-[#6b7280] italic">
                Empty folder
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
