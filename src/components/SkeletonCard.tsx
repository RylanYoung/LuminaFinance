export function SkeletonLine({ className = '' }: { className?: string }) {
  return <div className={`bg-surface-container-highest rounded animate-pulse ${className}`} />
}

import type { ReactNode } from 'react'

export function SkeletonCard({ className = '', children }: { className?: string; children?: ReactNode }) {
  return (
    <div className={`bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-ambient ${className}`}>
      {children ?? (
        <>
          <SkeletonLine className="h-3 w-24 mb-4" />
          <SkeletonLine className="h-8 w-40 mb-3" />
          <SkeletonLine className="h-3 w-32" />
        </>
      )}
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 py-4 border-b border-outline-variant/30">
      <div className="w-10 h-10 rounded-xl bg-surface-container-highest animate-pulse shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonLine className="h-3 w-36" />
        <SkeletonLine className="h-3 w-24" />
      </div>
      <SkeletonLine className="h-4 w-20" />
    </div>
  )
}
