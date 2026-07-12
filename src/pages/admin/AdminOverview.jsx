import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import StatCard from '@/components/ui/StatCard'
import StatusPill from '@/components/ui/StatusPill'
import PulseLine from '@/components/ui/PulseLine'
import { useHospitals, useDistrictStats, useFootfallTrend } from '@/hooks/useHospitals'
import { useAiInsights, useFlaggedHospitals, useRedistribution, useAiForecast } from '@/hooks/useAiInsights'

// Fix leaflet default icon issue with Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function createHospitalIcon(stockStatus, bedOccupancy) {
  const isCritical = stockStatus === 'critical' || bedOccupancy >= 90
  const isWarning = stockStatus === 'warning' || bedOccupancy >= 70
  const color = isCritical ? '#C0392B' : isWarning ? '#D68A1F' : '#1B9C6E'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
    <path d="M14 0C6.268 0 0 6.268 0 14c0 9.625 14 22 14 22S28 23.625 28 14C28 6.268 21.732 0 14 0z" fill="${color}"/>
    <circle cx="14" cy="14" r="6" fill="white"/>
    <text x="14" y="18" text-anchor="middle" font-size="10" font-family="IBM Plex Mono" font-weight="700" fill="${color}">+</text>
  </svg>`
  return L.divIcon({ html: svg, className: '', iconSize: [28, 36], iconAnchor: [14, 36], popupAnchor: [0, -36] })
}

const FILTERS = ['filterAll', 'filterUrban', 'filterRural', 'filterPHC', 'filterCHC', 'filterCritical']

const STAT_ICONS = {
  facilities: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M9 21V7l3-4 3 4v14" /></svg>,
  stock: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>,
  beds: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4v16M22 4v16M2 8h20M2 12h20" /></svg>,
  doctors: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
}

function HospitalRow({ hospital, index }) {
  const statusVariant =
    hospital.stockStatus === 'success' ? 'success'
    : hospital.stockStatus === 'warning' ? 'warning'
    : 'critical'
  const bedVariant = hospital.bedOccupancy >= 90 ? 'critical' : hospital.bedOccupancy >= 70 ? 'warning' : 'success'

  return (
    <motion.tr
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.25 }}
      className="border-b border-border hover:bg-mist/60 transition-colors"
    >
      <td className="py-3 px-4">
        <div>
          <Link to={`/admin/hospital/${hospital.id}`} className="font-body font-medium text-ink text-sm hover:text-primary transition-colors">
            {hospital.name}
          </Link>
          <p className="font-body text-2xs text-body/60 mt-0.5">{hospital.location}</p>
        </div>
      </td>
      <td className="py-3 px-4">
        <span className={`inline-block px-2 py-0.5 rounded text-2xs font-mono font-semibold ${
          hospital.type === 'CHC' ? 'bg-info-tint text-info' : 'bg-primary/10 text-primary'
        }`}>{hospital.type}</span>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-border rounded-full h-1.5 w-16">
            <div
              className={`h-1.5 rounded-full ${bedVariant === 'critical' ? 'bg-critical' : bedVariant === 'warning' ? 'bg-warning' : 'bg-success'}`}
              style={{ width: `${hospital.bedOccupancy}%` }}
            />
          </div>
          <span className="font-mono text-xs tabular text-ink">{hospital.bedOccupancy}%</span>
        </div>
      </td>
      <td className="py-3 px-4">
        <StatusPill variant={statusVariant} label={`${hospital.stockHealth}%`} />
      </td>
      <td className="py-3 px-4">
        <span className="font-mono text-sm tabular text-ink">{hospital.doctorsPresent}</span>
        <span className="font-body text-xs text-body/50">/{hospital.doctorsTotal}</span>
      </td>
      <td className="py-3 px-4">
        <Link
          to={`/admin/hospital/${hospital.id}`}
          className="text-primary text-xs font-body font-medium hover:underline"
        >
          View →
        </Link>
      </td>
    </motion.tr>
  )
}

function FlaggedRow({ flag, index, onResolve }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07 }}
      className={`p-4 rounded-xl border ${
        flag.severity === 'critical'
          ? 'bg-critical-tint border-critical/20'
          : 'bg-warning-tint border-warning/20'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <StatusPill variant={flag.severity} label={flag.severity === 'critical' ? 'Critical' : 'Warning'} />
            <Link to={`/admin/hospital/${flag.hospital?.id}`} className="font-body font-semibold text-sm text-ink hover:text-primary transition-colors">
              {flag.hospital?.name}
            </Link>
          </div>
          <p className="font-body text-xs text-body/70 leading-relaxed">{flag.reason}</p>
          {flag.actionTaken && (
            <p className="font-body text-xs text-success mt-1.5 flex items-center gap-1">
              <span>✓</span> {flag.actionTaken}
            </p>
          )}
        </div>
        {!flag.actionTaken && (
          <button
            onClick={() => onResolve(flag.id)}
            className="btn-ghost text-xs whitespace-nowrap flex-shrink-0"
          >
            Resolve
          </button>
        )}
      </div>
    </motion.div>
  )
}

