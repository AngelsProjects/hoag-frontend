import { getFileIcon } from '@/utils/file-icons'
import type { NodeType } from '@/types/file-tree'

interface TreeIconProps {
  type: NodeType
  isOpen: boolean
  name?: string
}

export function TreeIcon({ type, isOpen, name }: TreeIconProps) {
  const { emoji, color } = getFileIcon(type, isOpen, name)
  return (
    <span style={{ color }} className="text-sm select-none">
      {emoji}
    </span>
  )
}
