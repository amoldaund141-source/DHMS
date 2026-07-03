import React from 'react'

/**
 * The signature ECG-style pulse line.
 * Used as: section divider (mode="divider") or live-data indicator (mode="indicator")
 */
export default function PulseLine({ mode = 'divider', className = '' }) {
  if (mode === 'indicator') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 ${className}`}
        aria-hidden="true"
        title="Live data"
      >
        <svg
          width="32"
          height="14"
          viewBox="0 0 32 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="overflow-visible"
        >
          {/* flat baseline */}
          <line x1="0" y1="7" x2="32" y2="7" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.25" />
          {/* the blip path — ECG-style spike */}
          <path
            d="M0 7 L10 7 L13 7 L15 2 L17 12 L19 7 L22 7 L32 7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            className="animate-pulse-blip"
          />
        </svg>
      </span>
    )
  }

  // mode === 'divider'
  return (
    <div
      className={`pulse-divider ${className}`}
      aria-hidden="true"
      role="separator"
    >
      {/* Static hairline */}
      <div className="absolute inset-0 border-t border-border" />
      {/* Animated blip SVG overlaid on the divider */}
      <div className="absolute inset-0 flex items-center px-6">
        <svg
          width="80"
          height="16"
          viewBox="0 0 80 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-primary overflow-visible"
        >
          <path
            d="M0 8 L28 8 L32 8 L36 2 L40 14 L44 8 L48 8 L80 8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            strokeOpacity="0.6"
            className="animate-pulse-blip"
          />
        </svg>
      </div>
    </div>
  )
}
