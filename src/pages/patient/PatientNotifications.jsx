import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { format, parseISO, isToday, isYesterday } from 'date-fns'
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/hooks/useNotifications'

const TYPE_CONFIG = {
  lowStock:            { color: 'warning',  icon: '📦' },
  bedFull:             { color: 'critical', icon: '🛏️' },
  doctorAbsent:        { color: 'critical', icon: '👨‍⚕️' },
  appointmentReminder: { color: 'info',     icon: '📅' },
}

function groupByDate(notifications) {
  const today = [], yesterday = [], earlier = []
  notifications.forEach((n) => {
    const d = parseISO(n.time)
    if (isToday(d)) today.push(n)
    else if (isYesterday(d)) yesterday.push(n)
    else earlier.push(n)
  })
  return { today, yesterday, earlier }
}

export default function PatientNotifications() {
  const { t } = useTranslation()
  const { data: allNotifications = [] } = useNotifications()
  const { mutate: markReadMutate } = useMarkNotificationRead()
  const { mutate: markAllMutate } = useMarkAllNotificationsRead()

  // Patient only sees appointment & bed-full related notifications
  const notifications = allNotifications
    .filter((n) => n.type === 'appointmentReminder' || n.type === 'bedFull')
    .concat(allNotifications.filter((n) => n.type !== 'appointmentReminder' && n.type !== 'bedFull').slice(0, 2))

  const unreadCount = notifications.filter((n) => !n.read).length

  const markRead = (id) => markReadMutate(id)
  const markAll = () => markAllMutate()

  const { today, yesterday, earlier } = groupByDate(notifications)

  const variantBg = {
    warning:  'bg-warning-tint border-warning/20',
    critical: 'bg-critical-tint border-critical/20',
    info:     'bg-info-tint border-info/20',
  }

  const Section = ({ title, items }) => {
    if (!items.length) return null
    return (
      <div>
        <h3 className="font-body text-xs font-semibold text-body/50 uppercase tracking-wider mb-3">{title}</h3>
        <div className="space-y-2">
          <AnimatePresence>
            {items.map((n) => {
              const cfg = TYPE_CONFIG[n.type] ?? { color: 'info', icon: '🔔' }
              return (
                <motion.div
                  key={n.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${n.read ? 'bg-surface border-border' : variantBg[cfg.color] ?? 'bg-info-tint border-info/20'}`}
                >
                  <span className="text-lg flex-shrink-0 mt-0.5">{cfg.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`font-body text-sm font-medium ${n.read ? 'text-body' : 'text-ink'}`}>{n.message}</p>
                    <p className="font-body text-2xs text-body/50 mt-1">{n.hospital} · {format(parseISO(n.time), 'HH:mm')}</p>
                  </div>
                  {!n.read && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className={`w-2 h-2 rounded-full ${cfg.color === 'warning' ? 'bg-warning' : cfg.color === 'critical' ? 'bg-critical' : 'bg-info'}`} />
                      <button onClick={() => markRead(n.id)} className="text-2xs font-body text-body/60 hover:text-primary transition-colors whitespace-nowrap">
                        {t('notifications.markRead')}
                      </button>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6 pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-semibold text-xl text-ink">{t('notifications.title')}</h2>
          {unreadCount > 0 && <p className="font-body text-sm text-body/70 mt-0.5"><span className="font-mono text-primary">{unreadCount}</span> unread</p>}
        </div>
        {unreadCount > 0 && <button onClick={markAll} className="btn-ghost text-sm">{t('notifications.markAll')}</button>}
      </div>
      {notifications.length === 0 ? (
        <div className="card p-10 text-center"><p className="font-body text-body/60">{t('notifications.noNew')}</p></div>
      ) : (
        <div className="space-y-6">
          <Section title={t('common.today')} items={today} />
          <Section title={t('common.yesterday')} items={yesterday} />
          <Section title="Earlier" items={earlier} />
        </div>
      )}
    </div>
  )
}
