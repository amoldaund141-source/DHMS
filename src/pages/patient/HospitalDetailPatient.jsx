import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import StatusPill from '@/components/ui/StatusPill'
import { useHospital } from '@/hooks/useHospitals'

function BedBar({ label, occupied, total }) {
  const { t } = useTranslation()
  const pct = total > 0 ? Math.round((occupied / total) * 100) : 0
  const avail = total - occupied
  const variant = pct >= 90 ? 'critical' : pct >= 70 ? 'warning' : 'success'
  const barColor = variant === 'critical' ? 'bg-critical' : variant === 'warning' ? 'bg-warning' : 'bg-success'
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-body text-sm text-ink">{label}</span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs tabular text-body/60">{occupied}/{total} {t('beds.occupied')}</span>
          <StatusPill
            variant={variant}
            label={avail > 0 ? `${avail} ${t('beds.available')}` : t('patient.noBeds')}
          />
        </div>
      </div>
      <div className="w-full bg-border rounded-full h-2">
        <motion.div
          className={`h-2 rounded-full ${barColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

export default function HospitalDetailPatient() {
  const { id } = useParams()
  const { t } = useTranslation()
  const { data: hospital } = useHospital(id)

  if (!hospital) return <div className="p-8 text-center text-body/70">Loading hospital...</div>

  const availBeds = (hospital.beds.general.total - hospital.beds.general.occupied) +
    (hospital.beds.semi.total - hospital.beds.semi.occupied) +
    (hospital.beds.special.total - hospital.beds.special.occupied)
  const presentDoctors = hospital.doctors.filter((d) => d.status === 'present')

  return (
    <div className="max-w-2xl space-y-6 pb-6">
      {/* Back */}
      <Link to="/patient" className="inline-flex items-center gap-1.5 text-body/60 hover:text-primary text-sm font-body transition-colors">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        {t('patient.nearbyHospitals')}
      </Link>

      {/* Hospital header */}
      <motion.div
        className="card p-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-display font-semibold text-xl text-ink">{hospital.name}</h2>
              <span className={`px-2 py-0.5 rounded text-2xs font-mono font-semibold ${hospital.type === 'CHC' ? 'bg-info-tint text-info' : 'bg-primary/10 text-primary'}`}>{hospital.type}</span>
            </div>
            <p className="font-body text-sm text-body/70">{hospital.location}</p>
          </div>
          <StatusPill variant="success" label={t('status.operational')} />
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
          <div className="text-center">
            <p className="font-mono text-2xl font-bold text-ink tabular">{availBeds}</p>
            <p className="font-body text-2xs text-body/60 mt-1">{t('patient.bedsAvailable')}</p>
          </div>
          <div className="text-center border-x border-border">
            <p className="font-mono text-2xl font-bold text-ink tabular">{presentDoctors.length}</p>
            <p className="font-body text-2xs text-body/60 mt-1">Doctors today</p>
          </div>
          <div className="text-center">
            <p className="font-mono text-2xl font-bold text-ink tabular">{hospital.distance}</p>
            <p className="font-body text-2xs text-body/60 mt-1">{t('patient.distance')} (km)</p>
          </div>
        </div>

        {/* Contact */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-body)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.27 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72A12.84 12.84 0 0 0 9.7 6.17a2 2 0 0 1-.45 2.11L8.09 9.37A16 16 0 0 0 12 14l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.51.6A2 2 0 0 1 20 14.92z" />
          </svg>
          <a href={`tel:${hospital.phone}`} className="font-mono text-sm text-primary hover:underline tabular">{hospital.phone}</a>
        </div>
      </motion.div>

      {/* Bed availability */}
      <motion.div
        className="card p-5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h3 className="font-display font-semibold text-sm text-ink mb-4">{t('beds.title')}</h3>
        <BedBar label={t('beds.general')} occupied={hospital.beds.general.occupied} total={hospital.beds.general.total} />
        <BedBar label={t('beds.semiWard')} occupied={hospital.beds.semi.occupied} total={hospital.beds.semi.total} />
        <BedBar label={t('beds.special')} occupied={hospital.beds.special.occupied} total={hospital.beds.special.total} />
      </motion.div>

      {/* Available doctors */}
      <motion.div
        className="card p-5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="font-display font-semibold text-sm text-ink mb-4">Available Doctors Today</h3>
        {presentDoctors.length === 0 ? (
          <p className="font-body text-sm text-body/60">{t('errors.noData')}</p>
        ) : (
          <div className="space-y-3">
            {presentDoctors.map((doc, i) => (
              <motion.div
                key={doc.id}
                className="flex items-center justify-between gap-3 pb-3 border-b border-border last:border-0 last:pb-0"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.06 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-success-tint flex items-center justify-center flex-shrink-0">
                    <span className="font-mono text-xs font-bold text-success">{doc.name[4]}</span>
                  </div>
                  <div>
                    <p className="font-body text-sm font-medium text-ink">{doc.name}</p>
                    <p className="font-body text-2xs text-body/60">{doc.specialization}</p>
                  </div>
                </div>
                <StatusPill variant="success" label={t('status.present')} />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Book appointment CTA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Link
          to={`/patient/book?hospital=${hospital.id}`}
          className="btn-primary w-full justify-center py-3 text-base"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          {t('appointments.book')}
        </Link>
      </motion.div>
    </div>
  )
}
