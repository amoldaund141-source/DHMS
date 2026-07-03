import React from 'react'

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`card p-5 flex flex-col gap-3 ${className}`} aria-busy="true" aria-label="Loading…">
      <div className="skeleton h-3 w-24 rounded" />
      <div className="skeleton h-9 w-32 rounded" />
      <div className="skeleton h-5 w-16 rounded-full" />
    </div>
  )
}

export function SkeletonRow({ className = '' }) {
  return (
    <div className={`flex items-center gap-4 py-3 ${className}`} aria-busy="true">
      <div className="skeleton h-8 w-8 rounded-full flex-shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <div className="skeleton h-3 w-48 rounded" />
        <div className="skeleton h-3 w-32 rounded" />
      </div>
      <div className="skeleton h-5 w-16 rounded-full" />
    </div>
  )
}

export function SkeletonChart({ height = 200, className = '' }) {
  return (
    <div
      className={`skeleton rounded-xl ${className}`}
      style={{ height }}
      aria-busy="true"
      aria-label="Loading chart…"
    />
  )
}

export function SkeletonText({ lines = 3, className = '' }) {
  const widths = ['w-full', 'w-5/6', 'w-4/6']
  return (
    <div className={`flex flex-col gap-2 ${className}`} aria-busy="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`skeleton h-3 rounded ${widths[i % widths.length]}`} />
      ))}
    </div>
  )
}
