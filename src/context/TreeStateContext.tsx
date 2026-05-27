'use client'

import { createContext, useContext, useState, useCallback } from 'react'

interface TreeStateContextValue {
  openPaths: Set<string>
  toggle: (path: string) => void
  isOpen: (path: string) => boolean
}

const TreeStateContext = createContext<TreeStateContextValue | null>(null)

export function TreeStateProvider({
  children,
  initialOpen = [],
}: {
  children: React.ReactNode
  initialOpen?: string[]
}) {
  const [openPaths, setOpenPaths] = useState<Set<string>>(new Set(initialOpen))

  const toggle = useCallback((path: string) => {
    setOpenPaths(prev => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }, [])

  const isOpen = useCallback(
    (path: string) => openPaths.has(path),
    [openPaths]
  )

  return (
    <TreeStateContext.Provider value={{ openPaths, toggle, isOpen }}>
      {children}
    </TreeStateContext.Provider>
  )
}

export function useTreeState() {
  const ctx = useContext(TreeStateContext)
  if (!ctx) throw new Error('useTreeState must be used inside TreeStateProvider')
  return ctx
}
