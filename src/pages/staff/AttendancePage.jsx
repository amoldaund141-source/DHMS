import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import StatusPill from '@/components/ui/StatusPill'
import { useAttendance, useAttendanceHistory, useMarkAttendance } from '@/hooks/useAttendance'
import { useAuth } from '@/context/AuthContext'

export default function AttendancePage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const hospitalId = user?.hospitalId || 1
  const { data: attendance = [] } = useAttendance(hospitalId)
  const { data: history = [] } = useAttendanceHistory(hospitalId)
  const { mutate: markAttendance } = useMarkAttendance(hospitalId)
  const today = format(new Date(), 'dd MMMM yyyy')

  const presentCount = attendance.filter((d) => d.status === 'present').length
  const absentCount = attendance.filter((d) => d.status === 'absent').length

  const toggle = (doc) => {
    markAttendance({ doctorId: doc.id, status: doc.status === 'present' ? 'absent' : 'present' })
  }

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display font-semibold text-xl text-ink">{t('attendance.title')}</h2>
          <p className="font-body text-sm text-body/70 mt-0.5">{today}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="pill pill-success">
            <span className="pill-dot dot-success" />
            <span className="font-mono tabular">{presentCount}</span> Present
          </span>
          <span className="pill pill-critical">
            <span className="pill-dot dot-critical" />
            <span className="font-mono tabular">{absentCount}</span> Absent
          </span>
        </div>
      </div>

      {/* Doctor cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {attendance.map((doc, i) => (
          <motion.div
            key={doc.id}
            className="card p-4 flex items-start gap-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.3 }}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              doc.status === 'present' ? 'bg-success-tint' : 'bg-critical-tint'
            }`}>
              <span className={`font-mono text-sm font-bold ${doc.status === 'present' ? 'text-success' : 'text-critical'}`}>
                {doc.name[4]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-body text-sm font-medium text-ink truncate">{doc.name}</p>
              <p className="font-body text-2xs text-body/60">{doc.specialization}</p>
              {doc.checkIn && (
                <p className="font-mono text-2xs text-success mt-0.5">Check-in: {doc.checkIn}</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <StatusPill
                variant={doc.status === 'present' ? 'success' : 'critical'}
                label={doc.status === 'present' ? t('status.present') : t('status.absent')}
              />
              <button
                onClick={() => toggle(doc)}
                className={`text-2xs font-body px-2 py-1 rounded transition-colors ${
                  doc.status === 'present'
                    ? 'text-critical hover:bg-critical-tint'
                    : 'text-success hover:bg-success-tint'
                }`}
              >
                {doc.status === 'present' ? t('attendance.markAbsent') : t('attendance.markPresent')}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Attendance history chart */}
      <motion.div
        className="card p-5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className="font-display font-semibold text-sm text-ink mb-4">{t('attendance.history')} — Last 7 Days</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono', fill: 'var(--color-body)' }} />
            <YAxis tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono', fill: 'var(--color-body)' }} />
            <Tooltip contentStyle={{ fontFamily: 'Inter', fontSize: 12, borderRadius: 8, border: '1px solid var(--color-border)' }} />
            <Bar dataKey="present" name="Present" fill="var(--color-success)" radius={[3, 3, 0, 0]} />
            <Bar dataKey="absent" name="Absent" fill="var(--color-critical)" radius={[3, 3, 0, 0]} opacity={0.7} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  )
}
