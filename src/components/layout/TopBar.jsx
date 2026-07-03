import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/context/AuthContext'
import PulseLine from '@/components/ui/PulseLine'
import { format } from 'date-fns'

const ROLE_LABELS = {
  admin:   'District Admin',
  staff:   'Hospital Staff',
  patient: 'Patient',
}

const LANG_OPTIONS = [
  { code: 'en', label: 'EN' },
  { code: 'hi', label: 'HI' },
]

export default function TopBar({ title, notificationsPath, searchPlaceholder }) {
  const { t, i18n } = useTranslation()
  const { user, role } = useAuth()
  const navigate = useNavigate()
  const now = new Date()

  return (
    <header className="h-16 bg-surface border-b border-border flex items-center px-5 gap-4 flex-shrink-0 z-20">

      {/* Page title / district name */}
      <div className="flex-1 min-w-0">
        {title && (
          <h1 className="font-display font-semibold text-ink text-base leading-tight truncate">
            {title}
          </h1>
        )}
        {/* Live-data timestamp with pulse indicator */}
        <div className="flex items-center gap-1.5 text-2xs font-body text-body/50">
          <PulseLine mode="indicator" className="text-primary" />
          <span>{t('dashboard.lastUpdated')}: {format(now, 'dd MMM, HH:mm')}</span>
        </div>
      </div>

      {/* Search (admin only) */}
      {searchPlaceholder && (
        <div className="relative hidden md:block w-56">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-body/40 pointer-events-none"
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            placeholder={searchPlaceholder}
            className="form-input pl-8 py-1.5 text-xs w-full"
            aria-label={searchPlaceholder}
          />
        </div>
      )}

      {/* Language switcher */}
      <div className="flex items-center gap-1 bg-mist rounded-lg p-1">
        {LANG_OPTIONS.map((lang) => (
          <button
            key={lang.code}
            onClick={() => i18n.changeLanguage(lang.code)}
            className={`px-2.5 py-1 rounded-md text-2xs font-mono font-semibold transition-all ${
              i18n.language === lang.code
                ? 'bg-primary text-white shadow-sm'
                : 'text-body/60 hover:text-primary'
            }`}
            aria-pressed={i18n.language === lang.code}
          >
            {lang.label}
          </button>
        ))}
      </div>

      {/* Notifications bell */}
      {notificationsPath && (
        <Link
          to={notificationsPath}
          className="relative p-2 rounded-lg hover:bg-mist text-body/60 hover:text-primary transition-colors"
          aria-label={t('nav.notifications')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {/* Unread badge — red dot */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-critical rounded-full ring-2 ring-surface" aria-label="Unread notifications" />
        </Link>
      )}

      {/* Role badge */}
      <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-border">
        <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center">
          <span className="font-mono text-xs font-bold text-primary">
            {user?.name?.[0]?.toUpperCase() ?? 'U'}
          </span>
        </div>
        <div className="hidden lg:block">
          <p className="font-body text-xs font-medium text-ink leading-tight">{user?.name ?? 'User'}</p>
          <p className="font-body text-2xs text-body/50 capitalize">{ROLE_LABELS[role] ?? role}</p>
        </div>
      </div>
    </header>
  )
}
