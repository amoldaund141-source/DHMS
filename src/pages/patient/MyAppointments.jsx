import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { format, parseISO, isFuture, isPast } from 'date-fns'
import StatusPill from '@/components/ui/StatusPill'
import { useAppointments, useUpdateAppointment } from '@/hooks/useAppointments'
import { useAuth } from '@/context/AuthContext'

const STATUS_VARIANT = {
  confirmed: 'success',
  completed: 'info',
  cancelled: 'critical',
}

const STATUS_ICON = {
  confirmed: '✅',
  completed: '✓',
  cancelled: '✕',
}

export default function MyAppointments() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [tab, setTab] = useState('upcoming')
  const { data: allAppts = [] } = useAppointments({ patientId: user?.id })
  const { mutate: updateAppt } = useUpdateAppointment()

  const appointments = allAppts

  const upcoming = appointments.filter(
    (a) => a.status === 'confirmed' && isFuture(parseISO(`${a.date}T${a.time}:00`))
  )
  const past = appointments.filter(
    (a) => a.status === 'completed' || a.status === 'cancelled' || isPast(parseISO(`${a.date}T${a.time}:00`))
  )

  const cancelAppt = (id) => {
    updateAppt({ id, data: { status: 'cancelled' } })
  }

  const displayed = tab === 'upcoming' ? upcoming : past

  return (
    <div className="max-w-2xl space-y-6 pb-6">
      <div>
        <h2 className="font-display font-semibold text-xl text-ink">{t('appointments.title')}</h2>
        <p className="font-body text-sm text-body/70 mt-0.5">Your upcoming and past appointments</p>
      </div>

      {/* Tab strip */}
      <div className="flex gap-1 p-1 rounded-xl bg-mist border border-border w-fit">
        {['upcoming', 'past'].map((key) => (
          <button
            key={key}
            id={`tab-${key}`}
            onClick={() => setTab(key)}
            className={`px-5 py-2 rounded-lg text-sm font-body font-medium transition-all ${
              tab === key
                ? 'bg-surface shadow-sm text-ink border border-border'
                : 'text-body/60 hover:text-body'
            }`}
          >
            {key === 'upcoming' ? 'Upcoming' : 'Past'}
            <span className={`ml-1.5 font-mono text-xs ${tab === key ? 'text-primary' : 'text-body/40'}`}>
              {key === 'upcoming' ? upcoming.length : past.length}
            </span>
          </button>
        ))}
      </div>

      {/* Appointment cards */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="space-y-3"
        >
          {displayed.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="text-3xl mb-3">📅</p>
              <p className="font-body text-sm text-body/60">
                {tab === 'upcoming' ? 'No upcoming appointments.' : 'No past appointments.'}
              </p>
              {tab === 'upcoming' && (
                <p className="font-body text-xs text-body/40 mt-1">Book an appointment from Nearby Hospitals.</p>
              )}
            </div>
          ) : (
            displayed.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="card p-5 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                {/* Date/time block */}
                <div className="flex-shrink-0 w-16 text-center bg-primary/8 rounded-xl py-2.5 px-2 border border-primary/15">
                  <p className="font-mono text-xs text-primary/70 tabular">{format(parseISO(a.date), 'MMM')}</p>
                  <p className="font-mono font-bold text-xl text-primary tabular">{format(parseISO(a.date), 'd')}</p>
                  <p className="font-mono text-xs text-primary/70 tabular">{a.time}</p>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <p className="font-display font-semibold text-sm text-ink">{a.doctor}</p>
                      <p className="font-body text-xs text-body/60">{a.specialization}</p>
                    </div>
                    <StatusPill variant={STATUS_VARIANT[a.status] ?? 'info'} label={t(`appointments.${a.status}`)} />
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-2xs font-body text-body/50">
                    <span>🏥 {a.hospital}</span>
                    <span>·</span>
                    <span>📅 {format(parseISO(a.date), 'dd MMM yyyy')}</span>
                    <span>·</span>
                    <span>🕐 {a.time}</span>
                  </div>
                </div>

                {/* Actions */}
                {a.status === 'confirmed' && tab === 'upcoming' && (
                  <button
                    onClick={() => cancelAppt(a.id)}
                    id={`cancel-appt-${a.id}`}
                    className="flex-shrink-0 px-4 py-2 rounded-lg border border-critical/30 text-critical text-xs font-body font-medium hover:bg-critical-tint transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </motion.div>
            ))
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
