import React, { useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/context/AuthContext'

const ROLE_HOME = { admin: '/admin', staff: '/staff', patient: '/patient' }

// Animated ECG-style pulse line for 404 decoration
function PulseDecor() {
  return (
    <svg
      width="320"
      height="60"
      viewBox="0 0 320 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="opacity-30"
    >
      <motion.polyline
        points="0,30 40,30 50,10 60,50 70,20 80,40 90,30 140,30 155,5 165,55 175,15 185,45 195,30 320,30"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        className="text-primary"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 2, ease: 'easeInOut', repeat: Infinity, repeatType: 'loop', repeatDelay: 1 }}
      />
    </svg>
  )
}

export default function NotFoundPage() {
  const { t } = useTranslation()
  const { isAuthenticated, role } = useAuth()
  const navigate = useNavigate()

  // Auto-redirect after 10s if authenticated
  useEffect(() => {
    if (!isAuthenticated) return
    const timer = setTimeout(() => {
      navigate(ROLE_HOME[role] ?? '/landing', { replace: true })
    }, 10_000)
    return () => clearTimeout(timer)
  }, [isAuthenticated, role, navigate])

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

      {/* Floating blobs */}
      <motion.div
        className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl pointer-events-none"
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-96 h-96 bg-info/5 rounded-full blur-3xl pointer-events-none"
        animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />

      <motion.div
        className="relative text-center max-w-lg"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* 404 big number */}
        <div className="relative inline-block mb-6">
          <motion.div
            className="font-mono text-[9rem] font-bold leading-none select-none"
            style={{ color: 'transparent', WebkitTextStroke: '2px var(--color-border)' }}
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            404
          </motion.div>
          <motion.div
            className="absolute inset-0 font-mono text-[9rem] font-bold leading-none text-primary/15 select-none"
            animate={{ opacity: [0.15, 0.35, 0.15] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          >
            404
          </motion.div>
        </div>

        {/* Pulse decoration */}
        <div className="flex justify-center mb-6">
          <PulseDecor />
        </div>

        {/* Cross / plus icon */}
        <motion.div
          className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6"
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.5, delay: 0.3, type: 'spring', stiffness: 200 }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        </motion.div>

        <motion.h1
          className="font-display font-semibold text-ink text-3xl mb-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {t('errors.notFound')}
        </motion.h1>
        <motion.p
          className="font-body text-body/70 mb-8 leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {t('errors.notFoundDesc')}
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-3 justify-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Link
            to={isAuthenticated ? (ROLE_HOME[role] ?? '/landing') : '/landing'}
            className="btn-primary inline-flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            {t('errors.backToDashboard')}
          </Link>
          <button
            onClick={() => window.history.back()}
            className="btn-ghost inline-flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Go back
          </button>
        </motion.div>

        {isAuthenticated && (
          <motion.p
            className="font-body text-xs text-body/40 mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            Redirecting to your dashboard in 10 seconds…
          </motion.p>
        )}
      </motion.div>
    </div>
  )
}