function RedistributionRow({ item, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="flex items-center gap-3 py-3 border-b border-border last:border-0"
    >
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.urgency === 'critical' ? 'bg-critical' : 'bg-warning'}`} />
      <div className="flex-1 min-w-0">
        <p className="font-body text-sm text-ink">
          <span className="font-medium">{item.item}</span>
          <span className="text-body/50 text-xs"> · {item.qty} {item.unit}</span>
        </p>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="font-body text-2xs text-body/60">{item.from}</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--color-body)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
          <span className="font-body text-2xs text-body/60">{item.to}</span>
        </div>
      </div>
      <span className="font-mono text-2xs text-body/50 flex-shrink-0">{item.estimatedDistance} km</span>
    </motion.div>
  )
}

export default function AdminOverview() {
  const { t } = useTranslation()
  const [activeFilter, setActiveFilter] = useState('filterAll')
  const [viewMode, setViewMode] = useState('list') // 'list' | 'map'
  const { data: hospitals = [] } = useHospitals()
  const { data: stats = { totalFacilities: 0, avgStockHealth: 0, avgBedOccupancy: 0, doctorsPresent: 0, doctorsTotal: 0 } } = useDistrictStats()
  const { data: footfallTrend = [] } = useFootfallTrend()
  const { data: aiInsights = [] } = useAiInsights()
  const { data: flaggedHospitals = [] } = useFlaggedHospitals()
  const { data: redistribution = [] } = useRedistribution()
  const { data: aiForecast = [] } = useAiForecast()

  const [flags, setFlags] = useState([])
  useEffect(() => { setFlags(flaggedHospitals) }, [flaggedHospitals])

  const mapCenter = [18.5204, 73.0] // Raigad district center

  const filteredHospitals = hospitals.filter((h) => {
    if (activeFilter === 'filterAll') return true
    if (activeFilter === 'filterUrban') return h.area === 'urban'
    if (activeFilter === 'filterRural') return h.area === 'rural'
    if (activeFilter === 'filterPHC') return h.type === 'PHC'
    if (activeFilter === 'filterCHC') return h.type === 'CHC'
    if (activeFilter === 'filterCritical') return h.stockStatus === 'critical' || h.bedOccupancy >= 90
    return true
  })

  const resolveFlag = (id) => {
    setFlags((prev) => prev.map((f) => f.id === id ? { ...f, actionTaken: 'Marked resolved by admin.' } : f))
  }

  const openFlags = flags.filter((f) => !f.actionTaken)

  return (
    <div className="space-y-6 pb-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-semibold text-xl text-ink">{t('dashboard.districtOverview')}</h2>
          <div className="flex items-center gap-1.5 text-2xs font-body text-body/50 mt-0.5">
            <PulseLine mode="indicator" className="text-success" />
            <span>Raigad District · {hospitals.length} facilities loaded</span>
          </div>
        </div>
        <Link to="/admin/compare" className="btn-ghost text-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          {t('nav.compare')}
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t('dashboard.totalHospitals')}
          value={stats.totalFacilities}
          variant="success"
          pillLabel={t('status.operational')}
          icon={STAT_ICONS.facilities}
          delay={0}
        />
        <StatCard
          label={t('dashboard.avgStockHealth')}
          value={stats.avgStockHealth}
          unit="%"
          variant="warning"
          pillLabel={t('status.warning')}
          icon={STAT_ICONS.stock}
          delay={0.08}
        />
        <StatCard
          label={t('dashboard.avgBedOccupancy')}
          value={stats.avgBedOccupancy}
          unit="%"
          variant="info"
          pillLabel="Moderate"
          icon={STAT_ICONS.beds}
          delay={0.16}
        />
        <StatCard
          label={t('dashboard.doctorsPresent')}
          value={stats.doctorsPresent}
          unit={`/${stats.doctorsTotal}`}
          variant="success"
          pillLabel={t('status.present')}
          icon={STAT_ICONS.doctors}
          delay={0.24}
        />
      </div>

      {/* AI Insights */}
      <motion.div
        className="ai-panel"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.3 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-info)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span className="ai-panel-label">{t('dashboard.aiInsights')}</span>
        </div>
        <p className="font-body text-xs text-body/70 mb-3">{t('dashboard.aiInsightsDesc')}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {aiInsights.map((insight, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-1 h-1 rounded-full bg-info mt-1.5 flex-shrink-0" />
              <p className="font-body text-xs text-ink leading-relaxed">{insight}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Footfall trend */}
        <motion.div
          className="card p-5"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="font-display font-semibold text-sm text-ink mb-4">Weekly Footfall Trend</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={footfallTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="phcGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="chcGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-info)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--color-info)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono', fill: 'var(--color-body)' }} />
              <YAxis tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono', fill: 'var(--color-body)' }} />
              <Tooltip contentStyle={{ fontFamily: 'Inter', fontSize: 12, borderRadius: 8, border: '1px solid var(--color-border)' }} />
              <Area type="monotone" dataKey="phc" stroke="var(--color-primary)" fill="url(#phcGrad)" strokeWidth={2} name="PHC" />
              <Area type="monotone" dataKey="chc" stroke="var(--color-info)" fill="url(#chcGrad)" strokeWidth={2} name="CHC" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Stock health by hospital */}
        <motion.div
          className="card p-5"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.48 }}
        >
          <h3 className="font-display font-semibold text-sm text-ink mb-4">Stock Health by Facility</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={hospitals.map(h => ({ name: h.name.split(' ')[0], stock: h.stockHealth, beds: h.bedOccupancy }))} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono', fill: 'var(--color-body)' }} />
              <YAxis tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono', fill: 'var(--color-body)' }} domain={[0, 100]} />
              <Tooltip contentStyle={{ fontFamily: 'Inter', fontSize: 12, borderRadius: 8, border: '1px solid var(--color-border)' }} />
              <Bar dataKey="stock" name="Stock %" fill="var(--color-primary)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="beds" name="Beds %" fill="var(--color-info)" radius={[3, 3, 0, 0]} opacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* ── AI Stock Forecast + Redistribution ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* AI Stock-Out Forecast */}
        <motion.div
          className="card overflow-hidden"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.52 }}
        >
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-info)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            <h3 className="font-display font-semibold text-sm text-ink">AI Stock-Out Forecast</h3>
            <span className="ml-auto pill pill-info">7-day window</span>
          </div>
          <div className="divide-y divide-border">
            {aiForecast.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55 + i * 0.05 }}
                className="flex items-center gap-3 px-5 py-3"
              >
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.urgency === 'critical' ? 'bg-critical' : 'bg-warning'}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm text-ink truncate">{item.medicine}</p>
                  <p className="font-body text-2xs text-body/60">{item.hospital}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`font-mono text-sm font-bold tabular ${item.urgency === 'critical' ? 'text-critical' : 'text-warning'}`}>
                    {item.daysLeft}d
                  </span>
                  <p className="font-body text-2xs text-body/50">remaining</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Redistribution Suggestions */}
        <motion.div
          className="card overflow-hidden"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.54 }}
        >
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-warning)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            <h3 className="font-display font-semibold text-sm text-ink">Redistribution Suggestions</h3>
            <span className="ml-auto pill pill-warning">{redistribution.length} pending</span>
          </div>
          <div className="px-5 py-2">
            {redistribution.map((item, i) => (
              <RedistributionRow key={item.id} item={item} index={i} />
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Flagged Hospitals ──────────────────────────────────── */}
      {openFlags.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.58 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-critical)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <h3 className="font-display font-semibold text-sm text-ink">Intervention Required</h3>
            <span className="pill pill-critical">{openFlags.length} flagged</span>
          </div>
          <div className="space-y-2">
            {flags.map((flag, i) => (
              <FlaggedRow key={flag.id} flag={flag} index={i} onResolve={resolveFlag} />
            ))}
          </div>
        </motion.div>
      )}

      {/* ── District Map + Hospital Table ─────────────────────── */}
      <motion.div
        className="card overflow-hidden"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        {/* Filters + View toggle */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border overflow-x-auto scrollbar-hide">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-body font-medium whitespace-nowrap transition-all ${
                activeFilter === f
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-body hover:bg-mist hover:text-ink'
              }`}
            >
              {t(`dashboard.${f}`)}
            </button>
          ))}
          <span className="ml-auto font-mono text-xs text-body/50 whitespace-nowrap">{filteredHospitals.length} facilities</span>
          {/* Map / List toggle */}
          <div className="flex border border-border rounded-lg overflow-hidden flex-shrink-0 ml-2">
            <button
              onClick={() => setViewMode('list')}
              className={`px-2.5 py-1.5 text-xs font-body transition-all ${viewMode === 'list' ? 'bg-primary text-white' : 'text-body hover:bg-mist'}`}
            >
              ☰ List
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-2.5 py-1.5 text-xs font-body transition-all ${viewMode === 'map' ? 'bg-primary text-white' : 'text-body hover:bg-mist'}`}
            >
              ⊕ Map
            </button>
          </div>
        </div>

        {viewMode === 'list' ? (
          /* Table */
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-border bg-mist/40">
                  <th className="text-left py-2.5 px-4 font-body text-2xs uppercase tracking-wider text-body/60">Facility</th>
                  <th className="text-left py-2.5 px-4 font-body text-2xs uppercase tracking-wider text-body/60">Type</th>
                  <th className="text-left py-2.5 px-4 font-body text-2xs uppercase tracking-wider text-body/60">Bed Occupancy</th>
                  <th className="text-left py-2.5 px-4 font-body text-2xs uppercase tracking-wider text-body/60">Stock Health</th>
                  <th className="text-left py-2.5 px-4 font-body text-2xs uppercase tracking-wider text-body/60">Doctors</th>
                  <th className="py-2.5 px-4" />
                </tr>
              </thead>
              <tbody>
                {filteredHospitals.map((h, i) => (
                  <HospitalRow key={h.id} hospital={h} index={i} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Map view */
          <div style={{ height: 400 }}>
            <MapContainer
              center={mapCenter}
              zoom={9}
              style={{ width: '100%', height: '100%' }}
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {filteredHospitals.map((h) => (
                <Marker
                  key={h.id}
                  position={[h.lat, h.lng]}
                  icon={createHospitalIcon(h.stockStatus, h.bedOccupancy)}
                >
                  <Popup>
                    <div className="p-1">
                      <p className="font-body font-semibold text-ink text-sm">{h.name}</p>
                      <p className="font-body text-xs text-body/70 mt-0.5">{h.type} · {h.location}</p>
                      <p className="font-mono text-xs mt-1 text-ink tabular">Beds: {h.bedOccupancy}% · Stock: {h.stockHealth}%</p>
                      <a
                        href={`/admin/hospital/${h.id}`}
                        className="inline-block mt-1.5 text-primary text-xs font-body hover:underline"
                      >
                        View details →
                      </a>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        )}
      </motion.div>
    </div>
  )
}
