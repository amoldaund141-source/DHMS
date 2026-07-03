import React from 'react'
import { useTranslation } from 'react-i18next'

export function EmptyState({ title, description, action, icon, className = '' }) {
  const { t } = useTranslation()
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
      {icon ? (
        <div className="w-14 h-14 rounded-2xl bg-border flex items-center justify-center mb-4 text-body/40">
          {icon}
        </div>
      ) : (
        <div className="w-14 h-14 rounded-2xl bg-border flex items-center justify-center mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-body/40">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4" />
          </svg>
        </div>
      )}
      <h3 className="font-display font-semibold text-ink text-base mb-1">
        {title ?? t('errors.noData')}
      </h3>
      <p className="font-body text-sm text-body/70 max-w-xs">
        {description ?? t('errors.noDataDesc')}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({ title, description, onRetry, className = '' }) {
  const { t } = useTranslation()
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-critical-tint flex items-center justify-center mb-4">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-critical">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <h3 className="font-display font-semibold text-ink text-base mb-1">
        {title ?? t('errors.offline')}
      </h3>
      <p className="font-body text-sm text-body/70 max-w-xs mb-5">
        {description ?? t('errors.offlineDesc')}
      </p>
      {onRetry && (
        <button onClick={onRetry} className="btn-primary">
          {t('errors.retry')}
        </button>
      )}
    </div>
  )
}
