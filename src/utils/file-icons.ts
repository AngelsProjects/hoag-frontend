import type { NodeType } from '@/types/file-tree'

interface FileIcon {
  emoji: string
  color: string
}

const EXT_MAP: Record<string, string> = {
  ts: '#519aba',
  tsx: '#519aba',
  json: '#f7c948',
  css: '#ce9178',
  scss: '#ce9178',
  md: '#cccccc',
}

export function getFileIcon(type: NodeType, isOpen: boolean, name?: string): FileIcon {
  if (type === 'dir') {
    return { emoji: isOpen ? '📂' : '📁', color: '#dcb67a' }
  }

  const ext = name?.split('.').pop()?.toLowerCase() ?? ''
  const color = EXT_MAP[ext] ?? '#858585'
  return { emoji: '📄', color }
}
