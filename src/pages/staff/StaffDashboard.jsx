import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import StatCard from '@/components/ui/StatCard'
import StatusPill from '@/components/ui/StatusPill'
import PulseLine from '@/components/ui/PulseLine'
import { useHospital, useBedTrend } from '@/hooks/useHospitals'
import { useStock } from '@/hooks/useStock'
import { useAttendance } from '@/hooks/useAttendance'
import { useAppointments } from '@/hooks/useAppointments'
import { useAuth } from '@/context/AuthContext'

export default function StaffDashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const hospitalId = user?.hospitalId || 1

  const { data: hospital } = useHospital(hospitalId)
  const { data: bedTrend } = useBedTrend(hospitalId)
  const { data: stock = [] } = useStock(hospitalId)
  const { data: attendance = [] } = useAttendance(hospitalId)
  const { data: appointments = [] } = useAppointments({ hospitalId })

  if (!hospital) return <div className="p-8 text-center text-body/70">Loading dashboard...</div>

  const totalBeds = hospital.beds.general.total + hospital.beds.semi.total + hospital.beds.special.total
  const occupiedBeds = hospital.beds.general.occupied + hospital.beds.semi.occupied + hospital.beds.special.occupied
  const availableBeds = totalBeds - occupiedBeds
  const today = new Date().toISOString().split('T')[0]
  const todayAppts = appointments.filter((a) => a.date === today).length
  const presentDoctors = attendance.filter((d) => d.status === 'present').length

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div>
        <h2 className="font-display font-semibold text-xl text-ink">{hospital.name}</h2>
        <div className="flex items-center gap-1.5 text-2xs font-body text-body/50 mt-0.5">
          <PulseLine mode="indicator" className="text-success" />
          <span>{hospital.location} · {hospital.type}</span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Beds" value={totalBeds} variant="info" pillLabel="Facility" delay={0} />
        <StatCard label="Occupied" value={occupiedBeds} variant="warning" pillLabel="In use" delay={0.08} />
        <StatCard label="Available" value={availableBeds} variant="success" pillLabel="Free" delay={0.16} />
        <StatCard label={t('dashboard.doctorsPresent')} value={presentDoctors}
          unit={`/${attendance.length || 1}`} variant={presentDoctors < 3 ? 'critical' : 'success'}
          pillLabel={presentDoctors < 3 ? t('status.critical') : t('status.present')} delay={0.24}
        />
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bed wards */}
        <motion.div
          className="card p-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="font-display font-semibold text-sm text-ink mb-4">{t('beds.title')}</h3>
          {[
            { label: t('beds.general'), ...hospital.beds.general },
            { label: t('beds.semiWard'), ...hospital.beds.semi },
            { label: t('beds.special'), ...hospital.beds.special },
          ].map((ward, i) => {
            const pct = Math.round((ward.occupied / ward.total) * 100)
            const color = pct >= 90 ? 'bg-critical' : pct >= 70 ? 'bg-warning' : 'bg-success'
            return (
              <div key={ward.label} className="mb-3 last:mb-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-body text-xs text-body">{ward.label}</span>
                  <span className="font-mono text-xs tabular text-ink">{ward.occupied}/{ward.total}</span>
                </div>
                <div className="w-full bg-border rounded-full h-1.5">
                  <motion.div
                    className={`h-1.5 rounded-full ${color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.7, delay: 0.4 + i * 0.1 }}
                  />
                </div>
              </div>
            )
          })}
        </motion.div>

        {/* Today's appointments */}
        <motion.div
          className="card p-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-sm text-ink">Today's Appointments</h3>
            <Link to="/staff/appointments" className="text-primary text-xs font-body hover:underline">View all →</Link>
          </div>
          <div className="space-y-2.5">
            {appointments.filter((a) => a.date === today).slice(0, 4).map((a, i) => (
              <motion.div
                key={a.id}
                className="flex items-center gap-3 py-1.5"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 + i * 0.06 }}
              >
                <span className="font-mono text-xs tabular text-primary bg-primary/10 px-1.5 py-0.5 rounded w-12 text-center">{a.time}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-xs font-medium text-ink truncate">{a.patient}</p>
                  <p className="font-body text-2xs text-body/60">{a.doctor}</p>
                </div>
                <StatusPill variant="success" label="Confirmed" />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div
          className="card p-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.44 }}
        >
          <h3 className="font-display font-semibold text-sm text-ink mb-4">Bed Occupancy Trend</h3>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={bedTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono', fill: 'var(--color-body)' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono', fill: 'var(--color-body)' }} />
              <Tooltip contentStyle={{ fontFamily: 'Inter', fontSize: 12, borderRadius: 8, border: '1px solid var(--color-border)' }} />
              <Line type="monotone" dataKey="occupancy" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 3 }} name="Occupancy %" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Stock alerts */}
        <motion.div
          className="card p-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-sm text-ink">{t('stock.lowStock')}</h3>
            <Link to="/staff/stock" className="text-primary text-xs font-body hover:underline">Manage →</Link>
          </div>
          <div className="space-y-2">
            {stock.filter((s) => s.status !== 'success').map((s, i) => (
              <motion.div
                key={s.id}
                className="flex items-center justify-between py-1.5 border-b border-border last:border-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55 + i * 0.05 }}
              >
                <p className="font-body text-xs text-ink truncate flex-1">{s.medicine}</p>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="font-mono text-xs tabular text-ink">{s.current}</span>
                  <StatusPill
                    variant={s.status === 'critical' ? 'critical' : 'warning'}
                    label={s.status === 'critical' ? 'Critical' : 'Low'}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
