import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

// Pulsing wifi/signal icon to indicate connectivity issue
function OfflineIcon() {
  return (
    <motion.div
      className="w-16 h-16 rounded-2xl bg-critical-tint flex items-center justify-center mx-auto mb-6"
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-critical">
        <line x1="1" y1="1" x2="23" y2="23" />
        <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
        <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
        <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
        <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
        <line x1="12" y1="20" x2="12.01" y2="20" />
      </svg>
    </motion.div>
  )
}

// Countdown timer for auto-retry
function useCountdown(seconds, onFinish) {
  const [count, setCount] = useState(seconds)
  useEffect(() => {
    if (count <= 0) { onFinish(); return }
    const t = setTimeout(() => setCount((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [count, onFinish])
  return count
}

export default function ErrorPage() {
  const { t } = useTranslation()
  const [retrying, setRetrying] = useState(false)

  const handleRetry = () => {
    setRetrying(true)
    setTimeout(() => window.location.reload(), 400)
  }

  const count = useCountdown(30, handleRetry)

  return (
    <div className="min-h-screen bg-mist flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(var(--color-ink) 1px, transparent 1px), linear-gradient(90deg, var(--color-ink) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Background blobs */}
      <motion.div
        className="absolute top-16 right-16 w-80 h-80 bg-critical/5 rounded-full blur-3xl pointer-events-none"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-16 left-16 w-64 h-64 bg-warning/5 rounded-full blur-3xl pointer-events-none"
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />

      <motion.div
        className="relative text-center max-w-md"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <OfflineIcon />

        <motion.h1
          className="font-display font-semibold text-ink text-3xl mb-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {t('errors.offline')}
        </motion.h1>

        <motion.p
          className="font-body text-body/70 mb-4 leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {t('errors.offlineDesc')}
        </motion.p>

        {/* Auto-retry countdown */}
        <motion.div
          className="inline-flex items-center gap-2 bg-surface border border-border rounded-xl px-4 py-2 mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <motion.div
            className="w-2 h-2 rounded-full bg-warning"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <span className="font-body text-xs text-body/60">
            Auto-retry in{' '}
            <span className="font-mono font-semibold text-warning tabular">{count}s</span>
          </span>
        </motion.div>

        <motion.div
          className="flex flex-col sm:flex-row gap-3 justify-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <button
            id="retry-btn"
            onClick={handleRetry}
            disabled={retrying}
            className="btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {retrying ? (
              <>
                <motion.span
                  className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                />
                Retrying…
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 .49-3.5" />
                </svg>
                {t('errors.retry')}
              </>
            )}
          </button>
          <Link
            to="/landing"
            className="btn-ghost inline-flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            {t('errors.backToDashboard')}
          </Link>
        </motion.div>

        {/* System status hint */}
        <motion.div
          className="mt-8 p-4 rounded-xl bg-surface border border-border text-left"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <p className="font-body text-xs font-semibold text-ink mb-2">Troubleshooting</p>
          <ul className="space-y-1">
            {[
              'Check your internet connection',
              'Verify the Django backend is running on port 8000',
              'Confirm CORS_ALLOWED_ORIGINS includes http://localhost:5173',
            ].map((tip) => (
              <li key={tip} className="flex items-start gap-2 font-body text-2xs text-body/60">
                <span className="mt-0.5 text-body/40">·</span>
                {tip}
              </li>
            ))}
          </ul>
        </motion.div>
      </motion.div>
    </div>
  )
}
