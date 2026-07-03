import React from 'react'

/**
 * StatusPill — color-coded pill with animated dot indicator.
 * variant: 'success' | 'warning' | 'critical' | 'info'
 */
export default function StatusPill({ variant = 'success', label, className = '' }) {
  const map = {
    success:  { pill: 'pill-success',  dot: 'dot-success'  },
    warning:  { pill: 'pill-warning',  dot: 'dot-warning'  },
    critical: { pill: 'pill-critical', dot: 'dot-critical' },
    info:     { pill: 'pill-info',     dot: 'dot-info'     },
  }
  const { pill, dot } = map[variant] ?? map.success

  return (
    <span className={`pill ${pill} ${className}`} role="status" aria-label={`Status: ${label}`}>
      <span className={`pill-dot ${dot}`} aria-hidden="true" />
      {label}
    </span>
  )
}
