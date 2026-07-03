import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import StatusPill from '@/components/ui/StatusPill'
import { useHospital, useBedTrend, useTestAvailability } from '@/hooks/useHospitals'
import { useStock } from '@/hooks/useStock'


function BedWardCard({ label, occupied, total, delay }) {
  const pct = Math.round((occupied / total) * 100)
  const variant = pct >= 90 ? 'critical' : pct >= 70 ? 'warning' : 'success'
  const barColor = variant === 'critical' ? 'bg-critical' : variant === 'warning' ? 'bg-warning' : 'bg-success'

  return (
    <motion.div
      className="card p-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="font-body text-sm font-medium text-ink">{label}</span>
        <StatusPill variant={variant} label={`${pct}%`} />
      </div>
      <div className="flex items-end gap-1 mb-2">
        <span className="font-mono font-semibold text-3xl text-ink tabular">{occupied}</span>
        <span className="font-mono text-sm text-body/50 mb-0.5">/{total}</span>
      </div>
      <div className="w-full bg-border rounded-full h-2">
        <motion.div
          className={`h-2 rounded-full ${barColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay: delay + 0.2, ease: 'easeOut' }}
        />
      </div>
      <p className="font-body text-2xs text-body/50 mt-1.5">{total - occupied} available</p>
    </motion.div>
  )
}

export default function HospitalDetail() {
  const { id } = useParams()
  const { t } = useTranslation()
  const { data: hospital } = useHospital(id)
  const { data: bedTrend = [] } = useBedTrend(id)
  const { data: stock = [] } = useStock(id)
  const { data: tests = [] } = useTestAvailability(hospital?.id)

  const stockVariantMap = { success: 'success', warning: 'warning', critical: 'critical' }

  if (!hospital) return <div className="p-8 text-center text-body/70">Loading hospital details...</div>

  return (
    <div className="space-y-6 pb-6">
      {/* Back + Header */}
      <div>
        <Link to="/admin" className="inline-flex items-center gap-1.5 text-body/60 hover:text-primary text-sm font-body mb-4 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          {t('common.back')} to Overview
        </Link>

        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-display font-semibold text-xl text-ink">{hospital.name}</h2>
            <p className="font-body text-sm text-body/70 mt-0.5">{hospital.location} · {hospital.phone}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold ${
              hospital.type === 'CHC' ? 'bg-info-tint text-info' : 'bg-primary/10 text-primary'
            }`}>{hospital.type}</span>
            <StatusPill variant="success" label={t('status.operational')} />
          </div>
        </div>
      </div>

      {/* Bed wards */}
      <div>
        <h3 className="font-display font-semibold text-sm text-ink mb-3">{t('beds.title')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <BedWardCard label={t('beds.general')} occupied={hospital.beds.general.occupied} total={hospital.beds.general.total} delay={0.1} />
          <BedWardCard label={t('beds.semiWard')} occupied={hospital.beds.semi.occupied} total={hospital.beds.semi.total} delay={0.18} />
          <BedWardCard label={t('beds.special')} occupied={hospital.beds.special.occupied} total={hospital.beds.special.total} delay={0.26} />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div
          className="card p-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="font-display font-semibold text-sm text-ink mb-4">Bed Occupancy — Last 7 Days</h3>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={bedTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono', fill: 'var(--color-body)' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono', fill: 'var(--color-body)' }} />
              <Tooltip contentStyle={{ fontFamily: 'Inter', fontSize: 12, borderRadius: 8, border: '1px solid var(--color-border)' }} />
              <Line type="monotone" dataKey="occupancy" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 3, fill: 'var(--color-primary)' }} name="Occupancy %" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Doctor attendance */}
        <motion.div
          className="card p-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38 }}
        >
          <h3 className="font-display font-semibold text-sm text-ink mb-3">{t('attendance.title')}</h3>
          <div className="space-y-2.5">
            {hospital.doctors.map((doc, i) => (
              <motion.div
                key={doc.id}
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.06 }}
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="font-mono text-xs font-semibold text-primary">{doc.name[4]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-xs font-medium text-ink truncate">{doc.name}</p>
                  <p className="font-body text-2xs text-body/60">{doc.specialization}</p>
                </div>
                <StatusPill
                  variant={doc.status === 'present' ? 'success' : 'critical'}
                  label={doc.status === 'present' ? t('status.present') : t('status.absent')}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Stock table */}
      <motion.div
        className="card overflow-hidden"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.44 }}
      >
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-display font-semibold text-sm text-ink">{t('stock.title')}</h3>
          <span className="pill pill-warning">
            <span className="pill-dot dot-warning" />
            {stock.filter(s => s.status !== 'success').length} items need attention
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr className="border-b border-border bg-mist/40">
                <th className="text-left py-2.5 px-4 font-body text-2xs uppercase tracking-wider text-body/60">{t('stock.medicine')}</th>
                <th className="text-left py-2.5 px-4 font-body text-2xs uppercase tracking-wider text-body/60">{t('stock.current')}</th>
                <th className="text-left py-2.5 px-4 font-body text-2xs uppercase tracking-wider text-body/60">{t('stock.threshold')}</th>
                <th className="text-left py-2.5 px-4 font-body text-2xs uppercase tracking-wider text-body/60">Status</th>
              </tr>
            </thead>
            <tbody>
              {stock.slice(0, 7).map((item, i) => (
                <motion.tr
                  key={item.id}
                  className="border-b border-border hover:bg-mist/40 transition-colors"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 + i * 0.04 }}
                >
                  <td className="py-2.5 px-4 font-body text-sm text-ink">{item.medicine}</td>
                  <td className="py-2.5 px-4 font-mono text-sm tabular text-ink">{item.current} <span className="text-body/50 text-xs">{item.unit}</span></td>
                  <td className="py-2.5 px-4 font-mono text-sm tabular text-body/60">{item.threshold}</td>
                  <td className="py-2.5 px-4">
                    <StatusPill
                      variant={item.status}
                      label={item.status === 'success' ? 'Healthy' : item.status === 'warning' ? 'Low' : 'Critical'}
                    />
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Test Availability */}
      <motion.div
        className="card overflow-hidden"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.52 }}
      >
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v11m0 0H5m4 0h4m-4 3h10m-10 0v3m0-3a2 2 0 0 1 2 2v1" />
            </svg>
            <h3 className="font-display font-semibold text-sm text-ink">Diagnostic Test Availability</h3>
          </div>
          {(() => {
            const available = tests.filter(t => t.available).length
            return (
              <span className="font-mono text-xs text-body/60">
                <span className="text-success font-semibold">{available}</span>/{tests.length} available
              </span>
            )
          })()}
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {tests.map((test, i) => (
              <motion.div
                key={test.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.55 + i * 0.04 }}
                className={`flex items-center gap-2.5 p-2.5 rounded-lg border ${
                  test.available
                    ? 'bg-success-tint border-success/20'
                    : 'bg-mist border-border'
                }`}
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${test.available ? 'bg-success' : 'bg-border'}`} />
                <span className={`font-body text-xs ${test.available ? 'text-ink' : 'text-body/50 line-through'}`}>
                  {test.name}
                </span>
              </motion.div>
            ))}
            {tests.length === 0 && (
              <p className="col-span-3 text-center font-body text-sm text-body/50 py-4">No test data available for this facility.</p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

