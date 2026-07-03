import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import StatusPill from '@/components/ui/StatusPill'
import { useHospitals } from '@/hooks/useHospitals'

const COMPARE_METRICS = [
  { key: 'bedOccupancy', label: 'Bed Occ. %' },
  { key: 'stockHealth', label: 'Stock %' },
  { key: 'doctorsPresent', label: 'Doctors' },
  { key: 'footfall', label: 'Footfall' },
]

function SelectHospital({ label, value, onChange, exclude, hospitals = [] }) {
  return (
    <div>
      <label className="block font-body text-xs font-medium text-body mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="form-input pr-8"
      >
        {hospitals.filter((h) => h.id !== exclude).map((h) => (
          <option key={h.id} value={h.id}>{h.name}</option>
        ))}
      </select>
    </div>
  )
}

function MetricRow({ label, a, b, unit = '' }) {
  const aVal = Number(a)
  const bVal = Number(b)
  const winner = aVal > bVal ? 'a' : bVal > aVal ? 'b' : 'tie'
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
      <div className="flex-1 text-right">
        <span className={`font-mono text-sm tabular font-semibold ${winner === 'a' ? 'text-success' : 'text-ink'}`}>
          {aVal}{unit}
        </span>
      </div>
      <div className="w-28 text-center">
        <span className="font-body text-xs text-body/60">{label}</span>
      </div>
      <div className="flex-1 text-left">
        <span className={`font-mono text-sm tabular font-semibold ${winner === 'b' ? 'text-success' : 'text-ink'}`}>
          {bVal}{unit}
        </span>
      </div>
    </div>
  )
}

export default function CompareCharts() {
  const { t } = useTranslation()
  const [idA, setIdA] = useState(1)
  const [idB, setIdB] = useState(2)

  const { data: hospitals = [] } = useHospitals()
  const hospA = hospitals.find((h) => h.id === idA) ?? hospitals[0]
  const hospB = hospitals.find((h) => h.id === idB) ?? hospitals[1]

  if (!hospA || !hospB) return <div className="p-8 text-center text-body/70">Loading hospitals...</div>

  const barData = COMPARE_METRICS.map((m) => ({
    metric: m.label,
    [hospA.name.split(' ')[0]]: hospA[m.key],
    [hospB.name.split(' ')[0]]: hospB[m.key],
  }))

  const radarData = [
    { metric: 'Beds', A: hospA.bedOccupancy, B: hospB.bedOccupancy },
    { metric: 'Stock', A: hospA.stockHealth, B: hospB.stockHealth },
    { metric: 'Doctors', A: Math.round((hospA.doctorsPresent / hospA.doctorsTotal) * 100), B: Math.round((hospB.doctorsPresent / hospB.doctorsTotal) * 100) },
    { metric: 'Footfall', A: Math.min(hospA.footfall / 3, 100), B: Math.min(hospB.footfall / 3, 100) },
  ]

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h2 className="font-display font-semibold text-xl text-ink">{t('nav.compare')}</h2>
        <p className="font-body text-sm text-body/70 mt-0.5">Side-by-side hospital performance comparison</p>
      </div>

      {/* Selectors */}
      <motion.div
        className="card p-5 grid grid-cols-1 md:grid-cols-2 gap-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <SelectHospital label="Hospital A" value={idA} onChange={setIdA} exclude={idB} hospitals={hospitals} />
        <SelectHospital label="Hospital B" value={idB} onChange={setIdB} exclude={idA} hospitals={hospitals} />
      </motion.div>

      {/* Header cards */}
      <div className="grid grid-cols-2 gap-4">
        {[hospA, hospB].map((h, i) => (
          <motion.div
            key={h.id}
            className="card p-5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.1 }}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-display font-semibold text-base text-ink">{h.name}</h3>
                <p className="font-body text-xs text-body/60">{h.location}</p>
              </div>
              <span className={`px-2 py-0.5 rounded text-2xs font-mono font-semibold ${
                h.type === 'CHC' ? 'bg-info-tint text-info' : 'bg-primary/10 text-primary'
              }`}>{h.type}</span>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-2">
              <div className="text-center">
                <p className="font-mono text-xl font-semibold text-ink tabular">{h.bedOccupancy}%</p>
                <p className="font-body text-2xs text-body/50 mt-0.5">Beds</p>
              </div>
              <div className="text-center border-x border-border">
                <p className="font-mono text-xl font-semibold text-ink tabular">{h.stockHealth}%</p>
                <p className="font-body text-2xs text-body/50 mt-0.5">Stock</p>
              </div>
              <div className="text-center">
                <p className="font-mono text-xl font-semibold text-ink tabular">{h.doctorsPresent}/{h.doctorsTotal}</p>
                <p className="font-body text-2xs text-body/50 mt-0.5">Doctors</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div
          className="card p-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="font-display font-semibold text-sm text-ink mb-4">Metrics Comparison</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="metric" tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono', fill: 'var(--color-body)' }} />
              <YAxis tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono', fill: 'var(--color-body)' }} />
              <Tooltip contentStyle={{ fontFamily: 'Inter', fontSize: 12, borderRadius: 8, border: '1px solid var(--color-border)' }} />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'Inter' }} />
              <Bar dataKey={hospA.name.split(' ')[0]} fill="var(--color-primary)" radius={[3, 3, 0, 0]} />
              <Bar dataKey={hospB.name.split(' ')[0]} fill="var(--color-info)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          className="card p-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38 }}
        >
          <h3 className="font-display font-semibold text-sm text-ink mb-4">Radar Overview</h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--color-border)" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono', fill: 'var(--color-body)' }} />
              <Radar name={hospA.name.split(' ')[0]} dataKey="A" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.2} />
              <Radar name={hospB.name.split(' ')[0]} dataKey="B" stroke="var(--color-info)" fill="var(--color-info)" fillOpacity={0.2} />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'Inter' }} />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Delta table */}
      <motion.div
        className="card p-5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.44 }}
      >
        <h3 className="font-display font-semibold text-sm text-ink mb-3">Head-to-Head Metrics</h3>
        <div className="flex items-center gap-3 py-2 mb-1">
          <div className="flex-1 text-right">
            <span className="font-body text-xs font-semibold text-body/60">{hospA.name}</span>
          </div>
          <div className="w-28" />
          <div className="flex-1 text-left">
            <span className="font-body text-xs font-semibold text-body/60">{hospB.name}</span>
          </div>
        </div>
        <MetricRow label="Bed Occupancy" a={hospA.bedOccupancy} b={hospB.bedOccupancy} unit="%" />
        <MetricRow label="Stock Health" a={hospA.stockHealth} b={hospB.stockHealth} unit="%" />
        <MetricRow label="Doctors Present" a={hospA.doctorsPresent} b={hospB.doctorsPresent} />
        <MetricRow label="Daily Footfall" a={hospA.footfall} b={hospB.footfall} />
      </motion.div>
    </div>
  )
}
