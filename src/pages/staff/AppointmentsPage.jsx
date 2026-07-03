import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { format, addDays } from 'date-fns'
import StatusPill from '@/components/ui/StatusPill'
import { useAppointments, useSlots } from '@/hooks/useAppointments'
import { useAuth } from '@/context/AuthContext'

const DATE_STRIP = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i))

const STATUS_VARIANT = { confirmed: 'success', completed: 'info', cancelled: 'critical' }

export default function AppointmentsPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const hospitalId = user?.hospitalId || 1
  const { data: appointments = [] } = useAppointments({ hospitalId })
  const { data: slots = [] } = useSlots({ hospitalId, date: selectedDate })

  const dayAppts = appointments.filter((a) => a.date === selectedDate)

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h2 className="font-display font-semibold text-xl text-ink">{t('appointments.title')}</h2>
        <p className="font-body text-sm text-body/70 mt-0.5">Manage today's bookings and available slots</p>
      </div>

      {/* Date strip */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {DATE_STRIP.map((date) => {
          const key = format(date, 'yyyy-MM-dd')
          const isSelected = key === selectedDate
          const count = appointments.filter((a) => a.date === key).length
          return (
            <button
              key={key}
              onClick={() => setSelectedDate(key)}
              className={`flex-shrink-0 flex flex-col items-center gap-0.5 px-4 py-2.5 rounded-xl border transition-all ${
                isSelected
                  ? 'bg-primary border-primary text-white shadow-sm'
                  : 'bg-surface border-border text-body hover:border-primary/30'
              }`}
            >
              <span className={`font-body text-2xs uppercase ${isSelected ? 'text-white/70' : 'text-body/60'}`}>{format(date, 'EEE')}</span>
              <span className="font-mono font-semibold text-base tabular">{format(date, 'd')}</span>
              {count > 0 && (
                <span className={`font-mono text-2xs tabular ${isSelected ? 'text-white/80' : 'text-primary'}`}>{count}</span>
              )}
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Appointments list */}
        <div className="lg:col-span-3 card overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <h3 className="font-display font-semibold text-sm text-ink">
              {format(new Date(selectedDate), 'dd MMM yyyy')}
            </h3>
            <span className="font-mono text-xs text-body/50 tabular">{dayAppts.length} bookings</span>
          </div>
          {dayAppts.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <p className="font-body text-sm text-body/50">{t('errors.noData')}</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {dayAppts.map((a, i) => (
                <motion.div
                  key={a.id}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-mist/50 transition-colors"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <span className="font-mono text-sm tabular text-primary bg-primary/10 px-2 py-1 rounded w-14 text-center">{a.time}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm font-medium text-ink truncate">{a.patient}</p>
                    <p className="font-body text-2xs text-body/60">{a.doctor} · {a.specialization}</p>
                  </div>
                  <StatusPill variant={STATUS_VARIANT[a.status] ?? 'info'} label={t(`appointments.${a.status}`)} />
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Available slots */}
        <motion.div
          className="lg:col-span-2 card p-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="font-display font-semibold text-sm text-ink mb-4">{t('appointments.selectSlot')}</h3>
          <div className="grid grid-cols-2 gap-2">
            {slots.map((slot, i) => (
              <motion.div
                key={slot.time}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 + i * 0.04 }}
                className={`py-2 px-3 rounded-lg border text-center text-xs font-mono tabular ${
                  slot.available
                    ? 'border-success/30 bg-success-tint text-success cursor-pointer hover:border-success transition-colors'
                    : 'border-border bg-mist text-body/40 cursor-not-allowed'
                }`}
              >
                {slot.time}
                <span className="block text-2xs mt-0.5 font-body">{slot.available ? 'Free' : 'Booked'}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
