export type NodeType = 'file' | 'dir'

export interface FileNode {
  name: string
  type: NodeType
  path: string
  children?: FileNode[]
}

export interface ApiResponse {
  name: string
  type: NodeType
  path: string
  children: FileNode[]
}
