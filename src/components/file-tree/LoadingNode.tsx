export function LoadingNode({ depth }: { depth: number }) {
  return (
    <>
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="flex items-center gap-2 py-0.5"
          style={{ paddingLeft: `${(depth + 1) * 16}px` }}
        >
          <div className="h-3 bg-[#3c3c3c] rounded animate-pulse" style={{ width: `${60 + i * 20}px` }} />
        </div>
      ))}
    </>
  )
}
