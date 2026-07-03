import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import StatusPill from './StatusPill'

/**
 * Animates a number from 0 to `value` on mount.
 * Uses requestAnimationFrame for a smooth count-up effect.
 */
function useCountUp(target, duration = 1200, enabled = true) {
  const [display, setDisplay] = useState(enabled ? 0 : target)
  const raf = useRef(null)

  useEffect(() => {
    if (!enabled) { setDisplay(target); return }
    const start = performance.now()
    const startVal = 0

    const tick = (now) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(startVal + (target - startVal) * eased))
      if (progress < 1) raf.current = requestAnimationFrame(tick)
    }

    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, duration, enabled])

  return display
}

/**
 * StatCard — the primary data display unit.
 * Props:
 *   label      — uppercase small label above the number
 *   value      — numeric value to display (animates on mount)
 *   unit       — optional suffix, e.g. "%" or " beds"
 *   variant    — StatusPill variant: 'success'|'warning'|'critical'|'info'
 *   pillLabel  — text inside the status pill
 *   icon       — optional React element (Heroicon or similar)
 *   trend      — optional "+12% vs yesterday" string
 *   loading    — if true, shows skeleton shimmer
 *   delay      — Framer Motion stagger delay in seconds
 */
export default function StatCard({
  label,
  value = 0,
  unit = '',
  variant,
  pillLabel,
  icon,
  trend,
  loading = false,
  delay = 0,
  className = '',
}) {
  const displayValue = useCountUp(value, 1200, !loading)

  if (loading) {
    return (
      <div className={`card p-5 flex flex-col gap-3 ${className}`}>
        <div className="skeleton h-3 w-20 rounded" />
        <div className="skeleton h-9 w-28 rounded" />
        <div className="skeleton h-5 w-16 rounded-full" />
      </div>
    )
  }

  return (
    <motion.div
      className={`card card-hover p-5 flex flex-col gap-2 cursor-default ${className}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay, ease: 'easeOut' }}
    >
      {/* Label row */}
      <div className="flex items-center justify-between">
        <span className="stat-label">{label}</span>
        {icon && (
          <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary" aria-hidden="true">
            {icon}
          </span>
        )}
      </div>

      {/* Big number */}
      <div className="flex items-end gap-1">
        <span className="stat-number text-4xl leading-none" data-numeric="true">
          {displayValue.toLocaleString()}
        </span>
        {unit && (
          <span className="stat-number text-xl text-body/60 mb-0.5">{unit}</span>
        )}
      </div>

      {/* Bottom row: pill + trend */}
      <div className="flex items-center gap-2 mt-1">
        {variant && pillLabel && (
          <StatusPill variant={variant} label={pillLabel} />
        )}
        {trend && (
          <span className="text-2xs font-body text-body/60">{trend}</span>
        )}
      </div>
    </motion.div>
  )
}
